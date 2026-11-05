<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/server/ads-review/Review.php';
require dirname(__DIR__,2).'/server/ads-review/Pilot.php';
require dirname(__DIR__,2).'/server/ads-review/VerifiedAccess.php';
require dirname(__DIR__,2).'/server/ads-review/AccessController.php';
use Lienzo\Ads\{Contract,ReviewError,VerifiedEmailAccess,PilotStore,PilotReview,ReviewService,AdsAccessController};
$base=$argv[1]??throw new RuntimeException('Supply a fresh private directory');$root=dirname(__DIR__,2);$tests=[];$count=0;
function check(bool $ok,string $why='Assertion failed'):void {if(!$ok)throw new RuntimeException($why);}
function error(callable $work,int $status,string $reason):void {try{$work();}catch(ReviewError $e){check($e->status===$status&&$e->reason===$reason,'Unexpected '.$e->reason);return;}throw new RuntimeException('Expected '.$reason);}
function test(string $name,callable $work):void {global $tests;$work();$tests[]=$name;}
function request():array {
    $draft=['language'=>'es','business'=>'Fictional Studio','url'=>'https://example.com/offer','path1'=>'','path2'=>'','terms'=>'service',
        'headlines'=>[['text'=>'Conoce el servicio','pin'=>'']],'descriptions'=>[['text'=>'Consulta las condiciones.','pin'=>'']]];
    return ['schemaVersion'=>1,'requestId'=>'12345678-1234-4234-8234-123456789012','draftRevision'=>hash('sha256',Contract::canonical($draft)),
        'locale'=>'es-CO','goal'=>'Claridad','draft'=>$draft,'constraints'=>[],
        'evidence'=>[['id'=>'offer','text'=>'Primero, tu valoración','sourceUrl'=>$draft['url'],'scope'=>'offer','ownerConfirmed'=>true,'observedOn'=>'2026-11-04']],
        'consent'=>['version'=>'gemini-review-v1','confirmed'=>true]];
}
final class Scenario {
    public array $flow=[],$mail=[];public int $now=1793811600,$calls=0;public string $directory;
    public VerifiedEmailAccess $emails;public PilotStore $pilot;public AdsAccessController $controller;public bool $deliver=true;
    public function __construct(bool $preview=false,bool $enabled=true,bool $review=true,bool $mail=true) {
        global $base,$root,$count;$this->directory=$base.'/case-'.(++$count);
        $clock=fn()=>$this->now;
        $this->emails=new VerifiedEmailAccess($this->directory,$root,str_repeat('fictional-pepper-',3),$clock);
        $this->emails->invite('creator@example.test','es');
        $this->pilot=new PilotStore($this->directory,$root,[],$clock);
        $mock=new PilotReview($this->pilot,new ReviewService($this->directory,$root));
        $this->controller=new AdsAccessController($this->emails,$this->pilot,$mail?function($message){$this->mail[]=$message;return $this->deliver;}:null,
            $review?function($r,$grant)use($mock){$this->calls++;return $mock->review($r,$grant);}:null,$enabled,$preview,$clock);
    }
    public function server(string $method='POST'):array {return ['HTTPS'=>'on','HTTP_HOST'=>'lienzo.tools','HTTP_ORIGIN'=>'https://lienzo.tools',
        'REMOTE_ADDR'=>'192.0.2.10','CONTENT_TYPE'=>'application/json','REQUEST_METHOD'=>$method,'HTTP_X_CSRF_TOKEN'=>$this->flow['csrf']??''];}
    public function dispatch(string $path,array|string $body=[],string $lang='es',array $override=[]):array {
        $method=$path==='/api/ads/session'?'GET':'POST';
        return $this->controller->handle($override+$this->server($method),$path,is_string($body)?$body:json_encode($body),$this->flow,$lang);
    }
    public function start(string $email='creator@example.test'):array {$this->dispatch('/api/ads/session');return $this->dispatch('/api/ads/access/start',['email'=>$email]);}
    public function code():string {preg_match('/\b([0-9]{8})\b/',end($this->mail)['text'],$match);return $match[1];}
    public function login():array {$this->start();return $this->dispatch('/api/ads/access/verify',['code'=>$this->code()]);}
    public function grants():int {return (int)(new PDO('sqlite:'.$this->directory.'/pilot.sqlite'))->query('SELECT COUNT(*) FROM pilot_grants')->fetchColumn();}
}
test('controller defaults closed and does not allocate state',function(){$s=new Scenario(enabled:false);error(fn()=>$s->dispatch('/api/ads/session'),503,'ACCESS_NOT_CONFIGURED');check($s->flow===[]&&$s->mail===[]);});
test('anonymous bootstrap generates server nonce and separate CSRF only',function(){$s=new Scenario();$r=$s->dispatch('/api/ads/session');check($r['rotate']);check(strlen($s->flow['nonce'])===64&&$s->flow['nonce']!==$s->flow['csrf']);check(!str_contains(json_encode($r),$s->flow['nonce']));check(!$r['body']['authenticated']&&$s->grants()===0);});
test('HTTPS host Origin fetch-site method content-type and CSRF are enforced',function(){
    $s=new Scenario();$s->dispatch('/api/ads/session');
    foreach([['HTTPS'=>'off','HTTP_X_FORWARDED_PROTO'=>'https'],['HTTP_HOST'=>'www.lienzo.tools'],['HTTP_ORIGIN'=>'https://evil.test'],['HTTP_SEC_FETCH_SITE'=>'same-site'],['CONTENT_TYPE'=>'text/plain'],['HTTP_X_CSRF_TOKEN'=>str_repeat('f',64)]]as$change)
        error(fn()=>$s->dispatch('/api/ads/access/start',['email'=>'creator@example.test'],'es',$change),403,'ACCESS_REQUIRED');
    error(fn()=>$s->dispatch('/api/ads/access/start',[],'es',['REQUEST_METHOD'=>'GET']),405,'METHOD_NOT_ALLOWED');check($s->mail===[]);
});
test('POST cannot bootstrap its own nonce or CSRF',function(){$s=new Scenario();error(fn()=>$s->dispatch('/api/ads/access/start',['email'=>'creator@example.test']),403,'ACCESS_REQUIRED');check($s->flow===[]);});
test('unexpected browser nonce and challenge fields are rejected',function(){$s=new Scenario();$s->dispatch('/api/ads/session');error(fn()=>$s->dispatch('/api/ads/access/start',['email'=>'creator@example.test','nonce'=>str_repeat('a',64)]),400,'INVALID_REQUEST');error(fn()=>$s->dispatch('/api/ads/access/verify',['code'=>'12345678','challengeId'=>str_repeat('b',32)]),400,'INVALID_REQUEST');check($s->mail===[]);});
test('unknown mailbox has the same reply without revealing a code or identity',function(){$a=new Scenario();$b=new Scenario();$known=$a->start();$unknown=$b->start('unknown@example.test');check($known===$unknown&&count($a->mail)===1&&$b->mail===[]);check(!str_contains(json_encode($known),$a->code())&&!str_contains(json_encode($known),'creator@'));});
test('missing mailer blocks every mailbox without sending',function(){$s=new Scenario(mail:false);$s->dispatch('/api/ads/session');error(fn()=>$s->dispatch('/api/ads/access/start',['email'=>'creator@example.test']),503,'MAIL_NOT_CONFIGURED');check($s->mail===[]);});
test('resend cooldown is enforced server-side',function(){$s=new Scenario();$s->start();error(fn()=>$s->dispatch('/api/ads/access/start',['email'=>'creator@example.test']),429,'ACCESS_RESEND_WAIT');check(count($s->mail)===1);});
test('replacement code invalidates the old code',function(){$s=new Scenario();$s->start();$old=$s->code();$s->now+=61;$s->dispatch('/api/ads/access/start',['email'=>'creator@example.test']);error(fn()=>$s->dispatch('/api/ads/access/verify',['code'=>$old]),403,'ACCESS_REQUIRED');check($s->dispatch('/api/ads/access/verify',['code'=>$s->code()])['body']['authenticated']);});
test('verification rotates nonce CSRF and session; raw tokens never leave server state',function(){$s=new Scenario();$s->start();$old=$s->flow;$r=$s->dispatch('/api/ads/access/verify',['code'=>$s->code()]);check($r['rotate']&&$r['body']['authenticated']);check($old['nonce']!==$s->flow['nonce']&&$old['csrf']!==$s->flow['csrf']);check(!isset($s->flow['challengeId']));check(!str_contains(json_encode($r),$s->flow['authToken'])&&!str_contains(json_encode($r),$s->flow['authCsrf']));check($s->grants()===0);});
test('code verification cannot cross browser flows',function(){$s=new Scenario();$s->start();$code=$s->code();$s->flow['nonce']=bin2hex(random_bytes(32));error(fn()=>$s->dispatch('/api/ads/access/verify',['code'=>$code]),403,'ACCESS_REQUIRED');});
test('five wrong codes exhaust the challenge persistently',function(){$s=new Scenario();$s->start();$code=$s->code();$wrong=$code==='00000000'?'11111111':'00000000';for($i=0;$i<5;$i++)error(fn()=>$s->dispatch('/api/ads/access/verify',['code'=>$wrong]),403,'ACCESS_REQUIRED');error(fn()=>$s->dispatch('/api/ads/access/verify',['code'=>$code]),403,'ACCESS_REQUIRED');});
test('expired challenge is rejected without authenticating',function(){$s=new Scenario();$s->start();$code=$s->code();$s->now+=600;error(fn()=>$s->dispatch('/api/ads/access/verify',['code'=>$code]),403,'ACCESS_REQUIRED');check(!isset($s->flow['authToken']));});
test('mail acceptance failure cannot authenticate',function(){$s=new Scenario();$s->deliver=false;$s->start();error(fn()=>$s->dispatch('/api/ads/access/verify',['code'=>$s->code()]),403,'ACCESS_REQUIRED');});
test('read-only ES EN summaries preserve CSRF and never allocate a trial',function(){$s=new Scenario();$s->login();$es=$s->dispatch('/api/ads/session');$en=$s->dispatch('/api/ads/session',[],'en');check($es['body']['csrfToken']===$en['body']['csrfToken']);check($en['body']['consent']['version']==='gemini-review-v1'&&str_starts_with($en['body']['consent']['text'],'When'));check($s->grants()===0);});
test('review requires explicit current consent before allocating grant',function(){$s=new Scenario();$s->login();$r=request();$r['consent']['confirmed']=false;error(fn()=>$s->dispatch('/api/ads/review',$r),403,'CONSENT_REQUIRED');check($s->grants()===0&&$s->calls===0);});
test('unconfigured review never allocates or invokes a provider',function(){$s=new Scenario(review:false);$s->login();error(fn()=>$s->dispatch('/api/ads/review',request()),503,'GEMINI_PILOT_DISABLED');check($s->grants()===0&&$s->calls===0);});
test('review validates proposals and caches exactly one allowance',function(){$s=new Scenario();$s->login();$a=$s->dispatch('/api/ads/review',request());$b=$s->dispatch('/api/ads/review',request());check(Contract::canonical($a)===Contract::canonical($b),'Cached response differs');check($a['body']['status']==='review_required','Missing validated proposal');$en=$s->dispatch('/api/ads/session',[],'en');check($s->grants()===1&&$en['body']['pilot']['periodRemaining']===4&&$en['body']['pilot']['dailyRemaining']===1,'Quota changed more than once');});
test('logout revokes session rotates anonymous CSRF and preserves quota on relogin',function(){$s=new Scenario();$s->login();$s->dispatch('/api/ads/review',request());$old=$s->flow;$s->dispatch('/api/ads/access/logout','{}');check(!isset($s->flow['authToken'])&&$old['csrf']!==$s->flow['csrf']);error(fn()=>$s->emails->authorize($old['authToken'],$old['authCsrf']),403,'ACCESS_REQUIRED');$s->login();$r=$s->dispatch('/api/ads/session');check($r['body']['pilot']['periodRemaining']===4&&$s->grants()===1);});
test('revocation blocks even a cached review and resets session summary',function(){$s=new Scenario();$s->login();$s->dispatch('/api/ads/review',request());$s->emails->revoke('creator@example.test');error(fn()=>$s->dispatch('/api/ads/review',request()),403,'ACCESS_REQUIRED');$r=$s->dispatch('/api/ads/session');check(!$r['body']['authenticated']&&$r['rotate']);});
test('expired anonymous flow rotates through GET, never POST',function(){$s=new Scenario();$s->dispatch('/api/ads/session');$old=$s->flow;$s->now+=1800;error(fn()=>$s->dispatch('/api/ads/access/start',['email'=>'creator@example.test']),403,'ACCESS_REQUIRED');$s->dispatch('/api/ads/session');check($old['csrf']!==$s->flow['csrf']);});
test('body bounds and invalid JSON reject before delivery',function(){$s=new Scenario();$s->dispatch('/api/ads/session');error(fn()=>$s->dispatch('/api/ads/access/start',str_repeat('x',2049)),413,'REQUEST_TOO_LARGE');error(fn()=>$s->dispatch('/api/ads/access/start','{bad'),400,'INVALID_JSON');check($s->mail===[]);});
test('loopback exception cannot accept a remote host or peer',function(){$s=new Scenario(preview:true);error(fn()=>$s->dispatch('/api/ads/session'),403,'ACCESS_REQUIRED');$r=$s->dispatch('/api/ads/session',[],'es',['HTTP_HOST'=>'127.0.0.1:8812','REMOTE_ADDR'=>'127.0.0.1']);check($r['body']['mode']==='local-access-preview');});
test('unknown routes and language are closed',function(){$s=new Scenario();error(fn()=>$s->dispatch('/api/ads/admin'),404,'NOT_FOUND');error(fn()=>$s->dispatch('/api/ads/session',[],'fr'),400,'INVALID_LANGUAGE');});
echo json_encode(['passed'=>count($tests),'tests'=>$tests],JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
