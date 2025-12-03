#!/bin/bash

# DayMatch Health Check Script
# Usage: ./scripts/health-check.sh [api-url]

API_URL=${1:-http://localhost:3000}

echo "🏥 DayMatch 헬스체크"
echo "API URL: $API_URL"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_endpoint() {
  local name=$1
  local url=$2
  local expected=$3

  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 2>/dev/null)

  if [ "$response" == "$expected" ]; then
    echo -e "${GREEN}✓${NC} $name ($response)"
    return 0
  else
    echo -e "${RED}✗${NC} $name (기대: $expected, 실제: $response)"
    return 1
  fi
}

FAILED=0

echo "📡 엔드포인트 체크:"
echo ""

# Health endpoints
check_endpoint "Liveness" "$API_URL/health/live" "200" || ((FAILED++))
check_endpoint "Readiness" "$API_URL/health/ready" "200" || ((FAILED++))
check_endpoint "Detailed Health" "$API_URL/health/detailed" "200" || ((FAILED++))
check_endpoint "Metrics" "$API_URL/health/metrics" "200" || ((FAILED++))

echo ""
echo "🔌 API 엔드포인트:"
echo ""

# API endpoints
check_endpoint "Auth Login" "$API_URL/auth/login" "400" || ((FAILED++))  # 400 expected (no body)
check_endpoint "Categories" "$API_URL/categories" "200" || ((FAILED++))
check_endpoint "Jobs List" "$API_URL/jobs" "200" || ((FAILED++))

echo ""

# Detailed health info
echo "📊 상세 정보:"
health_response=$(curl -s "$API_URL/health/detailed" --max-time 10 2>/dev/null)

if [ -n "$health_response" ]; then
  echo "$health_response" | python3 -m json.tool 2>/dev/null || echo "$health_response"
else
  echo -e "${YELLOW}⚠️  상세 정보를 가져올 수 없습니다${NC}"
fi

echo ""
echo "=========================================="

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ 모든 체크 통과!${NC}"
  exit 0
else
  echo -e "${RED}❌ $FAILED 개 체크 실패${NC}"
  exit 1
fi
