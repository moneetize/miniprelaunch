param(
  [string]$OutputRoot = "frontend-moneetizeprelaunch/public/brand/logos"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$wordmark = "moneetize"
$slogan = "SPENDING$([char]0x2026) WITH BENEFITS"
$canvasBase = 1024.0
$symbolInset = 18.8748
$symbolSize = 46.2504
$bgPathData = "M42 0C10.6042 0 0 10.6042 0 42C0 73.3958 10.6042 84 42 84C73.3958 84 84 73.3958 84 42C84 10.6042 73.4202 0 42 0Z"
$leftPathData = "M18.2658 27.9983C15.5744 25.3069 15.5744 20.9431 18.2658 18.2517L34.4854 2.03219C38.8265 -2.30893 46.2504 0.765467 46.2504 6.90503V39.3433C46.2504 45.4829 38.8273 48.5581 34.4854 44.2161L18.2658 27.9966V27.9983Z"
$rightPathData = "M27.9846 27.9983C30.676 25.3069 30.676 20.9431 27.9846 18.2517L11.765 2.03219C7.42308 -2.30893 0 0.765467 0 6.90503V39.3433C0 45.4829 7.42308 48.5581 11.765 44.2161L27.9846 27.9966V27.9983Z"
$modes = @("full_color", "black", "white")
$formats = @("horizontal", "stacked", "message")
$sizes = @(1024, 3000)

function ConvertTo-SvgNumber([double]$value) {
  return $value.ToString("0.###", [System.Globalization.CultureInfo]::InvariantCulture)
}

function New-BrandFont([double]$size) {
  foreach ($name in @("Segoe UI Black", "Arial Black", "Segoe UI")) {
    try {
      return [System.Drawing.Font]::new($name, [single]$size, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    } catch {
      continue
    }
  }

  return [System.Drawing.Font]::new([System.Drawing.FontFamily]::GenericSansSerif, [single]$size, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
}

function Measure-Text([System.Drawing.Graphics]$graphics, [string]$text, [System.Drawing.Font]$font) {
  $format = [System.Drawing.StringFormat]::GenericTypographic
  $format.FormatFlags = $format.FormatFlags -bor [System.Drawing.StringFormatFlags]::MeasureTrailingSpaces
  return $graphics.MeasureString($text, $font, 5000, $format)
}

function Get-FontForWidth([System.Drawing.Graphics]$graphics, [string]$text, [double]$targetWidth, [double]$minSize, [double]$maxSize) {
  $best = New-BrandFont $minSize
  $low = $minSize
  $high = $maxSize

  for ($i = 0; $i -lt 18; $i++) {
    $mid = ($low + $high) / 2
    $font = New-BrandFont $mid
    $measure = Measure-Text $graphics $text $font
    if ($measure.Width -le $targetWidth) {
      $best.Dispose()
      $best = $font
      $low = $mid
    } else {
      $font.Dispose()
      $high = $mid
    }
  }

  return $best
}

function New-BgPath {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.StartFigure()
  $path.AddBezier(42, 0, 10.6042, 0, 0, 10.6042, 0, 42)
  $path.AddBezier(0, 42, 0, 73.3958, 10.6042, 84, 42, 84)
  $path.AddBezier(42, 84, 73.3958, 84, 84, 73.3958, 84, 42)
  $path.AddBezier(84, 42, 84, 10.6042, 73.4202, 0, 42, 0)
  $path.CloseFigure()
  return $path
}

function New-LeftSymbolPath {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.StartFigure()
  $path.AddBezier(18.2658, 27.9983, 15.5744, 25.3069, 15.5744, 20.9431, 18.2658, 18.2517)
  $path.AddLine(18.2658, 18.2517, 34.4854, 2.03219)
  $path.AddBezier(34.4854, 2.03219, 38.8265, -2.30893, 46.2504, 0.765467, 46.2504, 6.90503)
  $path.AddLine(46.2504, 6.90503, 46.2504, 39.3433)
  $path.AddBezier(46.2504, 39.3433, 46.2504, 45.4829, 38.8273, 48.5581, 34.4854, 44.2161)
  $path.AddLine(34.4854, 44.2161, 18.2658, 27.9966)
  $path.AddLine(18.2658, 27.9966, 18.2658, 27.9983)
  $path.CloseFigure()
  return $path
}

function New-RightSymbolPath {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.StartFigure()
  $path.AddBezier(27.9846, 27.9983, 30.676, 25.3069, 30.676, 20.9431, 27.9846, 18.2517)
  $path.AddLine(27.9846, 18.2517, 11.765, 2.03219)
  $path.AddBezier(11.765, 2.03219, 7.42308, -2.30893, 0, 0.765467, 0, 6.90503)
  $path.AddLine(0, 6.90503, 0, 39.3433)
  $path.AddBezier(0, 39.3433, 0, 45.4829, 7.42308, 48.5581, 11.765, 44.2161)
  $path.AddLine(11.765, 44.2161, 27.9846, 27.9966)
  $path.AddLine(27.9846, 27.9966, 27.9846, 27.9983)
  $path.CloseFigure()
  return $path
}

function Copy-PathWithTransform([System.Drawing.Drawing2D.GraphicsPath]$path, [double]$x, [double]$y, [double]$scale) {
  $clone = $path.Clone()
  $matrix = [System.Drawing.Drawing2D.Matrix]::new()
  $matrix.Translate([single]$x, [single]$y)
  $matrix.Scale([single]$scale, [single]$scale)
  $clone.Transform($matrix)
  $matrix.Dispose()
  return $clone
}

function Get-Layout([string]$format, [int]$canvasSize) {
  $bitmap = [System.Drawing.Bitmap]::new(16, 16)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $scale = $canvasSize / $canvasBase
  $layout = [ordered]@{ format = $format; canvasSize = $canvasSize }

  if ($format -eq "horizontal") {
    $font = Get-FontForWidth $graphics $wordmark ($canvasSize * 0.66) ($canvasSize * 0.05) ($canvasSize * 0.18)
    $text = Measure-Text $graphics $wordmark $font
    $iconSize = [math]::Round($font.Size * 0.82)
    $spacing = $iconSize * 0.5
    $groupWidth = $iconSize + $spacing + $text.Width
    $layout.iconX = ($canvasSize - $groupWidth) / 2
    $layout.iconY = ($canvasSize - $iconSize) / 2
    $layout.iconSize = $iconSize
    $layout.wordX = $layout.iconX + $iconSize + $spacing
    $layout.wordY = ($canvasSize - $text.Height) / 2
    $layout.wordSize = $font.Size
    $layout.sloganSize = 0
  } elseif ($format -eq "stacked") {
    $iconSize = 430 * $scale
    $font = Get-FontForWidth $graphics $wordmark ($iconSize / 1.2) ($canvasSize * 0.04) ($canvasSize * 0.16)
    $text = Measure-Text $graphics $wordmark $font
    $spacing = $iconSize * 0.75
    $groupHeight = $iconSize + $spacing + $text.Height
    $layout.iconX = ($canvasSize - $iconSize) / 2
    $layout.iconY = ($canvasSize - $groupHeight) / 2
    $layout.iconSize = $iconSize
    $layout.wordX = ($canvasSize - $text.Width) / 2
    $layout.wordY = $layout.iconY + $iconSize + $spacing
    $layout.wordSize = $font.Size
    $layout.sloganSize = 0
  } elseif ($format -eq "message") {
    $iconSize = 330 * $scale
    $font = Get-FontForWidth $graphics $wordmark ($canvasSize * 0.5) ($canvasSize * 0.05) ($canvasSize * 0.17)
    $text = Measure-Text $graphics $wordmark $font
    $sloganFont = New-BrandFont ($font.Size * 0.45)
    $sloganText = Measure-Text $graphics $slogan $sloganFont
    $iconSpacing = $iconSize * 0.5
    $sloganSpacing = $text.Height * 0.4
    $groupHeight = $iconSize + $iconSpacing + $text.Height + $sloganSpacing + $sloganText.Height
    $layout.iconX = ($canvasSize - $iconSize) / 2
    $layout.iconY = ($canvasSize - $groupHeight) / 2
    $layout.iconSize = $iconSize
    $layout.wordX = ($canvasSize - $text.Width) / 2
    $layout.wordY = $layout.iconY + $iconSize + $iconSpacing
    $layout.wordSize = $font.Size
    $layout.sloganX = ($canvasSize - $sloganText.Width) / 2
    $layout.sloganY = $layout.wordY + $text.Height + $sloganSpacing
    $layout.sloganSize = $sloganFont.Size
    $sloganFont.Dispose()
  } elseif ($format -eq "icon_only") {
    $iconSize = 570 * $scale
    $layout.iconX = ($canvasSize - $iconSize) / 2
    $layout.iconY = ($canvasSize - $iconSize) / 2
    $layout.iconSize = $iconSize
    $layout.wordSize = 0
    $layout.sloganSize = 0
  }

  if (Get-Variable -Name font -Scope Local -ErrorAction SilentlyContinue) {
    $font.Dispose()
  }
  $graphics.Dispose()
  $bitmap.Dispose()
  return $layout
}

function Get-ModeColor([string]$mode) {
  if ($mode -eq "white") { return [System.Drawing.Color]::White }
  return [System.Drawing.Color]::FromArgb(14, 15, 18)
}

function Draw-Icon([System.Drawing.Graphics]$graphics, [double]$x, [double]$y, [double]$size, [string]$mode) {
  $scale = $size / 84.0
  $bg = New-BgPath
  $left = New-LeftSymbolPath
  $right = New-RightSymbolPath

  if ($mode -eq "full_color") {
    $bgPath = Copy-PathWithTransform $bg $x $y $scale
    $bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(143, 240, 214))
    $graphics.FillPath($bgBrush, $bgPath)

    $symbolX = $x + ($symbolInset * $scale)
    $symbolY = $y + ($symbolInset * $scale)
    $leftPath = Copy-PathWithTransform $left $symbolX $symbolY $scale
    $rightPath = Copy-PathWithTransform $right $symbolX $symbolY $scale
    $gradient = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
      [System.Drawing.PointF]::new([single]($symbolX + $symbolSize * $scale), [single]($symbolY + 23.1254 * $scale)),
      [System.Drawing.PointF]::new([single]($symbolX + 16.2473 * $scale), [single]($symbolY + 23.1244 * $scale)),
      [System.Drawing.Color]::FromArgb(14, 15, 18),
      [System.Drawing.Color]::White
    )
    $rightBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(14, 15, 18))
    $graphics.FillPath($gradient, $leftPath)
    $graphics.FillPath($rightBrush, $rightPath)
    $gradient.Dispose(); $rightBrush.Dispose()
    $leftPath.Dispose(); $rightPath.Dispose(); $bgBrush.Dispose(); $bgPath.Dispose()
  } else {
    $symbolColor = Get-ModeColor $mode
    $symbolBrush = [System.Drawing.SolidBrush]::new($symbolColor)
    $symbolScale = $size / $symbolSize
    $symbolX = $x
    $symbolY = $y + (($size - ($symbolSize * $symbolScale)) / 2)
    $leftPath = Copy-PathWithTransform $left $symbolX $symbolY $symbolScale
    $rightPath = Copy-PathWithTransform $right $symbolX $symbolY $symbolScale
    $graphics.FillPath($symbolBrush, $leftPath)
    $graphics.FillPath($symbolBrush, $rightPath)
    $leftPath.Dispose(); $rightPath.Dispose(); $symbolBrush.Dispose()
  }

  $bg.Dispose(); $left.Dispose(); $right.Dispose()
}

