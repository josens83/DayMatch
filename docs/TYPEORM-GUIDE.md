# TypeORM 배포 최적화 가이드

> 이 프로젝트는 Prisma가 아닌 TypeORM을 사용합니다. 챕터 4의 원칙을 TypeORM에 맞게 적용한 가이드입니다.

## 목차
1. [TypeORM Entity 로딩 원리](#1-typeorm-entity-로딩-원리)
2. [Connection 설정 최적화](#2-connection-설정-최적화)
3. [Connection Pooling](#3-connection-pooling)
4. [마이그레이션 관리](#4-마이그레이션-관리)
5. [흔한 오류 해결](#5-흔한-오류-해결)
6. [배포 체크리스트](#6-배포-체크리스트)

---

## 1. TypeORM Entity 로딩 원리

### 빌드 시 Entity 파일 경로 문제

TypeORM은 Entity 클래스를 자동으로 검색하지만, 컴파일 후 경로가 달라질 수 있습니다.

```
프로젝트 구조:
├── src/
│   ├── users/
│   │   └── entities/
│   │       └── user.entity.ts    ← 개발 시
│   └── app.module.ts
└── dist/
    ├── users/
    │   └── entities/
    │       └── user.entity.js    ← 빌드 후
    └── app.module.js
```

### Entity 등록 방법

```typescript
// ❌ 문제: 런타임에 .ts 파일을 찾으려 함
entities: [__dirname + '/**/*.entity.ts']

// ✅ 해결 1: .ts와 .js 모두 포함
entities: [__dirname + '/**/*.entity{.ts,.js}']

// ✅ 해결 2: 명시적 등록 (권장)
import { User } from './users/entities/user.entity';
import { Job } from './jobs/entities/job.entity';

entities: [User, Job, Application, Match, Payment, Review, Notification]
```

---

## 2. Connection 설정 최적화

### 환경별 설정

```typescript
// src/config/typeorm.config.ts
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT', 5432),
  username: configService.get('DATABASE_USER'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),

  // Entity 자동 로드 (NestJS)
  autoLoadEntities: true,

  // 개발 환경에서만 동기화 (프로덕션에서 절대 사용 금지!)
  synchronize: configService.get('NODE_ENV') === 'development',

  // SSL 설정 (프로덕션)
  ssl: configService.get('NODE_ENV') === 'production'
    ? { rejectUnauthorized: false }
    : false,

  // 로깅
  logging: configService.get('NODE_ENV') === 'development',

  // Connection Pool 설정
  extra: {
    max: 20,                    // 최대 연결 수
    min: 5,                     // 최소 연결 수
    idleTimeoutMillis: 30000,   // 유휴 연결 타임아웃
  },
});
```

### app.module.ts 설정

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
  ],
})
export class AppModule {}
```

---

## 3. Connection Pooling

### Serverless 환경 문제

```
문제 시나리오:
─────────────
요청 1 → 새 인스턴스 → 새 DB 연결
요청 2 → 새 인스턴스 → 새 DB 연결
...
요청 100 → 연결 한계 초과! ❌

PostgreSQL 기본 연결 제한: ~100개
Serverless는 요청마다 새 연결 시도 → 금방 고갈
```

### Connection Pool 설정

```typescript
// TypeORM 설정
{
  extra: {
    // pg 드라이버 옵션
    max: 10,                     // 최대 연결 수 (Serverless: 낮게)
    min: 2,                      // 최소 연결 수
    idleTimeoutMillis: 10000,    // 유휴 연결 타임아웃
    connectionTimeoutMillis: 5000, // 연결 타임아웃
  },
}
```

### Railway PostgreSQL 설정

```typescript
// Railway에서 DATABASE_URL 사용 시
TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    autoLoadEntities: true,
    synchronize: false,
    extra: {
      max: 10,
    },
  }),
})
```

### Supabase + Connection Pooler

```env
# Pooled connection (애플리케이션용) - 포트 6543
DATABASE_URL=postgresql://user:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true

