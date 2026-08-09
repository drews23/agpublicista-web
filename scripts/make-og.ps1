Add-Type -AssemblyName System.Drawing

$w = 1200; $h = 630
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Fondo tinta
$g.Clear([System.Drawing.Color]::FromArgb(255, 10, 10, 15))

function Add-Glow($g, $cx, $cy, $rx, $ry, $color) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse($cx - $rx, $cy - $ry, $rx * 2, $ry * 2)
  $brush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
  $brush.CenterColor = $color
  $brush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, $color.R, $color.G, $color.B))
  $g.FillPath($brush, $path)
  $brush.Dispose(); $path.Dispose()
}

# Brillos violeta / turquesa / ámbar
Add-Glow $g 240 90 520 380 ([System.Drawing.Color]::FromArgb(85, 139, 123, 255))
Add-Glow $g 1030 560 520 360 ([System.Drawing.Color]::FromArgb(60, 53, 214, 200))
Add-Glow $g 900 80 300 220 ([System.Drawing.Color]::FromArgb(34, 255, 180, 84))

# Monograma: squircle con degradado
function New-RoundedPath($x, $y, $size, $r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $size - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $size - $d, $y + $size - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $size - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

$mx = 92; $my = 150; $ms = 150
$mpath = New-RoundedPath $mx $my $ms 40
$mbrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point($mx, $my)),
  (New-Object System.Drawing.Point(($mx + $ms), ($my + $ms))),
  [System.Drawing.Color]::FromArgb(255, 139, 123, 255),
  [System.Drawing.Color]::FromArgb(255, 53, 214, 200))
$g.FillPath($mbrush, $mpath)

$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = [System.Drawing.StringAlignment]::Center
$fmt.LineAlignment = [System.Drawing.StringAlignment]::Center

$fMono = New-Object System.Drawing.Font("Georgia", 60, ([System.Drawing.FontStyle]::Bold -bor [System.Drawing.FontStyle]::Italic))
$white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString("L", $fMono, $white, (New-Object System.Drawing.RectangleF($mx, ($my + 4), $ms, $ms)), $fmt)

# Punto ámbar del monograma
$amber = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 180, 84))
$g.FillEllipse($amber, ($mx + $ms - 26), ($my - 12), 38, 38)

# Título
$fTitle = New-Object System.Drawing.Font("Georgia", 92, ([System.Drawing.FontStyle]::Bold -bor [System.Drawing.FontStyle]::Italic))
$g.DrawString("Lienzo", $fTitle, $white, 270, 150)

# Subtítulo
$fSub = New-Object System.Drawing.Font("Segoe UI", 30, [System.Drawing.FontStyle]::Regular)
$gray = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 162, 161, 179))
$g.DrawString("Herramientas creativas sin fricción", $fSub, $gray, 285, 330)
$g.DrawString("Diseño, web y marketing — gratis y en español", $fSub, $gray, 285, 382)

# Línea de acento inferior
$accentBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point(285, 480)),
  (New-Object System.Drawing.Point(760, 480)),
  [System.Drawing.Color]::FromArgb(255, 139, 123, 255),
  [System.Drawing.Color]::FromArgb(255, 255, 180, 84))
$g.FillRectangle($accentBrush, 290, 470, 470, 8)

# Dominio
$fDom = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Bold)
$g.DrawString("agpublicista.com", $fDom, $white, 288, 508)

$outDir = "D:\agpublicista web\assets\og"
New-Item -ItemType Directory -Force $outDir | Out-Null
$bmp.Save("$outDir\og-home.png", [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose(); $bmp.Dispose()
Write-Output "OG generada: $outDir\og-home.png"
