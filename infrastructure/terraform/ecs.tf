# DayMatch ECS Infrastructure
# Task Definition, Service, and IAM roles

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.app_name}-ecs-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Policy to access Secrets Manager
resource "aws_iam_role_policy" "ecs_secrets" {
  name = "${var.app_name}-ecs-secrets"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.app_secrets.arn
        ]
      }
    ]
  })
}

# IAM Role for ECS Task (application role)
resource "aws_iam_role" "ecs_task" {
  name = "${var.app_name}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# Policy for S3 access
resource "aws_iam_role_policy" "ecs_s3" {
  name = "${var.app_name}-ecs-s3"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:PutObjectAcl"
        ]
        Resource = [
          "${aws_s3_bucket.uploads.arn}/*"
        ]
      }
    ]
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.app_name}"
  retention_in_days = var.environment == "production" ? 30 : 7
}

# ECS Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.app_name}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.environment == "production" ? 512 : 256
  memory                   = var.environment == "production" ? 1024 : 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "${var.app_name}-api"
      image = "${aws_ecr_repository.api.repository_url}:latest"

      essential = true

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = "3000"
        },
        {
          name  = "DATABASE_HOST"
          value = aws_db_instance.main.address
        },
        {
          name  = "DATABASE_PORT"
          value = "5432"
        },
        {
          name  = "DATABASE_NAME"
          value = "daymatch"
        },
        {
          name  = "DATABASE_SSL"
          value = "true"
        },
        {
          name  = "REDIS_HOST"
          value = aws_elasticache_cluster.main.cache_nodes[0].address
        },
        {
          name  = "REDIS_PORT"
          value = "6379"
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "S3_BUCKET"
          value = aws_s3_bucket.uploads.id
        },
        {
          name  = "CLOUDFRONT_URL"
          value = "https://${aws_cloudfront_distribution.uploads.domain_name}"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_USER"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:DATABASE_USER::"
        },
        {
          name      = "DATABASE_PASSWORD"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:DATABASE_PASSWORD::"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:JWT_SECRET::"
        },
        {
          name      = "JWT_REFRESH_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:JWT_REFRESH_SECRET::"
        },
        {
          name      = "TOSS_CLIENT_KEY"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:TOSS_CLIENT_KEY::"
        },
        {
          name      = "TOSS_SECRET_KEY"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:TOSS_SECRET_KEY::"
        },
        {
          name      = "FIREBASE_PROJECT_ID"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:FIREBASE_PROJECT_ID::"
        },
        {
          name      = "FIREBASE_PRIVATE_KEY"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:FIREBASE_PRIVATE_KEY::"
        },
        {
          name      = "FIREBASE_CLIENT_EMAIL"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:FIREBASE_CLIENT_EMAIL::"
        },
        {
          name      = "SMS_API_KEY"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:SMS_API_KEY::"
        },
        {
          name      = "SMS_API_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:SMS_API_SECRET::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/health/live || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

# ECS Service
resource "aws_ecs_service" "api" {
  name            = "${var.app_name}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.environment == "production" ? 2 : 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "${var.app_name}-api"
    container_port   = 3000
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = var.environment == "production" ? 100 : 50
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.https]
}

# Outputs
output "ecs_service_name" {
  value = aws_ecs_service.api.name
}

output "task_definition_arn" {
  value = aws_ecs_task_definition.api.arn
}
