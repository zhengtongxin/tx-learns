#!/usr/bin/env bash
# added: step 1 of the lesson as one script.
# Usage: scripts/build-static.sh /path/to/your/consultation-notes/project
# Your Next.js project must have   module.exports = { output: "export" };   in next.config.js
set -euo pipefail

FRONTEND="${1:?usage: scripts/build-static.sh /path/to/next-project}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"

( cd "$FRONTEND" && npm install && npm run build )   # static export -> "out"
rm -rf "$HERE/static"
cp -r "$FRONTEND/out" "$HERE/static"
echo "static front end copied to $HERE/static"