function Draw-LogoPng([string]$format, [string]$mode, [int]$canvasSize, [string]$outputPath) {
  $layout = Get-Layout $format $canvasSize
  $bitmap = [System.Drawing.Bitmap]::new($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $textColor = Get-ModeColor $mode
  $textBrush = [System.Drawing.SolidBrush]::new($textColor)
  $formatTypographic = [System.Drawing.StringFormat]::GenericTypographic

  Draw-Icon $graphics $layout.iconX $layout.iconY $layout.iconSize $mode

  if ($layout.wordSize -gt 0) {
    $wordFont = New-BrandFont $layout.wordSize
    $graphics.DrawString($wordmark, $wordFont, $textBrush, [single]$layout.wordX, [single]$layout.wordY, $formatTypographic)
    $wordFont.Dispose()
  }

  if ($layout.sloganSize -gt 0) {
    $sloganFont = New-BrandFont $layout.sloganSize
    $graphics.DrawString($slogan, $sloganFont, $textBrush, [single]$layout.sloganX, [single]$layout.sloganY, $formatTypographic)
    $sloganFont.Dispose()
  }

  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $textBrush.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

function Get-IconSvg([hashtable]$layout, [string]$mode, [string]$gradientId) {
  $x = ConvertTo-SvgNumber $layout.iconX
  $y = ConvertTo-SvgNumber $layout.iconY
  $scale = ConvertTo-SvgNumber ($layout.iconSize / 84.0)
  $symbolScale = ConvertTo-SvgNumber ($layout.iconSize / $symbolSize)
  $singleColor = if ($mode -eq "white") { "#FFFFFF" } else { "#0E0F12" }

  if ($mode -eq "full_color") {
    $symbolX = ConvertTo-SvgNumber ($layout.iconX + (($symbolInset * $layout.iconSize) / 84.0))
    $symbolY = ConvertTo-SvgNumber ($layout.iconY + (($symbolInset * $layout.iconSize) / 84.0))
    return @"
  <g transform="translate($x $y) scale($scale)">
    <path d="$bgPathData" fill="#8FF0D6"/>
  </g>
  <g transform="translate($symbolX $symbolY) scale($scale)">
    <path d="$leftPathData" fill="url(#$gradientId)"/>
    <path d="$rightPathData" fill="#0E0F12"/>
  </g>
"@
  }

  $symbolXSingle = ConvertTo-SvgNumber $layout.iconX
  $symbolYSingle = ConvertTo-SvgNumber $layout.iconY
  return @"
  <g transform="translate($symbolXSingle $symbolYSingle) scale($symbolScale)">
    <path d="$leftPathData" fill="$singleColor"/>
    <path d="$rightPathData" fill="$singleColor"/>
  </g>
"@
}

function Write-LogoSvg([string]$format, [string]$mode, [string]$outputPath) {
  $layout = Get-Layout $format 1024
  $gradientId = "moneetize-gradient-$format-$mode"
  $iconSvg = Get-IconSvg $layout $mode $gradientId
  $textColor = if ($mode -eq "white") { "#FFFFFF" } else { "#0E0F12" }
  $wordSvg = ""
  if ($layout.wordSize -gt 0) {
    $wordX = ConvertTo-SvgNumber $layout.wordX
    $wordY = ConvertTo-SvgNumber ($layout.wordY + ($layout.wordSize * 0.92))
    $wordSize = ConvertTo-SvgNumber $layout.wordSize
    $wordSvg = "  <text x=`"$wordX`" y=`"$wordY`" fill=`"$textColor`" font-family=`"Segoe UI Black, Arial Black, Arial, sans-serif`" font-size=`"$wordSize`" font-weight=`"900`">$wordmark</text>`n"
  }
  $sloganSvg = ""
  if ($layout.sloganSize -gt 0) {
    $sloganX = ConvertTo-SvgNumber $layout.sloganX
    $sloganY = ConvertTo-SvgNumber ($layout.sloganY + ($layout.sloganSize * 0.92))
    $sloganSize = ConvertTo-SvgNumber $layout.sloganSize
    $sloganSvg = "  <text x=`"$sloganX`" y=`"$sloganY`" fill=`"$textColor`" font-family=`"Segoe UI Black, Arial Black, Arial, sans-serif`" font-size=`"$sloganSize`" font-weight=`"900`" letter-spacing=`"0.08em`">$slogan</text>`n"
  }

  $defs = ""
  if ($mode -eq "full_color") {
    $defs = @"
  <defs>
    <linearGradient id="$gradientId" gradientUnits="userSpaceOnUse" x1="1024" y1="512" x2="0" y2="512">
      <stop stop-color="#0E0F12"/>
      <stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient>
  </defs>
"@
  }

  $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" fill="none">
$defs$iconSvg$wordSvg$sloganSvg</svg>
"@

  [System.IO.File]::WriteAllText($outputPath, $svg, [System.Text.UTF8Encoding]::new($false))
}

$resolvedOutputRoot = Join-Path (Get-Location) $OutputRoot
New-Item -ItemType Directory -Force -Path $resolvedOutputRoot | Out-Null

foreach ($format in $formats) {
  foreach ($mode in $modes) {
    $svgPath = Join-Path $resolvedOutputRoot "logo_${format}_${mode}.svg"
    Write-LogoSvg $format $mode $svgPath

    foreach ($size in $sizes) {
      $pngPath = Join-Path $resolvedOutputRoot "logo_${format}_${mode}_${size}.png"
      Draw-LogoPng $format $mode $size $pngPath
    }
  }
}

foreach ($mode in $modes) {
  $svgPath = Join-Path $resolvedOutputRoot "logo_icon_only_${mode}.svg"
  Write-LogoSvg "icon_only" $mode $svgPath

  foreach ($size in $sizes) {
    $pngPath = Join-Path $resolvedOutputRoot "logo_icon_only_${mode}_${size}.png"
    Draw-LogoPng "icon_only" $mode $size $pngPath
  }
}

Write-Host "Generated Moneetize brand assets in $resolvedOutputRoot"
