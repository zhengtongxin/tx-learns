output "site_bucket" {
  value = aws_s3_bucket.site.bucket
}

output "memory_bucket" {
  value = aws_s3_bucket.memory.bucket
}

output "site_url" {
  value = "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "api_url" {
  value = aws_apigatewayv2_api.twin.api_endpoint
}

# the pipeline clears the CDN's cache with this id (project step 4)
output "cdn_id" {
  value = aws_cloudfront_distribution.site.id
}
