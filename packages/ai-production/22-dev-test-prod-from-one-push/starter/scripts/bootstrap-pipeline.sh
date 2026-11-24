#!/usr/bin/env bash
# Once per account: let GitHub sign in without stored keys (OIDC), via the role "wharf-pipeline".
# Usage:   GITHUB_REPO=your-org/your-repo bash scripts/bootstrap-pipeline.sh
set -euo pipefail
cd "$(dirname "$0")/.."

: "${GITHUB_REPO:?set GITHUB_REPO, for example wharf-it/twin (exactly as GitHub spells it)}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
PROVIDER_ARN="arn:aws:iam::$ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"

# 1. trust tokens from GitHub (skip if the provider already exists)
if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$PROVIDER_ARN" >/dev/null 2>&1; then
  aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com >/dev/null \
  || { echo "If your command line asks for a thumbprint, add the provider in the console instead."; exit 1; }
fi

# 2. the pipeline role: trust policy names ONE repository
TRUST=$(mktemp); POLICY=$(mktemp)
trap 'rm -f "$TRUST" "$POLICY"' EXIT
sed -e "s/__ACCOUNT_ID__/$ACCOUNT_ID/g" -e "s#__REPO__#$GITHUB_REPO#g" iam/pipeline-trust-policy.json > "$TRUST"
sed -e "s/__ACCOUNT_ID__/$ACCOUNT_ID/g" iam/pipeline-policy.json > "$POLICY"
aws iam create-role --role-name wharf-pipeline --assume-role-policy-document "file://$TRUST" >/dev/null
aws iam put-role-policy --role-name wharf-pipeline --policy-name pipeline --policy-document "file://$POLICY"

echo "role ready: arn:aws:iam::$ACCOUNT_ID:role/wharf-pipeline"
echo "Next: bash scripts/set-github-config.sh"
