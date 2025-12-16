#!/bin/bash

# DayMatch Pre-flight Deployment Check
# Usage: ./scripts/preflight-check.sh

echo "🔍 DayMatch 배포 전 점검"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

check_pass() {
  echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  ((ERRORS++))
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

# 1. 환경 변수 파일 확인
echo "📋 환경 변수 파일 확인:"
echo ""

if [ -f "backend/.env" ]; then
  check_pass "backend/.env 존재"

  # 필수 변수 확인
  source backend/.env 2>/dev/null
  [ -n "$DATABASE_HOST" ] && check_pass "DATABASE_HOST 설정됨" || check_fail "DATABASE_HOST 미설정"
  [ -n "$JWT_SECRET" ] && check_pass "JWT_SECRET 설정됨" || check_fail "JWT_SECRET 미설정"
  [ -n "$TOSS_SECRET_KEY" ] && check_pass "TOSS_SECRET_KEY 설정됨" || check_warn "TOSS_SECRET_KEY 미설정 (결제 불가)"
else
  check_fail "backend/.env 없음"
fi

if [ -f "mobile/.env" ]; then
  check_pass "mobile/.env 존재"
else
  check_warn "mobile/.env 없음 (기본값 사용)"
fi

echo ""

# 2. TypeScript 타입 체크
echo "📝 TypeScript 타입 체크:"
echo ""

cd backend
if npx tsc --noEmit 2>/dev/null; then
  check_pass "Backend TypeScript 타입 체크 통과"
else
  check_fail "Backend TypeScript 타입 오류"
fi
cd ..

cd admin
if npx tsc --noEmit 2>/dev/null; then
  check_pass "Admin TypeScript 타입 체크 통과"
else
  check_fail "Admin TypeScript 타입 오류"
fi
cd ..

echo ""

# 3. 빌드 테스트
echo "🔨 빌드 테스트:"
echo ""

cd backend
if npm run build 2>/dev/null; then
  check_pass "Backend 빌드 성공"
else
  check_fail "Backend 빌드 실패"
fi
cd ..

cd admin
if npm run build 2>/dev/null; then
  check_pass "Admin 빌드 성공"
else
  check_fail "Admin 빌드 실패"
fi
cd ..

echo ""

# 3. 테스트 실행
echo "🧪 테스트 실행:"
echo ""

cd backend
if npm test 2>/dev/null; then
  check_pass "Backend 테스트 통과"
else
  check_warn "Backend 테스트 실패 또는 스킵"
fi
cd ..

echo ""

# 4. Docker 확인
echo "🐳 Docker 확인:"
echo ""

if command -v docker &> /dev/null; then
  check_pass "Docker 설치됨"

  if docker info &> /dev/null; then
    check_pass "Docker 데몬 실행 중"
  else
    check_fail "Docker 데몬 미실행"
  fi

  if [ -f "backend/Dockerfile" ]; then
    check_pass "Backend Dockerfile 존재"
  else
    check_fail "Backend Dockerfile 없음"
  fi
else
  check_fail "Docker 미설치"
fi

echo ""

# 5. AWS CLI 확인
echo "☁️  AWS 확인:"
echo ""

if command -v aws &> /dev/null; then
  check_pass "AWS CLI 설치됨"

  if aws sts get-caller-identity &> /dev/null; then
    check_pass "AWS 자격증명 유효"
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo "    계정 ID: $ACCOUNT_ID"
  else
    check_fail "AWS 자격증명 무효 또는 미설정"
  fi
else
  check_warn "AWS CLI 미설치 (수동 배포 필요)"
fi

echo ""

# 6. Terraform 확인
echo "🏗️  Terraform 확인:"
echo ""

if command -v terraform &> /dev/null; then
  check_pass "Terraform 설치됨"

  if [ -f "infrastructure/terraform/production.tfvars" ]; then
    check_pass "production.tfvars 존재"
  else
    check_warn "production.tfvars 없음 (생성 필요)"
  fi
else
  check_warn "Terraform 미설치 (인프라 수동 설정 필요)"
fi

echo ""

# 7. EAS CLI 확인
echo "📱 EAS 확인:"
echo ""

if command -v eas &> /dev/null; then
  check_pass "EAS CLI 설치됨"

  if eas whoami &> /dev/null; then
    EAS_USER=$(eas whoami)
    check_pass "EAS 로그인됨: $EAS_USER"
  else
    check_warn "EAS 로그인 필요"
  fi
else
  check_warn "EAS CLI 미설치 (npm install -g eas-cli)"
fi

echo ""
echo "=========================================="

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ 점검 실패: $ERRORS 에러, $WARNINGS 경고${NC}"
  echo ""
  echo "에러를 해결한 후 다시 시도하세요."
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  점검 완료: $WARNINGS 경고${NC}"
  echo ""
  echo "경고 사항을 확인하고 필요시 수정하세요."
  exit 0
else
  echo -e "${GREEN}✅ 모든 점검 통과!${NC}"
  echo ""
  echo "배포를 진행할 수 있습니다."
  exit 0
fi
