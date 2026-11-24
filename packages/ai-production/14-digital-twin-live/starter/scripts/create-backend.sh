#!/usr/bin/env bash
# Memory bucket, role, function and API gateway, wired back to front.   Run from the starter/ folder.
set -euo pipefail
cd "$(dirname "$0")/.."

REGION="${REGION:-ap-southeast-1}"
NAME="${NAME:-wharf-twin}"

# TODO 1: ACCOUNT_ID from aws sts get-caller-identity; MEMORY_BUCKET="$NAME-memory-$ACCOUNT_ID"
#         (bucket names are shared by everyone, so the account id keeps yours unique)
# TODO 2: create the bucket (aws s3api create-bucket with a LocationConstraint) and block public access
# TODO 3: create the role from iam/trust-policy.json, attach AWSLambdaBasicExecutionRole,
#         and add iam/memory-policy.json as an inline policy (replace __MEMORY_BUCKET__ first)
# TODO 4: create the function from backend/twin.zip (runtime python3.12, handler server.handler,
#         env: OPENAI_API_KEY, USE_BUCKET=true, MEMORY_BUCKET). Do not put keys on the command line.
# TODO 5: aws apigatewayv2 create-api (HTTP) with the function as --target and CORS for POST/OPTIONS,
#         then allow apigateway.amazonaws.com to invoke the function (aws lambda add-permission)
# TODO 6: print the API address and a curl line to test it
echo "TODO: finish this script"
exit 1
