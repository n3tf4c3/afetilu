# Junta as prévias renderizadas numa folha só (para revisão visual).
param([string]$Pasta, [string]$Saida)
Add-Type -AssemblyName System.Drawing
$ordem = "neutro","alimentacao","enjoo","desconforto","sono","banho","positivo"
$rotulos = @{ neutro="Neutro"; alimentacao="Alimentação"; enjoo="Enjoo"; desconforto="Dor ou desconforto"; sono="Sono"; banho="Banho e higiene"; positivo="Momento positivo" }
$w = 360; $h = 280; $cols = 4; $linhas = [math]::Ceiling($ordem.Count / $cols)
$folha = New-Object System.Drawing.Bitmap ($w * $cols), (($h + 34) * $linhas)
$g = [System.Drawing.Graphics]::FromImage($folha)
$g.Clear([System.Drawing.Color]::FromArgb(250, 247, 242))
$g.InterpolationMode = "HighQualityBicubic"
$fonte = New-Object System.Drawing.Font "Segoe UI", 13, ([System.Drawing.FontStyle]::Bold)
$pincel = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(34, 50, 74))
for ($i = 0; $i -lt $ordem.Count; $i++) {
  $img = [System.Drawing.Image]::FromFile((Join-Path $Pasta "$($ordem[$i]).png"))
  $x = ($i % $cols) * $w; $y = [math]::Floor($i / $cols) * ($h + 34)
  $g.DrawImage($img, $x, $y, $w, $h)
  $g.DrawString($rotulos[$ordem[$i]], $fonte, $pincel, ($x + 12), ($y + $h + 4))
  $img.Dispose()
}
$folha.Save($Saida, [System.Drawing.Imaging.ImageFormat]::Png)