# Direct connection (마이그레이션용) - 포트 5432
DATABASE_DIRECT_URL=postgresql://user:pass@db.xxx.supabase.co:5432/postgres
```

---

## 4. 마이그레이션 관리

### 마이그레이션 생성

```bash
# 마이그레이션 생성
npm run migration:generate -- -n CreateUserTable

# 결과: src/migrations/1234567890-CreateUserTable.ts
```

### 마이그레이션 실행

```bash
# 로컬에서 실행
npm run migration:run

# 프로덕션 배포 시 (Railway/Vercel)
# package.json scripts에 추가
"start:prod": "npm run migration:run && node dist/main"
```

### 마이그레이션 파일 예시

```typescript
// src/migrations/1234567890-CreateUserTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

### synchronize vs 마이그레이션

| 설정 | 개발 | 프로덕션 |
|------|:----:|:--------:|
| `synchronize: true` | ⚠️ 주의해서 사용 | ❌ 절대 금지 |
| Migration | ✅ 권장 | ✅ 필수 |

```typescript
// ⚠️ 절대 프로덕션에서 사용 금지!
synchronize: process.env.NODE_ENV !== 'production'
```

---

## 5. 흔한 오류 해결

### 오류: "EntityMetadataNotFoundError"

```
EntityMetadataNotFoundError: No metadata for "User" was found.
```

**원인:** Entity가 TypeORM에 등록되지 않음

**해결:**
```typescript
// 방법 1: autoLoadEntities 사용 (NestJS)
@Module({
  imports: [TypeOrmModule.forFeature([User])],
})

// 방법 2: entities 배열에 명시
entities: [User, Job, Application],
```

### 오류: "Connection refused"

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**체크리스트:**
- [ ] DATABASE_HOST가 localhost가 아닌 실제 호스트인지
- [ ] 보안 그룹/방화벽 설정
- [ ] SSL 설정 필요 여부

### 오류: "SSL connection required"

```typescript
// 해결: SSL 설정 추가
ssl: {
  rejectUnauthorized: false,
}
```

### 오류: "Too many connections"

```typescript
// 해결: Connection Pool 제한
extra: {
  max: 10,  // 연결 수 줄이기
}
```

### 오류: "Migration failed"

```bash
# 1. 마이그레이션 상태 확인
npm run typeorm migration:show

# 2. 실패한 마이그레이션 롤백
npm run typeorm migration:revert

# 3. 다시 실행
npm run typeorm migration:run
```

---

## 6. 배포 체크리스트

### 환경변수 확인

- [ ] `DATABASE_HOST` 설정됨
- [ ] `DATABASE_PORT` 설정됨 (기본: 5432)
- [ ] `DATABASE_USER` 설정됨
- [ ] `DATABASE_PASSWORD` 설정됨
- [ ] `DATABASE_NAME` 설정됨
- [ ] 또는 `DATABASE_URL` 설정됨 (Railway)

### TypeORM 설정 확인

- [ ] `synchronize: false` (프로덕션)
- [ ] `ssl` 설정됨 (클라우드 DB)
- [ ] Entity 경로가 올바름 (`.ts,.js`)
- [ ] Connection Pool 설정됨

### 마이그레이션 확인

- [ ] 모든 마이그레이션 파일 커밋됨
- [ ] 배포 전 마이그레이션 테스트 완료
- [ ] 롤백 계획 수립됨

### 배포 명령어 확인

```json
// package.json
{
  "scripts": {
    "start:prod": "node dist/main",
    "migration:run": "typeorm migration:run -d dist/config/typeorm.config.js"
  }
}
```

---

## TypeORM vs Prisma 비교

| 항목 | TypeORM | Prisma |
|------|---------|--------|
| 타입 생성 | 데코레이터 기반 | 스키마에서 자동 생성 |
| 마이그레이션 | SQL 직접 작성 | 자동 생성 |
| 쿼리 빌더 | 강력함 | 제한적 |
| 러닝 커브 | 중간 | 낮음 |
| Raw SQL | 쉬움 | 가능하지만 제한적 |

DayMatch는 복잡한 쿼리와 세밀한 제어가 필요하여 TypeORM을 선택했습니다.
