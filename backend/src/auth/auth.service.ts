import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RedisService } from '../config/redis.config';
import { SmsService } from '../common/services/sms.service';
import { LoggerService } from '../common/logger/logger.service';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginResult extends Tokens {
  user: Partial<User>;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private smsService: SmsService,
    private logger: LoggerService,
  ) {}

  async register(registerDto: RegisterDto): Promise<LoginResult> {
    const { email, phone, password, name, nickname } = registerDto;

    // Check for existing email
    const existingEmail = await this.userRepository.findOne({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
    }

    // Check for existing phone
    const existingPhone = await this.userRepository.findOne({
      where: { phone },
    });
    if (existingPhone) {
      throw new ConflictException('이미 사용 중인 전화번호입니다');
    }

    // Check for existing nickname
    if (nickname) {
      const existingNickname = await this.userRepository.findOne({
        where: { nickname },
      });
      if (existingNickname) {
        throw new ConflictException('이미 사용 중인 닉네임입니다');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = this.userRepository.create({
      email,
      phone,
      passwordHash,
      name,
      nickname,
    });

    await this.userRepository.save(user);
    this.logger.log(`New user registered: ${user.id}`, 'AuthService');

    // Generate tokens
    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const { email, password, deviceToken, deviceType } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      this.logger.logSecurity('failed_login', { email, reason: 'user_not_found' });
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.logSecurity('failed_login', { email, reason: 'invalid_password' });
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // Update device token if provided
    if (deviceToken) {
      await this.userRepository.update(user.id, {
        deviceToken,
        deviceType,
      });
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Store session in Redis
    await this.redisService.setSession(user.id, {
      userId: user.id,
      email: user.email,
      loginAt: new Date().toISOString(),
      deviceType,
    });

    this.logger.log(`User logged in: ${user.id}`, 'AuthService');

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('접근이 거부되었습니다');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) {
      this.logger.logSecurity('invalid_refresh_token', { userId });
      throw new UnauthorizedException('유효하지 않은 refresh token입니다');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: null });
    await this.redisService.deleteSession(userId);
    this.logger.log(`User logged out: ${userId}`, 'AuthService');
  }

  async sendVerificationCode(phone: string): Promise<{ message: string }> {
    // Check rate limit (max 5 requests per hour)
    const rateLimitKey = `sms_rate:${phone}`;
    const rateCount = await this.redisService.get(rateLimitKey);

    if (rateCount && parseInt(rateCount) >= 5) {
      throw new BadRequestException('인증번호 요청 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.');
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code in Redis (3 minutes TTL)
    await this.redisService.setVerificationCode(phone, code);

    // Increment rate limit counter
    const currentCount = parseInt(rateCount || '0');
    await this.redisService.set(rateLimitKey, (currentCount + 1).toString(), 3600);

    // Send SMS
    const sent = await this.smsService.sendVerificationCode(phone, code);

    if (!sent) {
      this.logger.error('SMS send failed', null, 'AuthService');
      throw new BadRequestException('인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }

    this.logger.log(`Verification code sent to ${phone.slice(0, 7)}****`, 'AuthService');
    return { message: '인증번호가 발송되었습니다' };
  }

  async confirmVerificationCode(
    phone: string,
    code: string,
  ): Promise<{ verified: boolean }> {
    const isValid = await this.redisService.verifyCode(phone, code);

    if (!isValid) {
      throw new BadRequestException('인증번호가 올바르지 않거나 만료되었습니다');
    }

    this.logger.log(`Phone verified: ${phone.slice(0, 7)}****`, 'AuthService');
    return { verified: true };
  }

  async updateDeviceToken(
    userId: string,
    deviceToken: string,
    deviceType: 'ios' | 'android',
  ): Promise<void> {
    await this.userRepository.update(userId, {
      deviceToken,
      deviceType,
    });
    this.logger.log(`Device token updated for user: ${userId}`, 'AuthService');
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  private async generateTokens(user: User): Promise<Tokens> {
    const payload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn', '1h'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, refreshToken, ...sanitized } = user;
    return sanitized;
  }
}
