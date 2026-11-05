<?php
declare(strict_types=1);
// Copied into a unique private fixture directory. Never install as a product endpoint.
ini_set('display_errors','0');
header('Cache-Control: no-store, max-age=0');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
function probeReply(int $status,array $value):never {http_response_code($status);header('Content-Type: application/json; charset=utf-8');echo json_encode($value,JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);exit;}
function probeClosed():never {http_response_code(404);exit;}
try {
    $private=realpath(__DIR__);
    $config=json_decode(file_get_contents(__DIR__.'/probe-config.json'),true,8,JSON_THROW_ON_ERROR);
    $public=realpath($config['publicRoot']??'');
    if($private===false || $public===false || !preg_match('/^lienzo-web-probe-[a-f0-9]{12}$/D',basename($private)) ||
        $private===$public || str_starts_with($private,$public.'/') || is_link(__FILE__) ||
        !is_int($config['expiresAt']??null) || $config['expiresAt']<time() || $config['expiresAt']>time()+3600 ||
        !preg_match('/^[a-f0-9]{64}$/D',$config['tokenHash']??'') || is_file($private.'/finished.json'))probeClosed();
    if(($_SERVER['HTTP_HOST']??'')!=='lienzo.tools')probeClosed();
    if(($_SERVER['REQUEST_METHOD']??'')==='GET') {
        $nonce=base64_encode(random_bytes(18));
        header("Content-Security-Policy: default-src 'none'; script-src 'nonce-$nonce'; style-src 'nonce-$nonce'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'");
        header('Content-Type: text/html; charset=utf-8');
        ?>
<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lienzo · Comprobación privada</title>
<style nonce="<?=htmlspecialchars($nonce)?>">body{margin:0;background:#0a1119;color:#e7eff6;font:16px/1.6 system-ui;padding:32px}main{max-width:960px;margin:auto}h1{font-size:clamp(28px,5vw,42px)}label{display:block}input,button{font:inherit;padding:12px;border-radius:10px;border:1px solid #526071}input{background:#151f2b;color:white;width:min(90%,600px)}button{background:#00d5d5;color:#031018;margin:18px 0;cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:20px;background:#14202c;border-radius:12px}small{color:#a7b9cc}</style>
<main><small>LIENZO · DIAGNÓSTICO TEMPORAL</small><h1>Comprobación privada del alojamiento</h1><p>Solo datos ficticios. Sin claves reales, emails ni generaciones de IA.</p><form id="probe-form"><label for="probe-token">Código temporal de la prueba</label><input id="probe-token" type="password" autocomplete="off" required><br><button id="probe-run">Ejecutar comprobación</button></form><pre id="probe-result" role="status">Esperando autorización de la prueba.</pre></main>
<script nonce="<?=htmlspecialchars($nonce)?>">
document.getElementById('probe-form').addEventListener('submit',async event=>{
 event.preventDefault();const field=document.getElementById('probe-token'),token=field.value;field.value='';
 const out=document.getElementById('probe-result'),button=document.getElementById('probe-run');button.disabled=true;
 async function call(body){const response=await fetch(location.pathname,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Lienzo-Probe':token},body:JSON.stringify(body)});if(!response.ok)throw new Error('La comprobación devolvió HTTP '+response.status);return response.json();}
 try{out.textContent='Preparando la sesión segura…';const start=await call({action:'bootstrap'});out.textContent='Comprobando almacenamiento, PHP, SQLite y HTTPS…';await call({action:'run',csrf:start.csrf});out.textContent='Comprobando reservas simultáneas…';await Promise.all([call({action:'race',csrf:start.csrf}),call({action:'race',csrf:start.csrf})]);const result=await call({action:'finish',csrf:start.csrf});out.textContent=JSON.stringify(result,null,2);document.title='Lienzo · Comprobación finalizada';}
 catch(error){out.textContent=error.message;button.disabled=false;}
});
</script></html>
        <?php exit;
    }
    $token=$_SERVER['HTTP_X_LIENZO_PROBE']??'';
    if(($_SERVER['REQUEST_METHOD']??'')!=='POST' || !preg_match('/^[a-f0-9]{64}$/D',$token) ||
        !hash_equals($config['tokenHash'],hash('sha256',$token)) ||
        ($_SERVER['HTTP_ORIGIN']??'')!=='https://lienzo.tools' ||
        strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE']??'')[0]))!=='application/json')probeClosed();
    $body=file_get_contents('php://input',false,null,0,1025);
    if(strlen($body)>1024)probeReply(413,['error'=>'REQUEST_TOO_LARGE']);
    $input=json_decode($body,true,8,JSON_THROW_ON_ERROR);
    if(!is_array($input)||!in_array($input['action']??'',['bootstrap','run','race','finish'],true))probeClosed();
    // Tighten only the newly uploaded fixture directory and its explicit file list.
    if(!chmod($private,0700))probeReply(503,['error'=>'PRIVATE_PERMISSIONS_REQUIRED']);
    foreach(array_merge(array_keys($config['sourceHashes']),['probe-config.json','hosting-web-probe.php']) as $name){
        if(!preg_match('/^[a-zA-Z0-9_.-]+$/D',$name) || is_link($private.'/'.$name) || !chmod($private.'/'.$name,0600))probeClosed();
    }
    umask(0077);
    foreach(['Review.php','Pilot.php','Gemini.php','PrivateFiles.php','GeminiHttps.php','VerifiedAccess.php'] as$file)require_once $private.'/'.$file;
    $sessionDirectory=\Lienzo\Ads\PrivateFiles::directory($private.'/sessions',$public);
    ini_set('session.use_strict_mode','1');ini_set('session.use_only_cookies','1');ini_set('session.use_trans_sid','0');
    session_name('__Host-LienzoProbe-'.substr(basename($private),-12));session_save_path($sessionDirectory);
    session_set_cookie_params(['lifetime'=>600,'path'=>'/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);
    session_start();
    if($input['action']==='bootstrap') {
        if(!isset($_SESSION['csrf'])){session_regenerate_id(true);$_SESSION['csrf']=bin2hex(random_bytes(32));$_SESSION['establishedAt']=time();}
        $csrf=$_SESSION['csrf'];session_write_close();probeReply(200,['csrf'=>$csrf]);
    }
    if(!isset($_SESSION['csrf']) || !is_string($input['csrf']??null))probeReply(403,['error'=>'SESSION_REQUIRED']);
    \Lienzo\Ads\AdsHttpsGuard::post($_SERVER,$_SESSION['csrf'],$input['csrf']);
    $sessionRoundtrip=isset($_SESSION['establishedAt']);$cookie=session_get_cookie_params();
    // Release the PHP session lock before parallel SQLite work.
    session_write_close();
    if($input['action']==='run') {
        $once=@fopen($private.'/run.lock','x');
        if($once===false)probeReply(409,['error'=>'PROBE_ALREADY_RUN']);
        fclose($once);
        $report=['schemaVersion'=>1,'probe'=>'lienzo-secure-web','checkedAt'=>gmdate('c'),
            'runtime'=>['php'=>PHP_VERSION,'sapi'=>PHP_SAPI], 'checks'=>[],
            'limits'=>['realCredentialsRead'=>false,'generationCalled'=>false,'emailSent'=>false,'customerDataUsed'=>false,
                'googleAuthenticationTested'=>false,'temporaryDiagnosticOnly'=>true]];
        $checks=&$report['checks'];
        $checks['webSapi']=!in_array(PHP_SAPI,['cli','cli-server'],true);
        $checks['php83']=version_compare(PHP_VERSION,'8.3.0','>=');
        foreach(['pdo_sqlite','intl','mbstring','curl','openssl','session']as$e)$checks['extension_'.$e]=extension_loaded($e);
        $checks['effectiveUidAvailable']=function_exists('posix_geteuid');
        $checks['directHttpsIndicator']=in_array($_SERVER['HTTPS']??'',['on','1'],true);
        $checks['realOriginCsrfJsonGuard']=true;
        $checks['browserSessionRoundtrip']=$sessionRoundtrip;
        $checks['cookieSecureConfigured']=$cookie['secure']===true;
        $checks['cookieHttpOnlyConfigured']=$cookie['httponly']===true;
        $checks['cookieSameSiteConfigured']=$cookie['samesite']==='Strict';
        $checks['cookieHostPrefix']=str_starts_with(session_name(),'__Host-')&&$cookie['domain']===''&&$cookie['path']==='/';
        $checks['sourceHashesMatch']=true;
        foreach($config['sourceHashes']as$file=>$hash)if(!hash_equals($hash,hash_file('sha256',$private.'/'.$file)))$checks['sourceHashesMatch']=false;
        $fixture=\Lienzo\Ads\PrivateFiles::directory($private.'/fixtures',$public);
        clearstatcache();$checks['privateDirectory0700']=(fileperms($private)&0777)===0700;
        $checks['privateFixture0700']=(fileperms($fixture)&0777)===0700;
        $fake=['schemaVersion'=>1,'projectId'=>\Lienzo\Ads\GeminiCredentials::PROJECT,'geminiApiKey'=>'SYNTHETIC_ONLY_NOT_A_REAL_GOOGLE_KEY_12345'];
        file_put_contents($fixture.'/synthetic-credential.json',json_encode($fake,JSON_THROW_ON_ERROR),LOCK_EX);
        $credential=\Lienzo\Ads\GeminiCredentials::fromFile($fixture.'/synthetic-credential.json',$public);
        $checks['strictPrivateFileReader']=str_starts_with($credential->header(),'x-goog-api-key: SYNTHETIC_ONLY');
        $checks['syntheticCredential0600']=(fileperms($fixture.'/synthetic-credential.json')&0777)===0600;
        $checks['credentialDumpRedacted']=json_encode($credential)==='{}';
        $access=new \Lienzo\Ads\VerifiedEmailAccess($fixture,$public,bin2hex(random_bytes(32)));
        $access->invite('fixture@example.com');$messages=[];$nonce=bin2hex(random_bytes(32));
        $challenge=$access->start('fixture@example.com',$nonce,'192.0.2.1',function($m)use(&$messages){$messages[]=$m;return true;});
        preg_match('/\b([0-9]{8})\b/',$messages[0]['text'],$match);
        $login=$access->verify($challenge['challengeId'],$match[1],$nonce,'192.0.2.1');
        $access->authorize($login['sessionToken'],$login['csrfToken']);$checks['syntheticEmailCodeSession']=true;
        $checks['syntheticCodeSingleUse']=false;
        try{$access->verify($challenge['challengeId'],$match[1],$nonce,'192.0.2.1');}catch(\Lienzo\Ads\ReviewError $e){$checks['syntheticCodeSingleUse']=$e->reason==='ACCESS_REQUIRED';}
        $access->logout($login['sessionToken'],$login['csrfToken']);$checks['syntheticLogoutRevokes']=false;
        try{$access->authorize($login['sessionToken'],$login['csrfToken']);}catch(\Lienzo\Ads\ReviewError $e){$checks['syntheticLogoutRevokes']=$e->reason==='ACCESS_REQUIRED';}
        $pilot=new \Lienzo\Ads\PilotStore($fixture,$public);
        $grant=$pilot->redeem($pilot->issueInvite('fictional-web-probe'));
        $checks['privatePilotSqlite']=$pilot->status($grant)['periodRemaining']===5;
        $checks['paidGenerationStillDisabled']=$pilot->status($grant)['paidGenerationEnabled']===false;
        clearstatcache();$checks['privateDatabases0600']=(fileperms($fixture.'/pilot.sqlite')&0777)===0600&&(fileperms($fixture.'/verified-access.sqlite')&0777)===0600;
        $reads=0;$transport=new \Lienzo\Ads\GeminiHttpsTransport(function()use(&$reads,$credential){$reads++;return $credential;});
        $checks['realTransportClosed']=false;
        try{$transport([]);}catch(\Lienzo\Ads\ReviewError $e){$checks['realTransportClosed']=$e->reason==='GEMINI_TRANSPORT_DISABLED'&&$reads===0;}
        $curl=curl_init('https://generativelanguage.googleapis.com/');
        curl_setopt_array($curl,[CURLOPT_NOBODY=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,
            CURLOPT_PROXY=>'',CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_TIMEOUT=>5,CURLOPT_SSL_VERIFYPEER=>true,
            CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS]);
        curl_exec($curl);$status=(int)curl_getinfo($curl,CURLINFO_RESPONSE_CODE);
        $checks['unauthenticatedGoogleTlsHead']=curl_errno($curl)===0&&(int)curl_getinfo($curl,CURLINFO_SSL_VERIFYRESULT)===0&&$status>=100&&$status<600;
        $report['outbound']=['method'=>'HEAD','host'=>'generativelanguage.googleapis.com','httpStatus'=>$status,'curlErrorCode'=>curl_errno($curl)];curl_close($curl);
        $db=new PDO('sqlite:'.$fixture.'/race.sqlite',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
        $db->exec('CREATE TABLE reservations(id TEXT PRIMARY KEY);CREATE TABLE attempts(pid INTEGER NOT NULL)');
        $checks['privateSqliteIntegrity']=$db->query('PRAGMA integrity_check')->fetchColumn()==='ok';
        file_put_contents($private.'/preliminary.json',json_encode($report,JSON_THROW_ON_ERROR),LOCK_EX);
        probeReply(200,['prepared'=>true]);
    }
    if(!is_file($private.'/preliminary.json'))probeReply(409,['error'=>'PROBE_NOT_PREPARED']);
    if($input['action']==='race') {
        $db=new PDO('sqlite:'.$private.'/fixtures/race.sqlite',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
        $db->exec('PRAGMA busy_timeout=3000;BEGIN IMMEDIATE');
        if((int)$db->query('SELECT COUNT(*) FROM attempts')->fetchColumn()>=2){$db->exec('ROLLBACK');probeReply(429,['error'=>'RACE_LIMIT']);}
        $db->prepare('INSERT INTO attempts VALUES (?)')->execute([getmypid()]);
        $won=(int)$db->query('SELECT COUNT(*) FROM reservations')->fetchColumn()===0;
        if($won){$db->exec("INSERT INTO reservations VALUES ('fictional-reservation')");usleep(250000);}
        $db->exec('COMMIT');probeReply(200,['reserved'=>$won]);
    }
    $report=json_decode(file_get_contents($private.'/preliminary.json'),true,16,JSON_THROW_ON_ERROR);
    $db=new PDO('sqlite:'.$private.'/fixtures/race.sqlite');
    $report['checks']['twoParallelWebAttempts']=(int)$db->query('SELECT COUNT(*) FROM attempts')->fetchColumn()===2;
    $report['checks']['singleAtomicReservation']=(int)$db->query('SELECT COUNT(*) FROM reservations')->fetchColumn()===1;
    $report['observations']['differentWebWorkers']=(int)$db->query('SELECT COUNT(DISTINCT pid) FROM attempts')->fetchColumn()>1;
    $report['passed']=!in_array(false,$report['checks'],true);
    file_put_contents($private.'/finished.json',json_encode($report,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR),LOCK_EX);
    setcookie(session_name(),'',array_merge(\Lienzo\Ads\AdsHttpsGuard::cookieOptions(time()-3600),[]));
    probeReply(200,$report);
} catch(Throwable $error) {
    // Only bounded symbolic errors; no stack, request, private paths or credential values.
    $code=$error instanceof \Lienzo\Ads\ReviewError?$error->reason:'WEB_PROBE_FAILED';
    probeReply(503,['error'=>$code]);
}
