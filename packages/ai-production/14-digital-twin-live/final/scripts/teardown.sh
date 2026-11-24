#!/usr/bin/env bash
# Step 6 of the project: the clean-up plan, in the order the lesson gives.
# THIS DELETES THINGS FOR GOOD. The CDN and the site bucket are deleted in the console / by hand
# first (see README): disable the CDN, wait, delete it, then empty and delete the site bucket.
set -uo pipefail   # no -e: keep going if one thing is already gone

REGION="${REGION:-ap-southeast-1}"
NAME="${NAME:-wharf-twin}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
MEMORY_BUCKET="$NAME-memory-$ACCOUNT_ID"
ROLE_NAME="$NAME-role"

read -r -p "Delete the API, function, role and memory bucket named $NAME in $REGION? (yes/no) " ok
[ "$ok" = "yes" ] || exit 1

# gateway first (it points at the function)
for id in $(aws apigatewayv2 get-apis --region "$REGION" --query "Items[?Name=='$NAME'].ApiId" --output text); do
  aws apigatewayv2 delete-api --api-id "$id" --region "$REGION"
done
aws lambda delete-function --function-name "$NAME" --region "$REGION"
aws logs delete-log-group --log-group-name "/aws/lambda/$NAME" --region "$REGION"
# the role's policies come off before the role goes
aws iam delete-role-policy --role-name "$ROLE_NAME" --policy-name memory-bucket
aws iam detach-role-policy --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name "$ROLE_NAME"
# a bucket must be empty before it can be deleted
aws s3 rm "s3://$MEMORY_BUCKET" --recursive
aws s3api delete-bucket --bucket "$MEMORY_BUCKET" --region "$REGION"

echo "Check what is left (each should print nothing or []):"
aws lambda list-functions --region "$REGION" --query "Functions[?FunctionName=='$NAME'].FunctionName"
aws s3 ls | grep "$NAME" || true
