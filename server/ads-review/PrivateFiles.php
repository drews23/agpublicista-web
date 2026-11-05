<?php
declare(strict_types=1);
namespace Lienzo\Ads;

/** No credentials are created or read merely by including this file. */
final class PrivateFiles {
    public static function directory(string $path, string $publicRoot): string {
        $public=realpath($publicRoot);
        $normalize=static fn(string $p): string=>strtolower(str_replace('\\','/',rtrim($p,'/\\')));
        Contract::reject($public===false || str_contains($path,"\0") || str_contains($path,'://') ||
            !preg_match('#^(?:[a-zA-Z]:[/\\\\]|/)#',$path) || preg_match('#(^|[/\\\\])\.\.?([/\\\\]|$)#',$path), 'PRIVATE_STORAGE_REQUIRED',503);
        $ancestor=$path;
        while (!file_exists($ancestor) && dirname($ancestor)!==$ancestor) $ancestor=dirname($ancestor);
        $resolved=realpath($ancestor);
        Contract::reject($resolved===false || $normalize($resolved)===$normalize($public) ||
            str_starts_with($normalize($resolved),$normalize($public).'/'),'PRIVATE_STORAGE_REQUIRED',503);
        $old=umask(0077);
        try {
            if (!is_dir($path) && !mkdir($path,0700,true) && !is_dir($path)) throw new ReviewError(503,'PRIVATE_STORAGE_UNAVAILABLE');
        } finally {umask($old);}
        $private=realpath($path);
        Contract::reject($private===false || $normalize($private)===$normalize($public) ||
            str_starts_with($normalize($private),$normalize($public).'/'),'PRIVATE_STORAGE_REQUIRED',503);
        if (PHP_OS_FAMILY!=='Windows') self::permissions(fileperms($private),fileowner($private),is_dir($private));
        return $private;
    }

    /** Fail closed for group/world access and ownership different from the PHP user. */
    public static function permissions(int|false $mode, int|false $owner, bool $directory, ?int $uid=null): void {
        $uid ??= function_exists('posix_geteuid')?posix_geteuid():null;
        Contract::reject($mode===false || $owner===false || $uid===null || $owner!==$uid ||
            ($mode & 0077)!==0 || ($mode & 0400)===0 || ($directory && ($mode & 0100)===0), 'PRIVATE_PERMISSIONS_REQUIRED',503);
    }

    public static function json(string $file, string $publicRoot): array {
        // PHP's Windows mode bits do not establish ACL privacy. Never infer it.
        Contract::reject(PHP_OS_FAMILY==='Windows','SECRET_STORAGE_PLATFORM_NOT_VERIFIED',503);
        Contract::reject(!is_file($file) || is_link($file),'PRIVATE_SECRET_UNAVAILABLE',503);
        $dir=self::directory(dirname($file),$publicRoot);
        $resolved=realpath($file);
        Contract::reject($resolved===false || dirname($resolved)!==$dir,'PRIVATE_SECRET_UNAVAILABLE',503);
        $handle=fopen($resolved,'rb');
        Contract::reject($handle===false,'PRIVATE_SECRET_UNAVAILABLE',503);
        try {
            $stat=fstat($handle);
            Contract::reject($stat===false || ($stat['mode'] & 0170000)!==0100000 || $stat['size']>16384,'PRIVATE_SECRET_UNAVAILABLE',503);
            self::permissions($stat['mode'],$stat['uid'],false);
            $body=stream_get_contents($handle,16385);
            Contract::reject($body===false || strlen($body)>16384,'PRIVATE_SECRET_UNAVAILABLE',503);
            try { $value=json_decode($body,true,8,JSON_THROW_ON_ERROR); }
            catch (\Throwable) {throw new ReviewError(503,'PRIVATE_SECRET_INVALID');}
            Contract::reject(!is_array($value) || array_is_list($value),'PRIVATE_SECRET_INVALID',503);
            return $value;
        } finally {fclose($handle);}
    }
}

final class GeminiCredentials {
    public const PROJECT = 'lienzo-tools-ads-20261104';
    private function __construct(#[\SensitiveParameter] private readonly string $key) {}
    public static function fromFile(string $file, string $publicRoot): self {
        $value=PrivateFiles::json($file,$publicRoot);
        return self::fromValues($value);
    }
    /** For a trusted server config source or synthetic tests, never an HTTP payload. */
    public static function fromValues(#[\SensitiveParameter] array $value): self {
        try {
            Contract::keys($value,['schemaVersion','projectId','geminiApiKey']);
            Contract::reject($value['schemaVersion']!==1 || $value['projectId']!==self::PROJECT ||
                !is_string($value['geminiApiKey']) || !preg_match('/^[\x21-\x7e]{20,512}$/D',$value['geminiApiKey']) ||
                str_contains(strtoupper($value['geminiApiKey']),'REPLACE'));
            return new self($value['geminiApiKey']);
        } catch (\Throwable) {throw new ReviewError(503,'PRIVATE_SECRET_INVALID');}
    }
    public function header(): string {return 'x-goog-api-key: '.$this->key;}
    public function __debugInfo(): array {return ['projectId'=>self::PROJECT,'key'=>'[redacted]'];}
    public function __serialize(): array {throw new ReviewError(503,'SECRET_SERIALIZATION_FORBIDDEN');}
}
