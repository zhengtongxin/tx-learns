#!/usr/bin/env bash
# added: make sure backend/twin.zip exists so "terraform plan -destroy" and "terraform destroy" can read it.
# If a real zip is already there, leave it alone. Run from the project folder.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f backend/twin.zip ]; then
  python3 -c "import zipfile; zipfile.ZipFile('backend/twin.zip', 'w').writestr('placeholder.txt', 'only used to destroy')"
  echo "made a placeholder backend/twin.zip"
fi
