<?php
declare(strict_types=1);
// Administrator CLI preparation only. No Google key, mail or network operation.
use Lienzo\Ads\{PrivateFiles,Contract,ReviewError,GeminiCredentials};
require dirname(__DIR__).'/server/ads-review/Review.php';
require dirname(__DIR__).'/server/ads-review/PrivateFiles.php';
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
try {
    Contract::reject(PHP_OS_FAMILY==='Windows','SECRET_STORAGE_PLATFORM_NOT_VERIFIED',503);
    Contract::reject($argc!==3,'USAGE_PRIVATE_DIRECTORY_AND_PUBLIC_ROOT_REQUIRED',400);
    $directory=PrivateFiles::directory($argv[1],$argv[2]);
    $paths=[$directory.'/access.json',$directory.'/gemini.json'];
    foreach($paths as$path)Contract::reject(file_exists($path)||is_link($path),'PRIVATE_CONFIGURATION_ALREADY_EXISTS',409);
    $values=[['schemaVersion'=>1,'projectId'=>GeminiCredentials::PROJECT,'identityPepper'=>bin2hex(random_bytes(32))],
        ['schemaVersion'=>1,'projectId'=>GeminiCredentials::PROJECT,'geminiApiKey'=>'REPLACE_IN_PRIVATE_SERVER_ONLY']];
    $mask=umask(0077);
    try {
        foreach($paths as$i=>$path) {
            $f=fopen($path,'x');Contract::reject($f===false,'PRIVATE_CONFIGURATION_ALREADY_EXISTS',409);
            try {
                $body=json_encode($values[$i],JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR)."\n";
                Contract::reject(fwrite($f,$body)!==strlen($body),'PRIVATE_CONFIGURATION_WRITE_FAILED',503);
                fflush($f);$stat=fstat($f);PrivateFiles::permissions($stat['mode'],$stat['uid'],false);
            }finally{fclose($f);}
        }
    }finally{umask($mask);}
    echo json_encode(['prepared'=>true,'files'=>['access.json','gemini.json'],'geminiCredential'=>'placeholder only','generationEnabled'=>false]);
}catch(ReviewError $e){fwrite(STDERR,$e->reason."\n");exit(1);}
catch(Throwable){fwrite(STDERR,"PRIVATE_PREPARATION_FAILED\n");exit(1);}
