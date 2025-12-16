# 프로젝트 템플릿 모음

이 디렉토리는 자주 사용하는 템플릿을 모아둔 곳입니다.

## 템플릿 목록

### 문서 템플릿
| 템플릿 | 위치 | 설명 |
|--------|------|------|
| ADR 템플릿 | `docs/adr/template.md` | 아키텍처 결정 기록 |
| 주간 점검 | `docs/reviews/weekly/template.md` | 주간 점검 체크리스트 |
| 월간 점검 | `docs/reviews/monthly/template.md` | 월간 점검 체크리스트 |
| 기능 체크리스트 | `docs/reviews/feature-checklist.md` | 새 기능 정렬 체크리스트 |
| 세션 노트 | `docs/session-notes/TEMPLATE.md` | AI 세션 기록 |

### 설정 파일 템플릿
| 템플릿 | 위치 | 설명 |
|--------|------|------|
| Vercel 설정 | `admin/vercel.json` | Vercel 배포 설정 |
| Railway 설정 | `backend/railway.toml` | Railway 배포 설정 |
| Nixpacks 설정 | `backend/nixpacks.toml` | Nixpacks 빌드 설정 |
| commitlint | `commitlint.config.js` | 커밋 메시지 규칙 |
| lint-staged | `.lintstagedrc.js` | 커밋 시 검증 설정 |

### AI 컨텍스트 템플릿
| 템플릿 | 위치 | 설명 |
|--------|------|------|
| Claude | `CLAUDE.md` | Claude Code용 컨텍스트 |
| Cursor | `.cursorrules` | Cursor용 컨텍스트 |
| Copilot | `.github/copilot-instructions.md` | GitHub Copilot용 |
| 전체 컨텍스트 | `CONTEXT.md` | 프로젝트 전체 맥락 |

---

## 빠른 복사 템플릿

### TypeScript 설정 (NestJS)

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
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### package.json 스크립트 (NestJS)

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "typecheck": "tsc --noEmit",
    "verify": "npm run typecheck && npm run lint && npm run build",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

### Health Check 엔드포인트 (NestJS)

```typescript
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
```

### 커밋 메시지 형식

```
<type>: <description>

[optional body]

[optional footer]
```

**타입:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 스타일 (포맷팅 등)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 기타 변경사항

**예시:**
```
feat: 사용자 인증 기능 추가

JWT 기반 인증 구현
- Access Token / Refresh Token 분리
- 만료 시간: 1시간 / 7일
```

---

## 사용법

1. 필요한 템플릿 파일로 이동
2. 내용 복사
3. 프로젝트에 맞게 수정
4. 필요한 값 채우기
