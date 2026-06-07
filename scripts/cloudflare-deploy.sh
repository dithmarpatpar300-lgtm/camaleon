#!/usr/bin/env bash
# Cloudflare Workers deploy — runs from repository root.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/frontend"
npx wrangler deploy
