#!/usr/bin/env bash
# Delete what you made. THIS DELETES THINGS FOR GOOD.
set -uo pipefail

REGION="${REGION:-ap-southeast-1}"
NAME="${NAME:-canteen-helper}"

# TODO 1: ask "are you sure?" and stop unless the answer is yes
# TODO 2: delete the function, the image repository (with --force) and the log group /aws/lambda/NAME
# TODO 3: detach the policy from the role, then delete the role
# TODO 4: list what is left so you can prove the account is clean
echo "TODO: finish this script"
exit 1
