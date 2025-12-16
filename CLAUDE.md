# DayMatch - AI 코딩 컨텍스트 가이드

## 프로젝트 개요

**DayMatch**는 단기 알바(일용직) 매칭 플랫폼입니다. 구인자(사업주)와 구직자(알바생)를 연결하여 빠르고 효율적인 일자리 매칭을 제공합니다.

### 핵심 가치
- **즉시성**: 당일 또는 단기간 내 일자리 매칭
- **신뢰성**: 평점 시스템과 본인인증으로 신뢰 구축
- **간편성**: 모바일 우선, 3분 내 신청 완료

### 타겟 사용자
1. **구인자 (Employer)**: 식당, 카페, 이벤트 업체, 물류 창고 등
2. **구직자 (Worker)**: 대학생, 프리랜서, 부업 희망자

---

## 기술 스택

### Backend (NestJS)
```
경로: /backend
프레임워크: NestJS 10.x
언어: TypeScript 5.x
데이터베이스: PostgreSQL 15 + TypeORM
캐시: Redis (ioredis)
인증: JWT (Access + Refresh Token)
결제: 토스페이먼츠 API
푸시알림: Firebase FCM
실시간: Socket.io
```

### Mobile (React Native)
```
경로: /mobile
프레임워크: Expo SDK 50+
상태관리: Redux Toolkit + RTK Query
네비게이션: React Navigation 6
UI: 커스텀 컴포넌트 + Theme System
```

### Admin (React)
```
경로: /admin
빌드도구: Vite
UI: Tailwind CSS
차트: Recharts
HTTP: Axios
```

### Infrastructure
```
경로: /infrastructure
IaC: Terraform (AWS)
CI/CD: GitHub Actions
배포: Railway (Backend), Vercel (Admin), EAS (Mobile)
```

---

## 프로젝트 구조

```
DayMatch/
├── backend/                 # NestJS API 서버
│   ├── src/
│   │   ├── auth/           # 인증 (JWT, 소셜로그인)
│   │   ├── users/          # 사용자 관리
│   │   ├── jobs/           # 일자리 CRUD
│   │   ├── applications/   # 지원 관리
│   │   ├── matches/        # 매칭 관리
│   │   ├── payments/       # 결제 (토스페이먼츠)
│   │   ├── chats/          # 실시간 채팅
│   │   ├── notifications/  # 푸시 알림
│   │   ├── reviews/        # 리뷰/평점
│   │   └── common/         # 공통 유틸, 데코레이터
│   └── test/               # E2E 테스트
├── mobile/                  # React Native 앱
│   └── src/
│       ├── screens/        # 화면 컴포넌트
│       ├── components/     # 재사용 컴포넌트
│       ├── store/          # Redux 상태
│       ├── services/       # API 호출
│       ├── hooks/          # 커스텀 훅
│       └── theme/          # 테마/스타일
├── admin/                   # 관리자 대시보드
│   └── src/
│       ├── pages/          # 페이지 컴포넌트
│       ├── components/     # UI 컴포넌트
│       └── services/       # API 서비스
├── infrastructure/          # Terraform IaC
├── scripts/                 # 배포/유틸 스크립트
└── .github/workflows/       # CI/CD
```

---

## 주요 기능 흐름

### 1. 일자리 등록 → 매칭 흐름
```
[구인자] 일자리 등록
    ↓
[시스템] 주변 구직자에게 푸시 알림
    ↓
[구직자] 일자리 목록 확인 → 지원
    ↓
[구인자] 지원자 확인 → 수락/거절
    ↓
[매칭 성립] 채팅방 생성, 상세 안내
    ↓
[근무 완료] 구직자 확인 버튼
    ↓
[구인자] 완료 승인 → 결제 처리
    ↓
[상호 리뷰] 평점 반영
```

### 2. 결제 흐름 (토스페이먼츠)
```
[구인자] 일자리 등록 시 예치금 결제
    ↓
[토스페이먼츠] 결제 승인 → paymentKey 발급
    ↓
[시스템] Payment 레코드 생성 (status: PENDING)
    ↓
[근무 완료 승인]
    ↓
[시스템] 정산 처리 → 구직자 계좌 입금
```

---

## 코딩 컨벤션

### TypeScript
- `strict: true` 사용
- 모든 함수에 명시적 반환 타입
- `any` 사용 금지, `unknown` 후 타입 가드 사용
- 경로 별칭: `@/*` → `src/*`

### NestJS
- Controller → Service → Repository 패턴
- DTO에 class-validator 데코레이터 필수
- 모든 엔드포인트에 Swagger 데코레이터
- Guard로 인증/인가 처리

### React Native
- 함수형 컴포넌트 + Hooks
- Redux Toolkit의 createSlice 사용
- API 호출은 RTK Query 또는 services/api.ts

### 네이밍
- 파일: `kebab-case.ts` 또는 `PascalCase.tsx`
- 클래스: `PascalCase`
- 함수/변수: `camelCase`
- 상수: `UPPER_SNAKE_CASE`
- DB 컬럼: `snake_case`

---

## 환경 변수

### Backend 필수 환경변수
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=daymatch
DATABASE_PASSWORD=password
DATABASE_NAME=daymatch

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Toss Payments
TOSS_CLIENT_KEY=test_ck_xxx
TOSS_SECRET_KEY=test_sk_xxx

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

---

## 자주 발생하는 이슈

### 1. TypeScript 대소문자 오류
```
원인: macOS/Windows는 대소문자 무시, Linux는 구분
해결: import 경로의 대소문자를 파일명과 정확히 일치시킴
```

### 2. Prisma Client not found (해당 시 참고)
```
원인: postinstall에서 generate 누락
해결: package.json의 postinstall에 prisma generate 추가
```

### 3. TypeORM 마이그레이션 오류
```
원인: 엔티티 변경 후 마이그레이션 미생성
해결: npm run migration:generate -- -n MigrationName
```

### 4. Socket.io CORS 오류
```
원인: origin 설정 누락
해결: app.module.ts의 WebSocket 설정에 cors 추가
```

---

## 현재 작업 상태

### 완료된 기능
- [x] 사용자 인증 (JWT, 리프레시 토큰)
- [x] 일자리 CRUD
- [x] 지원/매칭 시스템
- [x] 실시간 채팅
- [x] 결제 연동 (토스페이먼츠)
- [x] 푸시 알림 (FCM)
- [x] 관리자 대시보드
- [x] CI/CD 파이프라인

### 배포 상태
- Backend: Railway 배포 준비 완료
- Admin: Vercel 배포 준비 완료
- Mobile: EAS Build 준비 완료

---

## AI 어시스턴트 가이드라인

### 새 세션 시작 시
1. 이 CLAUDE.md 파일 먼저 읽기
2. 현재 작업 중인 기능 파악
3. 관련 파일들 확인 후 작업 시작

### 코드 수정 시
1. 기존 패턴과 컨벤션 따르기
2. 타입 안전성 유지
3. 테스트 영향도 고려
4. DEPLOYMENT.md의 배포 설정 참고

### 새 기능 추가 시
1. ADR 문서 먼저 검토
2. 기존 모듈 구조 따르기
3. DTO, Entity, Service, Controller 순서로 구현
4. Swagger 문서화 포함
