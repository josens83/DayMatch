import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { MatchesService } from '../matches/matches.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TossPaymentsService } from '../common/services/toss-payments.service';
import { LoggerService } from '../common/logger/logger.service';
import { MatchStatus } from '../matches/entities/match.entity';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockPaymentRepository: any;
  let mockMatchesService: any;
  let mockNotificationsService: any;
  let mockTossPaymentsService: any;
  let mockLoggerService: any;

  const mockMatch = {
    id: 'match-uuid-123',
    requesterId: 'requester-uuid',
    helperId: 'helper-uuid',
    jobId: 'job-uuid',
    finalPay: 50000,
    status: MatchStatus.IN_PROGRESS,
    job: { title: '테스트 일자리' },
  };

  const mockPayment = {
    id: 'payment-uuid-123',
    orderId: 'DM123456',
    matchId: 'match-uuid-123',
    jobId: 'job-uuid',
    amount: 50000,
    platformFee: 5000,
    helperPayout: 45000,
    status: PaymentStatus.PENDING,
    pgTid: null,
  };

  beforeEach(async () => {
    mockPaymentRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      }),
    };

    mockMatchesService = {
      findById: jest.fn().mockResolvedValue(mockMatch),
    };

    mockNotificationsService = {
      create: jest.fn().mockResolvedValue({}),
    };

    mockTossPaymentsService = {
      generateOrderId: jest.fn().mockReturnValue('DM123456'),
      getClientKey: jest.fn().mockReturnValue('test_client_key'),
      confirmPayment: jest.fn().mockResolvedValue({
        paymentKey: 'toss-payment-key',
        orderId: 'DM123456',
        status: 'DONE',
        method: '카드',
        totalAmount: 50000,
        approvedAt: new Date().toISOString(),
        receipt: { url: 'https://receipt.url' },
      }),
      cancelPayment: jest.fn().mockResolvedValue({
        paymentKey: 'toss-payment-key',
        cancels: [{ cancelAmount: 50000, cancelReason: '고객 요청' }],
      }),
    };

    mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      logPayment: jest.fn(),
      logSecurity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: MatchesService,
          useValue: mockMatchesService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: TossPaymentsService,
          useValue: mockTossPaymentsService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('prepare', () => {
    it('should create a new payment for requester', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);
      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      const result = await service.prepare('match-uuid-123', 'requester-uuid');

      expect(result).toHaveProperty('payment');
      expect(result).toHaveProperty('clientKey');
      expect(result).toHaveProperty('orderId');
      expect(result).toHaveProperty('amount', 50000);
    });

    it('should throw ForbiddenException if not requester', async () => {
      await expect(
        service.prepare('match-uuid-123', 'other-user-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if already paid', async () => {
      mockPaymentRepository.findOne.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
      });

      await expect(
        service.prepare('match-uuid-123', 'requester-uuid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirm', () => {
    const confirmDto = {
      paymentKey: 'toss-payment-key',
      orderId: 'DM123456',
      amount: 50000,
    };

    beforeEach(() => {
      mockPaymentRepository.findOne.mockResolvedValue({
        ...mockPayment,
        match: mockMatch,
        job: mockMatch.job,
      });
    });

    it('should confirm payment successfully', async () => {
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
      });

      const result = await service.confirm('payment-uuid-123', 'requester-uuid', confirmDto);

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(mockTossPaymentsService.confirmPayment).toHaveBeenCalled();
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for mismatched orderId', async () => {
      await expect(
        service.confirm('payment-uuid-123', 'requester-uuid', {
          ...confirmDto,
          orderId: 'wrong-order-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for mismatched amount', async () => {
      await expect(
        service.confirm('payment-uuid-123', 'requester-uuid', {
          ...confirmDto,
          amount: 99999,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('release', () => {
    it('should release payment for completed match', async () => {
      mockPaymentRepository.findOne.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
        match: { ...mockMatch, status: MatchStatus.COMPLETED },
        job: mockMatch.job,
      });
      mockMatchesService.findById.mockResolvedValue({
        ...mockMatch,
        status: MatchStatus.COMPLETED,
      });
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.RELEASED,
      });

      const result = await service.release('payment-uuid-123');

      expect(result.status).toBe(PaymentStatus.RELEASED);
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if match not completed', async () => {
      mockPaymentRepository.findOne.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
        match: mockMatch,
        job: mockMatch.job,
      });

      await expect(service.release('payment-uuid-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refund', () => {
    it('should refund payment successfully', async () => {
      mockPaymentRepository.findOne.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
        pgTid: 'toss-payment-key',
        match: mockMatch,
        job: mockMatch.job,
      });
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.REFUNDED,
      });

      const result = await service.refund('payment-uuid-123', 'requester-uuid', '단순 변심');

      expect(result.status).toBe(PaymentStatus.REFUNDED);
      expect(mockTossPaymentsService.cancelPayment).toHaveBeenCalled();
    });

    it('should throw BadRequestException if already released', async () => {
      mockPaymentRepository.findOne.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.RELEASED,
        match: mockMatch,
        job: mockMatch.job,
      });

      await expect(
        service.refund('payment-uuid-123', 'requester-uuid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return payment if found', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      const result = await service.findById('payment-uuid-123');

      expect(result).toEqual(mockPayment);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
