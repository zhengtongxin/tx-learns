#!/usr/bin/env bash
# Step 6 of the lesson: delete what you made. THIS DELETES THINGS FOR GOOD.
# Run it, then look in the console in every region you used.
set -uo pipefail   # no -e: keep going if one thing is already gone

REGION="${REGION:-ap-southeast-1}"
NAME="${NAME:-canteen-helper}"
ROLE_NAME="$NAME-role"

read -r -p "Delete function, image repository, logs and role named $NAME in $REGION? (yes/no) " ok
[ "$ok" = "yes" ] || exit 1

aws lambda delete-function --function-name "$NAME" --region "$REGION"
aws ecr delete-repository --repository-name "$NAME" --force --region "$REGION"
aws logs delete-log-group --log-group-name "/aws/lambda/$NAME" --region "$REGION"
# added: the role that create-function.sh made
aws iam detach-role-policy --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name "$ROLE_NAME"

echo "Check what is left (each should print nothing or []):"
aws lambda list-functions --region "$REGION" --query "Functions[?FunctionName=='$NAME'].FunctionName"
aws ecr describe-repositories --region "$REGION" --query "repositories[?repositoryName=='$NAME'].repositoryName" 2>/dev/null
