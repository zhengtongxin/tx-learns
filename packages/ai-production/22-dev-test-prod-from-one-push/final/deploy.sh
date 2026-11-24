#!/usr/bin/env bash
# deploy.sh <dev|test|prod> [plan]
# For macOS and Linux. (Windows needs its own PowerShell version.)
set -euo pipefail
ENV="${1:?usage: ./deploy.sh dev|test|prod [plan]}"
MODE="${2:-apply}"

# 1. backend package, built for the function's Linux even if your laptop is a Mac
( cd backend && rm -rf package twin.zip \
  && pip install --platform manylinux2014_x86_64 --python-version 3.12 --implementation cp \
       --target package --only-binary=:all: -r requirements.txt \
  && rm -rf package/boto3 package/botocore package/s3transfer package/jmespath \
  && cp ./*.py package/ && cp -r data package/ \
  && ( cd package && zip -qr ../twin.zip . ) )
# added above: --python-version/--implementation pick the right wheels; boto3 is left out because
# the function runtime already has it; data/ holds the twin's facts.

# 2. front end -> frontend/dist
( cd frontend && npm ci && npm run build )

# 3. the right workspace, printed every time
cd infra
terraform workspace select -or-create "$ENV"
echo "workspace: $(terraform workspace show)"

if [ "$MODE" = "plan" ]; then
  terraform plan -var="environment=$ENV"
  exit 0
fi

terraform apply -auto-approve -var="environment=$ENV"

# 4. the page needs to know the API address, which only exists after apply (added)
echo "window.API_URL = \"$(terraform output -raw api_url)\";" > ../frontend/dist/config.js

# 5. upload the site, then make the CDN forget its old copies (project step 4)
aws s3 sync ../frontend/dist "s3://$(terraform output -raw site_bucket)" --delete
aws cloudfront create-invalidation --distribution-id "$(terraform output -raw cdn_id)" --paths "/*" >/dev/null

echo "site: $(terraform output -raw site_url)"
echo "api:  $(terraform output -raw api_url)"
