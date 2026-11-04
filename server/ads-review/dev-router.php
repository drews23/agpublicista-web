<?php
declare(strict_types=1);
use Lienzo\Ads\{Contract,MockProvider,ReviewService,ReviewError,PilotStore,PilotReview};
require __DIR__.'/Review.php';
require __DIR__.'/Pilot.php';
$root=dirname(__DIR__,2);
$pilot=getenv('LIENZO_ADS_DEV_PILOT')==='1';
$host=$pilot?'127.0.0.1:8811':'127.0.0.1:8810';
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow');
function reply(int $status,array $value): never {
    http_response_code($status); header('Content-Type: application/json; charset=utf-8');
    echo json_encode($value,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit;
}
if (PHP_SAPI!=='cli-server' || getenv('LIENZO_ADS_DEV')!=='1') reply(503,['error'=>'GENERATION_NOT_CONFIGURED']);
if (($_SERVER['REMOTE_ADDR']??'')!=='127.0.0.1' || ($_SERVER['HTTP_HOST']??'')!==$host) reply(403,['error'=>'ACCESS_REQUIRED']);
$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
if (str_starts_with($path,'/api/ads/')) {
    try {
        Contract::reject(!in_array($path,$pilot?['/api/ads/session','/api/ads/review','/api/ads/activate']:['/api/ads/session','/api/ads/review'],true),'NOT_FOUND',404);
        $sessionRoute=$path==='/api/ads/session';
        Contract::reject($_SERVER['REQUEST_METHOD']!==($sessionRoute?'GET':'POST'),'METHOD_NOT_ALLOWED',405);
        if (!$sessionRoute) Contract::reject(($_SERVER['HTTP_ORIGIN']??'')!=='http://'.$host,'ORIGIN_REQUIRED',403);
        session_name($pilot?'LIENZO_ADS_LOCAL_PILOT':'LIENZO_ADS_LOCAL');
        session_start(['use_strict_mode'=>true,'cookie_httponly'=>true,'cookie_samesite'=>'Strict','cookie_secure'=>false,'cookie_path'=>'/api/ads/']);
        if (!isset($_SESSION['csrf'])) $_SESSION['csrf']=bin2hex(random_bytes(32));
        $private=getenv('LIENZO_ADS_PRIVATE_DIR')?:dirname($root).'/lienzo-private-dev/'.($pilot?'ads-review-pilot':'ads-review');
        $access=$pilot?new PilotStore($private,$root):null;
        if ($sessionRoute) {
            $data=['mode'=>$pilot?'local-pilot':'local-simulation','csrfToken'=>$_SESSION['csrf']];
            if ($pilot) {
                try { $data['pilot']=$access->status($_SESSION['pilotGrant']??''); }
                catch (ReviewError $e) { $data['pilot']=['access'=>'invitation_required','paidGenerationEnabled'=>false]; }
            }
            reply(200,$data);
        }
        Contract::reject(!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''),'ACCESS_REQUIRED',403);
        $identity=$pilot?($_SESSION['pilotGrant']??''):session_id();
        Contract::reject(strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE']??'')[0]))!=='application/json','CONTENT_TYPE_REQUIRED',415);
        $body=file_get_contents('php://input',false,null,0,65537);
        if ($path==='/api/ads/activate') {
            Contract::reject(strlen($body)>256,'REQUEST_TOO_LARGE',413);
            try { $activation=json_decode($body,true,8,JSON_THROW_ON_ERROR); }
            catch (Throwable) { throw new ReviewError(400,'INVALID_JSON'); }
            Contract::keys($activation,['token']);
            Contract::reject(!is_string($activation['token']),'INVITATION_INVALID',403);
            $_SESSION['activationAttempts']=array_values(array_filter($_SESSION['activationAttempts']??[],fn($t)=>$t>time()-60));
            Contract::reject(count($_SESSION['activationAttempts'])>=10,'ACTIVATION_LIMIT',429);
            $_SESSION['activationAttempts'][]=time();
            $grant=$access->redeem($activation['token']);
            session_regenerate_id(true); $_SESSION['pilotGrant']=$grant; $_SESSION['csrf']=bin2hex(random_bytes(32));
            reply(200,['mode'=>'local-pilot','csrfToken'=>$_SESSION['csrf'],'pilot'=>$access->status($grant)]);
        }
        session_write_close();
        $request=Contract::request($body);
        $service=new ReviewService($private,$root);
        if ($pilot) reply(200,(new PilotReview($access,$service))->review($request,$identity));
        reply(200,$service->review($request,$identity,new MockProvider()));
    } catch (ReviewError $error) { reply($error->status,['error'=>$error->reason]); }
      catch (Throwable) { reply(503,['error'=>'SERVICE_UNAVAILABLE']); }
}
if ($_SERVER['REQUEST_METHOD']!=='GET') reply(405,['error'=>'METHOD_NOT_ALLOWED']);
$routes=['/herramientas/anuncios/'=>'herramientas/anuncios/index.html','/en/tools/ads/'=>'en/tools/ads/index.html'];
if (isset($routes[$path])) {
    $html=file_get_contents($root.'/'.$routes[$path]);
    $html=str_replace(['Tu contenido permanece en este navegador','Your content stays in this browser'],
        ['Prueba local: envío solo al servidor de este equipo','Local test: sends only to this computer\'s server'],$html);
    $html=str_replace('El texto del anuncio se procesa en tu navegador y no se guarda automáticamente. No hay conexión con tu cuenta de Google Ads ni generación con IA en esta versión.',
        'La revisión de prueba envía el borrador al servidor local solo cuando lo confirmas. La respuesta se guarda en una base local para evitar duplicados. Usa datos ficticios. Sin conexión a Google Ads ni Gemini.',$html);
    $html=str_replace('Ad text is processed in your browser and is not saved automatically. This version has no Google Ads account connection or AI generation.',
        'This test sends the draft to the local server only after you confirm. The response is stored in a local database to prevent duplicate requests. Use fictional data. No Google Ads or Gemini connection.',$html);
    $html=str_replace('id="ads-workspace"','id="ads-workspace" data-review-demo="local"',$html);
    if ($pilot) $html=str_replace('data-review-demo="local"','data-review-demo="local" data-review-pilot="local"',$html);
    $html=str_replace('</head>','<link rel="stylesheet" href="/css/ads-studio-review.css"></head>',$html);
    $html=preg_replace('#(<script defer src="/js/ads-studio\.js[^\"]*"></script>)#',
        '<script defer src="/js/ads-studio-review-model.js"></script><script defer src="/js/ads-studio-review.js"></script>$1',$html);
    header('Content-Type: text/html; charset=utf-8'); echo $html; exit;
}
// A strict static allowlist: no PHP, credentials, databases, tests or arbitrary HTML.
$decoded=rawurldecode($path);
$candidate=realpath($root.$decoded);
$allowed=preg_match('#^/(css/|js/|assets/|en/assets/|favicon\.svg$)#',$decoded) &&
    $candidate!==false && str_starts_with(str_replace('\\','/',$candidate),str_replace('\\','/',$root).'/') &&
    preg_match('/\.(css|js|mjs|svg|woff2|webp|jpg|png)$/i',$candidate);
if (!$allowed || !is_file($candidate)) reply(404,['error'=>'NOT_FOUND']);
$types=['css'=>'text/css','js'=>'text/javascript','mjs'=>'text/javascript','svg'=>'image/svg+xml','woff2'=>'font/woff2','webp'=>'image/webp','jpg'=>'image/jpeg','png'=>'image/png'];
header('Content-Type: '.$types[strtolower(pathinfo($candidate,PATHINFO_EXTENSION))]); readfile($candidate);
