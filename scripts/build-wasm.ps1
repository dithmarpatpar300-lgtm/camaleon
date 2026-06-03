# Camaleon Wasm build script
# Usage: .\scripts\build-wasm.ps1
# Or via npm: npm run build:wasm (from frontend/)

$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$cratePath = Join-Path $workspaceRoot "motor_transmutacion\transmutador_jpg"
$outDir = Join-Path $workspaceRoot "frontend\public\wasm\transmutador_jpg"

Write-Host "Building Wasm for transmutador_jpg..." -ForegroundColor Cyan
Push-Location $cratePath
try {
    wasm-pack build --target web --out-dir $outDir --out-name transmutador_jpg
    Write-Host "Wasm build complete. Artifacts at: $outDir" -ForegroundColor Green
}
finally {
    Pop-Location
}
