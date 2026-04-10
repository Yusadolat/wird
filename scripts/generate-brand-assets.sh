#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ASSET_DIR="$ROOT_DIR/assets"
BRAND_DIR="$ASSET_DIR/brand"
STORE_DIR="$ASSET_DIR/store"

mkdir -p "$STORE_DIR"

rsvg-convert -w 1024 -h 1024 "$BRAND_DIR/icon-square.svg" > "$ASSET_DIR/icon.png"
rsvg-convert -w 1024 -h 1024 "$BRAND_DIR/adaptive-foreground.svg" > "$ASSET_DIR/adaptive-icon.png"
rsvg-convert -w 1024 -h 1024 "$BRAND_DIR/adaptive-monochrome.svg" > "$ASSET_DIR/adaptive-icon-monochrome.png"
rsvg-convert -w 1024 -h 1024 "$BRAND_DIR/splash-mark.svg" > "$ASSET_DIR/splash-icon.png"
rsvg-convert -w 1024 -h 500 "$BRAND_DIR/feature-graphic.svg" | magick png:- -background "#0b1526" -alpha remove -alpha off PNG24:"$STORE_DIR/play-feature-graphic.png"

magick "$ASSET_DIR/icon.png" -resize 512x512 "$STORE_DIR/play-hi-res-icon.png"
magick "$ASSET_DIR/icon.png" -resize 48x48 "$ASSET_DIR/favicon.png"

echo "Generated:"
echo "  $ASSET_DIR/icon.png"
echo "  $ASSET_DIR/adaptive-icon.png"
echo "  $ASSET_DIR/adaptive-icon-monochrome.png"
echo "  $ASSET_DIR/splash-icon.png"
echo "  $ASSET_DIR/favicon.png"
echo "  $STORE_DIR/play-hi-res-icon.png"
echo "  $STORE_DIR/play-feature-graphic.png"
