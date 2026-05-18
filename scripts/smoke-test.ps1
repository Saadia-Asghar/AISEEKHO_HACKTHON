# KhidmatAI — verify backend + mobile API wiring (run while backend is up)
$ErrorActionPreference = "Stop"
$base = if ($env:EXPO_PUBLIC_API_URL) { $env:EXPO_PUBLIC_API_URL } else { "http://127.0.0.1:8000" }

Write-Host "Smoke test: $base" -ForegroundColor Cyan

$h = Invoke-RestMethod -Uri "$base/health" -TimeoutSec 5
if ($h.status -ne "ok") { throw "Health check failed" }
Write-Host "[OK] GET /health" -ForegroundColor Green

Invoke-RestMethod -Uri "$base/api/google/status" -TimeoutSec 5 | Out-Null
Write-Host "[OK] GET /api/google/status" -ForegroundColor Green

$phone = "+923009998877"
Invoke-RestMethod -Method POST -Uri "$base/api/auth/send-otp" -ContentType "application/json" -Body (@{ phone = $phone } | ConvertTo-Json) | Out-Null
Write-Host "[OK] POST /api/auth/send-otp" -ForegroundColor Green

$auth = Invoke-RestMethod -Method POST -Uri "$base/api/auth/verify" -ContentType "application/json" -Body (@{ phone = $phone; otp = "1234"; name = "Smoke Test" } | ConvertTo-Json)
if (-not $auth.token) { throw "No token from verify" }
Write-Host "[OK] POST /api/auth/verify -> $($auth.user_id)" -ForegroundColor Green

$headers = @{ Authorization = "Bearer $($auth.token)" }
$orch = Invoke-RestMethod -Method POST -Uri "$base/api/orchestrate" -ContentType "application/json" -Headers $headers -Body (@{
  message = "Mujhe kal subah G-13 mein AC technician chahiye"
  user_id = $auth.user_id
  customer_name = "Smoke Test"
} | ConvertTo-Json) -TimeoutSec 60
if (-not $orch.session_id -or -not $orch.recommended) { throw "Orchestrate missing fields" }
Write-Host "[OK] POST /api/orchestrate -> $($orch.recommended.name)" -ForegroundColor Green

Invoke-RestMethod -Uri "$base/api/suggestions?hour=14" -TimeoutSec 5 | Out-Null
Write-Host "[OK] GET /api/suggestions" -ForegroundColor Green

$bookings = Invoke-RestMethod -Uri "$base/api/bookings/user/$($auth.user_id)?tab=upcoming" -Headers $headers -TimeoutSec 5
Write-Host "[OK] GET /api/bookings/user/{id} ($($bookings.bookings.Count) rows)" -ForegroundColor Green

Write-Host ""
Write-Host "All smoke tests passed. Frontend should use EXPO_PUBLIC_API_URL=$base" -ForegroundColor Green
