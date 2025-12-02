import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { RedisService } from '../config/redis.config';
import { SmsService } from '../common/services/sms.service';
import { LoggerService } from '../common/logger/logger.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockRedisService: any;
  let mockSmsService: any;
  let mockLoggerService: any;

  const mockUser = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    phone: '01012345678',
    passwordHash: '',
    name: '테스트',
    nickname: 'testuser',
    refreshToken: null,
  };

  beforeEach(async () => {
    mockUser.passwordHash = await bcrypt.hash('Password123!', 12);

    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          'jwt.secret': 'test-secret',
          'jwt.refreshSecret': 'test-refresh-secret',
          'jwt.expiresIn': '1h',
          'jwt.refreshExpiresIn': '7d',
        };
        return config[key];
      }),
    };

    mockRedisService = {
      setVerificationCode: jest.fn().mockResolvedValue(undefined),
      verifyCode: jest.fn().mockResolvedValue(true),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      setSession: jest.fn().mockResolvedValue(undefined),
      deleteSession: jest.fn().mockResolvedValue(undefined),
    };

    mockSmsService = {
      sendVerificationCode: jest.fn().mockResolvedValue(true),
    };

    mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      logSecurity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      phone: '01098765432',
      password: 'Password123!',
      name: '신규회원',
      nickname: 'newuser',
    };

    it('should successfully register a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ ...registerDto, id: 'new-uuid' });
      mockUserRepository.save.mockResolvedValue({ ...registerDto, id: 'new-uuid' });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ email: registerDto.email });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if phone already exists', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ phone: registerDto.phone }); // phone check

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should successfully login with valid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(mockRedisService.setSession).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.login({ ...loginDto, password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('sendVerificationCode', () => {
    it('should successfully send verification code', async () => {
      const result = await service.sendVerificationCode('01012345678');

      expect(result.message).toBe('인증번호가 발송되었습니다');
      expect(mockRedisService.setVerificationCode).toHaveBeenCalled();
      expect(mockSmsService.sendVerificationCode).toHaveBeenCalled();
    });

    it('should throw BadRequestException when rate limit exceeded', async () => {
      mockRedisService.get.mockResolvedValue('5');

      await expect(service.sendVerificationCode('01012345678')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('confirmVerificationCode', () => {
    it('should return verified: true for valid code', async () => {
      mockRedisService.verifyCode.mockResolvedValue(true);

      const result = await service.confirmVerificationCode('01012345678', '123456');

      expect(result.verified).toBe(true);
    });

    it('should throw BadRequestException for invalid code', async () => {
      mockRedisService.verifyCode.mockResolvedValue(false);

      await expect(
        service.confirmVerificationCode('01012345678', 'wrong'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      await service.logout('user-uuid-123');

      expect(mockUserRepository.update).toHaveBeenCalledWith('user-uuid-123', {
        refreshToken: null,
      });
      expect(mockRedisService.deleteSession).toHaveBeenCalledWith('user-uuid-123');
    });
  });
});
