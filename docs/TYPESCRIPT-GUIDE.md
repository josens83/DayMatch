# TypeScript 클라우드 배포 완벽 가이드

이 문서는 TypeScript 프로젝트를 클라우드에 배포할 때 발생하는 문제들을 완전히 해결하는 가이드입니다.

## 목차
1. [대소문자 문제 완전 해결](#1-대소문자-문제-완전-해결)
2. [Strict Mode 완벽 이해](#2-strict-mode-완벽-이해)
3. [모듈 해석 문제 해결](#3-모듈-해석-문제-해결)
4. [Path Alias 설정](#4-path-alias-설정)
5. [완벽한 tsconfig.json 템플릿](#5-완벽한-tsconfigjson-템플릿)
6. [흔한 오류 즉시 해결](#6-흔한-오류-즉시-해결)
7. [배포 전 검증](#7-배포-전-검증)

---

## 1. 대소문자 문제 완전 해결

**TypeScript 배포 오류의 #1 원인입니다.**

### tsconfig.json 필수 설정
```json
{
  "compilerOptions": {
    "forceConsistentCasingInFileNames": true
  }
}
```

### Git 설정
```bash
# 대소문자 변경 추적 활성화
git config core.ignorecase false

# 이미 잘못 커밋된 파일 수정
git rm -r --cached .
git add --all .
git commit -m "Fix file casing issues"
```

### ESLint import 검증
```bash
npm install -D eslint-plugin-import eslint-import-resolver-typescript
```

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['import'],
  rules: {
    'import/no-unresolved': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: true,
      node: true,
    },
  },
}
```

---

## 2. Strict Mode 완벽 이해

### strict: true가 활성화하는 옵션들

| 옵션 | 영향 |
|------|------|
| `strictNullChecks` | null/undefined 엄격 검사 |
| `strictFunctionTypes` | 함수 매개변수 타입 엄격 검사 |
| `strictBindCallApply` | bind, call, apply 타입 검사 |
| `strictPropertyInitialization` | 클래스 속성 초기화 강제 |
| `noImplicitAny` | 암시적 any 금지 |
| `noImplicitThis` | 암시적 this 금지 |
| `alwaysStrict` | "use strict" 자동 추가 |

### 흔한 strict mode 오류와 해결

```typescript
// ❌ 오류: Object is possibly 'undefined'
function getUser(id: string) {
  const users = [{ id: '1', name: 'Kim' }]
  const user = users.find(u => u.id === id)
  return user.name  // user가 undefined일 수 있음!
}

// ✅ 해결 1: 옵셔널 체이닝
return user?.name

// ✅ 해결 2: 명시적 체크
if (!user) throw new Error('User not found')
return user.name

// ✅ 해결 3: Non-null assertion (확실할 때만!)
return user!.name
```

```typescript
// ❌ 오류: Parameter 'event' implicitly has an 'any' type
const handleClick = (event) => { ... }

// ✅ 해결: 타입 명시
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => { ... }
```

---

## 3. 모듈 해석 문제 해결

### moduleResolution 옵션 비교

| 옵션 | 설명 | 사용 환경 |
|------|------|----------|
| `node` | 전통적 Node.js 방식 | CJS 프로젝트 |
| `node16` / `nodenext` | Node.js 16+ ESM | ESM 프로젝트 |
| `bundler` | 번들러 사용 프로젝트 (권장) | Vite, webpack 등 |

### JSON 파일 import 오류 해결
```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

---

## 4. Path Alias 설정

### tsconfig.json
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@lib/*": ["./src/lib/*"]
    }
  }
}
```

### Vite 추가 설정 (vite.config.ts)
```typescript
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### NestJS 런타임 경로 해석
```json
// package.json
{
  "scripts": {
    "start:prod": "node -r tsconfig-paths/register dist/main"
  }
}
```

---

## 5. 완벽한 tsconfig.json 템플릿

### NestJS Backend용 (DayMatch 적용)

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

### React/Vite Frontend용

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react-jsx",
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### React Native/Expo용

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

---

## 6. 흔한 오류 즉시 해결

| 오류 메시지 | 원인 | 해결법 |
|------------|------|--------|
| `TS1149: File name differs in casing` | import 대소문자 불일치 | import 경로를 실제 파일명과 일치 |
| `TS2307: Cannot find module` | 모듈 경로 오류 | `@types/` 설치 또는 경로 확인 |
| `TS2322: Type 'X' is not assignable` | 타입 불일치 | 타입 단언 또는 수정 |
| `TS2531: Object is possibly 'null'` | null 체크 누락 | `?.` 또는 null 체크 추가 |
| `TS7006: Parameter implicitly has 'any'` | 타입 누락 | 명시적 타입 추가 |
| `TS18048: 'X' is possibly 'undefined'` | undefined 체크 누락 | `?.` 또는 기본값 설정 |

### 타입 단언 패턴

```typescript
// 외부 라이브러리 타입 불완전
const result = someLibraryFunction() as ExpectedType

// DOM 요소
const button = document.getElementById('btn') as HTMLButtonElement

// 확실히 값이 있을 때 (주의해서 사용)
const value = possiblyNull!
```

---

## 7. 배포 전 검증

### package.json 스크립트 추가
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch",
    "verify": "npm run typecheck && npm run lint && npm run build"
  }
}
```

### 배포 전 체크리스트

- [ ] `forceConsistentCasingInFileNames: true` 설정됨
- [ ] import 경로 대소문자가 실제 파일명과 일치
- [ ] `npm run typecheck` 통과
- [ ] `npm run build` 로컬에서 성공
- [ ] `package.json`에 `engines.node` 버전 명시
- [ ] 모든 타입 오류 해결 (no any, no implicit)

### 검증 명령어
```bash
# 빠른 타입 체크
npm run typecheck

# 전체 검증 (권장)
npm run verify

# NestJS 프로덕션 빌드 테스트
NODE_ENV=production npm run build
```

---

## TypeScript 설정 요약

### 필수 설정 (모든 프로젝트)
```json
{
  "compilerOptions": {
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

### 권장 추가 설정
```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

이 설정들을 적용하면 로컬에서 발견한 오류가 클라우드 배포 시에도 동일하게 발생하여, 배포 실패를 사전에 방지할 수 있습니다.
