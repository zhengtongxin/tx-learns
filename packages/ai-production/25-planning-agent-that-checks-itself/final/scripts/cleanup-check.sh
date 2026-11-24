#!/usr/bin/env bash
# added: step 6 helps you FIND what to delete. These commands only LIST things; they delete nothing.
# Run it before and after you remove the agent, and compare. Names vary a little by toolkit version.
# To delete: use the agent runtime's console page, or run "agentcore --help" and look for a
# destroy/delete command in your toolkit version; then delete the leftovers listed here.
set -uo pipefail
REGION="${AWS_REGION:-ap-southeast-1}"

echo "== container image repositories (look for one made by the toolkit) =="
aws ecr describe-repositories --region "$REGION" --query "repositories[].repositoryName" --output text

echo "== roles made for the agent (names usually contain AgentCore) =="
aws iam list-roles --query "Roles[?contains(RoleName, 'AgentCore')].RoleName" --output text

echo "== log groups (set a short retention, or delete) =="
aws logs describe-log-groups --region "$REGION" --log-group-name-prefix /aws/bedrock-agentcore \
  --query "logGroups[].logGroupName" --output text

echo "== build projects made by the toolkit =="
aws codebuild list-projects --region "$REGION" --query "projects" --output text

echo "Then open the console and check nothing is left in $REGION."
