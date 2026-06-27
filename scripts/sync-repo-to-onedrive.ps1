param(
  [string]$Source = (Join-Path $PSScriptRoot ".."),
  [string]$Target = (Join-Path $env:USERPROFILE "OneDrive\Masaüstü\para\ZIGO")
)

$ErrorActionPreference = "Stop"
$Source = (Resolve-Path $Source).Path

if (-not (Test-Path $Source)) {
  Write-Error "Source repo not found: $Source"
}

New-Item -ItemType Directory -Force -Path $Target | Out-Null

$excludeDirs = @(
  "node_modules",
  ".next",
  ".git",
  "android\.gradle",
  "android\app\build",
  "android\build",
  "playwright-report",
  "test-results",
  "coverage"
)

$excludeFiles = @(
  ".env.local",
  ".env.vercel.production.local",
  "keystore.properties",
  "*.aab",
  "*.apk"
)

robocopy $Source $Target /MIR /XD $excludeDirs /XF $excludeFiles /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null

if ($LASTEXITCODE -ge 8) {
  Write-Error "Robocopy failed with exit code $LASTEXITCODE"
}

Write-Host "PASS Synced $Source -> $Target"
