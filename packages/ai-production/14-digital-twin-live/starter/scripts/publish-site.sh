#!/usr/bin/env bash
# Step 4 of the project: point the front end at the API, rebuild, upload, clear the CDN cache.
# Usage:   API=https://abc123.execute-api.ap-southeast-1.amazonaws.com SITE_BUCKET=wharf-twin-site-ACCOUNTID \
#            DISTRIBUTION_ID=YOUR_DISTRIBUTION_ID bash scripts/publish-site.sh
# The site bucket and the CDN are made in the console (see README, "Cloud steps").
set -euo pipefail
cd "$(dirname "$0")/../frontend"

: "${API:?set API to your gateway address}"
: "${SITE_BUCKET:?set SITE_BUCKET to your site bucket name}"

npm install
NEXT_PUBLIC_API_BASE="$API" npm run build            # static export -> "out"
aws s3 sync out/ "s3://$SITE_BUCKET" --delete

if [ -n "${DISTRIBUTION_ID:-}" ]; then
  # without this the CDN serves its old copy for minutes
  aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
else
  echo "DISTRIBUTION_ID not set: skipped the cache invalidation (the old page may linger)."
fi
