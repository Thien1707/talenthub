# Xuất .drawio -> diagram_exports/*.png (cần draw.io Desktop)
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$diagrams = Join-Path $root "diagrams"
$exports = Join-Path $root "diagram_exports"
$drawio = @(
    "$env:LocalAppData\Programs\draw.io\draw.io.exe",
    "C:\Program Files\draw.io\draw.io.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $drawio) {
    Write-Error "Không tìm thấy draw.io Desktop. Xuất PNG thủ công từ app.diagrams.net."
    exit 1
}

New-Item -ItemType Directory -Force -Path $exports | Out-Null
Get-ChildItem $diagrams -Filter *.drawio | ForEach-Object {
    $out = Join-Path $exports ($_.BaseName + ".png")
    Write-Host "Export $($_.Name) -> $out"
    & $drawio -x -f png -s 2 -b 10 -o $out $_.FullName
}
