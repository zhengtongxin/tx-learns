#!/usr/bin/env bash
# The clean-up plan. THIS DELETES THINGS FOR GOOD.
set -uo pipefail

REGION="${REGION:-ap-southeast-1}"
NAME="${NAME:-wharf-twin}"

# TODO: delete in dependency order, then print what is left to prove it:
#   1. the CDN (console: disable, wait, delete)      2. the site bucket (empty it first)
#   3. the API gateway                               4. the function (and its log group)
#   5. the role (remove its policies first)          6. the memory bucket (empty it first)
# Hint: whatever points at something goes first.
echo "TODO: finish this script"
exit 1
