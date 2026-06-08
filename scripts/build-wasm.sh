#!/usr/bin/env bash
# Camaleon Wasm build script
# Usage: ./scripts/build-wasm.sh
# Or via npm: npm run build:wasm (from frontend/)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(dirname "$SCRIPT_DIR")"
WASM_OUT_BASE="$WORKSPACE_ROOT/frontend/public/wasm"

crates=("transmutador_jpg" "transmutador_png" "transmutador_webp" "transmutador_encode" "transmutador_gif" "transmutador_bmp" "transmutador_tiff")

for crate in "${crates[@]}"; do
    crate_path="$WORKSPACE_ROOT/motor_transmutacion/$crate"
    out_dir="$WASM_OUT_BASE/$crate"

    echo "Building Wasm for $crate..."
    pushd "$crate_path" > /dev/null
    wasm-pack build --target web --out-dir "$out_dir" --out-name "$crate"
    popd > /dev/null
    echo "Wasm build complete. Artifacts at: $out_dir"
done

echo "All Wasm modules built successfully."
