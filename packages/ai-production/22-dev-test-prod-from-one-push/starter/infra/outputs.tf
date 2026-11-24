# deploy.sh and destroy.sh read these five names. Add one output block for each, pointing at
# the matching resource from main.tf:
#   site_bucket    the site bucket's name
#   memory_bucket  the memory bucket's name
#   site_url       "https://" + the CDN's domain name
#   api_url        the API gateway's endpoint
#   cdn_id         the CDN distribution's id (used to clear its cache after an upload)
# TODO: write them. Example shape:
# output "site_bucket" {
#   value = ...
# }
