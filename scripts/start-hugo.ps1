Param()

# start-hugo.ps1 — helper to start Hugo dev server and capture logs
# Usage (PowerShell, run as Admin if installing):
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-hugo.ps1

$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

Write-Host "Project root: $projectRoot"

if (-not (Get-Command hugo -ErrorAction SilentlyContinue)) {
    Write-Host "Hugo executable not found in PATH." -ForegroundColor Yellow
    Write-Host 'If you have Chocolatey installed, run as Admin: choco install hugo -y'
    Write-Host 'Or install from: https://gohugo.io/getting-started/installing/'
    exit 2
}

$log = Join-Path $projectRoot "hugo-dev.log"
if (Test-Path $log) { Remove-Item $log -Force }

Write-Host "Starting Hugo server... Logs -> $log"

# Start Hugo server and tee output to log
hugo server -D --bind 127.0.0.1 --port 1313 --disableFastRender 2>&1 | Tee-Object -FilePath $log
