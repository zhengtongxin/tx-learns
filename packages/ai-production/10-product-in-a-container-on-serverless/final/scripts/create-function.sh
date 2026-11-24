#!/usr/bin/env bash
# Step 4 of the lesson, as commands instead of console clicks (added: the lesson used the console).
# Creates the role, the function from your pushed image, and the streaming function URL.
# Reads OPENAI_API_KEY, CLERK_SECRET_KEY, CLERK_JWKS_URL (and optional ALLOWED_ORIGINS) from ./.env
# Run from the folder that holds .env:   scripts/create-function.sh
set -euo pipefail

REGION="${REGION:-ap-southeast-1}"
NAME="${NAME:-canteen-helper}"
ENV_FILE="${ENV_FILE:-.env}"
ROLE_NAME="$NAME-role"

[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE (copy env.example to .env first)"; exit 1; }

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGISTRY="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# 1. A basic role: lets the function run and write its logs, nothing else.
aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]
}' >/dev/null
aws iam attach-role-policy --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
sleep 10   # a new role needs a few seconds to be usable

# 2. The environment variables, written to a private temp file so keys never show in "ps".
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
chmod 600 "$TMP"
ENV_FILE="$ENV_FILE" python3 - > "$TMP" <<'PY'
import json, os
keep = {"OPENAI_API_KEY", "CLERK_SECRET_KEY", "CLERK_JWKS_URL", "ALLOWED_ORIGINS"}
values = {}
for line in open(os.environ["ENV_FILE"], encoding="utf-8"):
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, _, value = line.partition("=")
    if key.strip() in keep:
        values[key.strip()] = value.strip()
print(json.dumps({"Variables": values}))
PY

# 3. The function, from the image. 512 MB and a 60 s timeout, as in the lesson.
aws lambda create-function --function-name "$NAME" --region "$REGION" \
  --package-type Image --code "ImageUri=$REGISTRY/$NAME:latest" \
  --role "arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME" \
  --architectures x86_64 --memory-size 512 --timeout 60 \
  --environment "file://$TMP" >/dev/null
aws lambda wait function-active-v2 --function-name "$NAME" --region "$REGION"

# 4. The function URL: no extra gateway, streaming on, the app does its own sign-in check.
aws lambda create-function-url-config --function-name "$NAME" --region "$REGION" \
  --auth-type NONE --invoke-mode RESPONSE_STREAM >/dev/null
# A public function URL also needs these two permissions (newer accounts need both).
aws lambda add-permission --function-name "$NAME" --region "$REGION" \
  --statement-id function-url-public --action lambda:InvokeFunctionUrl \
  --principal "*" --function-url-auth-type NONE >/dev/null
aws lambda add-permission --function-name "$NAME" --region "$REGION" \
  --statement-id function-url-invoke --action lambda:InvokeFunction \
  --principal "*" --invoked-via-function-url >/dev/null

echo "Function URL:"
aws lambda get-function-url-config --function-name "$NAME" --region "$REGION" \
  --query FunctionUrl --output text
echo "Now add that address to your sign-in service's allowed addresses."
