<?php
declare(strict_types=1);

// Run a copied file from a dedicated private directory, never from the web root.
// This diagnostic has no provider, credentials, input data or public HTTP route.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
if ($argc !== 2 || !str_starts_with($argv[1], '--public-root=')) {
    fwrite(STDERR, "Usage: php hosting-probe.php --public-root=/absolute/public_html\n"); exit(64);
}
$public = realpath(substr($argv[1], strlen('--public-root=')));
$private = realpath(__DIR__);
$inside = static function (string $path, string $root): bool {
    $normalize = static fn(string $s): string => strtolower(str_replace('\\', '/', rtrim($s, '/\\')));
    return $normalize($path) === $normalize($root) || str_starts_with($normalize($path), $normalize($root) . '/');
};
if ($public === false || $private === false || $inside($private, $public) ||
    !preg_match('/^lienzo-ads-probe-[a-f0-9]{12}$/D', basename($private)) || is_link(__FILE__)) {
    fwrite(STDERR, "PRIVATE_DIRECTORY_REQUIRED\n"); exit(78);
}
// Each uploaded copy can run once, only during the first fifteen minutes.
if (time() > filemtime(__FILE__) + 900 || filemtime(__FILE__) > time() + 60) {
    fwrite(STDERR, "PROBE_EXPIRED\n"); exit(78);
}
umask(0077);
$lock = @fopen($private . '/once.lock', 'x');
if ($lock === false) {
    if (is_file($private . '/report.json')) readfile($private . '/report.json');
    else echo "ALREADY_RESERVED\n";
    exit;
}
chmod($private, 0700);
flock($lock, LOCK_EX);
$report = [
    'schemaVersion' => 1, 'probe' => 'lienzo-ads-hosting', 'checkedAt' => gmdate('c'),
    'runtime' => ['php' => PHP_VERSION, 'sapi' => PHP_SAPI],
    'checks' => [], 'limits' => [
        'providerCalled' => false, 'credentialsRead' => false, 'customerDataUsed' => false,
        'webSapiTested' => false, 'publicEndpointCreated' => false,
        'concurrencyAcrossProcessesTested' => false,
    ],
];
$checks = &$report['checks'];
$checks['php83OrNewer'] = version_compare(PHP_VERSION, '8.3.0', '>=');
$checks['outsidePublicRoot'] = !$inside($private, $public);
foreach (['pdo_sqlite', 'intl', 'mbstring', 'curl', 'openssl', 'session'] as $extension) {
    $checks['extension_' . $extension] = extension_loaded($extension);
}
clearstatcache();
$checks['privateDirectoryPermissions'] = PHP_OS_FAMILY === 'Windows' ? null : ((fileperms($private) & 0777) === 0700);
$database = $private . '/probe.sqlite';
try {
    if (!$checks['extension_pdo_sqlite']) throw new RuntimeException('SQLITE_UNAVAILABLE');
    $a = new PDO('sqlite:' . $database, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $a->exec('PRAGMA busy_timeout=100; CREATE TABLE reservations (request_id TEXT PRIMARY KEY, value INTEGER NOT NULL)');
    $a->exec("BEGIN IMMEDIATE; INSERT INTO reservations VALUES ('fictional-probe', 1); ROLLBACK");
    $checks['transactionRollback'] = (int)$a->query('SELECT COUNT(*) FROM reservations')->fetchColumn() === 0;
    $b = new PDO('sqlite:' . $database, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $b->exec('PRAGMA busy_timeout=100');
    $a->exec('BEGIN IMMEDIATE');
    $checks['secondWriterBlocked'] = false;
    try { $b->exec('BEGIN IMMEDIATE'); $b->exec('ROLLBACK'); }
    catch (PDOException $e) { $checks['secondWriterBlocked'] = ($e->errorInfo[1] ?? null) === 5; }
    $a->exec("INSERT INTO reservations VALUES ('fictional-probe', 1); COMMIT");
    $checks['uniqueReservation'] = false;
    try { $b->exec("INSERT INTO reservations VALUES ('fictional-probe', 2)"); }
    catch (PDOException $e) { $checks['uniqueReservation'] = ($e->errorInfo[1] ?? null) === 19; }
    $checks['committedValuePreserved'] = (int)$b->query("SELECT value FROM reservations WHERE request_id='fictional-probe'")->fetchColumn() === 1;
    $checks['databaseIntegrity'] = $a->query('PRAGMA integrity_check')->fetchColumn() === 'ok';
    $a = $b = null;
    clearstatcache();
    $checks['privateDatabasePermissions'] = PHP_OS_FAMILY === 'Windows' ? null : ((fileperms($database) & 0777) === 0600);
} catch (Throwable) { $checks['databaseTestCompleted'] = false; }

// TLS reachability only: an unauthenticated HEAD, never generateContent.
$checks['googleHttpsReachable'] = false;
if ($checks['extension_curl']) {
    $curl = curl_init('https://generativelanguage.googleapis.com/');
    curl_setopt_array($curl, [CURLOPT_NOBODY => true, CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => 3, CURLOPT_TIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS]);
    curl_exec($curl);
    $http = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $checks['googleHttpsReachable'] = curl_errno($curl) === 0 && $http >= 100 && $http < 600 && (int)curl_getinfo($curl, CURLINFO_SSL_VERIFYRESULT) === 0;
    $report['outbound'] = ['method' => 'HEAD', 'destination' => 'generativelanguage.googleapis.com', 'httpStatus' => $http, 'curlErrorCode' => curl_errno($curl)];
    curl_close($curl);
}
$report['passed'] = !in_array(false, $checks, true);
$json = json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n";
$written = file_put_contents($private . '/report.json', $json, LOCK_EX);
if ($written !== strlen($json)) { fwrite(STDERR, "REPORT_WRITE_FAILED\n"); exit(74); }
echo $json;
fclose($lock);
exit($report['passed'] ? 0 : 1);
