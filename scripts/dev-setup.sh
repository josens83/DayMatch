#!/bin/bash
set -e

# DayMatch Local Development Setup Script
# Usage: ./scripts/dev-setup.sh

echo "🛠️  DayMatch 로컬 개발환경 설정"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_command() {
  if command -v $1 &> /dev/null; then
    echo -e "${GREEN}✓${NC} $1 설치됨"
    return 0
  else
    echo -e "${RED}✗${NC} $1 미설치"
    return 1
  fi
}

# 1. 필수 도구 확인
echo "📋 필수 도구 확인 중..."
echo ""

MISSING_TOOLS=()

check_command node || MISSING_TOOLS+=("node")
check_command npm || MISSING_TOOLS+=("npm")
check_command docker || MISSING_TOOLS+=("docker")
check_command docker-compose || MISSING_TOOLS+=("docker-compose")

echo ""

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
  echo -e "${YELLOW}⚠️  다음 도구를 먼저 설치하세요:${NC}"
  for tool in "${MISSING_TOOLS[@]}"; do
    echo "   - $tool"
  done
  echo ""
  echo "설치 후 다시 실행하세요."
  exit 1
fi

# 2. Docker 서비스 시작
echo "🐳 Docker 서비스 시작 중..."
docker-compose -f docker-compose.dev.yml up -d

# Docker 컨테이너가 준비될 때까지 대기
echo "⏳ 데이터베이스 준비 대기 중..."
sleep 5

# 3. Backend 설정
echo ""
echo "📦 Backend 의존성 설치 중..."
cd backend

if [ ! -f .env ]; then
  echo "📝 Backend .env 파일 생성 중..."
  cp .env.example .env
fi

npm install

echo "🔄 데이터베이스 마이그레이션 실행 중..."
npm run build
npm run migration:run 2>/dev/null || echo "마이그레이션 스킵 (이미 적용됨)"

cd ..

# 4. Mobile 설정
echo ""
echo "📱 Mobile 의존성 설치 중..."
cd mobile

if [ ! -f .env ]; then
  echo "📝 Mobile .env 파일 생성 중..."
  cp .env.example .env
fi

npm install
cd ..

# 5. Admin 설정
echo ""
echo "🖥️  Admin 의존성 설치 중..."
cd admin
npm install
cd ..

echo ""
echo "=========================================="
echo -e "${GREEN}✅ 개발환경 설정 완료!${NC}"
echo "=========================================="
echo ""
echo "🚀 서비스 시작 방법:"
echo ""
echo "   Backend:"
echo "   cd backend && npm run start:dev"
echo ""
echo "   Mobile:"
echo "   cd mobile && npx expo start"
echo ""
echo "   Admin:"
echo "   cd admin && npm run dev"
echo ""
echo "📊 Docker 서비스:"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "🔗 접속 URL:"
echo "   Backend API: http://localhost:3000"
echo "   Mobile (Expo): exp://localhost:19000"
echo "   Admin: http://localhost:5173"
echo ""
