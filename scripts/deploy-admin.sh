#!/bin/bash
set -e

# DayMatch Admin Dashboard Deployment Script
# Usage: ./scripts/deploy-admin.sh [bucket-name]

S3_BUCKET=${1:-daymatch-admin}
AWS_REGION=${AWS_REGION:-ap-northeast-2}
CLOUDFRONT_DISTRIBUTION_ID=${CLOUDFRONT_DISTRIBUTION_ID:-}

echo "🖥️  DayMatch Admin 대시보드 배포 시작"
echo "S3 버킷: $S3_BUCKET"
echo ""

cd admin

# 1. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 2. 프로덕션 빌드
echo "🔨 프로덕션 빌드 중..."
npm run build

# 3. S3에 업로드
echo "📤 S3에 업로드 중..."
aws s3 sync dist/ s3://$S3_BUCKET/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --region $AWS_REGION

# HTML 파일은 캐시하지 않음
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html" \
  --region $AWS_REGION

# 4. CloudFront 캐시 무효화 (설정된 경우)
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "🔄 CloudFront 캐시 무효화 중..."
  aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*"
fi

echo ""
echo "✅ Admin 대시보드 배포 완료!"
echo "URL: https://$S3_BUCKET.s3.$AWS_REGION.amazonaws.com/index.html"
