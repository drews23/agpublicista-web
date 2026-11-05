<?php
declare(strict_types=1);
namespace Lienzo\Ads;
require_once __DIR__.'/PrivateFiles.php';

/** Prepared transport. Closed by default; no route or environment flag activates it. */
final class GeminiHttpsTransport {
    public function __construct(private readonly \Closure $credentials,
        private readonly bool $enabled=false, private readonly ?\Closure $wire=null) {}

    public function __invoke(array $spec): array {
        Contract::reject(!$this->enabled,'GEMINI_TRANSPORT_DISABLED',503);
        $this->validate($spec);
        Contract::reject($this->wire===null && !extension_loaded('curl'),'CURL_REQUIRED',503);
        try {$secret=($this->credentials)();}
        catch(\Throwable){throw new ReviewError(503,'PRIVATE_SECRET_UNAVAILABLE');}
        Contract::reject(!$secret instanceof GeminiCredentials,'PRIVATE_SECRET_INVALID',503);
        $headers=['Content-Type: application/json','Api-Revision: '.GeminiProvider::API_REVISION,$secret->header()];
        try {
            // The injected wire is used only by offline tests. Production uses cURL below.
            if ($this->wire!==null) return ($this->wire)($spec,$headers);
            return $this->curl($spec,$headers);
        } catch (\Throwable $e) {
            if ($e instanceof ReviewError && in_array($e->reason,['REVIEW_TIMEOUT','PROVIDER_RESPONSE_TOO_LARGE','CURL_REQUIRED'],true)) throw $e;
            throw new ReviewError(502,'PROVIDER_UNAVAILABLE');
        }
    }

    private function validate(array $s): void {
        try {
            Contract::keys($s,['method','url','headers','body','timeoutSeconds','maxResponseBytes']);
            Contract::reject($s['method']!=='POST' || $s['url']!==GeminiProvider::ENDPOINT ||
                $s['headers']!==['Content-Type'=>'application/json','Api-Revision'=>GeminiProvider::API_REVISION] ||
                $s['timeoutSeconds']!==30 || $s['maxResponseBytes']!==GeminiProvider::MAX_BODY_BYTES ||
                !is_string($s['body']) || strlen($s['body'])>65536);
            $b=json_decode($s['body'],true,32,JSON_THROW_ON_ERROR);
            Contract::keys($b,['model','store','background','stream','system_instruction','input','generation_config','response_format']);
            Contract::reject($b['model']!==GeminiProvider::MODEL || $b['store']!==false || $b['background']!==false || $b['stream']!==false ||
                !is_string($b['input']) || !is_string($b['system_instruction']) ||
                $b['generation_config']!==['max_output_tokens'=>4096,'thinking_level'=>'low','thinking_summaries'=>'none']);
            Contract::keys($b['response_format'],['type','mime_type','schema']);
            Contract::reject($b['response_format']['type']!=='text' || $b['response_format']['mime_type']!=='application/json');
        } catch (\Throwable) {throw new ReviewError(503,'INVALID_GEMINI_TRANSPORT_REQUEST');}
    }

    private function curl(array $spec,#[\SensitiveParameter] array $headers): array {
        Contract::reject(!extension_loaded('curl'),'CURL_REQUIRED',503);
        $handle=curl_init();
        Contract::reject($handle===false,'PROVIDER_UNAVAILABLE',502);
        $body=''; $tooLarge=false;
        try {
            $ok=curl_setopt_array($handle,[
                CURLOPT_URL=>GeminiProvider::ENDPOINT, CURLOPT_POST=>true,
                CURLOPT_POSTFIELDS=>$spec['body'], CURLOPT_HTTPHEADER=>$headers,
                CURLOPT_FOLLOWLOCATION=>false, CURLOPT_MAXREDIRS=>0,
                CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS, CURLOPT_REDIR_PROTOCOLS=>CURLPROTO_HTTPS,
                CURLOPT_SSL_VERIFYPEER=>true, CURLOPT_SSL_VERIFYHOST=>2,
                CURLOPT_CONNECTTIMEOUT_MS=>5000, CURLOPT_TIMEOUT_MS=>30000,
                CURLOPT_NOSIGNAL=>true, CURLOPT_PROXY=>'', CURLOPT_VERBOSE=>false,
                CURLOPT_WRITEFUNCTION=>static function($h,string $chunk) use (&$body,&$tooLarge): int {
                    if (strlen($body)+strlen($chunk)>GeminiProvider::MAX_BODY_BYTES) {$tooLarge=true;return 0;}
                    $body.=$chunk; return strlen($chunk);
                },
            ]);
            Contract::reject(!$ok,'PROVIDER_UNAVAILABLE',502);
            $result=curl_exec($handle);
            Contract::reject($tooLarge,'PROVIDER_RESPONSE_TOO_LARGE',502);
            if ($result===false) throw new ReviewError(curl_errno($handle)===CURLE_OPERATION_TIMEDOUT?504:502,
                curl_errno($handle)===CURLE_OPERATION_TIMEDOUT?'REVIEW_TIMEOUT':'PROVIDER_UNAVAILABLE');
            $status=(int)curl_getinfo($handle,CURLINFO_RESPONSE_CODE);
            // Redirects are a failure; the credential is never forwarded to their destination.
            Contract::reject($status>=300 && $status<400,'PROVIDER_UNAVAILABLE',502);
            return ['status'=>$status,'body'=>$body];
        } finally {curl_close($handle);}
    }
    public function __debugInfo(): array {return ['enabled'=>$this->enabled,'credentials'=>'[redacted]'];}
    public function __serialize(): array {throw new ReviewError(503,'SECRET_SERIALIZATION_FORBIDDEN');}
}
