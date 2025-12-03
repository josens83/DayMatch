# DayMatch 배포 가이드

## 📋 배포 전 체크리스트

### 1. 외부 서비스 계정 생성

#### AWS (필수)
- [ ] AWS 계정 생성 및 IAM 사용자 생성
- [ ] 액세스 키 발급 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
- [ ] 필요 권한: ECS, ECR, RDS, ElastiCache, S3, CloudWatch, ACM, Route53

#### Firebase (푸시 알림)
- [ ] Firebase 프로젝트 생성
- [ ] Android 앱 등록 (패키지명: com.daymatch.app)
- [ ] iOS 앱 등록 (Bundle ID: com.daymatch.app)
- [ ] 서비스 계정 키 다운로드 (JSON)
- [ ] Cloud Messaging 설정

#### Toss Payments (결제)
- [ ] 토스 개발자 센터 가입
- [ ] 테스트 API 키 발급
- [ ] 실제 결제 심사 신청 (프로덕션용)

#### SMS 서비스 (본인인증)
- [ ] Aligo 또는 NHN Cloud 가입
- [ ] API 키 발급
- [ ] 발신 번호 등록

#### Expo (모바일 빌드)
- [ ] Expo 계정 생성
- [ ] EAS CLI 설치: `npm install -g eas-cli`
- [ ] 프로젝트 연결: `eas login && eas build:configure`

#### Apple Developer (iOS)
- [ ] Apple Developer Program 가입 ($99/년)
- [ ] App ID 생성
- [ ] Push Notification 인증서 생성
- [ ] 프로비저닝 프로파일 생성

#### Google Play (Android)
- [ ] Google Play Console 가입 ($25 일회성)
- [ ] 앱 생성
- [ ] SHA-1 키 등록

---

### 2. 인프라 배포 (Terraform)

```bash
cd infrastructure/terraform

# 1. 변수 파일 생성
cp production.tfvars.example production.tfvars
# production.tfvars 파일에 실제 값 입력

# 2. Terraform 초기화
terraform init

# 3. 계획 검토
terraform plan -var-file=production.tfvars

# 4. 인프라 생성
terraform apply -var-file=production.tfvars
```

#### 생성되는 리소스
- VPC, 서브넷, 보안 그룹
- RDS PostgreSQL (프리티어: db.t3.micro)
- ElastiCache Redis (cache.t3.micro)
- S3 버킷 (이미지 업로드)
- ECS Fargate 클러스터
- ALB (로드밸런서)
- ACM 인증서 (HTTPS)
- CloudWatch 대시보드 및 알람

---

### 3. 데이터베이스 마이그레이션

```bash
cd backend

# 환경변수 설정
export DATABASE_HOST=your-rds-endpoint.ap-northeast-2.rds.amazonaws.com
export DATABASE_PORT=5432
export DATABASE_USER=daymatch
export DATABASE_PASSWORD=your-password
export DATABASE_NAME=daymatch

# 마이그레이션 빌드
npm run build

# 마이그레이션 실행
npm run migration:run
```

---

### 4. Backend 배포

#### Docker 이미지 빌드 및 푸시

```bash
cd backend

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 빌드
docker build -t daymatch-backend .

# 태그
docker tag daymatch-backend:latest <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/daymatch-backend:latest

# 푸시
docker push <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/daymatch-backend:latest

# ECS 서비스 업데이트
aws ecs update-service --cluster daymatch-cluster --service daymatch-service --force-new-deployment
```

---

### 5. Mobile 앱 빌드 (EAS)

```bash
cd mobile

# 환경 변수 설정
cp .env.example .env
# .env 파일에 실제 API URL 입력

# EAS 로그인
eas login

# 개발용 빌드
eas build --profile development --platform all

# 프리뷰 빌드 (내부 테스트용)
eas build --profile preview --platform all

# 프로덕션 빌드 (스토어 제출용)
eas build --profile production --platform all
```

---

### 6. Admin 대시보드 배포

```bash
cd admin

# 빌드
npm run build

# S3에 업로드 (정적 호스팅)
aws s3 sync dist/ s3://daymatch-admin/ --delete

# 또는 CloudFront 배포 설정
```

---

### 7. 앱스토어 제출

#### iOS (App Store Connect)
1. EAS에서 .ipa 파일 다운로드
2. Transporter 앱으로 업로드
3. App Store Connect에서 메타데이터 입력
4. 심사 제출

#### Android (Google Play Console)
1. EAS에서 .aab 파일 다운로드
2. Play Console > 프로덕션 > 새 버전 만들기
3. .aab 파일 업로드
4. 출시 노트 작성
5. 검토 후 출시

---

## 🔧 환경별 설정

### Development
```
API_URL=http://localhost:3000
DATABASE_HOST=localhost
REDIS_HOST=localhost
```

### Staging
```
API_URL=https://staging-api.daymatch.co.kr
DATABASE_HOST=staging-rds.xxx.ap-northeast-2.rds.amazonaws.com
REDIS_HOST=staging-redis.xxx.cache.amazonaws.com
```

### Production
```
API_URL=https://api.daymatch.co.kr
DATABASE_HOST=prod-rds.xxx.ap-northeast-2.rds.amazonaws.com
REDIS_HOST=prod-redis.xxx.cache.amazonaws.com
```

---

## 📊 모니터링

### CloudWatch 대시보드
- URL: AWS Console > CloudWatch > Dashboards > daymatch-dashboard

### 알람 설정
- CPU 사용률 > 80%
- 메모리 사용률 > 80%
- 5XX 에러 > 10/분
- DB 연결 수 > 80

### 로그 확인
```bash
# ECS 로그
aws logs tail /ecs/daymatch-backend --follow

# 에러 로그만
aws logs filter-log-events --log-group-name /ecs/daymatch-backend --filter-pattern "ERROR"
```

---

## 🚨 롤백 절차

### Backend 롤백
```bash
# 이전 태스크 정의로 롤백
aws ecs update-service \
  --cluster daymatch-cluster \
  --service daymatch-service \
  --task-definition daymatch-backend:<previous-revision>
```

### Database 롤백
```bash
# 마이그레이션 롤백 (주의: 데이터 손실 가능)
npm run migration:revert
```

---

## 💰 예상 비용 (월간)

| 서비스 | 사양 | 예상 비용 |
|--------|------|----------|
| ECS Fargate | 0.5 vCPU, 1GB | ~$15 |
| RDS PostgreSQL | db.t3.micro | ~$15 |
| ElastiCache Redis | cache.t3.micro | ~$12 |
| ALB | - | ~$18 |
| S3 + CloudFront | 10GB | ~$3 |
| Route53 | 1 호스팅 영역 | ~$0.5 |
| **합계** | | **~$65/월** |

*프리티어 적용 시 첫 12개월은 더 저렴할 수 있음*

---

## 📞 지원

문제 발생 시:
1. CloudWatch 로그 확인
2. GitHub Issues에 리포트
3. 긴급 시 롤백 후 조사
