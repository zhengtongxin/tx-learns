#!/usr/bin/env bash
# Helps you FIND what to delete. Listing only: this script must delete nothing.
set -uo pipefail
REGION="${AWS_REGION:-ap-southeast-1}"

# TODO: print four lists, each with a heading, using the AWS CLI in $REGION:
#   1. container image repositories     (aws ecr describe-repositories)
#   2. roles whose name contains AgentCore (aws iam list-roles with a --query filter)
#   3. log groups under /aws/bedrock-agentcore (aws logs describe-log-groups)
#   4. build projects (aws codebuild list-projects)
echo "TODO: finish this script"
exit 1
