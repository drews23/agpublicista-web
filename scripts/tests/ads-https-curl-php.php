<?php
declare(strict_types=1);
namespace Lienzo\Ads;
// Namespace substitutes exercise the actual cURL branch without opening a socket.
require dirname(__DIR__,2).'/server/ads-review/Review.php';
require dirname(__DIR__,2).'/server/ads-review/Gemini.php';
require dirname(__DIR__,2).'/server/ads-review/GeminiHttps.php';
$tests=[];$scenario='ok';$options=[];$sends=0;$closes=0;
function check(bool $ok):void {if(!$ok)throw new \RuntimeException('Assertion failed');}
check(extension_loaded('curl'));
// If production changes to bypass these substitutes, fail before any transport call.
check(!preg_match('/\\\\curl_[a-z_]+\s*\(/',file_get_contents(dirname(__DIR__,2).'/server/ads-review/GeminiHttps.php')));
function curl_init():object {return new \stdClass;}
function curl_setopt_array($h,array $o):bool {global $options;$options=$o;return true;}
function curl_exec($h):bool {
    global $scenario,$sends,$options;$sends++;
    if(in_array($scenario,['timeout','tls-failure'],true))return false;
    $chunks=$scenario==='oversize'?[str_repeat('x',100000),str_repeat('y',40000)]:['{"synthetic":true}'];
    foreach($chunks as$chunk)if($options[CURLOPT_WRITEFUNCTION]($h,$chunk)!==strlen($chunk))return false;
    return true;
}
function curl_errno($h):int {global $scenario;return $scenario==='timeout'?CURLE_OPERATION_TIMEDOUT:CURLE_PEER_FAILED_VERIFICATION;}
function curl_getinfo($h,int $option):int {global $scenario;return $scenario==='redirect'?302:($scenario==='http-error'?500:200);}
function curl_close($h):void {global $closes;$closes++;}
function test(string $name,callable $work):void {global $tests,$scenario,$sends,$closes;$scenario='ok';$sends=0;$closes=0;$work();$tests[]=$name;}
function call():array {
    $d=['language'=>'es','business'=>'Fictional','url'=>'https://example.com/offer','path1'=>'','path2'=>'','terms'=>'',
        'headlines'=>[['text'=>'Consulta el servicio','pin'=>'']],'descriptions'=>[['text'=>'Revisa las condiciones.','pin'=>'']]];
    $r=['schemaVersion'=>1,'requestId'=>'12345678-1234-4234-8234-123456789012','draftRevision'=>hash('sha256',Contract::canonical($d)),
        'locale'=>'es-CO','goal'=>'Claridad','draft'=>$d,'constraints'=>[],'evidence'=>[],'consent'=>['version'=>'gemini-review-v1','confirmed'=>true]];
    $spec=(new GeminiProvider(null,fn()=>strtotime('2026-11-04T12:00:00-05:00')))->specification($r);
    return (new GeminiHttpsTransport(fn()=>GeminiCredentials::fromValues(['schemaVersion'=>1,'projectId'=>GeminiCredentials::PROJECT,
        'geminiApiKey'=>'SYNTHETIC_ONLY_NOT_A_REAL_GOOGLE_KEY_12345']),true))($spec);
}
function error(string $reason,int $status):void {try{call();}catch(ReviewError $e){check($e->reason===$reason&&$e->status===$status);return;}throw new \RuntimeException('Expected error');}
test('cURL branch enforces TLS HTTPS endpoint and no proxy or redirect',function(){global $options,$sends,$closes;$r=call();check($r['status']===200&&$sends===1&&$closes===1);check($options[CURLOPT_URL]===GeminiProvider::ENDPOINT&&$options[CURLOPT_PROTOCOLS]===CURLPROTO_HTTPS);check($options[CURLOPT_SSL_VERIFYPEER]===true&&$options[CURLOPT_SSL_VERIFYHOST]===2);check($options[CURLOPT_FOLLOWLOCATION]===false&&$options[CURLOPT_MAXREDIRS]===0&&$options[CURLOPT_PROXY]==='');});
test('cURL branch enforces connection and total deadlines',function(){global $options;call();check($options[CURLOPT_CONNECTTIMEOUT_MS]===5000&&$options[CURLOPT_TIMEOUT_MS]===30000);});
test('credential is only in HTTPS headers and verbose logging is disabled',function(){global $options;call();check(count($options[CURLOPT_HTTPHEADER])===3);check(str_starts_with($options[CURLOPT_HTTPHEADER][2],'x-goog-api-key: SYNTHETIC_ONLY'));check(!str_contains($options[CURLOPT_POSTFIELDS],'SYNTHETIC_ONLY')&&$options[CURLOPT_VERBOSE]===false);});
test('redirects fail without a second request',function(){global $scenario,$sends,$closes;$scenario='redirect';error('PROVIDER_UNAVAILABLE',502);check($sends===1&&$closes===1);});
test('body cap aborts while receiving rather than after downloading everything',function(){global $scenario,$sends,$closes;$scenario='oversize';error('PROVIDER_RESPONSE_TOO_LARGE',502);check($sends===1&&$closes===1);});
test('timeout does not retry and closes the handle',function(){global $scenario,$sends,$closes;$scenario='timeout';error('REVIEW_TIMEOUT',504);check($sends===1&&$closes===1);});
test('TLS failure cannot fall back to insecure HTTP',function(){global $scenario,$sends,$closes;$scenario='tls-failure';error('PROVIDER_UNAVAILABLE',502);check($sends===1&&$closes===1);});
test('HTTP error is returned once for the provider to sanitize',function(){global $scenario,$sends;$scenario='http-error';check(call()['status']===500&&$sends===1);});
echo json_encode(['passed'=>count($tests),'network'=>'cURL functions substituted; no socket opened','tests'=>$tests],JSON_PRETTY_PRINT);
