# 배포 트러블슈팅 가이드

> "제 컴퓨터에서는 잘 되는데요..." - 모든 개발자가 한 번쯤 해본 말

이 문서는 로컬에서 잘 되던 코드가 클라우드 배포 시 실패하는 문제들의 근본 원인과 해결책을 다룹니다.

## 목차
1. [로컬 vs 클라우드 환경 차이](#1-로컬-vs-클라우드-환경-차이)
2. [파일시스템 대소문자 문제](#2-파일시스템-대소문자-문제)
3. [Node.js 버전 불일치](#3-nodejs-버전-불일치)
4. [환경변수 누락](#4-환경변수-누락)
5. [의존성 설치 차이](#5-의존성-설치-차이)
6. [빌드 모드 차이](#6-빌드-모드-차이)
7. [TypeScript 배포 오류](#7-typescript-배포-오류)
8. [TypeORM/Database 오류](#8-typeormdatabase-오류)
9. [해결 원칙과 체크리스트](#9-해결-원칙과-체크리스트)

---

## 1. 로컬 vs 클라우드 환경 차이

### 환경 비교 표

| 항목 | 로컬 (Windows/macOS) | 클라우드 (Linux) |
|------|---------------------|------------------|
| **파일시스템** | 대소문자 구분 안 함 | 대소문자 엄격히 구분 |
| **Node 버전** | 내 PC에 설치된 버전 | 플랫폼 기본값 |
| **환경변수** | .env 자동 로드 | 대시보드에서 직접 설정 |
| **의존성** | node_modules 유지됨 | 매 빌드마다 새로 설치 |
| **빌드 모드** | 개발 모드 (관대) | 프로덕션 모드 (엄격) |

---

## 2. 파일시스템 대소문자 문제

**⚠️ TypeScript 배포 오류의 #1 원인입니다.**

Windows와 macOS는 `UserProfile.ts`와 `userprofile.ts`를 같은 파일로 취급합니다.
Linux 기반 클라우드에서는 완전히 다른 파일입니다.

### 오류 예시
```typescript
// 실제 파일명: components/UserProfile.tsx

// ❌ 로컬에서는 되지만 클라우드에서 실패
import UserProfile from './components/userprofile'  // 소문자

// ✅ 정확한 대소문자로 import
import UserProfile from './components/UserProfile'  // 대문자 P
```

### 오류 메시지
```
Error: Cannot find module './components/userprofile'

TS1149: File name 'UserProfile.tsx' differs from already
        included file name 'userprofile.tsx' only in casing
```

### 해결법
```bash
# 1. Git 대소문자 감지 활성화
git config core.ignorecase false

# 2. 파일명 변경 강제 반영
git mv User.service.ts user.service.ts
git mv user.service.ts User.service.ts

# 3. tsconfig.json 설정
{
  "compilerOptions": {
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## 3. Node.js 버전 불일치

### 버전별 주요 차이

| 기능 | Node 18 | Node 20+ |
|------|---------|----------|
| `Array.toSorted()` | ❌ | ✅ |
| `fetch()` 내장 | ✅ | ✅ |
| `import.meta.resolve()` | 불안정 | ✅ 안정 |

### 문제 시나리오
```javascript
// Node 20에서는 작동, Node 18에서는 실패
const sorted = myArray.toSorted()  // Node 20+ 전용

// Node 18 이하 호환 코드
const sorted = [...myArray].sort()
```

### 해결법
```json
// package.json에 Node 버전 명시
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

---

## 4. 환경변수 누락

### 로드 방식 차이

| 환경 | 로드 방식 |
|------|----------|
| 로컬 개발 | `.env`, `.env.local` 자동 로드 |
| 클라우드 | 대시보드에서 직접 설정 필요 |

### 흔한 오류
```
Error: DATABASE_URL environment variable is not set

Error: Invalid prisma.user.findMany() invocation:
       Unable to connect to the database
```

### 필수 환경변수 체크리스트

| 변수 | 필수 | 설명 |
|------|:----:|------|
| `DATABASE_URL` | ✅ | PostgreSQL 연결 문자열 |
| `JWT_SECRET` | ✅ | 최소 32자 랜덤 문자열 |
| `JWT_REFRESH_SECRET` | ✅ | 별도 32자 랜덤 문자열 |
| `REDIS_URL` | ⚠️ | 캐싱/세션 사용 시 |
| `TOSS_SECRET_KEY` | ⚠️ | 결제 기능 사용 시 |

### 플랫폼별 설정

```bash
# Railway
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="your-secret-key"

# Vercel
vercel env add VITE_API_URL production
```

---

## 5. 의존성 설치 차이

### npm install vs npm ci

| 명령어 | 동작 | 사용 환경 |
|--------|------|----------|
| `npm install` | package.json 기준, lock 파일 업데이트 가능 | 로컬 개발 |
| `npm ci` | package-lock.json 기준, 정확한 버전 | CI/CD |

### 문제 시나리오
```bash
# 로컬에서 패키지 추가 후 lock 파일 커밋 안 함
npm install some-package  # package.json만 수정됨

# CI에서 빌드 시
npm ci  # package-lock.json과 불일치 → 오류!
```

### 오류 메시지
```
npm ERR! `npm ci` can only install packages when your
         package.json and package-lock.json are in sync.
```

### 해결법
```bash
# package-lock.json 동기화
npm install
git add package-lock.json
git commit -m "fix: sync package-lock.json"
```

---

## 6. 빌드 모드 차이

### 개발 vs 프로덕션 비교

| 검사 항목 | 개발 모드 | 프로덕션 모드 |
|----------|:---------:|:-------------:|
| TypeScript 오류 | 경고만 | 빌드 실패 |
| ESLint 경고 | 콘솔 표시 | 빌드 실패 (설정에 따라) |
| 미사용 변수 | 무시 | 오류 |
| any 타입 | 허용 | 오류 (strict mode) |

### 해결법: 로컬에서 프로덕션 빌드 테스트
```bash
# 배포 전 반드시 실행
npm run build

# 프로덕션 환경 시뮬레이션
NODE_ENV=production npm run build
NODE_ENV=production npm run start:prod
```

---

## 7. TypeScript 배포 오류

### 오류: "Cannot find module"

**원인:** 경로 별칭(@/) 런타임 해석 실패

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

### 오류: "Decorators are not valid here"

**원인:** NestJS 데코레이터 설정 누락

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 완벽한 tsconfig.json 템플릿

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

---

## 8. TypeORM/Database 오류

### 오류: "Connection refused"

**체크리스트:**
- [ ] DATABASE_HOST가 올바른지 (localhost → 실제 호스트)
- [ ] 보안 그룹/방화벽에서 포트 열려있는지
- [ ] SSL 설정이 필요한지

```typescript
// app.module.ts - SSL 자동 설정
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

```typescript
// app.module.ts - Entity 명시적 등록
TypeOrmModule.forRoot({
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  // 또는 명시적으로
  entities: [User, Job, Application, Match, Payment],
})
```

### 마이그레이션 문제

```bash
# 현재 상태 확인
npm run typeorm migration:show

# 마이그레이션 실행
npm run typeorm migration:run

# 롤백
npm run typeorm migration:revert
```

---

## 9. 해결 원칙과 체크리스트

### 배포 오류 해결 3원칙

| 원칙 | 설명 |
|------|------|
| **환경을 일치시켜라** | Node 버전 명시, 환경변수 동기화, 대소문자 강제 |
| **배포 전에 검증하라** | 로컬 프로덕션 빌드, CI 자동 검증, pre-commit hook |
| **실패를 빨리 발견하라** | 푸시 전 발견 = 5분 수정, 배포 후 발견 = 1시간+ 수정 |

### 배포 전 체크리스트

- [ ] `npm run build` 로컬에서 성공
- [ ] `npx tsc --noEmit` 타입 오류 없음
- [ ] `package-lock.json` 커밋됨
- [ ] 환경변수 모두 설정됨
- [ ] 파일명 대소문자 확인됨
- [ ] `package.json`의 engines 설정됨

### 배포 실패 시 디버깅

```bash
# 1. 로그 확인
railway logs  # Railway
vercel logs   # Vercel

# 2. 로컬에서 프로덕션 빌드
NODE_ENV=production npm run build
NODE_ENV=production npm run start:prod

# 3. Docker로 정확한 환경 테스트
docker build -t test .
docker run -e DATABASE_URL=... test
```

### 플랫폼별 특이사항

| 플랫폼 | 특징 |
|--------|------|
| **Railway** | 자동 `npm run build`, PORT 자동 설정 |
| **Vercel** | 정적 파일만, 빌드 시 환경변수 사용 |
| **EAS Build** | 프로필별 환경변수, OTA 시 환경변수 미반영 |
