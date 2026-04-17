#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/out"
HOST="jirkovo.app"
USER="admin.jirkovo.app"
PASS="666MyClinic3210"
REMOTE_DIR="jirkovo.app/sub/lfa"

if ! command -v lftp >/dev/null 2>&1; then
  echo "lftp is required for FTP deploy." >&2
  exit 1
fi

cd "$ROOT_DIR"
npm run build

lftp -u "$USER","$PASS" "$HOST" <<EOF
set ssl:verify-certificate no
mirror -R --delete --verbose "$OUT_DIR" "$REMOTE_DIR"
bye
EOF
