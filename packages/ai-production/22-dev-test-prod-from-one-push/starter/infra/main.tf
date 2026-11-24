# One set of files, three environments. Every name carries the environment and the account id.
data "aws_caller_identity" "me" {}

locals {
  prefix = "wharf-twin-${var.environment}"
  suffix = data.aws_caller_identity.me.account_id
  # TODO 1: model_id = the entry of var.model_ids for this environment (a map lookup)
}

# TODO 2: two buckets (memory and site), named "${local.prefix}-memory-${local.suffix}" and "...-site-...".
#         Set force_destroy for dev and test only. Block all public access on both.

# TODO 3: the function's role (trusted service: lambda.amazonaws.com), with
#         - AWSLambdaBasicExecutionRole attached (logs)
#         - an inline policy: get/put objects in the memory bucket, list the bucket,
#           and bedrock:InvokeModel for the amazon.nova-* models and inference profiles

# TODO 4: a log group "/aws/lambda/<function name>" with a short retention (14 days)

# TODO 5: aws_lambda_function "twin": handler server.handler, runtime python3.12,
#         filename ../backend/twin.zip with source_code_hash, timeout 30, memory 512,
#         environment MODEL_ID, MEMORY_BUCKET and USE_BUCKET = "true"

# TODO 6: the HTTP API gateway: api (CORS for your CDN address, POST and OPTIONS), an AWS_PROXY
#         integration (payload format 2.0), a "$default" route, a "$default" stage with auto_deploy,
#         and a permission that lets apigateway.amazonaws.com invoke the function

# TODO 7: the CDN: an origin access control, a distribution with default_root_object index.html,
#         and a site-bucket policy that lets ONLY that distribution read the objects

# Hint: build and test one piece at a time with  terraform plan -var="environment=dev"
