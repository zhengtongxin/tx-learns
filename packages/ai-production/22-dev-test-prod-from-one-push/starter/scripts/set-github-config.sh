#!/usr/bin/env bash
# Once per repository: secrets, variables and the three environments (prod needs a reviewer).
# Needs the GitHub command line (gh) signed in with permission to admin the repository.
# Usage:   GITHUB_REPO=your-org/your-repo bash scripts/set-github-config.sh
set -euo pipefail

: "${GITHUB_REPO:?set GITHUB_REPO, for example wharf-it/twin}"
REGION="${REGION:-ap-southeast-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
STATE_BUCKET="${STATE_BUCKET:-wharf-tf-state-$ACCOUNT_ID}"

# printf %s: no stray space or newline sneaks into the value
printf %s "$ACCOUNT_ID"   | gh secret set AWS_ACCOUNT_ID --repo "$GITHUB_REPO"
printf %s "$STATE_BUCKET" | gh secret set STATE_BUCKET   --repo "$GITHUB_REPO"
printf %s "$REGION"       | gh variable set AWS_REGION   --repo "$GITHUB_REPO"

# environments: dev and test open; prod waits for you (you are the required reviewer)
MY_ID=$(gh api user --jq .id)
gh api -X PUT "repos/$GITHUB_REPO/environments/dev"  >/dev/null
gh api -X PUT "repos/$GITHUB_REPO/environments/test" >/dev/null
echo "{\"reviewers\":[{\"type\":\"User\",\"id\":$MY_ID}]}" \
  | gh api -X PUT "repos/$GITHUB_REPO/environments/prod" --input - >/dev/null
echo "configured $GITHUB_REPO: 3 environments, prod needs your approval."
echo "Required reviewers on a private repo may need a paid GitHub plan: check the repository settings."
