# og-generate.ps1 —— 生成 blog.955827.xyz 的全局社交分享卡 public/og-image.png (1200x630)
# 用法: powershell -ExecutionPolicy Bypass -File scripts/og-generate.ps1
# 依赖: Windows 自带 System.Drawing + 微软雅黑字体（无需额外安装）

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$w = 1200; $h = 630
$out = Join-Path $PSScriptRoot '..\XHBlogs\public\og-image.png'

$bmp = [System.Drawing.Bitmap]::new($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.Clear([System.Drawing.ColorTranslator]::FromHtml('#0f172a'))

function New-Brush([string]$hex, [float]$alpha = 1.0) {
  $c = [System.Drawing.ColorTranslator]::FromHtml($hex)
  $a = [System.Drawing.Color]::FromArgb([int](255 * $alpha), $c.R, $c.G, $c.B)
  return [System.Drawing.SolidBrush]::new($a)
}

# 主渐变（对角流光，低透明度叠加在深色底上）
$rect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
$grad = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  $rect,
  [System.Drawing.Color]::FromArgb(70, 161, 140, 209),  # #a18cd1
  [System.Drawing.Color]::FromArgb(70, 251, 194, 235),  # #fbc2eb
  45.0)
$g.FillRectangle($grad, $rect)

# 柔光圆（右下 + 左上），模拟站点玻璃光晕
$glow1 = New-Brush '#a1c4fd' 0.28
$g.FillEllipse($glow1, 760, 350, 620, 460)
$glow2 = New-Brush '#c2e9fb' 0.18
$g.FillEllipse($glow2, -160, -180, 560, 420)
$glow3 = New-Brush '#fbc2eb' 0.16
$g.FillEllipse($glow3, 900, -120, 420, 380)

# 底部细渐变条，让卡片更立体
$barRect = [System.Drawing.Rectangle]::new(0, $h - 10, $w, 10)
$bar = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  $barRect,
  [System.Drawing.ColorTranslator]::FromHtml('#a18cd1'),
  [System.Drawing.ColorTranslator]::FromHtml('#a1c4fd'),
  0.0)
$g.FillRectangle($bar, $barRect)

function Draw-Text([string]$text, [float]$size, [string]$hex, [float]$x, [float]$y, [bool]$bold = $true) {
  $style = if ($bold) { [System.Drawing.FontStyle]::Bold } else { [System.Drawing.FontStyle]::Regular }
  $font = [System.Drawing.Font]::new('Microsoft YaHei UI', $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-Brush $hex
  $g.DrawString($text, $font, $brush, $x, $y)
  $font.Dispose(); $brush.Dispose()
}

# 主标题
Draw-Text 'Bortala の 宝藏之地' 62 '#ffffff' 72 118
# 副标题
Draw-Text 'RCJ Lab · 把想法做成可用产品的个人工作室' 28 '#cbd5e1' 76 236
Draw-Text '东西基本都跑在 Cloudflare 边缘上' 28 '#cbd5e1' 76 282
# 域名
Draw-Text 'blog.955827.xyz' 30 '#a5b4fc' 76 480

$g.Dispose()
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "OG image written: $out"
