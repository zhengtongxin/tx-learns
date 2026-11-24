#!/usr/bin/env bash
# destroy.sh <dev|test|prod>
# Empties the buckets, then destroys. If a stale lock blocks it, asks a human before unlocking.
set -euo pipefail
ENV="${1:?usage: ./destroy.sh dev|test|prod}"

# added: the function resource reads backend/twin.zip even while destroying, so make sure one exists
bash scripts/ensure-zip.sh

cd infra
terraform workspace select "$ENV"
echo "workspace: $(terraform workspace show)"

for name in site_bucket memory_bucket; do
  aws s3 rm "s3://$(terraform output -raw "$name")" --recursive    # a bucket with files will not delete
done

if out=$(terraform destroy -auto-approve -lock-timeout=30s -var="environment=$ENV" 2>&1); then
  echo "$out"; exit 0
fi
echo "$out"
if echo "$out" | grep -q "Error acquiring the state lock"; then
  id=$(echo "$out" | awk '/^ *ID:/ {print $2; exit}')
  read -r -p "Lock $id is held. Is nobody really running Terraform on $ENV? (yes/no) " ok
  [ "$ok" = "yes" ] || exit 1
  terraform force-unlock -force "$id"
  terraform destroy -auto-approve -var="environment=$ENV"
else
  exit 1
fi
