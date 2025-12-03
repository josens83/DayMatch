#!/bin/bash
set -e

# DayMatch Backend Deployment Script
# Usage: ./scripts/deploy-backend.sh [environment]

ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-ap-northeast-2}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/daymatch-backend"
ECS_CLUSTER="daymatch-cluster"
ECS_SERVICE="daymatch-service"

echo "🚀 DayMatch Backend 배포 시작"
echo "환경: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo ""

# 1. ECR 로그인
echo "📦 ECR 로그인 중..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# 2. Docker 이미지 빌드
echo "🔨 Docker 이미지 빌드 중..."
cd backend
docker build -t daymatch-backend:$ENVIRONMENT .

# 3. 이미지 태그
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker tag daymatch-backend:$ENVIRONMENT $ECR_REPO:$ENVIRONMENT
docker tag daymatch-backend:$ENVIRONMENT $ECR_REPO:$ENVIRONMENT-$TIMESTAMP

# 4. 이미지 푸시
echo "📤 ECR에 이미지 푸시 중..."
docker push $ECR_REPO:$ENVIRONMENT
docker push $ECR_REPO:$ENVIRONMENT-$TIMESTAMP

# 5. ECS 서비스 업데이트
echo "🔄 ECS 서비스 업데이트 중..."
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION

# 6. 배포 완료 대기
echo "⏳ 배포 완료 대기 중..."
aws ecs wait services-stable \
  --cluster $ECS_CLUSTER \
  --services $ECS_SERVICE \
  --region $AWS_REGION

echo ""
echo "✅ Backend 배포 완료!"
echo "이미지: $ECR_REPO:$ENVIRONMENT-$TIMESTAMP"
