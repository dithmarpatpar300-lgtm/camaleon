#!/usr/bin/env bash
# Camaleon Wasm build script (Unix / CI)
# Usage: ./scripts/build-wasm.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRATE="$ROOT/motor_transmutacion/transmutador_jpg"
OUT="$ROOT/frontend/public/wasm/transmutador_jpg"

echo "Building Wasm for transmutador_jpg..."
wasm-pack build --target web --out-dir "$OUT" --out-name transmutador_jpg "$CRATE"
echo "Wasm build complete. Artifacts at: $OUT"
