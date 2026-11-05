<?php
declare(strict_types=1);
use Lienzo\Ads\{Contract,VerifiedEmailAccess,PrivateFiles};
require_once __DIR__.'/../server/ads-review/Review.php';
require_once __DIR__.'/../server/ads-review/Pilot.php';
require_once __DIR__.'/../server/ads-review/VerifiedAccess.php';
if(PHP_SAPI!=='cli')exit(1);
$root=dirname(__DIR__);$directory=$argv[1]??dirname($root).'/lienzo-private-dev/ads-access-preview';
$directory=PrivateFiles::directory($directory,$root);$file=$directory.'/preview-only.json';
if(!is_file($file)) {
    $mask=umask(0077);$stream=fopen($file,'x');
    try {if(!$stream)throw new RuntimeException('Preview fixture unavailable');
        fwrite($stream,json_encode(['mode'=>'local-access-preview','pepper'=>bin2hex(random_bytes(32))],JSON_THROW_ON_ERROR));
    } finally {if(is_resource($stream))fclose($stream);umask($mask);}
    $data=json_decode(file_get_contents($file),true,8,JSON_THROW_ON_ERROR);
    (new VerifiedEmailAccess($directory,$root,$data['pepper']))->invite('preview@example.test','es');
}
echo "Local fictional fixture prepared. No mail, credentials or generation.\n";
