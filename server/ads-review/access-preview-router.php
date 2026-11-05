<?php
declare(strict_types=1);
use Lienzo\Ads\{Contract,VerifiedEmailAccess,PilotStore,PilotReview,ReviewService,AdsAccessController,AdsAccessHttp};
require_once __DIR__.'/Review.php';require_once __DIR__.'/Pilot.php';
require_once __DIR__.'/VerifiedAccess.php';require_once __DIR__.'/AccessController.php';
$root=dirname(__DIR__,2);
header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');header('X-Robots-Tag: noindex, nofollow');
function accessPreviewReply(int $status,array $body):never {
    http_response_code($status);header('Content-Type: application/json; charset=utf-8');echo json_encode($body);exit;
}
if(PHP_SAPI!=='cli-server' || getenv('LIENZO_ADS_DEV_ACCESS')!=='1')accessPreviewReply(503,['error'=>'ACCESS_NOT_CONFIGURED']);
if(($_SERVER['REMOTE_ADDR']??'')!=='127.0.0.1' || ($_SERVER['HTTP_HOST']??'')!=='127.0.0.1:8812')accessPreviewReply(403,['error'=>'ACCESS_REQUIRED']);
$path=parse_url($_SERVER['REQUEST_URI']??'',PHP_URL_PATH);
if(str_starts_with($path,'/api/ads/')) {
    try {
        $private=getenv('LIENZO_ADS_ACCESS_PRIVATE_DIR')?:dirname($root).'/lienzo-private-dev/ads-access-preview';
        $data=json_decode(file_get_contents($private.'/preview-only.json'),true,8,JSON_THROW_ON_ERROR);
        Contract::reject(($data['mode']??'')!=='local-access-preview' || !preg_match('/^[a-f0-9]{64}$/D',$data['pepper']??''),'ACCESS_NOT_CONFIGURED',503);
        $emails=new VerifiedEmailAccess($private,$root,$data['pepper']);$pilot=new PilotStore($private,$root);
        $mock=new PilotReview($pilot,new ReviewService($private,$root));
        $mailer=static function(array $message)use($private):bool {
            // Fictional local outbox only. No route ever serves this file or a code.
            $mask=umask(0077);
            try {return file_put_contents($private.'/preview-mail.json',json_encode($message,JSON_THROW_ON_ERROR),LOCK_EX)!==false;}
            finally {umask($mask);}
        };
        $controller=new AdsAccessController($emails,$pilot,$mailer,static fn($request,$grant)=>$mock->review($request,$grant),true,true);
        AdsAccessHttp::serve($controller,$private,$root,true);
    }catch(Throwable){accessPreviewReply(503,['error'=>'SERVICE_UNAVAILABLE']);}
}
if(($_SERVER['REQUEST_METHOD']??'')!=='GET')accessPreviewReply(405,['error'=>'METHOD_NOT_ALLOWED']);
$routes=['/herramientas/anuncios/'=>'herramientas/anuncios/index.html','/en/tools/ads/'=>'en/tools/ads/index.html'];
if(isset($routes[$path])) {
    $html=file_get_contents($root.'/'.$routes[$path]);
    $html=str_replace(['Tu contenido permanece en este navegador','Your content stays in this browser'],
        ['Vista de desarrollo: servidor local','Development preview: local server'],$html);
    $html=str_replace('El texto del anuncio se procesa en tu navegador y no se guarda automáticamente. No hay conexión con tu cuenta de Google Ads ni generación con IA en esta versión.',
        'Vista de desarrollo del acceso por correo. Usa preview@example.test y datos ficticios. La revisión utiliza un simulador local, sin envíos de correo ni conexión con Google.',$html);
    $html=str_replace('Ad text is processed in your browser and is not saved automatically. This version has no Google Ads account connection or AI generation.',
        'Development preview of email access. Use preview@example.test and fictional data. Reviews use a local simulator, with no emails or Google connection.',$html);
    $html=str_replace('id="ads-workspace"','id="ads-workspace" data-review-demo="local" data-review-access="local"',$html);
    $html=str_replace('</head>','<link rel="stylesheet" href="/css/ads-studio-review.css"><link rel="stylesheet" href="/css/ads-studio-access.css"></head>',$html);
    $html=preg_replace('#(<script defer src="/js/ads-studio\.js[^\"]*"></script>)#',
        '<script defer src="/js/ads-studio-review-model.js"></script><script defer src="/js/ads-studio-access.js"></script><script defer src="/js/ads-studio-review.js"></script>$1',$html);
    header('Content-Type: text/html; charset=utf-8');echo $html;exit;
}
$decoded=rawurldecode($path);$candidate=realpath($root.$decoded);
if(!preg_match('#^/(css/|js/|assets/|en/assets/|favicon\.svg$)#',$decoded) || !$candidate ||
    !str_starts_with(str_replace('\\','/',$candidate),str_replace('\\','/',$root).'/') ||
    !preg_match('/\.(css|js|mjs|svg|woff2|webp|jpg|png)$/i',$candidate) || !is_file($candidate))accessPreviewReply(404,['error'=>'NOT_FOUND']);
$types=['css'=>'text/css','js'=>'text/javascript','mjs'=>'text/javascript','svg'=>'image/svg+xml','woff2'=>'font/woff2','webp'=>'image/webp','jpg'=>'image/jpeg','png'=>'image/png'];
header('Content-Type: '.$types[strtolower(pathinfo($candidate,PATHINFO_EXTENSION))]);readfile($candidate);
