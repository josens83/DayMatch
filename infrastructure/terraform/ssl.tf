# DayMatch SSL/TLS Configuration
# Note: DNS validation requires Route53 hosted zone or manual validation

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "daymatch.kr"
}

variable "create_certificate" {
  description = "Whether to create ACM certificate"
  type        = bool
  default     = false  # Set to true when domain is ready
}

# ACM Certificate
resource "aws_acm_certificate" "main" {
  count             = var.create_certificate ? 1 : 0
  domain_name       = "api.${var.domain_name}"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.app_name}-certificate"
  }
}

# Route53 Zone (if managing DNS in AWS)
variable "create_route53_zone" {
  description = "Whether to create Route53 hosted zone"
  type        = bool
  default     = false
}

resource "aws_route53_zone" "main" {
  count = var.create_route53_zone ? 1 : 0
  name  = var.domain_name
}

# DNS records for certificate validation
resource "aws_route53_record" "cert_validation" {
  for_each = var.create_certificate && var.create_route53_zone ? {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main[0].zone_id
}

# Certificate validation
resource "aws_acm_certificate_validation" "main" {
  count                   = var.create_certificate && var.create_route53_zone ? 1 : 0
  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Route53 A Record for API
resource "aws_route53_record" "api" {
  count   = var.create_route53_zone ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.api.dns_name
    zone_id                = aws_lb.api.zone_id
    evaluate_target_health = true
  }
}

# Outputs
output "certificate_arn" {
  value = var.create_certificate ? aws_acm_certificate.main[0].arn : ""
}

output "certificate_status" {
  value = var.create_certificate ? aws_acm_certificate.main[0].status : "not_created"
}

output "route53_nameservers" {
  value = var.create_route53_zone ? aws_route53_zone.main[0].name_servers : []
}
