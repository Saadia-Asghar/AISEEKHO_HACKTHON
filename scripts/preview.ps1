# KhidmatAI — start backend + Expo for local preview
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "=== KhidmatAI preview ===" -ForegroundColor Cyan
Write-Host "Framer: https://splendid-gibbon-403400.framer.app/" -ForegroundColor Gray

# Backend
$backend = Join-Path $root "backend"
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$backend'; if (Test-Path .\.venv\Scripts\Activate.ps1) { .\.venv\Scripts\Activate.ps1 }; python run.py"
) -WindowStyle Normal

Start-Sleep -Seconds 2
try {
  $h = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 5
  Write-Host "Backend OK: $($h.status)" -ForegroundColor Green
} catch {
  Write-Host "Backend starting... open http://127.0.0.1:8000/health" -ForegroundColor Yellow
}

# Mobile
$mobile = Join-Path $root "khidmat-ai\mobile"
if (-not (Test-Path (Join-Path $mobile "node_modules"))) {
  Write-Host "Installing mobile dependencies..." -ForegroundColor Yellow
  Push-Location $mobile
  npm install
  Pop-Location
}

Write-Host "Stopping old Metro on 8081-8083..." -ForegroundColor Gray
8081, 8082, 8083 | ForEach-Object {
  $port = $_
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object {
    $procId = $_.OwningProcess
    if ($procId -gt 0) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }
  }
}

$env:EXPO_PUBLIC_API_URL = "http://127.0.0.1:8000"
Write-Host "EXPO_PUBLIC_API_URL=$env:EXPO_PUBLIC_API_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "Open app (web): http://localhost:8081" -ForegroundColor Green
Write-Host "Login: any +92 number, OTP 1234" -ForegroundColor Gray
Set-Location $mobile
npx expo start --web --port 8081 --clear
