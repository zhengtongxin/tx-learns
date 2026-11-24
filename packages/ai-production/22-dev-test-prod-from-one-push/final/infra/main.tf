# One set of files, three environments. Every name carries the environment and the account id.
data "aws_caller_identity" "me" {}

locals {
  prefix   = "wharf-twin-${var.environment}"
  suffix   = data.aws_caller_identity.me.account_id
  model_id = var.model_ids[var.environment]
}

# ---- buckets ---------------------------------------------------------------

resource "aws_s3_bucket" "memory" {
  bucket        = "${local.prefix}-memory-${local.suffix}"
  force_destroy = var.environment != "prod" # lets dev and test be emptied by destroy itself
}

resource "aws_s3_bucket" "site" {
  bucket        = "${local.prefix}-site-${local.suffix}"
  force_destroy = var.environment != "prod"
}

# added: both buckets stay private; the CDN is the only reader of the site bucket
resource "aws_s3_bucket_public_access_block" "memory" {
  bucket                  = aws_s3_bucket.memory.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---- function role ---------------------------------------------------------

resource "aws_iam_role" "twin" {
  name = "${local.prefix}-twin-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# added: the lesson said "attach the permissions from earlier lessons". Here they are.
resource "aws_iam_role_policy_attachment" "logs" {
  role       = aws_iam_role.twin.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "twin" {
  name = "memory-and-model"
  role = aws_iam_role.twin.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = "${aws_s3_bucket.memory.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.memory.arn
      },
      {
        Effect = "Allow"
        Action = "bedrock:InvokeModel"
        Resource = [
          "arn:aws:bedrock:*::foundation-model/amazon.nova-*",
          "arn:aws:bedrock:*:*:inference-profile/*.amazon.nova-*"
        ]
      }
    ]
  })
}

# ---- function --------------------------------------------------------------

# added: own log group with a short retention, so destroy removes it and old logs do not pile up
resource "aws_cloudwatch_log_group" "twin" {
  name              = "/aws/lambda/${local.prefix}-twin"
  retention_in_days = 14
}

resource "aws_lambda_function" "twin" {
  function_name    = "${local.prefix}-twin"
  role             = aws_iam_role.twin.arn
  handler          = "server.handler"
  runtime          = "python3.12"
  filename         = "${path.module}/../backend/twin.zip"
  source_code_hash = filebase64sha256("${path.module}/../backend/twin.zip")
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      MODEL_ID      = local.model_id
      MEMORY_BUCKET = aws_s3_bucket.memory.bucket
      USE_BUCKET    = "true" # added: tells the code to keep memory in the bucket
    }
  }

  depends_on = [aws_cloudwatch_log_group.twin, aws_iam_role_policy_attachment.logs]
}

# ---- API gateway (the lesson's outputs mention it; written out here) -------

resource "aws_apigatewayv2_api" "twin" {
  name          = "${local.prefix}-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["https://${aws_cloudfront_distribution.site.domain_name}"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

resource "aws_apigatewayv2_integration" "twin" {
  api_id                 = aws_apigatewayv2_api.twin.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.twin.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "twin" {
  api_id    = aws_apigatewayv2_api.twin.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.twin.id}"
}

resource "aws_apigatewayv2_stage" "twin" {
  api_id      = aws_apigatewayv2_api.twin.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "gateway" {
  statement_id  = "AllowGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.twin.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.twin.execution_arn}/*/*"
}

# ---- CDN in front of the site bucket ---------------------------------------

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${local.prefix}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "site"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "site"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # the cloud's managed "caching optimized" policy
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

data "aws_iam_policy_document" "site" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket     = aws_s3_bucket.site.id
  policy     = data.aws_iam_policy_document.site.json
  depends_on = [aws_s3_bucket_public_access_block.site]
}
