#!/usr/bin/env bash
# Build backend/twin.zip, the function's code package.   Run from the final/ folder.
set -euo pipefail
cd "$(dirname "$0")/../backend"

rm -rf package twin.zip
# Install for the chip type the cloud uses, not your laptop's.
pip install --platform manylinux2014_x86_64 --python-version 3.12 --implementation cp \
  --target package --only-binary=:all: -r requirements.txt
# added: the function runtime already includes boto3, so leave it out to keep the zip small
rm -rf package/boto3 package/botocore package/s3transfer package/jmespath
cp ./*.py package/
cp -r data package/
( cd package && zip -qr ../twin.zip . )
echo "built backend/twin.zip ($(du -h twin.zip | cut -f1))"
