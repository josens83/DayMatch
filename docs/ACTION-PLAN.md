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
