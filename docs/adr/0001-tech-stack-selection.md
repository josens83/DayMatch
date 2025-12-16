# ADR 0001: 기술 스택 선택

## 상태
승인됨 (2024-01)

## 컨텍스트
DayMatch 단기 알바 매칭 플랫폼의 MVP 개발을 위한 기술 스택을 결정해야 합니다.

### 요구사항
- 빠른 개발 속도 (솔로 개발자)
- 모바일 앱 필수 (iOS + Android)
- 실시간 기능 (채팅, 알림)
- 결제 연동
- 확장 가능한 아키텍처

## 결정

### Backend: NestJS + TypeORM + PostgreSQL
**이유:**
- TypeScript로 프론트엔드와 타입 공유 가능
- 구조화된 아키텍처 (DI, 모듈 시스템)
- 풍부한 생태계 (WebSocket, Swagger, 검증)
- PostgreSQL은 ACID 보장 + 확장성

**대안 검토:**
- Express: 자유도 높지만 구조화 부족
- FastAPI: Python 기반, 타입 공유 어려움
- Go/Fiber: 성능 좋지만 개발 속도 느림

### Mobile: React Native (Expo)
**이유:**
- 단일 코드베이스로 iOS/Android 동시 개발
- Expo로 빌드/배포 간소화
- React 생태계 활용
- OTA 업데이트 지원

**대안 검토:**
- Flutter: Dart 학습 필요
- Native: 2개 앱 개발 비용 2배

### Admin: React + Vite + Tailwind
**이유:**
- 빠른 개발 속도
- 모바일 앱과 컴포넌트 로직 공유 가능
- Vite로 빠른 빌드

## 결과

### 장점
- 전체 스택 TypeScript 통일
- 코드 재사용성 높음
- 개발 속도 최적화

### 단점
- JavaScript 런타임 성능 한계 (필요시 Go 마이크로서비스 분리)
- React Native의 네이티브 기능 제한 (대부분 Expo SDK로 해결)

## 참고
- NestJS 공식 문서: https://docs.nestjs.com
- Expo 문서: https://docs.expo.dev
