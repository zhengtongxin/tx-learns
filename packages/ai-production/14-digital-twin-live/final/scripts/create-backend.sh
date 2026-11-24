#!/usr/bin/env bash
# Steps 2 and 3 of the project: memory bucket, role, function and API gateway, back to front.
# added: the lesson used the console for these. This script does the same with commands.
# Needs: backend/twin.zip (scripts/package.sh) and OPENAI_API_KEY in your shell.
# ALLOWED_ORIGIN defaults to * for the first test. After the CDN exists, tighten it:
#   aws apigatewayv2 update-api --api-id API_ID --cors-configuration AllowOrigins=https://YOUR-CDN-ADDRESS,AllowMethods=POST,OPTIONS,AllowHeaders=content-type
set -euo pipefail
cd "$(dirname "$0")/.."

REGION="${REGION:-ap-southeast-1}"
NAME="${NAME:-wharf-twin}"
ALLOWED_ORIGIN="${ALLOWED_ORIGIN:-*}"
: "${OPENAI_API_KEY:?set OPENAI_API_KEY first (see env.example)}"
[ -f backend/twin.zip ] || { echo "build the zip first: bash scripts/package.sh"; exit 1; }

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
MEMORY_BUCKET="$NAME-memory-$ACCOUNT_ID"   # bucket names are shared by everyone, so add the account id
ROLE_NAME="$NAME-role"

echo "1/5 memory bucket: $MEMORY_BUCKET"
aws s3api create-bucket --bucket "$MEMORY_BUCKET" --region "$REGION" \
  --create-bucket-configuration "LocationConstraint=$REGION" >/dev/null
aws s3api put-public-access-block --bucket "$MEMORY_BUCKET" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "2/5 role with least privilege (this bucket only, plus logs)"
aws iam create-role --role-name "$ROLE_NAME" \
  --assume-role-policy-document file://iam/trust-policy.json >/dev/null
aws iam attach-role-policy --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
POLICY=$(mktemp)
ENVFILE=$(mktemp)
chmod 600 "$ENVFILE"
trap 'rm -f "$POLICY" "$ENVFILE"' EXIT
sed "s/__MEMORY_BUCKET__/$MEMORY_BUCKET/g" iam/memory-policy.json > "$POLICY"
aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name memory-bucket \
  --policy-document "file://$POLICY"
sleep 10   # a new role needs a few seconds before the function can use it

echo "3/5 function"
MEMORY_BUCKET="$MEMORY_BUCKET" python3 - > "$ENVFILE" <<'PY'
import json, os
print(json.dumps({"Variables": {
    "OPENAI_API_KEY": os.environ["OPENAI_API_KEY"],
    "USE_BUCKET": "true",
    "MEMORY_BUCKET": os.environ["MEMORY_BUCKET"],
}}))
PY
aws lambda create-function --function-name "$NAME" --region "$REGION" \
  --runtime python3.12 --handler server.handler \
  --zip-file fileb://backend/twin.zip \
  --role "arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME" \
  --timeout 30 --memory-size 512 \
  --environment "file://$ENVFILE" >/dev/null
aws lambda wait function-active-v2 --function-name "$NAME" --region "$REGION"
FN_ARN=$(aws lambda get-function --function-name "$NAME" --region "$REGION" --query Configuration.FunctionArn --output text)

echo "4/5 API gateway in front of the function"
API_ID=$(aws apigatewayv2 create-api --name "$NAME" --protocol-type HTTP --region "$REGION" \
  --target "$FN_ARN" \
  --cors-configuration "AllowOrigins=$ALLOWED_ORIGIN,AllowMethods=POST,OPTIONS,AllowHeaders=content-type" \
  --query ApiId --output text)

echo "5/5 let the gateway call the function"
aws lambda add-permission --function-name "$NAME" --region "$REGION" \
  --statement-id apigw-invoke --action lambda:InvokeFunction --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" >/dev/null

API="https://$API_ID.execute-api.$REGION.amazonaws.com"
echo
echo "Done. Test it by itself, before any page exists:"
echo "  curl -s -X POST \"$API/api/chat\" -H \"Content-Type: application/json\" \\"
echo "    -d '{\"session_id\": \"test-1\", \"message\": \"Hi, what do you work on?\"}'"
echo "Expect {\"reply\": ...} and a new object test-1.json in $MEMORY_BUCKET."
echo "API address: $API"
