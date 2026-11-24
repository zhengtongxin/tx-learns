#!/usr/bin/env bash
# destroy.sh <dev|test|prod>
set -euo pipefail
ENV="${1:?usage: ./destroy.sh dev|test|prod}"

# TODO 1: run scripts/ensure-zip.sh (the function resource reads backend/twin.zip even when destroying)
# TODO 2: cd infra, select the workspace, print it
# TODO 3: empty the site and memory buckets (aws s3 rm ... --recursive); a bucket with files will not delete
# TODO 4: terraform destroy -auto-approve with -lock-timeout=30s
# TODO 5 (stretch): if it fails with "Error acquiring the state lock", take the lock ID from the
#         message, ASK a human "is nobody really running Terraform?", and only on "yes" run
#         terraform force-unlock -force <id> and try again. Never unlock silently.
echo "TODO: finish destroy.sh"
exit 1
