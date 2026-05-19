# Download Stitch screen screenshot + HTML for KhidmatAI
# Requires: $env:STITCH_API_KEY or $env:GOOGLE_ACCESS_TOKEN (OAuth)
# Usage:
#   $env:STITCH_API_KEY = "your-token"
#   .\scripts\fetch-stitch-screen.ps1

$ProjectId = "10743790711138500902"
$ScreenId = "62d971c7f47c4dc3bc78e8f2695c851e"
$OutDir = Join-Path $PSScriptRoot "..\khidmat-ai\mobile\design\stitch"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$token = $env:STITCH_API_KEY
if (-not $token) { $token = $env:GOOGLE_ACCESS_TOKEN }
if (-not $token) {
  Write-Host "Set STITCH_API_KEY or GOOGLE_ACCESS_TOKEN (e.g. gcloud auth print-access-token)" -ForegroundColor Yellow
  exit 1
}

$uri = "https://stitch.googleapis.com/v1/projects/$ProjectId/screens/$ScreenId"
Write-Host "GET $uri"
$json = curl.exe -sS -L $uri -H "Authorization: Bearer $token" -H "Accept: application/json"
$resp = $json | ConvertFrom-Json
if ($resp.error) {
  Write-Host ($resp.error | ConvertTo-Json -Depth 5) -ForegroundColor Red
  exit 1
}

$resp | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $OutDir "screen-metadata.json") -Encoding UTF8

$imgUrl = $resp.screenshot.downloadUrl
$htmlUrl = $resp.htmlCode.downloadUrl
if ($imgUrl) {
  curl.exe -sS -L $imgUrl -o (Join-Path $OutDir "login-authentication.png")
  Write-Host "Saved login-authentication.png"
}
if ($htmlUrl) {
  curl.exe -sS -L $htmlUrl -o (Join-Path $OutDir "login-authentication.html")
  Write-Host "Saved login-authentication.html"
}
Write-Host "Done -> $OutDir"
