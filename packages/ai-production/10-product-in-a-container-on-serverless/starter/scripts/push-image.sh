#!/usr/bin/env bash
# Run from the folder that holds the Dockerfile:   scripts/push-image.sh
set -euo pipefail

REGION="${REGION:-ap-southeast-1}"
NAME="${NAME:-canteen-helper}"

# TODO 1: ACCOUNT_ID from:  aws sts get-caller-identity --query Account --output text
# TODO 2: REGISTRY = ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com
# TODO 3: docker build for linux/amd64 (add --provenance=false), tagged with NAME
# TODO 4: aws ecr create-repository (skip the error if it already exists)
# TODO 5: aws ecr get-login-password | docker login --username AWS --password-stdin REGISTRY
# TODO 6: docker tag, then docker push  REGISTRY/NAME:latest
# Hint: --password-stdin passes the token in without typing it into the command.
echo "TODO: finish this script"
exit 1
