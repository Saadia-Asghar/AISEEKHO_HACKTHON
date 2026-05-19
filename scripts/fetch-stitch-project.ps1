# Download all screens from Stitch project KhidmatAI Mobile Service Hub
# https://stitch.withgoogle.com/projects/10743790711138500902
$ProjectId = "10743790711138500902"
$OutDir = Join-Path $PSScriptRoot "..\khidmat-ai\mobile\design\stitch"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$token = $env:STITCH_API_KEY
if (-not $token) { $token = $env:GOOGLE_ACCESS_TOKEN }
if (-not $token) {
  Write-Host "Set GOOGLE_ACCESS_TOKEN or STITCH_API_KEY" -ForegroundColor Yellow
  exit 1
}

$listUri = "https://stitch.googleapis.com/v1/projects/$ProjectId/screens"
$listJson = curl.exe -sS -L $listUri -H "Authorization: Bearer $token" -H "Accept: application/json"
$list = $listJson | ConvertFrom-Json
$screens = $list.screens
if (-not $screens) {
  Write-Host $listJson
  exit 1
}

foreach ($s in $screens) {
  $id = $s.name -replace '^.*/screens/', ''
  $title = ($s.title -replace '[^\w\-]', '_').ToLower()
  if (-not $title) { $title = $id }
  $detailUri = "https://stitch.googleapis.com/v1/projects/$ProjectId/screens/$id"
  $detail = (curl.exe -sS -L $detailUri -H "Authorization: Bearer $token" -H "Accept: application/json" | ConvertFrom-Json)
  if ($detail.screenshot.downloadUrl) {
    curl.exe -sS -L $detail.screenshot.downloadUrl -o (Join-Path $OutDir "$title.png")
  }
  if ($detail.htmlCode.downloadUrl) {
    curl.exe -sS -L $detail.htmlCode.downloadUrl -o (Join-Path $OutDir "$title.html")
  }
  Write-Host "OK $title"
}
Write-Host "Saved to $OutDir"
