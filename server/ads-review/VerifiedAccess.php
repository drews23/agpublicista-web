<?php
declare(strict_types=1);
namespace Lienzo\Ads;
require_once __DIR__.'/PrivateFiles.php';

use PDO;
use Throwable;

/** Internal email-code flow. The caller supplies an explicit mailer; none is configured here. */
final class VerifiedEmailAccess {
    private PDO $db;
    private \Closure $clock;
    public function __construct(string $directory,string $publicRoot,#[\SensitiveParameter] private readonly string $pepper,?\Closure $clock=null) {
        Contract::reject(strlen($pepper)<32 || strlen($pepper)>512,'IDENTITY_SECRET_REQUIRED',503);
        $directory=PrivateFiles::directory($directory,$publicRoot);
        $this->clock=$clock??static fn():int=>time();
        $database=$directory.'/verified-access.sqlite';
        Contract::reject(is_link($database),'PRIVATE_STORAGE_REQUIRED',503);
        if(is_file($database) && PHP_OS_FAMILY!=='Windows')PrivateFiles::permissions(fileperms($database),fileowner($database),false);
        $mask=umask(0077);
        try {
            $this->db=new PDO('sqlite:'.$directory.'/verified-access.sqlite',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
            $this->db->exec('PRAGMA busy_timeout=3000;
                CREATE TABLE IF NOT EXISTS allowed_email (identity TEXT PRIMARY KEY, locale TEXT NOT NULL, active INTEGER NOT NULL, expires INTEGER NOT NULL, pilot_grant TEXT);
                CREATE TABLE IF NOT EXISTS login_challenge (id TEXT PRIMARY KEY, identity TEXT NOT NULL, nonce_hash TEXT NOT NULL, code_hash TEXT NOT NULL, expires INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, used INTEGER NOT NULL DEFAULT 0);
                CREATE TABLE IF NOT EXISTS verified_session (token_hash TEXT PRIMARY KEY, csrf_hash TEXT NOT NULL, identity TEXT NOT NULL, nonce_hash TEXT NOT NULL, expires INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0);
                CREATE TABLE IF NOT EXISTS access_attempt (bucket TEXT NOT NULL, created INTEGER NOT NULL);
                CREATE INDEX IF NOT EXISTS access_attempt_bucket ON access_attempt(bucket,created);');
        } finally {umask($mask);}
    }
    public static function fromSecretFile(string $directory,string $publicRoot,string $file,?\Closure $clock=null):self {
        $v=PrivateFiles::json($file,$publicRoot);
        try {
            Contract::keys($v,['schemaVersion','projectId','identityPepper']);
            Contract::reject($v['schemaVersion']!==1 || $v['projectId']!==GeminiCredentials::PROJECT ||
                !is_string($v['identityPepper']) || !preg_match('/^[a-f0-9]{64}$/D',$v['identityPepper']));
        } catch(Throwable){throw new ReviewError(503,'IDENTITY_SECRET_REQUIRED');}
        return new self($directory,$publicRoot,$v['identityPepper'],$clock);
    }
    private function now():int {return ($this->clock)();}
    private function hash(string $value):string {return hash_hmac('sha256',$value,$this->pepper);}
    private function query(string $sql,array $params=[]):\PDOStatement {$q=$this->db->prepare($sql);$q->execute($params);return $q;}
    private function transaction(callable $work):mixed {
        try {$this->db->exec('BEGIN IMMEDIATE');$out=$work();$this->db->exec('COMMIT');return $out;}
        catch(Throwable $e) {try{$this->db->exec('ROLLBACK');}catch(Throwable){}if($e instanceof ReviewError)throw $e;throw new ReviewError(503,'ACCESS_STORAGE_UNAVAILABLE');}
    }
    private function email(string $email):string {
        $email=strtolower(trim($email));
        Contract::reject(strlen($email)>254 || !preg_match('/^[\x21-\x7e]+$/D',$email) || !filter_var($email,FILTER_VALIDATE_EMAIL),'INVALID_EMAIL',400);
        return $email;
    }
    private function nonce(string $value):void {Contract::reject(!preg_match('/^[a-f0-9]{64}$/D',$value),'ACCESS_REQUIRED',403);}
    private function peer(string $value):string {Contract::reject(!filter_var($value,FILTER_VALIDATE_IP),'ACCESS_REQUIRED',403);return $this->hash('peer:'.$value);}
    private function rate(array $buckets):void {
        $this->query('DELETE FROM access_attempt WHERE created < ?',[$this->now()-86400]);
        foreach($buckets as $bucket=>$limit) Contract::reject((int)$this->query('SELECT COUNT(*) FROM access_attempt WHERE bucket=? AND created>?',[$bucket,$this->now()-900])->fetchColumn()>=$limit,'ACCESS_RATE_LIMIT',429);
        foreach($buckets as $bucket=>$limit)$this->query('INSERT INTO access_attempt VALUES (?,?)',[$bucket,$this->now()]);
    }
    /** Administrator-only allowlist. Never expose it through a public registration route. */
    public function invite(string $email,string $locale='es',int $ttl=2592000):void {
        $identity=$this->hash('email:'.$this->email($email));
        Contract::reject(!in_array($locale,['es','en'],true) || $ttl<1 || $ttl>2592000,'INVALID_INVITATION',400);
        $this->transaction(function()use($identity,$locale,$ttl){
            $exists=$this->query('SELECT identity FROM allowed_email WHERE identity=?',[$identity])->fetchColumn();
            Contract::reject(!$exists && (int)$this->query('SELECT COUNT(*) FROM allowed_email')->fetchColumn()>=20,'PILOT_FULL',403);
            $this->query('INSERT INTO allowed_email(identity,locale,active,expires) VALUES (?,?,1,?) ON CONFLICT(identity) DO UPDATE SET locale=excluded.locale,active=1,expires=excluded.expires',[$identity,$locale,$this->now()+$ttl]);
        });
    }
    public function revoke(string $email):void {
        $identity=$this->hash('email:'.$this->email($email));
        $this->transaction(function()use($identity){
            $this->query('UPDATE allowed_email SET active=0 WHERE identity=?',[$identity]);
            $this->query('UPDATE verified_session SET revoked=1 WHERE identity=?',[$identity]);
            $this->query('UPDATE login_challenge SET used=1 WHERE identity=?',[$identity]);
        });
    }
    /** Generic reply for invited/unknown mailboxes. Sending is outside the database lock. */
    public function start(#[\SensitiveParameter] string $email,#[\SensitiveParameter] string $browserNonce,string $remoteAddress,\Closure $mailer):array {
        $email=$this->email($email);$this->nonce($browserNonce);$peer=$this->peer($remoteAddress);
        $identity=$this->hash('email:'.$email);$id=bin2hex(random_bytes(16));$code=sprintf('%08d',random_int(0,99999999));
        $locale=$this->transaction(function()use($id,$identity,$browserNonce,$code,$peer){
            $this->rate(['start:global'=>30,'start:'.$peer=>5,'start:'.$identity=>3]);
            $row=$this->query('SELECT * FROM allowed_email WHERE identity=?',[$identity])->fetch(PDO::FETCH_ASSOC);
            if(!$row || !(int)$row['active'] || (int)$row['expires']<=$this->now())return null;
            $nonce=hash('sha256',$browserNonce);
            $this->query('UPDATE login_challenge SET used=1 WHERE identity=? AND nonce_hash=?',[$identity,$nonce]);
            $this->query('INSERT INTO login_challenge(id,identity,nonce_hash,code_hash,expires) VALUES (?,?,?,?,?)',[$id,$identity,$nonce,$this->hash('code:'.$id.':'.$code),$this->now()+600]);
            return $row['locale'];
        });
        if($locale!==null) {
            $en=$locale==='en';
            $message=['to'=>$email,'subject'=>$en?'Your Lienzo pilot access code':'Tu código de acceso al piloto de Lienzo',
                'text'=>$en?"Your code: $code\nValid for 10 minutes in the browser where you requested it. Do not share it. If you did not request this, ignore this email.":
                    "Tu código: $code\nVálido durante 10 minutos en el navegador donde lo solicitaste. No lo compartas. Si no lo solicitaste, ignora este correo."];
            try {$accepted=$mailer($message)===true;}catch(Throwable){$accepted=false;}
            if(!$accepted)$this->query('UPDATE login_challenge SET used=1 WHERE id=?',[$id]);
        }
        return ['accepted'=>true,'challengeId'=>$id];
    }
    /** POST-only controller must verify Origin and CSRF before calling this method. */
    public function verify(string $id,#[\SensitiveParameter] string $code,#[\SensitiveParameter] string $browserNonce,string $remoteAddress):array {
        $this->nonce($browserNonce);$peer=$this->peer($remoteAddress);
        Contract::reject(!preg_match('/^[a-f0-9]{32}$/D',$id) || !preg_match('/^[0-9]{8}$/D',$code),'ACCESS_REQUIRED',403);
        $result=$this->transaction(function()use($id,$code,$browserNonce,$peer){
            $this->rate(['verify:global'=>200,'verify:'.$peer=>20]);
            $row=$this->query('SELECT c.*,a.active,a.expires AS allowed_until FROM login_challenge c JOIN allowed_email a ON a.identity=c.identity WHERE c.id=?',[$id])->fetch(PDO::FETCH_ASSOC);
            if(!$row || (int)$row['used'] || (int)$row['expires']<=$this->now() || !(int)$row['active'] ||
                (int)$row['allowed_until']<=$this->now() || !hash_equals($row['nonce_hash'],hash('sha256',$browserNonce)) || (int)$row['attempts']>=5)return null;
            // Failed guesses must commit; throwing inside the transaction would undo this counter.
            $this->query('UPDATE login_challenge SET attempts=attempts+1 WHERE id=?',[$id]);
            if(!hash_equals($row['code_hash'],$this->hash('code:'.$id.':'.$code)))return null;
            $this->query('UPDATE login_challenge SET used=1 WHERE id=?',[$id]);
            $this->query('UPDATE verified_session SET revoked=1 WHERE identity=? AND nonce_hash=?',[$row['identity'],$row['nonce_hash']]);
            $token=bin2hex(random_bytes(32));$csrf=bin2hex(random_bytes(32));$expires=min($this->now()+28800,(int)$row['allowed_until']);
            $this->query('INSERT INTO verified_session(token_hash,csrf_hash,identity,nonce_hash,expires) VALUES (?,?,?,?,?)',[
                hash('sha256',$token),hash('sha256',$csrf),$row['identity'],$row['nonce_hash'],$expires]);
            return ['sessionToken'=>$token,'csrfToken'=>$csrf,'expiresAt'=>gmdate('c',$expires)];
        });
        Contract::reject($result===null,'ACCESS_REQUIRED',403);
        return $result;
    }
    private function session(#[\SensitiveParameter] string $token,#[\SensitiveParameter] string $csrf):array {
        $this->nonce($token);$this->nonce($csrf);
        $row=$this->query('SELECT s.*,a.active,a.expires AS allowed_until,a.pilot_grant FROM verified_session s JOIN allowed_email a ON a.identity=s.identity WHERE token_hash=?',[hash('sha256',$token)])->fetch(PDO::FETCH_ASSOC);
        Contract::reject(!$row || (int)$row['revoked'] || !(int)$row['active'] || (int)$row['expires']<=$this->now() ||
            (int)$row['allowed_until']<=$this->now() || !hash_equals($row['csrf_hash'],hash('sha256',$csrf)),'ACCESS_REQUIRED',403);
        return $row;
    }
    public function authorize(#[\SensitiveParameter] string $token,#[\SensitiveParameter] string $csrf):void {$this->session($token,$csrf);}
    public function logout(#[\SensitiveParameter] string $token,#[\SensitiveParameter] string $csrf):void {
        $this->session($token,$csrf);
        $this->query('UPDATE verified_session SET revoked=1 WHERE token_hash=?',[hash('sha256',$token)]);
    }
    public function grant(#[\SensitiveParameter] string $token,#[\SensitiveParameter] string $csrf,PilotStore $pilot):string {
        return $this->transaction(function()use($token,$csrf,$pilot){
            $row=$this->session($token,$csrf);
            if($row['pilot_grant']!==null){$pilot->authorize($row['pilot_grant']);return $row['pilot_grant'];}
            $id=$pilot->redeem($pilot->issueInvite('email_'.$row['identity']));
            $this->query('UPDATE allowed_email SET pilot_grant=? WHERE identity=?',[$id,$row['identity']]);
            return $id;
        });
    }
    public function __debugInfo():array {return ['identitySecret'=>'[redacted]'];}
    public function __serialize():array {throw new ReviewError(503,'SECRET_SERIALIZATION_FORBIDDEN');}
}

final class AdsHttpsGuard {
    /** No X-Forwarded-* trust. A reverse proxy requires a separately reviewed configuration. */
    public static function post(#[\SensitiveParameter] array $server,#[\SensitiveParameter] string $expectedCsrf,#[\SensitiveParameter] string $presentedCsrf):void {
        Contract::reject(!in_array($server['HTTPS']??'', ['on','1'],true) || ($server['REQUEST_METHOD']??'')!=='POST' ||
            ($server['HTTP_HOST']??'')!=='lienzo.tools' || ($server['HTTP_ORIGIN']??'')!=='https://lienzo.tools' ||
            strtolower(trim(explode(';',$server['CONTENT_TYPE']??'')[0]))!=='application/json' ||
            !preg_match('/^[a-f0-9]{64}$/D',$expectedCsrf) || !hash_equals($expectedCsrf,$presentedCsrf),'ACCESS_REQUIRED',403);
    }
    public static function cookieOptions(int $expires):array {
        return ['expires'=>$expires,'path'=>'/','secure'=>true,'httponly'=>true,'samesite'=>'Strict'];
    }
    public const COOKIE_NAME='__Host-LIENZO_ADS_SESSION';
    public static function consent(string $language):array {
        Contract::reject(!in_array($language,['es','en'],true),'INVALID_LANGUAGE',400);
        return ['version'=>'gemini-review-v1','text'=>$language==='es'
            ?'Al confirmar, el borrador, objetivo, términos y hechos confirmados se enviarán a Google Gemini para revisar propuestas. Debes revisar cada cambio antes de aplicarlo. No se publican anuncios ni se accede a tu cuenta de Google Ads.'
            :'When you confirm, your draft, goal, terms and confirmed facts will be sent to Google Gemini to review suggestions. Review each change before applying it. No ads are published and your Google Ads account is not accessed.'];
    }
}

/** Prepared internal bridge. No public route instantiates it; it stays closed by default. */
final class VerifiedGeminiReview {
    public function __construct(private VerifiedEmailAccess $emails,private PilotStore $pilot,
        private GeminiPilotReview $reviews,private readonly bool $enabled=false) {}
    public function review(array $request,#[\SensitiveParameter] string $sessionToken,#[\SensitiveParameter] string $csrfToken):array {
        Contract::reject(!$this->enabled,'GEMINI_PILOT_DISABLED',503);
        $this->emails->authorize($sessionToken,$csrfToken);
        $request=Contract::request(Contract::canonical($request),'gemini-review-v1');
        $grant=$this->emails->grant($sessionToken,$csrfToken,$this->pilot);
        return $this->reviews->review($request,$grant);
    }
}
