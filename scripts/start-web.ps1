# Backend + Expo web — single dev run (http://localhost:8081)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$mobile = Join-Path $root "khidmat-ai\mobile"
$backend = Join-Path $root "backend"
$apiUrl = "http://127.0.0.1:8000"

Write-Host "Stopping old Metro on 8081-8083..." -ForegroundColor Gray
8081, 8082, 8083 | ForEach-Object {
  $port = $_
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object {
    $procId = $_.OwningProcess
    if ($procId -gt 0) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }
  }
}

$backendUp = $false
try {
  $h = Invoke-RestMethod -Uri "$apiUrl/health" -TimeoutSec 2
  if ($h.status -eq "ok") { $backendUp = $true }
} catch {}

if (-not $backendUp) {
  if (-not (Test-Path (Join-Path $backend ".venv\Scripts\python.exe"))) {
    Write-Host "Backend venv missing. Run:" -ForegroundColor Yellow
    Write-Host "  cd backend; python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt" -ForegroundColor Gray
    exit 1
  }
  Write-Host "Starting backend on $apiUrl ..." -ForegroundColor Cyan
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backend'; .\.venv\Scripts\Activate.ps1; python run.py"
  foreach ($i in 1..15) {
    Start-Sleep -Seconds 1
    try {
      $h = Invoke-RestMethod -Uri "$apiUrl/health" -TimeoutSec 2
      if ($h.status -eq "ok") { $backendUp = $true; break }
    } catch {}
  }
  if (-not $backendUp) {
    Write-Host "Backend did not start in time. Check the backend window." -ForegroundColor Red
    exit 1
  }
}
Write-Host "Backend OK: $apiUrl" -ForegroundColor Green

$env:EXPO_PUBLIC_API_URL = $apiUrl
& (Join-Path $root "scripts\smoke-test.ps1")

Set-Location $mobile
if (-not (Test-Path "node_modules")) {
  Write-Host "Installing mobile dependencies..." -ForegroundColor Yellow
  npm install
}

Write-Host ""
Write-Host "Open app: http://localhost:8081" -ForegroundColor Green
Write-Host "Login: any +92 number, OTP 1234 (or Continue as Guest)" -ForegroundColor Gray
npx expo start --web --port 8081 --clear
