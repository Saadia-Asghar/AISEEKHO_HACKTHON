# Build submission ZIP: Antigravity traces + workflow API export
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$traceDir = Join-Path $root "docs\antigravity-trace"
$distDir = Join-Path $root "dist"
$api = if ($env:API_URL) { $env:API_URL } else { "http://127.0.0.1:8000" }

New-Item -ItemType Directory -Force -Path (Join-Path $traceDir "samples") | Out-Null
New-Item -ItemType Directory -Force -Path $distDir | Out-Null

try {
    Invoke-WebRequest -Uri "$api/api/antigravity/workflow" -UseBasicParsing -TimeoutSec 8 |
        Select-Object -ExpandProperty Content |
        Set-Content -Path (Join-Path $traceDir "workflow_definition.json") -Encoding UTF8
    Write-Host "OK workflow_definition.json from $api"
} catch {
    Write-Warning "API not reachable at $api - using existing workflow_definition.json if present"
}

$wfPy = Join-Path $root "backend\app\antigravity\workflow.py"
$mdOut = Join-Path $traceDir "backend_workflow_source.md"
if (Test-Path $wfPy) {
    $lines = Get-Content $wfPy -Raw
    $md = "# KhidmatAI Antigravity node registration (source)`n`nFile: backend/app/antigravity/workflow.py`n`n``````python`n$lines``````"
    Set-Content -Path $mdOut -Value $md -Encoding UTF8
}

$memberTpl = Join-Path $traceDir "member_example"
if (-not (Test-Path $memberTpl)) {
    New-Item -ItemType Directory -Path $memberTpl | Out-Null
    Set-Content -Path (Join-Path $memberTpl "README.md") -Encoding UTF8 -Value @(
        "# Replace this folder per teammate",
        "",
        "Export from Google Antigravity IDE (or Cursor agent sessions):",
        "- implementation_plans.md",
        "- task_list.md",
        "- walkthrough.md"
    )
}

$zipPath = Join-Path $distDir "khidmatai-antigravity-traces.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $traceDir "*") -DestinationPath $zipPath -Force
Write-Host "Created $zipPath"
Write-Host "Upload for submission item 6 (Antigravity Trace / Logs)."
