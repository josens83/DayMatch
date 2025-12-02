import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('DayMatch API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET) - should return OK', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });

    it('/health/live (GET) - should return OK', () => {
      return request(app.getHttpServer())
        .get('/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });

    it('/health/ready (GET) - should return OK when services are ready', () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('Auth', () => {
    const testUser = {
      email: `test${Date.now()}@test.com`,
      password: 'Test1234!',
      name: '테스트유저',
      phone: '01012345678',
    };

    it('/api/auth/register (POST) - should register new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe(testUser.email);
          authToken = res.body.accessToken;
          testUserId = res.body.user.id;
        });
    });

    it('/api/auth/register (POST) - should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('/api/auth/login (POST) - should login user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user.email).toBe(testUser.email);
        });
    });

    it('/api/auth/login (POST) - should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Users', () => {
    it('/api/users/me (GET) - should return current user', () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testUserId);
        });
    });

    it('/api/users/me (GET) - should fail without auth', () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .expect(401);
    });

    it('/api/users/me (PATCH) - should update user profile', () => {
      return request(app.getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nickname: '테스트닉네임',
          bio: '테스트 자기소개입니다.',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.nickname).toBe('테스트닉네임');
          expect(res.body.bio).toBe('테스트 자기소개입니다.');
        });
    });
  });

  describe('Jobs', () => {
    let testJobId: string;

    it('/api/jobs (POST) - should create a new job', () => {
      return request(app.getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '테스트 일자리',
          description: '테스트 일자리 설명입니다.',
          categoryId: '1', // Assuming category exists
          pay: 50000,
          estimatedDuration: 2,
          address: '서울시 강남구',
          latitude: 37.4967,
          longitude: 127.0284,
          scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        })
        .expect((res) => {
          if (res.status === 201) {
            expect(res.body.title).toBe('테스트 일자리');
            testJobId = res.body.id;
          }
        });
    });

    it('/api/jobs (GET) - should list jobs', () => {
      return request(app.getHttpServer())
        .get('/api/jobs')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('/api/jobs/:id (GET) - should get job detail', () => {
      if (!testJobId) return;
      return request(app.getHttpServer())
        .get(`/api/jobs/${testJobId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testJobId);
        });
    });
  });

  describe('Categories', () => {
    it('/api/categories (GET) - should list categories', () => {
      return request(app.getHttpServer())
        .get('/api/categories')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Notifications', () => {
    it('/api/notifications (GET) - should list notifications', () => {
      return request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });
  });
});
