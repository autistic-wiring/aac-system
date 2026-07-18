#!/usr/bin/env bash
# Generate animations for ALL AAC board buttons end-to-end.
# Phase 1: Veo MP4 generation (one at a time, skips existing)
# Phase 2: MP4 -> transparent WebP conversion (batch)
# Phase 3: Output animation data for vocabulary update
#
# Usage:
#   bash scripts/batch-animate-all.sh              # full pipeline
#   bash scripts/batch-animate-all.sh --phase1     # only Veo generation
#   bash scripts/batch-animate-all.sh --phase2     # only transparency conversion
#   bash scripts/batch-animate-all.sh --resume ID  # resume from a specific button

set -euo pipefail

export PATH="$HOME/google-cloud-sdk/bin:$PATH"

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PYTHON="$(which python3)"
FFPROBE="$(which ffprobe)"
GENERATOR="$REPO/scripts/generate-button-animation.py"
TRANSPARENCY="$REPO/scripts/mp4-to-transparent-apng.py"
ANIM_DIR="$REPO/public/images/core/animated"

# All buttons that have image PNGs (matching defaultVocabulary.js core array)
# help already done, so skip by default unless --all
BUTTONS=(
  help me i want
  give me2 yes no
  hi bye my_turn your_turn
  more all_done washroom wait
  i_eat i_drink hi2 bye2
)

PHASE1=true
PHASE2=true
RESUME_FROM=""
ALL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --phase1) PHASE2=false ;;
    --phase2) PHASE1=false ;;
    --resume) RESUME_FROM="$2"; shift ;;
    --all) ALL=true ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
  shift
done

mkdir -p "$ANIM_DIR"

###############################################################################
# Phase 1: Veo generation
###############################################################################
phase1() {
  local started=false
  for id in "${BUTTONS[@]}"; do
    # Resume control: skip until we reach the resume point
    if [[ -n "$RESUME_FROM" && "$id" != "$RESUME_FROM" && "$started" != true ]]; then
      echo "[batch] skipping $id (before resume point)"
      continue
    fi
    started=true
    RESUME_FROM=""  # only skip once

    local mp4="$ANIM_DIR/${id}.mp4"
    if [[ -f "$mp4" ]]; then
      echo "[batch] SKIP $id — MP4 exists ($(du -h "$mp4" | cut -f1))"
      continue
    fi

    # Skip help by default since it's already done (unless --all)
    if [[ "$id" == "help" && "$ALL" != true ]]; then
      echo "[batch] SKIP help — already animated"
      continue
    fi

    echo "==================== $id ===================="
    echo "[batch] $(date '+%H:%M:%S') Generating Veo animation for: $id"

    "$PYTHON" "$GENERATOR" "$id" \
      --white-bg \
      --fps 14 \
      --scale 320 \
      --mp4-only \
      --duration 4 \
      || {
        echo "[batch] FAILED: $id (Veo generation error)"
        continue
      }

    echo "[batch] $(date '+%H:%M:%S') Done: $id"
  done
}

###############################################################################
# Phase 2: MP4 -> transparent WebP
###############################################################################
phase2() {
  for id in "${BUTTONS[@]}"; do
    local mp4="$ANIM_DIR/${id}.mp4"
    local webp="$ANIM_DIR/${id}.webp"

    if [[ ! -f "$mp4" ]]; then
      echo "[batch] SKIP $id — no MP4 to convert"
      continue
    fi

    if [[ -f "$webp" ]]; then
      # Check if WebP is newer than MP4
      if [[ "$webp" -nt "$mp4" ]]; then
        echo "[batch] SKIP $id — WebP already up to date"
        continue
      fi
      echo "[batch] REBUILD $id — WebP older than MP4"
    fi

    echo "[batch] $(date '+%H:%M:%S') Converting $id MP4 -> transparent WebP"
    "$PYTHON" "$TRANSPARENCY" "$mp4" \
      --format webp \
      --fps 14 \
      --scale 256 \
      || {
        echo "[batch] FAILED: $id (transparency conversion error)"
        continue
      }
  done
}

###############################################################################
# Phase 3: Output animation data JSON
###############################################################################
phase3() {
  echo "{"
  local first=true
  for id in "${BUTTONS[@]}"; do
    local webp="$ANIM_DIR/${id}.webp"
    local mp4="$ANIM_DIR/${id}.mp4"
    [[ -f "$webp" ]] || continue

    local duration
    duration=$("$FFPROBE" -v error -show_entries format=duration \
      -of default=noprint_wrappers=1:nokey=1 "$mp4" 2>/dev/null || echo "0")

    # Round to 3 decimal places
    duration=$(printf "%.3f" "$duration")

    local size
    size=$(stat -c%s "$webp" 2>/dev/null || echo "0")

    $first || echo ","
    first=false
    printf '  "%s": {"animation": "images/core/animated/%s.webp", "animationDuration": %s, "size": %s}' \
      "$id" "$id" "$duration" "$size"
  done
  echo ""
  echo "}"
}

###############################################################################
# Main
###############################################################################
echo "[batch] ====== $(date) ======"
echo "[batch] Phase1=$PHASE1 Phase2=$PHASE2 Resume=$RESUME_FROM All=$ALL"

if $PHASE1; then
  phase1
fi

if $PHASE2; then
  phase2
fi

echo "[batch] ====== Animation data for vocabulary ======"
phase3
echo "[batch] ====== DONE $(date) ======"
