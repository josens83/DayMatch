# 플랫폼별 배포 설정 가이드

로컬 환경 없이 GitHub와 클라우드 서비스만으로 배포하는 상세 가이드입니다.

---

## Railway (Backend)

### 1. 프로젝트 생성

1. https://railway.app 접속
2. **Start a New Project** 클릭
3. **Deploy from GitHub repo** 선택
4. GitHub 계정 연결 및 `josens83/DayMatch` 저장소 선택

### 2. 서비스 설정

#### Backend 서비스
```
Root Directory: backend
Build Command: npm run build
Start Command: npm run start:prod
```

#### PostgreSQL 추가
1. **+ New** → **Database** → **PostgreSQL**
2. 자동으로 `DATABASE_URL` 환경변수 생성됨

#### Redis 추가
1. **+ New** → **Database** → **Redis**
2. 자동으로 `REDIS_URL` 환경변수 생성됨

### 3. 환경변수 설정

Railway Dashboard → Variables에서 추가:

```env
# 기본 설정
NODE_ENV=production
PORT=3000

# JWT (직접 생성)
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_REFRESH_SECRET=another-super-secret-key-for-refresh

# 토스페이먼츠 (https://developers.tosspayments.com에서 발급)
TOSS_CLIENT_KEY=test_ck_xxxxxxxx
TOSS_SECRET_KEY=test_sk_xxxxxxxx

# Firebase (Firebase Console에서 발급)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxxxxx\n-----END PRIVATE KEY-----"
```

### 4. 도메인 설정

1. **Settings** → **Networking** → **Generate Domain**
2. 생성된 URL: `https://daymatch-api-production.up.railway.app`
3. 커스텀 도메인: **Add Custom Domain** → DNS 설정

### 5. Railway 설정 파일

```toml
# railway.toml (프로젝트 루트에 생성)
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

---

## Vercel (Admin Dashboard)

### 1. 프로젝트 생성

1. https://vercel.com 접속
2. **Add New Project** 클릭
3. GitHub에서 `josens83/DayMatch` import

### 2. 빌드 설정

```
Framework Preset: Vite
Root Directory: admin
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

### 3. 환경변수 설정

```env
VITE_API_URL=https://your-railway-url.railway.app
```

### 4. vercel.json 설정

```json
// admin/vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

## Expo/EAS (Mobile)

### 1. Expo 계정 설정

1. https://expo.dev 접속 및 가입
2. **Access Tokens** → **Create Token**
3. 토큰 복사하여 GitHub Secrets에 `EXPO_TOKEN`으로 저장

### 2. EAS 설정

```json
// mobile/eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "API_URL": "https://staging-api.daymatch.co.kr"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "API_URL": "https://staging-api.daymatch.co.kr"
      }
    },
    "production": {
      "env": {
        "API_URL": "https://api.daymatch.co.kr"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json"
      }
    }
  }
}
```

### 3. app.json 설정

```json
// mobile/app.json
{
  "expo": {
    "name": "DayMatch",
    "slug": "daymatch",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#4F46E5"
    },
    "ios": {
      "bundleIdentifier": "com.daymatch.app",
      "supportsTablet": false,
      "infoPlist": {
        "NSCameraUsageDescription": "프로필 사진 촬영에 카메라를 사용합니다",
        "NSPhotoLibraryUsageDescription": "프로필 사진 선택에 갤러리를 사용합니다"
      }
    },
    "android": {
      "package": "com.daymatch.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#4F46E5"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

---

## GitHub Secrets 전체 목록

Repository → Settings → Secrets and variables → Actions

| Secret 이름 | 설명 | 발급처 |
|-------------|------|--------|
| `RAILWAY_TOKEN` | Railway 배포 토큰 | Railway Dashboard → Account → Tokens |
| `VERCEL_TOKEN` | Vercel 배포 토큰 | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel Organization ID | Vercel → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel Project ID | Vercel → Project Settings |
| `EXPO_TOKEN` | Expo 접근 토큰 | Expo → Account → Access Tokens |
| `VITE_API_URL` | Admin API URL | Railway에서 생성된 URL |

---

## 배포 순서

```
1. Railway 설정
   ├── PostgreSQL 생성 → DATABASE_URL 자동 설정
   ├── Redis 생성 → REDIS_URL 자동 설정
   ├── Backend 서비스 배포
   └── API URL 확인

2. Vercel 설정
   ├── VITE_API_URL에 Railway URL 입력
   └── Admin 대시보드 배포

3. EAS 설정
   ├── API_URL 환경변수 설정
   ├── 테스트 빌드 (preview)
   └── 프로덕션 빌드

4. 도메인 연결 (선택)
   ├── Railway: api.yourdomain.com
   ├── Vercel: admin.yourdomain.com
   └── DNS CNAME 설정
```

---

## 비용 예상

### Railway (Backend)
| 항목 | 무료 | Pro ($5/월) |
|------|------|-------------|
| 실행 시간 | 500시간/월 | 무제한 |
| 메모리 | 512MB | 8GB |
| PostgreSQL | 1GB | 100GB |

### Vercel (Admin)
| 항목 | Hobby (무료) | Pro ($20/월) |
|------|-------------|--------------|
| 대역폭 | 100GB | 1TB |
| 빌드 | 6000분 | 무제한 |
| 팀 멤버 | 1명 | 무제한 |

### Expo/EAS (Mobile)
| 항목 | Free | Production ($99/월) |
|------|------|---------------------|
| 빌드 | 30/월 | 무제한 |
| 업데이트 | 1000/월 | 무제한 |
