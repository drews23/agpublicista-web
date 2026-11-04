<?php
declare(strict_types=1);
// Local QA only. Writes a single-use invitation into private storage, never stdout.
if (PHP_SAPI !== 'cli' || getenv('LIENZO_ADS_DEV_PILOT') !== '1') exit(78);
require dirname(__DIR__).'/server/ads-review/Review.php';
require dirname(__DIR__).'/server/ads-review/Pilot.php';
$private=$argv[1]??''; $participant=$argv[2]??'';
$store=new \Lienzo\Ads\PilotStore($private,dirname(__DIR__));
$token=$store->issueInvite($participant);
$file=realpath($private).'/invitation-token.txt';
$mask=umask(0077);
try { if (file_put_contents($file,$token,LOCK_EX)!==64) exit(74); }
finally { umask($mask); }
echo json_encode(['tokenFile'=>$file,'mode'=>'local-test','emailVerified'=>false],JSON_UNESCAPED_SLASHES)."\n";
