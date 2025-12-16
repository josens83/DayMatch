# ADR 0002: 인증 전략

## 상태
승인됨 (2024-01)

## 컨텍스트
모바일 앱과 웹 관리자 대시보드에서 사용할 인증 방식을 결정해야 합니다.

### 요구사항
- 모바일 앱의 오프라인 대응
- 보안성 (토큰 탈취 대응)
- 자동 로그인 유지
- 관리자 권한 분리

## 결정

### JWT (Access Token + Refresh Token) 방식 채택

```
┌─────────────────────────────────────────────────────────┐
│                    토큰 흐름                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [로그인] → Access Token (1시간) + Refresh Token (7일)  │
│       ↓                                                 │
│  [API 요청] → Access Token 헤더에 포함                  │
│       ↓                                                 │
│  [만료 시] → Refresh Token으로 새 Access Token 발급     │
│       ↓                                                 │
│  [Refresh 만료] → 재로그인 필요                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 토큰 저장 위치
- **Mobile**: SecureStore (암호화된 저장소)
- **Admin**: httpOnly Cookie (XSS 방지)

### Redis 세션 관리
- Refresh Token을 Redis에 저장
- 로그아웃 시 Redis에서 삭제 (토큰 무효화)
- 동시 로그인 제어 가능

## 대안 검토

### Session 기반
- 장점: 서버에서 완전 제어
- 단점: 스케일 아웃 시 sticky session 필요, 모바일 친화적이지 않음

### OAuth만 사용
- 장점: 구현 간단
- 단점: 자체 인증 불가, 의존성 높음

## 결과

### 구현 상세
```typescript
// Access Token: 1시간
JWT_EXPIRATION=1h

// Refresh Token: 7일
JWT_REFRESH_EXPIRATION=7d

// Refresh Token은 Redis에 저장
// Key: refresh_token:{userId}
// Value: token hash
// TTL: 7일
```

### 보안 강화
- Refresh Token rotation (사용 시 새 토큰 발급)
- IP/User-Agent 변경 감지 시 재인증 요구
- Rate limiting으로 브루트포스 방지
