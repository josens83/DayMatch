# DayMatch - 단기 알바 매칭 플랫폼

단기/일회성 도움이 필요한 사람(의뢰자)과 시간과 능력이 있는 사람(헬퍼)을 실시간으로 연결하는 플랫폼입니다.

## 서비스 카테고리

- **생활도움**: 이사, 청소, 음식 픽업, 줄서기 대행
- **계절/농촌**: 김장, 수확철 일손, 농산물 포장
- **이동/운전**: 하루 기사, 공항 픽업, 장거리 운전
- **전문서비스**: 과외, 통역, 여행 가이드
- **이벤트**: 행사 스태프, 촬영 보조

## 기술 스택

### Backend
- **Framework**: NestJS + TypeScript
- **ORM**: TypeORM
- **Database**: PostgreSQL + Redis
- **Authentication**: JWT (Access + Refresh Token)
- **Real-time**: Socket.io

### Frontend (Mobile)
- **Framework**: React Native + Expo
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **Styling**: StyleSheet (Custom Theme)

### Infrastructure
- **Container**: Docker + Docker Compose
- **Cloud**: AWS (ECS, RDS, S3, CloudFront)
- **CI/CD**: GitHub Actions

## 프로젝트 구조

```
DayMatch/
├── backend/                 # NestJS Backend API
│   ├── src/
│   │   ├── auth/           # 인증 모듈
│   │   ├── users/          # 사용자 모듈
│   │   ├── jobs/           # 일자리 모듈
│   │   ├── applications/   # 지원 모듈
│   │   ├── matches/        # 매칭 모듈
│   │   ├── chats/          # 채팅 모듈 (WebSocket)
│   │   ├── payments/       # 결제 모듈
│   │   ├── reviews/        # 리뷰 모듈
│   │   ├── notifications/  # 알림 모듈
│   │   ├── categories/     # 카테고리 모듈
│   │   ├── uploads/        # 파일 업로드 모듈
│   │   └── common/         # 공통 유틸리티
│   ├── Dockerfile
│   └── package.json
├── mobile/                  # React Native App
│   ├── src/
│   │   ├── components/     # UI 컴포넌트
│   │   ├── screens/        # 화면 컴포넌트
│   │   ├── navigation/     # 네비게이션 설정
│   │   ├── services/       # API 서비스
│   │   ├── store/          # Redux Store
│   │   ├── theme/          # 디자인 시스템
│   │   ├── hooks/          # Custom Hooks
│   │   ├── utils/          # 유틸리티 함수
│   │   └── types/          # TypeScript 타입
│   ├── App.tsx
│   └── package.json
├── docker-compose.yml       # Production Docker Compose
├── docker-compose.dev.yml   # Development Docker Compose
└── .github/workflows/       # CI/CD 설정
```

## 시작하기

### 사전 요구사항

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Backend 개발 환경 설정

```bash
# 개발용 데이터베이스 시작
docker-compose -f docker-compose.dev.yml up -d

# Backend 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# 개발 서버 시작
npm run start:dev
```

### Mobile 개발 환경 설정

```bash
# Mobile 디렉토리로 이동
cd mobile

# 의존성 설치
npm install

# Expo 개발 서버 시작
npm start
```

### Docker로 전체 실행

```bash
# 환경 변수 설정
export DB_PASSWORD=your_password
export REDIS_PASSWORD=your_redis_password
export JWT_SECRET=your_jwt_secret

# 모든 서비스 시작
docker-compose up -d
```

## API 문서

서버 실행 후 Swagger 문서를 확인할 수 있습니다:
- http://localhost:3000/api/docs

## 주요 기능

### 의뢰자 (Requester)
- 일자리 등록 및 관리
- 지원자 확인 및 수락/거절
- 작업 완료 확인
- 헬퍼 리뷰 작성

### 헬퍼 (Helper)
- 일자리 검색 및 필터링
- 일자리 지원
- 작업 시작/완료 처리
- 정산 수령

### 공통
- 실시간 채팅
- 푸시 알림
- 프로필 관리
- 리뷰 시스템

## 결제 시스템

- 에스크로 방식 (결제 → 보관 → 정산)
- 플랫폼 수수료: 10%
- PG사: 토스페이먼츠 연동

## 라이선스

MIT License
