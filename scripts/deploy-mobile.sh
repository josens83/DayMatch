#!/bin/bash
set -e

# DayMatch Mobile Deployment Script
# Usage: ./scripts/deploy-mobile.sh [profile] [platform]

PROFILE=${1:-preview}
PLATFORM=${2:-all}

echo "📱 DayMatch Mobile 빌드 시작"
echo "프로필: $PROFILE"
echo "플랫폼: $PLATFORM"
echo ""

cd mobile

# 1. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 2. 환경변수 확인
if [ ! -f .env ]; then
  echo "⚠️  .env 파일이 없습니다. .env.example에서 복사합니다."
  cp .env.example .env
  echo "📝 .env 파일을 편집하여 실제 값을 입력하세요."
  exit 1
fi

# 3. EAS 빌드
echo "🔨 EAS 빌드 시작..."
case $PLATFORM in
  ios)
    eas build --profile $PROFILE --platform ios --non-interactive
    ;;
  android)
    eas build --profile $PROFILE --platform android --non-interactive
    ;;
  all)
    eas build --profile $PROFILE --platform all --non-interactive
    ;;
  *)
    echo "❌ 알 수 없는 플랫폼: $PLATFORM"
    echo "사용법: ./deploy-mobile.sh [profile] [ios|android|all]"
    exit 1
    ;;
esac

echo ""
echo "✅ Mobile 빌드 완료!"
echo ""
echo "📥 빌드 다운로드:"
echo "   eas build:list"
echo ""
echo "📤 스토어 제출:"
echo "   eas submit --platform ios"
echo "   eas submit --platform android"
