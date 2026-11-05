param([string]$PhpPath = '', [switch]$Pilot, [switch]$Access)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
if (-not $PhpPath) { $PhpPath = Join-Path $taskRoot 'output\ads-review-runtime\php\php.exe' }
if (-not (Test-Path -LiteralPath $PhpPath)) { throw 'Set -PhpPath to a PHP 8.3 executable with PDO SQLite, intl and mbstring.' }
$taskPhp = (Resolve-Path -LiteralPath $PhpPath).Path
$taskOldFlag = $env:LIENZO_ADS_DEV
$taskOldPilot = $env:LIENZO_ADS_DEV_PILOT
$taskOldAccess = $env:LIENZO_ADS_DEV_ACCESS
if ($Pilot -and $Access) { throw 'Choose either -Pilot or -Access.' }
Push-Location $taskRoot
try {
    $env:LIENZO_ADS_DEV = '1'
    $env:LIENZO_ADS_DEV_PILOT = $(if ($Pilot) { '1' } else { '0' })
    $env:LIENZO_ADS_DEV_ACCESS = $(if ($Access) { '1' } else { '0' })
    $taskListen = $(if ($Access) { '127.0.0.1:8812' } elseif ($Pilot) { '127.0.0.1:8811' } else { '127.0.0.1:8810' })
    $taskRouter = $(if ($Access) { 'server/ads-review/access-preview-router.php' } else { 'server/ads-review/dev-router.php' })
    $taskFlags = @('-n', '-d', ('extension_dir=' + (Join-Path (Split-Path $taskPhp -Parent) 'ext')), '-d', 'extension=pdo_sqlite', '-d', 'extension=mbstring', '-d', 'extension=intl', '-d', 'display_errors=0')
    if ($Access) {
        $taskPrivate = $(if ($env:LIENZO_ADS_ACCESS_PRIVATE_DIR) { $env:LIENZO_ADS_ACCESS_PRIVATE_DIR } else { Join-Path (Split-Path $taskRoot -Parent) 'lienzo-private-dev\ads-access-preview' })
        & $taskPhp @taskFlags scripts/prepare-ads-access-preview.php $taskPrivate
        if ($LASTEXITCODE -ne 0) { throw 'Could not prepare fictional access fixture.' }
    }
    & $taskPhp @taskFlags -S $taskListen $taskRouter
} finally {
    $env:LIENZO_ADS_DEV = $taskOldFlag
    $env:LIENZO_ADS_DEV_PILOT = $taskOldPilot
    $env:LIENZO_ADS_DEV_ACCESS = $taskOldAccess
    Pop-Location
}
