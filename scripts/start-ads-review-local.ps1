param([string]$PhpPath = '', [switch]$Pilot)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
if (-not $PhpPath) { $PhpPath = Join-Path $taskRoot 'output\ads-review-runtime\php\php.exe' }
if (-not (Test-Path -LiteralPath $PhpPath)) { throw 'Set -PhpPath to a PHP 8.3 executable with PDO SQLite, intl and mbstring.' }
$taskPhp = (Resolve-Path -LiteralPath $PhpPath).Path
$taskOldFlag = $env:LIENZO_ADS_DEV
$taskOldPilot = $env:LIENZO_ADS_DEV_PILOT
Push-Location $taskRoot
try {
    $env:LIENZO_ADS_DEV = '1'
    $env:LIENZO_ADS_DEV_PILOT = $(if ($Pilot) { '1' } else { '0' })
    $taskListen = $(if ($Pilot) { '127.0.0.1:8811' } else { '127.0.0.1:8810' })
    & $taskPhp -n -d ('extension_dir=' + (Join-Path (Split-Path $taskPhp -Parent) 'ext')) -d extension=pdo_sqlite -d extension=mbstring -d extension=intl -d display_errors=0 -S $taskListen server/ads-review/dev-router.php
} finally {
    $env:LIENZO_ADS_DEV = $taskOldFlag
    $env:LIENZO_ADS_DEV_PILOT = $taskOldPilot
    Pop-Location
}
