#!/usr/bin/env bash
# Creates the role, the function from your pushed image, and the streaming function URL.
# Run from the folder that holds .env:   scripts/create-function.sh
set -euo pipefail

REGION="${REGION:-ap-southeast-1}"
NAME="${NAME:-canteen-helper}"

# TODO 1: aws iam create-role for the function (trusted service: lambda.amazonaws.com) and
#         attach the managed policy AWSLambdaBasicExecutionRole (so it can write logs)
# TODO 2: turn the keys in .env (OPENAI_API_KEY, CLERK_SECRET_KEY, CLERK_JWKS_URL) into the
#         --environment value. Hint: never put keys directly on the command line.
# TODO 3: aws lambda create-function --package-type Image, memory 512, timeout 60 (not the default)
# TODO 4: aws lambda create-function-url-config with --auth-type NONE and --invoke-mode RESPONSE_STREAM
# TODO 5: add the two public permissions the function URL needs, then print the URL
echo "TODO: finish this script"
exit 1
