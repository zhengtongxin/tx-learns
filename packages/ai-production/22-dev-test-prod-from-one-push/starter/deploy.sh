#!/usr/bin/env bash
# deploy.sh <dev|test|prod> [plan]
set -euo pipefail
ENV="${1:?usage: ./deploy.sh dev|test|prod [plan]}"
MODE="${2:-apply}"

# TODO 1: build backend/twin.zip. Order: pip install into backend/package for the function's Linux
#         (--platform manylinux2014_x86_64 --only-binary=:all:), copy *.py and data/ in, zip it.
# TODO 2: build the front end (cd frontend && npm ci && npm run build)
# TODO 3: cd infra; select (or create) the workspace named $ENV and PRINT it
# TODO 4: if MODE is "plan", run terraform plan -var="environment=$ENV" and exit
# TODO 5: terraform apply -auto-approve -var="environment=$ENV"
# TODO 6: write frontend/dist/config.js with   window.API_URL = "<the api_url output>";
# TODO 7: aws s3 sync frontend/dist to the site bucket (--delete), then create a CDN invalidation for "/*"
# TODO 8: print the site and api addresses
echo "TODO: finish deploy.sh"
exit 1
