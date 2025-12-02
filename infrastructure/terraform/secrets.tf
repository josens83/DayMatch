# DayMatch Secrets Manager Configuration

# Main application secrets
resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "${var.app_name}/${var.environment}/secrets"
  description = "DayMatch application secrets"

  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = {
    Name        = "${var.app_name}-secrets"
    Environment = var.environment
  }
}

# Initial secret values (placeholder - update via AWS Console or CLI)
resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    DATABASE_USER        = var.db_username
    DATABASE_PASSWORD    = var.db_password
    JWT_SECRET           = var.jwt_secret
    JWT_REFRESH_SECRET   = var.jwt_refresh_secret
    TOSS_CLIENT_KEY      = var.toss_client_key
    TOSS_SECRET_KEY      = var.toss_secret_key
    FIREBASE_PROJECT_ID  = var.firebase_project_id
    FIREBASE_PRIVATE_KEY = var.firebase_private_key
    FIREBASE_CLIENT_EMAIL = var.firebase_client_email
    SMS_API_KEY          = var.sms_api_key
    SMS_API_SECRET       = var.sms_api_secret
  })

  lifecycle {
    ignore_changes = [secret_string]  # Don't overwrite manual changes
  }
}

# Variables for secrets (sensitive)
variable "db_username" {
  description = "Database username"
  type        = string
  default     = "daymatch"
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
  default     = "change-me-in-production"
}

variable "jwt_refresh_secret" {
  description = "JWT refresh token secret"
  type        = string
  sensitive   = true
  default     = "change-me-in-production-refresh"
}

variable "toss_client_key" {
  description = "Toss Payments client key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "toss_secret_key" {
  description = "Toss Payments secret key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "firebase_project_id" {
  description = "Firebase project ID"
  type        = string
  default     = ""
}

variable "firebase_private_key" {
  description = "Firebase private key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "firebase_client_email" {
  description = "Firebase client email"
  type        = string
  default     = ""
}

variable "sms_api_key" {
  description = "SMS service API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sms_api_secret" {
  description = "SMS service API secret"
  type        = string
  sensitive   = true
  default     = ""
}

# Output
output "secrets_arn" {
  value = aws_secretsmanager_secret.app_secrets.arn
}
