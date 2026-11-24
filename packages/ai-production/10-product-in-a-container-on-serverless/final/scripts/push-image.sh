#!/usr/bin/env bash
# Step 2 and 3 of the lesson: build for the cloud's chip type, then push to your registry.
# Run from the folder that holds the Dockerfile:   scripts/push-image.sh
set -euo pipefail

REGION="${REGION:-ap-southeast-1}"
NAME="${NAME:-canteen-helper}"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGISTRY="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Build for the platform you deploy to. --provenance=false is added: newer Docker adds
# extra metadata that the function service refuses ("image manifest ... not supported").
docker build --platform linux/amd64 --provenance=false -t "$NAME" .

# One repository per app (added: skip the error if it already exists)
aws ecr describe-repositories --repository-names "$NAME" --region "$REGION" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "$NAME" --region "$REGION"

# Log in with a temporary token (it expires, which is the point)
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"

docker tag "$NAME:latest" "$REGISTRY/$NAME:latest"
docker push "$REGISTRY/$NAME:latest"
echo "pushed $REGISTRY/$NAME:latest"
