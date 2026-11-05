<?php
declare(strict_types=1);
namespace Lienzo\Ads;

use Closure;
use Throwable;

/** Prepared HTTP application. No public entry point loads it; all dependencies are explicit. */
final class AdsAccessController {
    public function __construct(private VerifiedEmailAccess $emails,private PilotStore $pilot,
        private readonly ?Closure $mailer=null,private readonly ?Closure $reviewer=null,
        private readonly bool $enabled=false,private readonly bool $localPreview=false,
        private readonly ?Closure $clock=null) {}

    private function now():int {return $this->clock ? ($this->clock)() : time();}
    private function anonymous():array {
        return ['nonce'=>bin2hex(random_bytes(32)),'csrf'=>bin2hex(random_bytes(32)),
            'until'=>$this->now()+1800];
    }
    private function gate(array $server,bool $post,array $flow):void {
        $host=$this->localPreview?'127.0.0.1:8812':'lienzo.tools';
        Contract::reject(($server['HTTP_HOST']??'')!==$host ||
            (!$this->localPreview && !in_array($server['HTTPS']??'',['on','1'],true)) ||
            ($this->localPreview && ($server['REMOTE_ADDR']??'')!=='127.0.0.1'),'ACCESS_REQUIRED',403);
        Contract::reject(in_array($server['HTTP_SEC_FETCH_SITE']??'',['cross-site','same-site'],true),'ACCESS_REQUIRED',403);
        if(!$post)return;
        $expected=$flow['csrf']??'';$presented=$server['HTTP_X_CSRF_TOKEN']??'';
        Contract::reject(($flow['until']??0)<=$this->now(),'ACCESS_REQUIRED',403);
        if(!$this->localPreview) {AdsHttpsGuard::post($server,$expected,$presented);return;}
        Contract::reject(($server['REQUEST_METHOD']??'')!=='POST' ||
            ($server['HTTP_ORIGIN']??'')!=='http://'.$host ||
            strtolower(trim(explode(';',$server['CONTENT_TYPE']??'')[0]))!=='application/json' ||
            !preg_match('/^[a-f0-9]{64}$/D',$expected) || !hash_equals($expected,$presented),'ACCESS_REQUIRED',403);
    }
    private function json(string $body,array $keys,int $maximum=2048):array {
        Contract::reject(strlen($body)>$maximum,'REQUEST_TOO_LARGE',413);
        try {$value=json_decode($body,true,16,JSON_THROW_ON_ERROR);}
        catch(Throwable){throw new ReviewError(400,'INVALID_JSON');}
        if($keys===[]){Contract::reject(trim($body)!=='{}');return [];}
        Contract::keys($value,$keys);return $value;
    }
    private function snapshot(array &$flow,string $language):array {
        $status=['authenticated'=>false];
        if(isset($flow['authToken'],$flow['authCsrf'])) {
            try {$status=['authenticated'=>true]+$this->emails->status($flow['authToken'],$flow['authCsrf'],$this->pilot);}
            catch(ReviewError){$flow=$this->anonymous();}
        }
        return $status+['mode'=>$this->localPreview?'local-access-preview':'gemini-pilot',
            'csrfToken'=>$flow['csrf'],'consent'=>AdsHttpsGuard::consent($language),
            'reviewAvailable'=>$this->reviewer!==null,'limits'=>$this->pilot->limits(),
            'challengePending'=>isset($flow['challengeId']) && ($flow['challengeUntil']??0)>$this->now(),
            'resendAfter'=>max(0,($flow['resendAt']??0)-$this->now())];
    }
    /** The browser never supplies a flow nonce, challenge ID or authenticated session token. */
    public function handle(array $server,string $path,string $body,array &$flow,string $language='es',?Closure $releaseSession=null):array {
        Contract::reject(!$this->enabled,'ACCESS_NOT_CONFIGURED',503);
        Contract::reject(!in_array($language,['es','en'],true),'INVALID_LANGUAGE',400);
        $routes=['/api/ads/session'=>'GET','/api/ads/access/start'=>'POST',
            '/api/ads/access/verify'=>'POST','/api/ads/access/logout'=>'POST','/api/ads/review'=>'POST'];
        Contract::reject(!isset($routes[$path]),'NOT_FOUND',404);
        Contract::reject(($server['REQUEST_METHOD']??'')!==$routes[$path],'METHOD_NOT_ALLOWED',405);
        $post=$routes[$path]==='POST';$this->gate($server,$post,$flow);
        $rotate=false;
        if(!$post) {
            if(!isset($flow['csrf'],$flow['nonce']) || ($flow['until']??0)<=$this->now()) {$flow=$this->anonymous();$rotate=true;}
            $old=$flow['csrf'];$data=$this->snapshot($flow,$language);
            return ['status'=>200,'body'=>$data,'rotate'=>$rotate || $old!==$flow['csrf']];
        }
        if($path==='/api/ads/access/start') {
            Contract::reject(isset($flow['authToken']),'ALREADY_SIGNED_IN',409);
            $data=$this->json($body,['email']);Contract::text($data['email'],254,false);
            Contract::reject(($flow['resendAt']??0)>$this->now(),'ACCESS_RESEND_WAIT',429);
            Contract::reject($this->mailer===null,'MAIL_NOT_CONFIGURED',503);
            $result=$this->emails->start($data['email'],$flow['nonce'],$server['REMOTE_ADDR']??'',$this->mailer);
            $flow['challengeId']=$result['challengeId'];$flow['challengeUntil']=$this->now()+600;$flow['resendAt']=$this->now()+60;
            return ['status'=>202,'body'=>['accepted'=>true,'expiresIn'=>600,'resendAfter'=>60],'rotate'=>false];
        }
        if($path==='/api/ads/access/verify') {
            $data=$this->json($body,['code'],128);Contract::text($data['code'],8,false);
            Contract::reject(!isset($flow['challengeId']) || ($flow['challengeUntil']??0)<=$this->now(),'ACCESS_REQUIRED',403);
            $result=$this->emails->verify($flow['challengeId'],$data['code'],$flow['nonce'],$server['REMOTE_ADDR']??'');
            $flow=$this->anonymous();$flow['authToken']=$result['sessionToken'];$flow['authCsrf']=$result['csrfToken'];
            $flow['until']=strtotime($result['expiresAt']);
            return ['status'=>200,'body'=>$this->snapshot($flow,$language),'rotate'=>true];
        }
        Contract::reject(!isset($flow['authToken'],$flow['authCsrf']),'ACCESS_REQUIRED',403);
        $this->emails->authorize($flow['authToken'],$flow['authCsrf']);
        if($path==='/api/ads/access/logout') {
            $this->json($body,[],32);$this->emails->logout($flow['authToken'],$flow['authCsrf']);$flow=$this->anonymous();
            return ['status'=>200,'body'=>$this->snapshot($flow,$language),'rotate'=>true];
        }
        // Validate consent and the complete request before allocating any allowance.
        $request=Contract::request($body,'gemini-review-v1');
        Contract::reject($this->reviewer===null,'GEMINI_PILOT_DISABLED',503);
        $grant=$this->emails->grant($flow['authToken'],$flow['authCsrf'],$this->pilot);
        // The HTTP adapter releases its PHP session lock before a slow provider call.
        if($releaseSession!==null)$releaseSession();
        $value=($this->reviewer)($request,$grant);
        return ['status'=>200,'body'=>$value,'rotate'=>false];
    }
}

