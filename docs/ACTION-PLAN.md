# 즉시 실행 가능한 액션 플랜

이 문서는 DayMatch 프로젝트를 배포하기 위한 단계별 체크리스트입니다.

---

## Phase 1: 계정 생성 (30분)

### 필수 계정

- [ ] **Railway** (https://railway.app)
  - GitHub 계정으로 가입
  - 무료 플랜으로 시작

- [ ] **Vercel** (https://vercel.com)
  - GitHub 계정으로 가입
  - Hobby 플랜 (무료)

- [ ] **Expo** (https://expo.dev)
  - 이메일로 가입
  - Access Token 발급

### 선택 계정 (결제/알림 기능용)

- [ ] **토스페이먼츠** (https://developers.tosspayments.com)
  - 사업자등록 필요 (테스트는 가능)
  - 테스트 API 키 발급

- [ ] **Firebase** (https://console.firebase.google.com)
  - Google 계정 필요
  - Cloud Messaging 설정

---

## Phase 2: 토큰 발급 (20분)

### Railway
1. https://railway.app/account/tokens
2. **Create Token** 클릭
3. 이름: `github-actions`
4. 토큰 복사 → `RAILWAY_TOKEN`

### Vercel
1. https://vercel.com/account/tokens
2. **Create** 클릭
3. 이름: `github-actions`, Scope: Full Access
4. 토큰 복사 → `VERCEL_TOKEN`

### Vercel Project/Org ID
1. Vercel에서 프로젝트 생성 (아직 배포 안해도 됨)
2. Project Settings → General
3. `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID` 복사

### Expo
1. https://expo.dev/settings/access-tokens
2. **Create Token** 클릭
3. 토큰 복사 → `EXPO_TOKEN`

---

## Phase 3: GitHub Secrets 등록 (10분)

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. **New repository secret** 클릭
3. 다음 항목들 추가:

```
RAILWAY_TOKEN=railway_xxxx
VERCEL_TOKEN=vercel_xxxx
VERCEL_ORG_ID=team_xxxx
VERCEL_PROJECT_ID=prj_xxxx
EXPO_TOKEN=expo_xxxx
VITE_API_URL=https://your-api.railway.app (나중에 업데이트)
```

---

## Phase 4: Railway 배포 (30분)

### 4.1 데이터베이스 생성
1. Railway Dashboard → New Project
2. **+ New** → **Database** → **PostgreSQL**
3. **+ New** → **Database** → **Redis**

### 4.2 Backend 서비스 생성
1. **+ New** → **GitHub Repo**
2. `josens83/DayMatch` 선택
3. **Settings** → **Root Directory**: `backend`

### 4.3 환경변수 설정
Variables 탭에서:
```
NODE_ENV=production
JWT_SECRET=[32자 이상 랜덤 문자열]
JWT_REFRESH_SECRET=[32자 이상 랜덤 문자열]
```

### 4.4 배포 확인
1. Deployments 탭에서 빌드 로그 확인
2. 성공 시 **Settings** → **Generate Domain**
3. 생성된 URL 복사 (예: `daymatch-production.up.railway.app`)

### 4.5 헬스체크 확인
```
https://your-url.railway.app/health
→ 200 OK 응답 확인
```

---

## Phase 5: Vercel 배포 (15분)

### 5.1 프로젝트 생성
1. Vercel Dashboard → Add New Project
2. `josens83/DayMatch` import
3. **Root Directory**: `admin`
4. **Framework**: Vite

### 5.2 환경변수 설정
```
VITE_API_URL=https://your-railway-url.railway.app
```

### 5.3 배포 확인
1. 자동 배포 시작
2. 생성된 URL에서 Admin 대시보드 확인

### 5.4 GitHub Secret 업데이트
```
VITE_API_URL=https://your-railway-url.railway.app
```

---

## Phase 6: Mobile 빌드 (선택, 1시간)

### 6.1 EAS 설정
1. Expo Dashboard에서 프로젝트 생성
2. `mobile/eas.json` 확인

### 6.2 첫 빌드
GitHub Actions가 자동으로 빌드하거나:
```bash
# Expo CLI 사용 (로컬 환경 필요)
eas build --platform all --profile preview
```

### 6.3 테스트
1. Expo Dashboard에서 QR 코드 생성
2. 실제 기기에서 테스트

---

## 배포 후 체크리스트

### API 확인
- [ ] `GET /health` 200 응답
- [ ] `POST /auth/register` 회원가입 동작
- [ ] `POST /auth/login` 로그인 동작

### Admin 확인
- [ ] 로그인 페이지 표시
- [ ] API 연결 확인 (Network 탭)

### Mobile 확인 (빌드 완료 시)
- [ ] 앱 설치 가능
- [ ] 로그인 화면 표시
- [ ] API 통신 정상

---

## 트러블슈팅

### Railway 빌드 실패
```
✓ package.json의 engines.node 확인
✓ postinstall 스크립트 확인
✓ 환경변수 모두 설정했는지 확인
```

### Vercel 빌드 실패
```
✓ Root Directory가 admin인지 확인
✓ VITE_API_URL 설정 확인
✓ Build Command: npm run build
```

### API 연결 실패
```
✓ CORS 설정 확인 (backend)
✓ VITE_API_URL이 https://인지 확인
✓ Railway 서비스가 실행 중인지 확인
```

---

## 다음 단계

배포 완료 후:

1. **커스텀 도메인 연결**
   - Railway: api.yourdomain.com
   - Vercel: admin.yourdomain.com

2. **결제 기능 활성화**
   - 토스페이먼츠 실서비스 전환
   - Webhook URL 설정

3. **푸시 알림 설정**
   - Firebase 프로젝트 설정
   - APNs 인증서 등록 (iOS)

4. **앱 스토어 등록**
   - Apple Developer Program 가입
   - Google Play Console 가입
   - EAS Submit 설정

---

## 예상 소요 시간

| 단계 | 시간 | 비고 |
|------|------|------|
| 계정 생성 | 30분 | |
| 토큰 발급 | 20분 | |
| GitHub Secrets | 10분 | |
| Railway 배포 | 30분 | 첫 빌드 시간 포함 |
| Vercel 배포 | 15분 | |
| Mobile 빌드 | 1시간 | 선택사항 |
| **총합** | **~2시간** | Mobile 제외 시 1시간 |

---

## 워크플로우 성숙도 점검

각 항목에 체크하고 점수를 계산해보세요.

### 배포 안정성 (각 2점, 총 10점)
- [ ] tsconfig.json에 forceConsistentCasingInFileNames 설정됨
- [ ] package.json에 postinstall 스크립트 있음
- [ ] GitHub Actions CI 파이프라인 구축됨
- [ ] Husky pre-commit hook 설정됨
- [ ] 배포 전 로컬 빌드 테스트 습관화

### AI 도구 활용 (각 2점, 총 10점)
- [ ] CLAUDE.md (또는 동등한 컨텍스트 파일) 존재함
- [ ] 1 태스크 = 1 세션 원칙 실천 중
- [ ] 세션 종료 전 지식 보존 습관화
- [ ] 구체적인 프롬프트 작성 습관화
- [ ] Explore → Plan → Code 워크플로우 적용

### 프로젝트 관리 (각 2점, 총 10점)
- [ ] 비전 문서 (README 또는 VISION.md) 존재함
- [ ] "목표 NOT" 섹션 정의됨
- [ ] ADR 최소 1개 이상 작성됨
- [ ] Kanban 보드 사용 중
- [ ] 주간/월간 점검 루틴 실천 중

### 점수 해석
| 점수 | 레벨 | 설명 |
|------|------|------|
| 25-30점 | 마스터 | 체계적인 워크플로우 구축 완료 |
| 15-24점 | 중급 | 기본기 갖춤, 일부 개선 필요 |
| 8-14점 | 초급 | 핵심 요소 도입 시작 권장 |
| 0-7점 | 시작 | 1단계부터 시작 권장 |

---

## 3단계 도입 로드맵

### 1단계: 오늘 당장 (30분)
```
□ tsconfig.json에 forceConsistentCasingInFileNames 확인
□ package.json에 postinstall 스크립트 확인
□ CLAUDE.md 파일 확인 및 최신화
□ README.md에 비전 섹션 확인
```

### 2단계: 이번 주 안에 (2-3시간)
```
□ Vercel/Railway CLI 설치 및 프로젝트 연결
□ GitHub Actions CI 파이프라인 확인
□ Husky + lint-staged 동작 확인
□ ADR 검토
□ Kanban 보드 설정 (GitHub Projects)
```

### 3단계: 습관화 (매주/매월)
```
□ 배포 전 npm run verify 실행
□ AI 세션 종료 전 지식 보존
□ 주간 15분 점검
□ 월간 1시간 점검
□ 새 기능 전 정렬 체크리스트 확인
```

---

## 문제별 즉시 해결 가이드

### TypeScript 오류
| 오류 | 해결 |
|------|------|
| `File name differs in casing` | import 경로 대소문자를 실제 파일명과 일치 |
| `Cannot find module` | 경로 확인, @types 패키지 설치 |
| `Object is possibly null` | `?.` 옵셔널 체이닝 또는 null 체크 |
| `Parameter implicitly has any` | 타입 명시: `(param: Type)` |

### TypeORM 오류
| 오류 | 해결 |
|------|------|
| `Entity not found` | Entity 파일 경로 확인, synchronize 설정 |
| `Connection failed` | DATABASE_URL 환경변수 확인 |
| `Migration failed` | 마이그레이션 파일 생성 후 실행 |

### 배포 오류
| 오류 | 해결 |
|------|------|
| Vercel `BUILD_FAILED` | `vercel build` 로컬 실행으로 원인 파악 |
| Railway `Application failed to respond` | `process.env.PORT`, `0.0.0.0` 바인딩 |
| `FUNCTION_INVOCATION_TIMEOUT` | `maxDuration` 증가 또는 로직 최적화 |

---

## 추천 도구 요약

| 영역 | 핵심 도구 | 대안 |
|------|----------|------|
| 로컬 빌드 검증 | Vercel CLI, Nixpacks | Docker |
| CI/CD | GitHub Actions | GitLab CI |
| 커밋 검증 | Husky + lint-staged | pre-commit |
| AI 컨텍스트 | CLAUDE.md | .cursorrules |
| 아키텍처 문서 | Mermaid, ADR | Structurizr |
| 태스크 관리 | GitHub Projects | Notion, Linear |
| DB ORM | TypeORM | Prisma, Drizzle |
| 배포 (Frontend) | Vercel | Netlify |
| 배포 (Backend) | Railway | Render, Fly.io |

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| `CLAUDE.md` | AI 코딩 도구용 컨텍스트 |
| `docs/VISION.md` | 프로젝트 비전, 목표 NOT |
| `docs/adr/` | 아키텍처 결정 기록 |
| `docs/architecture/` | C4 다이어그램 |
| `docs/PLATFORM-SETUP.md` | 플랫폼별 설정 |
| `docs/TROUBLESHOOTING.md` | 문제 해결 가이드 |
| `docs/TYPESCRIPT-GUIDE.md` | TypeScript 배포 가이드 |
| `docs/TYPEORM-GUIDE.md` | TypeORM 최적화 가이드 |
| `docs/reviews/` | 점검 템플릿 |
| `docs/session-notes/` | AI 세션 기록 |
| `docs/templates/` | 재사용 템플릿 |
