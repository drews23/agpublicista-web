<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/server/ads-review/Review.php';
require dirname(__DIR__,2).'/server/ads-review/Pilot.php';
use Lienzo\Ads\{PilotStore,PilotReview,ReviewService,ReviewError,Contract};
$root=dirname(__DIR__,2);
if (($argv[1]??'')==='setup-race') {
    $s=new PilotStore($argv[2],$root,['budgetMicroUsd'=>100,'dailyReviews'=>5]);
    $a=$s->redeem($s->issueInvite('fictional-race-a'));$b=$s->redeem($s->issueInvite('fictional-race-b'));
    $token=$s->issueInvite('fictional-race-c');file_put_contents($argv[2].'/race-token.txt',$token);
    echo json_encode(['a'=>$a,'b'=>$b]);exit;
}
if (in_array($argv[1]??'',['worker-reserve','worker-redeem'],true)) {
    $s=new PilotStore($argv[2],$root,['budgetMicroUsd'=>100,'dailyReviews'=>5]);
    try {
        if($argv[1]==='worker-redeem') $s->redeem(file_get_contents($argv[2].'/race-token.txt'));
        else {$s->reserve($argv[3],$argv[4],str_repeat('a',64),75);usleep(150000);$s->complete($argv[3],$argv[4],75);}
        echo json_encode(['status'=>200]);
    }catch(ReviewError $e){echo json_encode(['status'=>$e->status,'error'=>$e->reason]);}
    exit;
}
$base=$argv[1];$tests=[];$index=0;
function check(bool $ok,string $message='Assertion failed'):void {if(!$ok)throw new RuntimeException($message);}
function test(string $name,callable $call):void {global $tests;$call();$tests[]=$name;}
function error(callable $call,int $status,string $code):void {try{$call();}catch(ReviewError $e){check($e->status===$status&&$e->reason===$code,'Unexpected '.$e->reason);return;}throw new RuntimeException('Expected '.$code);}
function store(array $policy=[],?\Closure $clock=null):array {global $base,$root,$index;$dir=$base.'/case-'.(++$index);return [new PilotStore($dir,$root,$policy,$clock),$dir];}
function grant(PilotStore $s,string $person='fictional-person-a'):string {return $s->redeem($s->issueInvite($person));}
function rid(int $i):string {return sprintf('12345678-1234-4234-8234-%012d',$i);}
function fixture(int $i=1,string $locale='es-CO'):array {
    $d=['language'=>str_starts_with($locale,'en')?'en':'es','business'=>'Fictional coffee','url'=>'https://example.com/coffee','path1'=>'','path2'=>'','terms'=>'coffee',
        'headlines'=>[['text'=>'Coffee for your day','pin'=>''],['text'=>'Explore our coffee','pin'=>''],['text'=>'Discover the offer','pin'=>'']],
        'descriptions'=>[['text'=>'Discover our coffee and its conditions.','pin'=>''],['text'=>'Explore the available options.','pin'=>'']]];
    return Contract::request(Contract::canonical(['schemaVersion'=>1,'requestId'=>rid($i),'draftRevision'=>hash('sha256',Contract::canonical($d)),
        'locale'=>$locale,'goal'=>'Clear offer','draft'=>$d,'evidence'=>[['id'=>'offer-1','text'=>'Roasted in small batches','sourceUrl'=>$d['url'],'observedOn'=>'2026-11-04','scope'=>'offer','ownerConfirmed'=>true]],
        'constraints'=>[],'consent'=>['version'=>'local-simulation-v1','confirmed'=>true]]));
}
$fp=str_repeat('a',64);
test('public storage rejected before creation',function()use($root){$dir=$root.'/output/pilot-must-not-exist';error(fn()=>new PilotStore($dir,$root),503,'PRIVATE_STORAGE_REQUIRED');check(!file_exists($dir));});
test('unsafe traversal rejected',function()use($base,$root){error(fn()=>new PilotStore($base.'/../unsafe',$root),503,'PRIVATE_STORAGE_REQUIRED');});
test('invalid policy fails closed',function()use($base,$root){error(fn()=>new PilotStore($base.'/invalid',$root,['budgetMicroUsd'=>-1]),503,'INVALID_PILOT_POLICY');});
test('invitation is stored hashed and redeemed only once',function(){[$s,$dir]=store();$token=$s->issueInvite('fictional-person-a');check(!str_contains(file_get_contents($dir.'/pilot.sqlite'),$token));$id=$s->redeem($token);check($s->status($id)['access']==='active');error(fn()=>$s->redeem($token),403,'INVITATION_INVALID');});
test('malformed and missing invitations cannot activate',function(){[$s]=store();error(fn()=>$s->redeem('bad'),403,'INVITATION_INVALID');error(fn()=>$s->redeem(str_repeat('a',64)),403,'INVITATION_INVALID');});
test('expired invitation is rejected at exact boundary',function(){$now=1000;[$s]=store([],function()use(&$now){return $now;});$token=$s->issueInvite('fictional-person-a',10);$now=1010;error(fn()=>$s->redeem($token),403,'INVITATION_INVALID');});
test('replacement invitation invalidates the unused previous one',function(){[$s]=store();$old=$s->issueInvite('fictional-person-a');$new=$s->issueInvite('fictional-person-a');error(fn()=>$s->redeem($old),403,'INVITATION_INVALID');check($s->redeem($new)!=='');});
test('same participant keeps grant and quota after another invitation',function()use($fp){[$s]=store();$a=grant($s);$s->reserve($a,rid(1),$fp);$s->complete($a,rid(1));$b=grant($s);check($a===$b&&$s->status($b)['periodRemaining']===4);});
test('cohort capacity does not block an existing participant',function(){[$s]=store(['capacity'=>1]);$a=grant($s);$token=$s->issueInvite('fictional-person-b');error(fn()=>$s->redeem($token),403,'PILOT_FULL');check(grant($s)===$a);});
test('revoked participant cannot review or redeem a new invitation',function()use($fp){[$s]=store();$id=grant($s);$token=$s->issueInvite('fictional-person-a');$s->revoke($id);error(fn()=>$s->reserve($id,rid(1),$fp),403,'INVITATION_REQUIRED');error(fn()=>$s->redeem($token),403,'INVITATION_REQUIRED');});
test('pilot access expires after its fixed period',function(){$now=1000;[$s]=store(['periodDays'=>1],function()use(&$now){return $now;});$id=grant($s);$now+=86400;error(fn()=>$s->status($id),403,'PILOT_EXPIRED');});
test('daily quota survives new sessions and resets at Bogota midnight',function()use($root,$fp){$now=strtotime('2026-11-04T17:00:00Z');$clock=function()use(&$now){return $now;};[$s,$dir]=store([],$clock);$id=grant($s);foreach([1,2]as$i){$s->reserve($id,rid($i),$fp);$s->complete($id,rid($i));}$other=new PilotStore($dir,$root,[],$clock);error(fn()=>$other->reserve($id,rid(3),$fp),429,'PILOT_DAILY_LIMIT');$now=strtotime('2026-11-05T04:59:59Z');check($other->status($id)['dailyRemaining']===0);$now++;check($other->status($id)['dailyRemaining']===2&&$other->status($id)['periodRemaining']===3);});
test('period quota survives daily reset',function()use($fp){$now=1793811600;[$s]=store([],function()use(&$now){return $now;});$id=grant($s);foreach(range(1,5)as$i){$s->reserve($id,rid($i),$fp);$s->complete($id,rid($i));$now+=86400;}error(fn()=>$s->reserve($id,rid(6),$fp),429,'PILOT_PERIOD_LIMIT');});
test('exact retry does not reserve again and changed bodies conflict',function()use($fp){[$s]=store();$id=grant($s);check($s->reserve($id,rid(1),$fp));error(fn()=>$s->reserve($id,rid(1),$fp),409,'REVIEW_RESERVED');$s->complete($id,rid(1));check(!$s->reserve($id,rid(1),$fp));error(fn()=>$s->reserve($id,rid(1),str_repeat('b',64)),409,'IDEMPOTENCY_CONFLICT');check($s->status($id)['periodRemaining']===4);});
test('zero paid budget rejects any positive reservation',function()use($fp){[$s]=store();$id=grant($s);error(fn()=>$s->reserve($id,rid(1),$fp,1),429,'PILOT_BUDGET_LIMIT');check($s->status($id)['periodRemaining']===5);});
test('global budget is shared across participants',function()use($fp){[$s]=store(['budgetMicroUsd'=>100]);$a=grant($s);$b=grant($s,'fictional-person-b');$s->reserve($a,rid(1),$fp,75);error(fn()=>$s->reserve($b,rid(1),$fp,75),429,'PILOT_BUDGET_LIMIT');check($s->status($b)['periodRemaining']===5);});
test('total pilot budget never renews at a calendar month boundary',function()use($fp){$now=strtotime('2026-11-30T18:00:00Z');[$s]=store(['budgetMicroUsd'=>5],function()use(&$now){return $now;});$a=grant($s);$s->reserve($a,rid(1),$fp,3);$s->complete($a,rid(1),3);$now=strtotime('2026-12-01T18:00:00Z');error(fn()=>$s->reserve($a,rid(2),$fp,3),429,'PILOT_BUDGET_LIMIT');check($s->reserve($a,rid(2),$fp,2));$s->complete($a,rid(2),2);$b=grant($s,'fictional-person-b');error(fn()=>$s->reserve($b,rid(1),$fp,1),429,'PILOT_BUDGET_LIMIT');});
test('uncertain reservations stay held across calendar months',function()use($fp){$now=strtotime('2026-11-30T18:00:00Z');[$s]=store(['budgetMicroUsd'=>5],function()use(&$now){return $now;});$a=grant($s);$s->reserve($a,rid(1),$fp,3);$s->uncertain($a,rid(1));$now=strtotime('2026-12-01T18:00:00Z');error(fn()=>$s->reserve($a,rid(2),$fp,3),429,'PILOT_BUDGET_LIMIT');});
test('settlement releases only unused reserved budget',function()use($fp){[$s]=store(['budgetMicroUsd'=>5]);$a=grant($s);$s->reserve($a,rid(1),$fp,3);$s->complete($a,rid(1),2);check($s->reserve($a,rid(2),$fp,3));});
test('uncertain execution keeps its slot and maximum cost reserved',function()use($fp){[$s]=store(['budgetMicroUsd'=>5]);$a=grant($s);$s->reserve($a,rid(1),$fp,3);$s->uncertain($a,rid(1));error(fn()=>$s->reserve($a,rid(1),$fp,3),409,'REVIEW_RESERVED');error(fn()=>$s->reserve($a,rid(2),$fp,3),429,'PILOT_BUDGET_LIMIT');check($s->status($a)['periodRemaining']===4);});
test('accounting mismatch pauses further execution',function()use($fp){[$s]=store(['budgetMicroUsd'=>10]);$a=grant($s);$s->reserve($a,rid(1),$fp,3);error(fn()=>$s->complete($a,rid(1),4),503,'BUDGET_ACCOUNTING_MISMATCH');check($s->status($a)['paused']);error(fn()=>$s->reserve($a,rid(2),$fp),503,'PILOT_PAUSED');});
test('ES and EN use the same participant allowance',function()use($root){[$s,$dir]=store();$a=grant($s);$reviews=new PilotReview($s,new ReviewService($dir,$root));check($reviews->review(fixture(1),$a)['status']==='review_required');check($reviews->review(fixture(2,'en-US'),$a)['status']==='review_required');check($s->status($a)['periodRemaining']===3);error(fn()=>$reviews->review(fixture(3),$a),429,'PILOT_DAILY_LIMIT');});
test('cached response reuses allowance and revocation still blocks it',function()use($root){[$s,$dir]=store();$a=grant($s);$reviews=new PilotReview($s,new ReviewService($dir,$root));$r=fixture();$one=$reviews->review($r,$a);check(Contract::canonical($reviews->review($r,$a))===Contract::canonical($one));check($s->status($a)['periodRemaining']===4);$s->revoke($a);error(fn()=>$reviews->review($r,$a),403,'INVITATION_REQUIRED');});
test('cache expiry cannot silently execute a charged request again',function()use($root){[$s,$dir]=store();$a=grant($s);$reviews=new PilotReview($s,new ReviewService($dir,$root));$r=fixture();$reviews->review($r,$a);$db=new PDO('sqlite:'.$dir.'/requests.sqlite');$db->exec('UPDATE requests SET created='.(time()-601));error(fn()=>$reviews->review($r,$a),409,'REVIEW_RESULT_EXPIRED');check($s->status($a)['periodRemaining']===4);});
test('public endpoint cannot provide paid costs or budget',function(){$r=fixture();$r['budgetMicroUsd']=100000;error(fn()=>Contract::request(Contract::canonical($r)),400,'INVALID_REQUEST');});
echo json_encode(['passed'=>count($tests),'tests'=>$tests],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)."\n";
