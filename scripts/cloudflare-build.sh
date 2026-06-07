#!/usr/bin/env bash
# Cloudflare Workers build — runs from repository root.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="$ROOT/frontend"

if ! command -v wasm-pack >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
  # shellcheck disable=SC1090
  . "$HOME/.cargo/env"
  cargo install wasm-pack --locked
fi

cd "$FRONTEND"
npm ci
npm run build:wasm
npm run build:cf
