# Camaleon Wasm build script
# Usage: .\scripts\build-wasm.ps1
# Or via npm: npm run build:wasm (from frontend/)

$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$wasmOutBase = Join-Path $workspaceRoot "frontend\public\wasm"

$crates = @(
    @{ Name = "transmutador_jpg"; Path = "motor_transmutacion\transmutador_jpg" },
    @{ Name = "transmutador_png"; Path = "motor_transmutacion\transmutador_png" },
    @{ Name = "transmutador_webp"; Path = "motor_transmutacion\transmutador_webp" },
    @{ Name = "transmutador_encode"; Path = "motor_transmutacion\transmutador_encode" }
)

foreach ($crate in $crates) {
    $cratePath = Join-Path $workspaceRoot $crate.Path
    $outDir = Join-Path $wasmOutBase $crate.Name

    Write-Host "Building Wasm for $($crate.Name)..." -ForegroundColor Cyan
    Push-Location $cratePath
    try {
        wasm-pack build --target web --out-dir $outDir --out-name $($crate.Name)
        Write-Host "Wasm build complete. Artifacts at: $outDir" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

Write-Host "All Wasm modules built successfully." -ForegroundColor Green
