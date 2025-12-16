# 배포 트러블슈팅 가이드

이 문서는 로컬에서 잘 되던 코드가 클라우드 배포 시 실패하는 문제들을 다룹니다.

## 목차
1. [로컬 vs 클라우드 환경 차이](#1-로컬-vs-클라우드-환경-차이)
2. [TypeScript 배포 오류](#2-typescript-배포-오류)
3. [TypeORM/Database 오류](#3-typeormdatabase-오류)
4. [환경변수 오류](#4-환경변수-오류)
5. [빠른 해결 체크리스트](#5-빠른-해결-체크리스트)

---

## 1. 로컬 vs 클라우드 환경 차이

### 파일 시스템 대소문자

| 환경 | 대소문자 구분 |
|------|--------------|
| macOS | 구분 안함 (기본) |
| Windows | 구분 안함 |
| Linux (클라우드) | **구분함** |

```typescript
// ❌ 로컬에서 동작, 클라우드에서 실패
import { UserService } from './user.service';  // 파일명: User.service.ts

// ✅ 올바른 방법
import { UserService } from './User.service';  // 파일명과 정확히 일치
```

**해결법:**
```bash
# Git 대소문자 감지 활성화
git config core.ignorecase false

# 파일명 변경 강제 반영
git mv User.service.ts user.service.ts
git mv user.service.ts User.service.ts
```

### Node.js 버전 차이

```json
// package.json에 명시
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### 시간대 차이

```typescript
// ❌ 서버 시간대 의존
const now = new Date();

// ✅ UTC 또는 명시적 시간대
const now = new Date().toISOString();
// 또는
import { format } from 'date-fns-tz';
const kstTime = format(new Date(), 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Seoul' });
```

---

## 2. TypeScript 배포 오류

### 오류: "Cannot find module"

**원인:** 컴파일 후 경로 별칭(@/) 해석 실패

**해결:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

```json
// package.json - 런타임 경로 해석 추가
{
  "scripts": {
    "start:prod": "node -r tsconfig-paths/register dist/main"
  }
}
```

### 오류: "Type X is not assignable to type Y"

**원인:** strict mode 차이

**해결:** 로컬과 클라우드의 tsconfig.json 동일하게 유지
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

### 오류: "Decorators are not valid here"

**원인:** experimentalDecorators 미설정

**해결:**
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## 3. TypeORM/Database 오류

### 오류: "Connection refused"

**원인:** 데이터베이스 연결 정보 오류

**체크리스트:**
- [ ] DATABASE_HOST가 올바른지 (localhost → 실제 호스트)
- [ ] 보안 그룹/방화벽에서 포트 열려있는지
- [ ] SSL 설정이 필요한지

```typescript
// app.module.ts
TypeOrmModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get('DATABASE_HOST'),
    port: config.get('DATABASE_PORT'),
    ssl: config.get('NODE_ENV') === 'production'
      ? { rejectUnauthorized: false }
      : false,
  }),
})
```

### 오류: "Entity not found"

**원인:** Entity 파일이 dist에 포함되지 않음

**해결:**
```typescript
// app.module.ts
TypeOrmModule.forRoot({
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  // 또는 명시적으로
  entities: [User, Job, Application, Match, Payment],
})
```

### 오류: "Migration failed"

**원인:** 마이그레이션 순서 또는 동기화 문제

**해결:**
```bash
# 1. 현재 마이그레이션 상태 확인
npm run typeorm migration:show

# 2. 마이그레이션 실행
npm run typeorm migration:run

# 3. 문제 시 롤백
npm run typeorm migration:revert
```

---

## 4. 환경변수 오류

### Railway에서 환경변수 설정

```bash
# Railway CLI로 설정
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="your-secret"
```

### Vercel에서 환경변수 설정

```bash
# Vercel CLI로 설정
vercel env add VITE_API_URL production
```

### 민감 정보 체크리스트

| 변수 | 필수 | 설명 |
|------|------|------|
| DATABASE_URL | ✅ | PostgreSQL 연결 문자열 |
| JWT_SECRET | ✅ | 최소 32자 |
| REDIS_URL | ⚠️ | 캐싱 사용 시 |
| TOSS_SECRET_KEY | ⚠️ | 결제 사용 시 |

---

## 5. 빠른 해결 체크리스트

### 배포 전

- [ ] `npm run build` 로컬에서 성공하는지
- [ ] `npx tsc --noEmit` 타입 오류 없는지
- [ ] 환경변수 모두 설정했는지
- [ ] 파일명 대소문자 확인했는지
- [ ] package.json의 engines 설정했는지

### 배포 실패 시

```bash
# 1. 로그 확인
railway logs  # Railway
vercel logs   # Vercel

# 2. 로컬에서 프로덕션 빌드 테스트
NODE_ENV=production npm run build
NODE_ENV=production npm run start:prod

# 3. Docker로 테스트 (가장 확실)
docker build -t test .
docker run -e DATABASE_URL=... test
```

### 자주 놓치는 것들

1. **postinstall 스크립트**
   ```json
   "scripts": {
     "postinstall": "npm run build"
   }
   ```

2. **devDependencies vs dependencies**
   - 프로덕션에서 필요한 패키지는 dependencies에

3. **포트 설정**
   ```typescript
   const port = process.env.PORT || 3000;
   ```

---

## 플랫폼별 특이사항

### Railway
- 자동으로 `npm run build` 실행
- PORT 환경변수 자동 설정
- DATABASE_URL 형식: `postgresql://user:pass@host:5432/db`

### Vercel
- 정적 파일만 호스팅 (Admin용)
- 환경변수는 빌드 시점에만 사용
- `vercel.json`으로 라우팅 설정

### EAS Build
- `eas.json`의 env 섹션 확인
- 빌드 프로필별 환경변수 분리
- OTA 업데이트 시 환경변수 반영 안됨
