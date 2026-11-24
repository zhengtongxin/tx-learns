#!/usr/bin/env bash
# Once per account: the state bucket and the lock table (lesson "Shared state and stale locks").
# Terraform cannot store its state in a bucket it has not made yet, so this is a script, not Terraform.
set -euo pipefail
cd "$(dirname "$0")/.."

REGION="${REGION:-ap-southeast-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="${BUCKET:-wharf-tf-state-$ACCOUNT_ID}"
TABLE="${TABLE:-wharf-tf-locks}"

aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
  --create-bucket-configuration "LocationConstraint=$REGION"
aws s3api put-bucket-versioning --bucket "$BUCKET" --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket "$BUCKET" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws dynamodb create-table --table-name "$TABLE" --region "$REGION" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST >/dev/null

# added: write the file the lesson's "terraform init -backend-config=backend.hcl" reads
cat > infra/backend.hcl <<EOF
bucket         = "$BUCKET"
region         = "$REGION"
dynamodb_table = "$TABLE"
EOF
echo "state bucket: $BUCKET   lock table: $TABLE   (wrote infra/backend.hcl)"
echo "Next:  cd infra && terraform init -backend-config=backend.hcl"
