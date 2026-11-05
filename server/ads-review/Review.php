<?php
declare(strict_types=1);
namespace Lienzo\Ads;

use PDO;
use Throwable;

final class ReviewError extends \RuntimeException {
    public function __construct(public readonly int $status, public readonly string $reason) { parent::__construct($reason); }
}

final class Contract {
    public static function reject(bool $condition, string $code = 'INVALID_REQUEST', int $status = 400): void {
        if ($condition) throw new ReviewError($status, $code);
    }
    public static function keys(mixed $value, array $keys): void {
        self::reject(!is_array($value) || array_is_list($value));
        $actual = array_keys($value); sort($actual); sort($keys);
        self::reject($actual !== $keys);
    }
    public static function text(mixed $value, int $max, bool $empty = true): void {
        self::reject(!is_string($value) || !preg_match('//u', $value));
        self::reject(preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u', $value) === 1 || self::length($value) > $max || (!$empty && trim($value) === ''));
    }
    public static function length(string $text): int { return preg_match_all('/./us', $text); }
    public static function count(string $text): int {
        // Same conservative wide-character ranges as LienzoAdsEngine; parity tested.
        preg_match_all('/./us', $text, $characters); $length = 0;
        foreach ($characters[0] as $char) {
            $bytes = array_values(unpack('C*', $char)); $n = count($bytes);
            $code = $n === 1 ? $bytes[0] : ($bytes[0] & (0x7f >> $n));
            for ($i = 1; $i < $n; $i++) $code = ($code << 6) | ($bytes[$i] & 0x3f);
            $wide = $code >= 0x1100 && ($code <= 0x115f || in_array($code, [0x2329,0x232a], true) ||
                ($code >= 0x2e80 && $code <= 0xa4cf && $code !== 0x303f) || ($code >= 0xac00 && $code <= 0xd7a3) ||
                ($code >= 0xf900 && $code <= 0xfaff) || ($code >= 0xfe10 && $code <= 0xfe19) ||
                ($code >= 0xfe30 && $code <= 0xfe6f) || ($code >= 0xff00 && $code <= 0xff60) ||
                ($code >= 0xffe0 && $code <= 0xffe6) || ($code >= 0x1b000 && $code <= 0x1b2ff) ||
                ($code >= 0x1f000 && $code <= 0x1faff) || ($code >= 0x20000 && $code <= 0x3fffd));
            $length += $wide ? 2 : 1;
        }
        return $length;
    }
    public static function canonical(mixed $value): string {
        $sort = function (mixed $v) use (&$sort): mixed {
            if (!is_array($v)) return $v;
            if (!array_is_list($v)) ksort($v, SORT_STRING);
            return array_map($sort, $v);
        };
        return json_encode($sort($value), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_LINE_TERMINATORS | JSON_THROW_ON_ERROR);
    }
    public static function url(string $url): bool {
        $parts = parse_url($url);
        return $parts !== false && in_array($parts['scheme'] ?? '', ['http','https'], true) && !empty($parts['host']) &&
            !isset($parts['user']) && !isset($parts['pass']) && !preg_match('/[\s\x00-\x1f\x7f]/u', $url);
    }
    public static function request(string $body, string $consentVersion = 'local-simulation-v1'): array {
        // The server chooses the purpose. A browser cannot promote simulation consent.
        self::reject(!in_array($consentVersion,['local-simulation-v1','gemini-review-v1'],true),'INVALID_CONSENT_CONFIGURATION',503);
        self::reject(strlen($body) > 65536, 'REQUEST_TOO_LARGE', 413);
        try { $r = json_decode($body, true, 32, JSON_THROW_ON_ERROR); } catch (Throwable) { throw new ReviewError(400,'INVALID_JSON'); }
        self::keys($r, ['schemaVersion','requestId','draftRevision','locale','goal','draft','evidence','constraints','consent']);
        self::reject($r['schemaVersion'] !== 1 || !is_string($r['requestId']) || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iD', $r['requestId']));
        self::reject(!is_string($r['draftRevision']) || !preg_match('/^[a-f0-9]{64}$/D', $r['draftRevision']));
        self::reject(!in_array($r['locale'], ['es-CO','es-MX','en-US'], true));
        self::text($r['goal'],500,false);
        $d = $r['draft']; self::keys($d,['language','business','url','path1','path2','terms','headlines','descriptions']);
        self::reject(!in_array($d['language'],['es','en'],true));
        foreach (['business'=>200,'url'=>4096,'path1'=>1000,'path2'=>1000,'terms'=>4000] as $field=>$max) self::text($d[$field],$max);
        self::reject(!self::url($d['url']), 'INVALID_DESTINATION',422);
        foreach (['headlines'=>15,'descriptions'=>4] as $kind=>$max) {
            self::reject(!is_array($d[$kind]) || !array_is_list($d[$kind]) || count($d[$kind]) < 1 || count($d[$kind]) > $max);
            foreach ($d[$kind] as $asset) {
                self::keys($asset,['text','pin']); self::text($asset['text'],1000);
                self::reject(!in_array($asset['pin'],$kind==='headlines'?['','1','2','3']:['','1','2'],true));
            }
        }
        self::reject(!hash_equals(hash('sha256',self::canonical($d)), $r['draftRevision']), 'REVISION_CONFLICT',409);
        self::keys($r['consent'],['version','confirmed']);
        self::reject($r['consent']['version'] !== $consentVersion || $r['consent']['confirmed'] !== true,'CONSENT_REQUIRED',403);
        self::reject(!is_array($r['constraints']) || !array_is_list($r['constraints']) || count($r['constraints'])>20);
        foreach ($r['constraints'] as $value) self::text($value,500,false);
        self::reject(!is_array($r['evidence']) || !array_is_list($r['evidence']) || count($r['evidence'])>20);
        $ids=[]; $total=0;
        foreach ($r['evidence'] as $e) {
            self::keys($e,['id','text','sourceUrl','observedOn','scope','ownerConfirmed']);
            self::text($e['id'],64,false); self::text($e['text'],20000,false); self::text($e['sourceUrl'],4096);
            self::reject(isset($ids[$e['id']]) || !preg_match('/^[a-zA-Z0-9_-]+$/D',$e['id'])); $ids[$e['id']]=true;
            self::reject($e['sourceUrl']!=='' && !self::url($e['sourceUrl']));
            self::reject(!is_string($e['observedOn']) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D',$e['observedOn']));
            [$y,$m,$day]=array_map('intval',explode('-',$e['observedOn'])); self::reject(!checkdate($m,$day,$y));
            self::reject(!in_array($e['scope'],['offer','conditions','context'],true) || !is_bool($e['ownerConfirmed']));
            $total+=self::length($e['text']);
        }
        self::reject($total>20000);
        return $r;
    }
    public static function response(array $r, mixed $value): array {
        try {
            self::keys($value,['schemaVersion','requestId','draftRevision','status','suggestions','missingFacts','warnings']);
            self::reject($value['schemaVersion']!==1 || $value['requestId']!==$r['requestId'] || $value['draftRevision']!==$r['draftRevision']);
            self::reject(!in_array($value['status'],['review_required','insufficient_evidence'],true));
            foreach (['suggestions'=>10,'missingFacts'=>10,'warnings'=>20] as $key=>$max) self::reject(!is_array($value[$key]) || !array_is_list($value[$key]) || count($value[$key])>$max);
            foreach (array_merge($value['missingFacts'],$value['warnings']) as $text) self::text($text,1000,false);
            self::reject(($value['status']==='insufficient_evidence') !== (count($value['suggestions'])===0));
            $ids=[]; $targets=[]; $draft=$r['draft'];
            foreach ($value['suggestions'] as $s) {
                self::keys($s,['id','field','index','originalText','proposedText','reason','evidenceIds','requiresOwnerConfirmation']);
                self::text($s['id'],64,false); self::reject(isset($ids[$s['id']])); $ids[$s['id']]=true;
                self::reject(!in_array($s['field'],['headlines','descriptions'],true) || !is_int($s['index']) || !isset($draft[$s['field']][$s['index']]));
                $target=$s['field'].':'.$s['index']; self::reject(isset($targets[$target])); $targets[$target]=true;
                self::text($s['originalText'],1000); self::text($s['proposedText'],1000,false); self::text($s['reason'],1000,false);
                self::reject($s['originalText']!==$draft[$s['field']][$s['index']]['text'] || $s['requiresOwnerConfirmation']!==true);
                $text=$s['proposedText'];
                self::reject(preg_match('/[{}\x00-\x1f\x7f]|^[\s]*[=+@\-＝＋＠－]/u',$text)===1 || self::count($text)>($s['field']==='headlines'?30:90));
                foreach ($draft[$s['field']] as $i=>$asset) if ($i!==$s['index']) self::reject(normalizeAsset($asset['text'])===normalizeAsset($text));
                self::reject(!is_array($s['evidenceIds']) || !array_is_list($s['evidenceIds']) || count($s['evidenceIds'])===0);
                $supported=false;
                foreach ($s['evidenceIds'] as $id) {
                    self::reject(!is_string($id)); $found=false;
                    foreach ($r['evidence'] as $e) if ($id===$e['id']) {
                        $found=true;
                        self::reject(!$e['ownerConfirmed'] || !in_array($e['scope'],['offer','conditions'],true) || ($e['sourceUrl']!=='' && $e['sourceUrl']!==$draft['url']));
                        if (trim($e['text'])===$text) $supported=true;
                    }
                    self::reject(!$found);
                }
                // Extractive simulation only. Real generative validation is a separate future gate.
                self::reject(!$supported);
            }
            return $value;
        } catch (Throwable) { throw new ReviewError(502,'INVALID_PROVIDER_RESPONSE'); }
    }
}

function normalizeAsset(string $s): string {
    if (!class_exists('Normalizer') || !function_exists('mb_strtolower')) throw new ReviewError(503,'EXTENSION_REQUIRED');
    $s=preg_replace('/\p{M}/u','',\Normalizer::normalize($s,\Normalizer::FORM_D));
    return trim(preg_replace('/\s+/u',' ',mb_strtolower($s,'UTF-8')));
}

final class MockProvider {
    public function __invoke(array $r): array {
        $en=str_starts_with($r['locale'],'en');
        $out=['schemaVersion'=>1,'requestId'=>$r['requestId'],'draftRevision'=>$r['draftRevision'],
            'status'=>'insufficient_evidence','suggestions'=>[], 'missingFacts'=>[],
            'warnings'=>[$en?'Local simulation only. No AI or Google request. Human review required.':'Solo simulación local. Sin IA ni envío a Google. Requiere revisión humana.']];
        foreach ($r['evidence'] as $e) {
            if (!$e['ownerConfirmed'] || $e['scope']!=='offer' || ($e['sourceUrl']!=='' && $e['sourceUrl']!==$r['draft']['url'])) continue;
            $text=trim($e['text']);
            foreach (['headlines'=>30,'descriptions'=>90] as $field=>$max) {
                if (Contract::count($text)>$max || preg_match('/[{}\x00-\x1f\x7f]|^[\s]*[=+@\-＝＋＠－]/u',$text)) continue;
                if (in_array(normalizeAsset($text),array_map(fn($a)=>normalizeAsset($a['text']),$r['draft'][$field]),true)) continue;
                $out['suggestions'][]=['id'=>'local-1','field'=>$field,'index'=>0,'originalText'=>$r['draft'][$field][0]['text'],
                    'proposedText'=>$text,'reason'=>$en?'Repeats your confirmed fact verbatim to test the review flow.':'Repite tu hecho confirmado para probar el recorrido de revisión.',
                    'evidenceIds'=>[$e['id']],'requiresOwnerConfirmation'=>true];
                $out['status']='review_required'; return $out;
            }
        }
        $out['missingFacts'][]=$en?'Provide a different confirmed offer fact, no longer than 90 ad characters.':'Indica otro hecho confirmado de la oferta, de hasta 90 caracteres de anuncio.';
        return $out;
    }
}

final class ReviewService {
    private PDO $db;
    public function __construct(string $privateDirectory, string $publicRoot, private readonly int $perSession=6, private readonly int $globalLimit=60) {
        $public=realpath($publicRoot); if ($public===false) throw new ReviewError(503,'STORAGE_UNAVAILABLE');
        if (!is_dir($privateDirectory) && !mkdir($privateDirectory,0700,true) && !is_dir($privateDirectory)) throw new ReviewError(503,'STORAGE_UNAVAILABLE');
        $private=realpath($privateDirectory);
        $normalize=fn($p)=>strtolower(str_replace('\\','/',$p));
        if ($private===false || $normalize($private)===$normalize($public) || str_starts_with($normalize($private),$normalize($public).'/')) throw new ReviewError(503,'PRIVATE_STORAGE_REQUIRED');
        $this->db=new PDO('sqlite:'.$private.'/requests.sqlite',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
        $this->db->exec('PRAGMA busy_timeout=3000');
        $this->db->exec('CREATE TABLE IF NOT EXISTS requests (scope TEXT NOT NULL, id TEXT NOT NULL, fingerprint TEXT NOT NULL, created INTEGER NOT NULL, status TEXT NOT NULL, response TEXT, PRIMARY KEY(scope,id))');
    }
    public function review(array $r,string $session,callable $provider): array {
        Contract::reject($session==='','ACCESS_REQUIRED',403);
        $scope=hash('sha256',$session); $fingerprint=hash('sha256',Contract::canonical($r)); $now=time();
        try {
            $this->db->exec('BEGIN IMMEDIATE');
            $q=$this->db->prepare('DELETE FROM requests WHERE created < ?'); $q->execute([$now-600]);
            $q=$this->db->prepare('SELECT * FROM requests WHERE scope=? AND id=?'); $q->execute([$scope,$r['requestId']]); $prior=$q->fetch(PDO::FETCH_ASSOC);
            if ($prior) {
                if (!hash_equals($prior['fingerprint'],$fingerprint)) throw new ReviewError(409,'IDEMPOTENCY_CONFLICT');
                if ($prior['status']==='pending') throw new ReviewError(409,'REQUEST_PENDING');
                if ($prior['status']==='failed') throw new ReviewError(502,'PREVIOUS_REQUEST_FAILED');
                $this->db->exec('COMMIT'); return json_decode($prior['response'],true,32,JSON_THROW_ON_ERROR);
            }
            $q=$this->db->prepare('SELECT COUNT(*) FROM requests WHERE created >= ? AND scope=?'); $q->execute([$now-60,$scope]);
            if ((int)$q->fetchColumn()>=$this->perSession) throw new ReviewError(429,'SESSION_LIMIT');
            $q=$this->db->prepare('SELECT COUNT(*) FROM requests WHERE created >= ?'); $q->execute([$now-60]);
            if ((int)$q->fetchColumn()>=$this->globalLimit) throw new ReviewError(429,'GLOBAL_LIMIT');
            $q=$this->db->prepare('INSERT INTO requests VALUES (?,?,?,?,?,NULL)'); $q->execute([$scope,$r['requestId'],$fingerprint,$now,'pending']);
            $this->db->exec('COMMIT');
        } catch (Throwable $error) {
            try {$this->db->exec('ROLLBACK');} catch (Throwable) {}
            if ($error instanceof ReviewError) throw $error;
            throw new ReviewError(503,'STORAGE_UNAVAILABLE');
        }
        try {
            $response=Contract::response($r,$provider($r));
            $q=$this->db->prepare('UPDATE requests SET status=?,response=? WHERE scope=? AND id=?');
            $q->execute(['complete',Contract::canonical($response),$scope,$r['requestId']]); return $response;
        } catch (Throwable $error) {
            $q=$this->db->prepare('UPDATE requests SET status=? WHERE scope=? AND id=?'); $q->execute(['failed',$scope,$r['requestId']]);
            if ($error instanceof ReviewError) throw $error;
            throw new ReviewError(502,'PROVIDER_UNAVAILABLE');
        }
    }
}
