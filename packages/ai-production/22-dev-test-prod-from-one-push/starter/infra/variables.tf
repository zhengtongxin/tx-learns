variable "environment" {
  type        = string
  description = "dev, test or prod"
  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "environment must be dev, test or prod."
  }
}

# added: the lesson wrote the region straight into the provider; a variable keeps it in one place
variable "region" {
  type    = string
  default = "ap-southeast-1"
}

# a smaller, cheaper model in dev and a bigger one in prod
variable "model_ids" {
  type = map(string)
  default = {
    dev  = "apac.amazon.nova-micro-v1:0"
    test = "apac.amazon.nova-lite-v1:0"
    prod = "apac.amazon.nova-pro-v1:0"
  }
}
