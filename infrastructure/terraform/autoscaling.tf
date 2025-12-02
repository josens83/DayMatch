# DayMatch Auto Scaling Configuration

# Auto Scaling Target for ECS Service
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.environment == "production" ? 10 : 3
  min_capacity       = var.environment == "production" ? 2 : 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Scale Up Policy - CPU
resource "aws_appautoscaling_policy" "ecs_cpu_up" {
  name               = "${var.app_name}-cpu-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Scale Up Policy - Memory
resource "aws_appautoscaling_policy" "ecs_memory_up" {
  name               = "${var.app_name}-memory-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Scale based on ALB Request Count
resource "aws_appautoscaling_policy" "ecs_requests" {
  name               = "${var.app_name}-requests-scale"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.api.arn_suffix}/${aws_lb_target_group.api.arn_suffix}"
    }
    target_value       = 1000  # Target 1000 requests per target
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Scheduled Scaling - Scale up during business hours (Korea time)
resource "aws_appautoscaling_scheduled_action" "scale_up_morning" {
  count              = var.environment == "production" ? 1 : 0
  name               = "${var.app_name}-scale-up-morning"
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  schedule           = "cron(0 0 ? * MON-FRI *)"  # 09:00 KST (00:00 UTC)

  scalable_target_action {
    min_capacity = 3
    max_capacity = 10
  }
}

# Scheduled Scaling - Scale down at night
resource "aws_appautoscaling_scheduled_action" "scale_down_night" {
  count              = var.environment == "production" ? 1 : 0
  name               = "${var.app_name}-scale-down-night"
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  schedule           = "cron(0 14 ? * * *)"  # 23:00 KST (14:00 UTC)

  scalable_target_action {
    min_capacity = 2
    max_capacity = 5
  }
}