/** HTTPS bootstrap ready for an explicitly configured entry point; never reads a secret by itself. */
final class AdsAccessHttp {
    public static function serve(AdsAccessController $controller,string $privateDirectory,string $publicRoot,bool $localPreview=false):never {
        header('Cache-Control: no-store, private');header('Pragma: no-cache');
        header('X-Content-Type-Options: nosniff');header('Referrer-Policy: no-referrer');
        header('X-Robots-Tag: noindex, nofollow');header('Vary: Cookie');
        try {
            if($localPreview) Contract::reject(PHP_SAPI!=='cli-server' || ($_SERVER['HTTP_HOST']??'')!=='127.0.0.1:8812' ||
                ($_SERVER['REMOTE_ADDR']??'')!=='127.0.0.1','ACCESS_REQUIRED',403);
            else Contract::reject(($_SERVER['HTTP_HOST']??'')!=='lienzo.tools' || !in_array($_SERVER['HTTPS']??'',['on','1'],true),'ACCESS_REQUIRED',403);
            $directory=PrivateFiles::directory($privateDirectory,$publicRoot);
            $sessions=PrivateFiles::directory($directory.'/http-sessions',$publicRoot);
            session_name($localPreview?'LIENZO_ADS_ACCESS_PREVIEW':AdsHttpsGuard::COOKIE_NAME);
            session_save_path($sessions);ini_set('session.use_trans_sid','0');
            $mask=umask(0077);
            try {$started=session_start(['use_strict_mode'=>true,'use_only_cookies'=>true,
                'cookie_httponly'=>true,'cookie_secure'=>!$localPreview,'cookie_samesite'=>'Strict',
                'cookie_path'=>'/','cookie_domain'=>'','cookie_lifetime'=>0,'gc_maxlifetime'=>28800]);}
            finally {umask($mask);}
            Contract::reject(!$started,'SESSION_UNAVAILABLE',503);
            $path=parse_url($_SERVER['REQUEST_URI']??'',PHP_URL_PATH);
            $language=$_GET['lang']??'es';
            Contract::reject(!is_string($path) || !is_string($language),'INVALID_REQUEST',400);
            $body=file_get_contents('php://input',false,null,0,65537);
            $flow=$_SESSION['access']??[];
            $result=$controller->handle($_SERVER,$path,$body,$flow,$language,static function()use(&$flow):void {
                $_SESSION['access']=$flow;session_write_close();
            });
            if(session_status()===PHP_SESSION_ACTIVE) {
                if($result['rotate'])Contract::reject(!session_regenerate_id(true),'SESSION_UNAVAILABLE',503);
                $_SESSION['access']=$flow;session_write_close();
            }
            http_response_code($result['status']);$value=$result['body'];
        } catch(ReviewError $e) {http_response_code($e->status);$value=['error'=>$e->reason];}
          catch(Throwable) {http_response_code(503);$value=['error'=>'SERVICE_UNAVAILABLE'];}
        if(session_status()===PHP_SESSION_ACTIVE)session_write_close();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($value,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;
    }
}
