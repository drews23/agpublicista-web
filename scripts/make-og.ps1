# Lienzo - regenera assets/og/og-home.png a partir de la plantilla HTML
# que renderiza el logo SVG real (assets/og/og-plantilla.html).
#
# Uso:  powershell -ExecutionPolicy Bypass -File scripts/make-og.ps1
# Necesita un servidor estatico en http://localhost:8123 (python -m http.server 8123);
# si no hay ninguno, este script levanta uno temporal y lo apaga al terminar.

$raiz = Split-Path -Parent $PSScriptRoot
$salida = Join-Path $raiz "assets\og\og-home.png"
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "C:\Program Files\Microsoft\Edge\Application\msedge.exe" }

# Servidor temporal solo si el puerto esta libre
$temporal = $null
$ocupado = Test-NetConnection -ComputerName 127.0.0.1 -Port 8123 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $ocupado) {
  $temporal = Start-Process python -ArgumentList "-m", "http.server", "8123", "--bind", "127.0.0.1" `
    -WorkingDirectory $raiz -PassThru -WindowStyle Hidden
  Start-Sleep -Seconds 2
}

& $edge --headless --disable-gpu --hide-scrollbars `
  --screenshot="$salida" --window-size=1200,630 --virtual-time-budget=6000 `
  "http://localhost:8123/assets/og/og-plantilla.html" 2>&1 | Out-Null

if ($temporal) { Stop-Process -Id $temporal.Id -Force -ErrorAction SilentlyContinue }

if (Test-Path $salida) {
  $peso = (Get-Item $salida).Length
  Write-Output "OG regenerada: $salida ($([math]::Round($peso/1KB)) KB)"
} else {
  Write-Error "No se genero la imagen."
}
