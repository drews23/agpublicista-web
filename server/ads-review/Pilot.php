<?php
declare(strict_types=1);
namespace Lienzo\Ads;

use PDO;
use Throwable;

/** Local pilot foundation. Invitations prove token possession, not verified email. */
final class PilotStore {
    private PDO $db;
    private \Closure $clock;
    private array $policy;

    public function __construct(string $directory, string $publicRoot, array $policy = [], ?\Closure $clock = null) {
        $defaults = ['capacity'=>20, 'periodDays'=>30, 'periodReviews'=>5, 'dailyReviews'=>2, 'budgetMicroUsd'=>0];
        Contract::reject(array_diff(array_keys($policy), array_keys($defaults)) !== [], 'INVALID_PILOT_POLICY', 503);
        $this->policy = $policy + $defaults;
        foreach ($this->policy as $key=>$value) {
            Contract::reject(!is_int($value) || $value < ($key === 'budgetMicroUsd' ? 0 : 1) || $value > 1000000000, 'INVALID_PILOT_POLICY', 503);
        }
        $this->clock = $clock ?? static fn(): int => time();
        $public = realpath($publicRoot);
        Contract::reject($public === false, 'PRIVATE_STORAGE_REQUIRED', 503);
        $normalize = static fn(string $p): string => strtolower(str_replace('\\', '/', rtrim($p, '/\\')));
        // Reject the public root before creating anything; resolve existing symlinks too.
        $ancestor = $directory;
        while (!file_exists($ancestor) && dirname($ancestor) !== $ancestor) $ancestor = dirname($ancestor);
        $resolved = realpath($ancestor);
        Contract::reject($resolved === false || $normalize($resolved) === $normalize($public) || str_starts_with($normalize($resolved), $normalize($public).'/'), 'PRIVATE_STORAGE_REQUIRED', 503);
        Contract::reject(preg_match('#(^|[/\\\\])\.\.?([/\\\\]|$)#', $directory) === 1, 'PRIVATE_STORAGE_REQUIRED', 503);
        if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) throw new ReviewError(503, 'STORAGE_UNAVAILABLE');
        $private = realpath($directory);
        Contract::reject($private === false || $normalize($private) === $normalize($public) || str_starts_with($normalize($private), $normalize($public).'/'), 'PRIVATE_STORAGE_REQUIRED', 503);
        $oldMask = umask(0077);
        try {
            $this->db = new PDO('sqlite:'.$private.'/pilot.sqlite', null, null, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
            $this->db->exec('PRAGMA busy_timeout=3000;
                CREATE TABLE IF NOT EXISTS pilot_grants (id TEXT PRIMARY KEY, participant TEXT UNIQUE NOT NULL, activated INTEGER NOT NULL, expires INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0);
                CREATE TABLE IF NOT EXISTS pilot_invites (token_hash TEXT PRIMARY KEY, participant TEXT NOT NULL, expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0);
                CREATE TABLE IF NOT EXISTS pilot_usage (grant_id TEXT NOT NULL, request_id TEXT NOT NULL, fingerprint TEXT NOT NULL, created INTEGER NOT NULL, day_key TEXT NOT NULL, budget_period TEXT NOT NULL, state TEXT NOT NULL, reserved INTEGER NOT NULL, spent INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(grant_id,request_id));
                CREATE TABLE IF NOT EXISTS pilot_settings (id INTEGER PRIMARY KEY CHECK(id=1), paused INTEGER NOT NULL);
                INSERT OR IGNORE INTO pilot_settings VALUES (1,0);');
        } finally { umask($oldMask); }
    }
    private function now(): int { return ($this->clock)(); }
    private function calendar(int $now, string $format): string {
        return (new \DateTimeImmutable('@'.$now))->setTimezone(new \DateTimeZone('America/Bogota'))->format($format);
    }
    private function transaction(callable $work): mixed {
        try { $this->db->exec('BEGIN IMMEDIATE'); $value=$work(); $this->db->exec('COMMIT'); return $value; }
        catch (Throwable $e) {
            try { $this->db->exec('ROLLBACK'); } catch (Throwable) {}
            if ($e instanceof ReviewError) throw $e;
            throw new ReviewError(503, 'PILOT_STORAGE_UNAVAILABLE');
        }
    }
    private function query(string $sql, array $values=[]): \PDOStatement {
        $q=$this->db->prepare($sql); $q->execute($values); return $q;
    }
    /** Administrative operation only; no public invitation-creation endpoint. */
    public function issueInvite(string $participant, int $ttl=86400): string {
        Contract::reject(!preg_match('/^[a-zA-Z0-9_-]{8,100}$/D', $participant) || $ttl < 1 || $ttl > 604800, 'INVALID_INVITATION', 400);
        return $this->transaction(function() use($participant,$ttl) {
            $hash=hash('sha256',$participant);
            $this->query('UPDATE pilot_invites SET used=1 WHERE participant=? AND used=0',[$hash]);
            $token=bin2hex(random_bytes(32));
            $this->query('INSERT INTO pilot_invites (token_hash,participant,expires) VALUES (?,?,?)',[hash('sha256',$token),$hash,$this->now()+$ttl]);
            return $token;
        });
    }
    public function redeem(string $token): string {
        Contract::reject(!preg_match('/^[a-f0-9]{64}$/D',$token), 'INVITATION_INVALID', 403);
        return $this->transaction(function() use($token) {
            $invite=$this->query('SELECT * FROM pilot_invites WHERE token_hash=?',[hash('sha256',$token)])->fetch(PDO::FETCH_ASSOC);
            Contract::reject(!$invite || (int)$invite['used']!==0 || (int)$invite['expires'] <= $this->now(), 'INVITATION_INVALID',403);
            $grant=$this->query('SELECT * FROM pilot_grants WHERE participant=?',[$invite['participant']])->fetch(PDO::FETCH_ASSOC);
            if ($grant) { $this->authorize($grant['id']); $id=$grant['id']; }
            else {
                Contract::reject((int)$this->query('SELECT COUNT(*) FROM pilot_grants')->fetchColumn() >= $this->policy['capacity'],'PILOT_FULL',403);
                $id='p_'.bin2hex(random_bytes(16)); $now=$this->now();
                $this->query('INSERT INTO pilot_grants (id,participant,activated,expires) VALUES (?,?,?,?)',[$id,$invite['participant'],$now,$now+$this->policy['periodDays']*86400]);
            }
            $this->query('UPDATE pilot_invites SET used=1 WHERE token_hash=?',[hash('sha256',$token)]);
            return $id;
        });
    }
    public function authorize(string $id): array {
        $grant=$this->query('SELECT * FROM pilot_grants WHERE id=?',[$id])->fetch(PDO::FETCH_ASSOC);
        Contract::reject(!$grant || (int)$grant['revoked']!==0,'INVITATION_REQUIRED',403);
        Contract::reject((int)$grant['expires'] <= $this->now(),'PILOT_EXPIRED',403);
        return $grant;
    }
    public function revoke(string $id): void { $this->query('UPDATE pilot_grants SET revoked=1 WHERE id=?',[$id]); }
    public function pause(bool $paused): void { $this->query('UPDATE pilot_settings SET paused=? WHERE id=1',[$paused?1:0]); }
    /** Public limits only; inspecting access must not start the participant's trial. */
    public function limits(): array {
        return ['periodReviews'=>$this->policy['periodReviews'],'dailyReviews'=>$this->policy['dailyReviews'],
            'periodDays'=>$this->policy['periodDays'],'timezone'=>'America/Bogota'];
    }
    public function requireBudgetCeiling(int $maximum): void {
        Contract::reject($maximum < 0 || $this->policy['budgetMicroUsd'] > $maximum,'PILOT_BUDGET_CONFIGURATION',503);
    }
    public function status(string $id): array {
        $grant=$this->authorize($id); $day=$this->calendar($this->now(),'Y-m-d');
        $total=(int)$this->query('SELECT COUNT(*) FROM pilot_usage WHERE grant_id=?',[$id])->fetchColumn();
        $daily=(int)$this->query('SELECT COUNT(*) FROM pilot_usage WHERE grant_id=? AND day_key=?',[$id,$day])->fetchColumn();
        return ['access'=>'active','periodRemaining'=>max(0,$this->policy['periodReviews']-$total),
            'dailyRemaining'=>max(0,$this->policy['dailyReviews']-$daily),'expiresAt'=>gmdate('c',(int)$grant['expires']),
            'paused'=>(bool)$this->query('SELECT paused FROM pilot_settings WHERE id=1')->fetchColumn(),
            'timezone'=>'America/Bogota','paidGenerationEnabled'=>false];
    }
    /** Cost values are server-owned integer micro-USD. Local simulation reserves zero. */
    public function reserve(string $id, string $request, string $fingerprint, int $maximumCost=0): bool {
        Contract::reject(!preg_match('/^[a-f0-9-]{36}$/iD',$request) || !preg_match('/^[a-f0-9]{64}$/D',$fingerprint) || $maximumCost < 0 || $maximumCost > 1000000000,'INVALID_RESERVATION',400);
        return $this->transaction(function() use($id,$request,$fingerprint,$maximumCost) {
            $this->authorize($id);
            Contract::reject((bool)$this->query('SELECT paused FROM pilot_settings WHERE id=1')->fetchColumn(),'PILOT_PAUSED',503);
            $prior=$this->query('SELECT * FROM pilot_usage WHERE grant_id=? AND request_id=?',[$id,$request])->fetch(PDO::FETCH_ASSOC);
            if ($prior) {
                Contract::reject(!hash_equals($prior['fingerprint'],$fingerprint),'IDEMPOTENCY_CONFLICT',409);
                Contract::reject($prior['state']!=='complete','REVIEW_RESERVED',409);
                return false;
            }
            $status=$this->status($id);
            Contract::reject($status['periodRemaining']===0,'PILOT_PERIOD_LIMIT',429);
            Contract::reject($status['dailyRemaining']===0,'PILOT_DAILY_LIMIT',429);
            $now=$this->now(); $period=$this->calendar($now,'Y-m');
            // The pilot budget is a lifetime cap, not a monthly allowance. The
            // calendar period is retained only for accounting and never resets it.
            $used=(int)$this->query("SELECT COALESCE(SUM(CASE WHEN state='complete' THEN spent ELSE MAX(reserved,spent) END),0) FROM pilot_usage")->fetchColumn();
            Contract::reject($maximumCost > $this->policy['budgetMicroUsd']-$used,'PILOT_BUDGET_LIMIT',429);
            $this->query("INSERT INTO pilot_usage (grant_id,request_id,fingerprint,created,day_key,budget_period,state,reserved) VALUES (?,?,?,?,?,?,'pending',?)",[$id,$request,$fingerprint,$now,$this->calendar($now,'Y-m-d'),$period,$maximumCost]);
            return true;
        });
    }
    public function complete(string $id, string $request, int $actualCost=0): void {
        $mismatch=$this->transaction(function() use($id,$request,$actualCost) {
            $row=$this->query('SELECT * FROM pilot_usage WHERE grant_id=? AND request_id=?',[$id,$request])->fetch(PDO::FETCH_ASSOC);
            Contract::reject(!$row || $row['state']!=='pending','RESERVATION_CONFLICT',409);
            if ($actualCost < 0 || $actualCost > (int)$row['reserved']) {
                $this->query("UPDATE pilot_usage SET state='uncertain',spent=? WHERE grant_id=? AND request_id=?",[max(0,$actualCost),$id,$request]);
                $this->query('UPDATE pilot_settings SET paused=1 WHERE id=1'); return true;
            }
            $this->query("UPDATE pilot_usage SET state='complete',spent=? WHERE grant_id=? AND request_id=?",[$actualCost,$id,$request]); return false;
        });
        Contract::reject($mismatch,'BUDGET_ACCOUNTING_MISMATCH',503);
    }
    public function uncertain(string $id, string $request): void {
        $this->query("UPDATE pilot_usage SET state='uncertain' WHERE grant_id=? AND request_id=? AND state='pending'",[$id,$request]);
    }
}

/** A complete local invitation/quota path, deliberately restricted to MockProvider. */
final class PilotReview {
    public function __construct(private PilotStore $access, private ReviewService $reviews) {}
    public function review(array $request, string $grant): array {
        $this->access->authorize($grant);
        $fresh=$this->access->reserve($grant,$request['requestId'],hash('sha256',Contract::canonical($request)));
        try {
            $result=$this->reviews->review($request,'pilot:'.$grant,function($r) use($fresh) {
                Contract::reject(!$fresh,'REVIEW_RESULT_EXPIRED',409);
                return (new MockProvider())($r);
            });
            if ($fresh) $this->access->complete($grant,$request['requestId']);
            return $result;
        } catch (Throwable $error) {
            if ($fresh) $this->access->uncertain($grant,$request['requestId']);
            throw $error;
        }
    }
}
