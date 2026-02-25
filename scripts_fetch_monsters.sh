#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$BASE_DIR/web/characters/hq"
mkdir -p "$OUT_DIR"

curl -L --fail "https://cdn.jsdelivr.net/npm/openmoji@14.0.0/color/svg/1F996.svg" -o "$OUT_DIR/dino.svg"
curl -L --fail "https://cdn.jsdelivr.net/npm/openmoji@14.0.0/color/svg/1F47A.svg" -o "$OUT_DIR/goblin.svg"
curl -L --fail "https://cdn.jsdelivr.net/npm/openmoji@14.0.0/color/svg/1F479.svg" -o "$OUT_DIR/troll.svg"
curl -L --fail "https://cdn.jsdelivr.net/npm/openmoji@14.0.0/color/svg/1F47B.svg" -o "$OUT_DIR/ghost.svg"
curl -L --fail "https://cdn.jsdelivr.net/npm/openmoji@14.0.0/color/svg/1F432.svg" -o "$OUT_DIR/dragon.svg"
curl -L --fail "https://cdn.jsdelivr.net/npm/openmoji@14.0.0/color/svg/1F9A4.svg" -o "$OUT_DIR/ostrich.svg"

echo "Downloaded monster assets to: $OUT_DIR"
