terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  # Shared state: the bucket and lock table are made once by scripts/bootstrap-state.sh.
  # The bucket name, region and lock table come from backend.hcl (or the pipeline's flags).
  backend "s3" {
    key     = "twin/terraform.tfstate"
    encrypt = true
  }
}

provider "aws" {
  region = var.region
}
