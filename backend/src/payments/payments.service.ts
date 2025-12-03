import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { MatchesService } from '../matches/matches.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { MatchStatus } from '../matches/entities/match.entity';
import { TossPaymentsService } from '../common/services/toss-payments.service';
import { LoggerService } from '../common/logger/logger.service';

const PLATFORM_FEE_RATE = 0.1; // 10%

export interface PreparePaymentResult {
  payment: Payment;
  clientKey: string;
  orderId: string;
  orderName: string;
  amount: number;
}

interface ConfirmPaymentDto {
  paymentKey: string;
  orderId: string;
  amount: number;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private matchesService: MatchesService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
    private tossPaymentsService: TossPaymentsService,
    private logger: LoggerService,
  ) {}

  async prepare(matchId: string, requesterId: string): Promise<PreparePaymentResult> {
    const match = await this.matchesService.findById(matchId);

    if (match.requesterId !== requesterId) {
      throw new ForbiddenException('결제 권한이 없습니다');
    }

    // Check if payment already exists
    const existingPayment = await this.paymentRepository.findOne({
      where: { matchId },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.PAID) {
      throw new BadRequestException('이미 결제가 완료된 매칭입니다');
    }

    const amount = match.finalPay;
    const platformFee = Math.floor(amount * PLATFORM_FEE_RATE);
    const helperPayout = amount - platformFee;
    const orderId = this.tossPaymentsService.generateOrderId();

    let payment: Payment;

    if (existingPayment) {
      // Update existing pending payment
      existingPayment.orderId = orderId;
      existingPayment.amount = amount;
      existingPayment.platformFee = platformFee;
      existingPayment.helperPayout = helperPayout;
      payment = await this.paymentRepository.save(existingPayment);
    } else {
      // Create new payment
      payment = this.paymentRepository.create({
        matchId,
        jobId: match.jobId,
        orderId,
        amount,
        platformFee,
        helperPayout,
        status: PaymentStatus.PENDING,
      });
      payment = await this.paymentRepository.save(payment);
    }

    this.logger.log(`Payment prepared: ${payment.id}, Order: ${orderId}`, 'PaymentsService');

    return {
      payment,
      clientKey: this.tossPaymentsService.getClientKey(),
      orderId,
      orderName: `DayMatch - ${match.job?.title || '일자리 매칭'}`,
      amount,
    };
  }

  async confirm(
    paymentId: string,
    requesterId: string,
    confirmDto: ConfirmPaymentDto,
  ): Promise<Payment> {
    const { paymentKey, orderId, amount } = confirmDto;

    const payment = await this.findById(paymentId);
    const match = await this.matchesService.findById(payment.matchId);

    if (match.requesterId !== requesterId) {
      throw new ForbiddenException('결제 확인 권한이 없습니다');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('이미 처리된 결제입니다');
    }

    // Verify orderId matches
    if (payment.orderId !== orderId) {
      this.logger.logSecurity('payment_order_mismatch', {
        paymentId,
        expected: payment.orderId,
        received: orderId,
      });
      throw new BadRequestException('주문 정보가 일치하지 않습니다');
    }

    // Verify amount matches
    if (payment.amount !== amount) {
      this.logger.logSecurity('payment_amount_mismatch', {
        paymentId,
        expected: payment.amount,
        received: amount,
      });
      throw new BadRequestException('결제 금액이 일치하지 않습니다');
    }

    try {
      // Confirm payment with Toss Payments
      const tossResponse = await this.tossPaymentsService.confirmPayment({
        paymentKey,
        orderId,
        amount,
      });

      // Update payment record
      payment.pgProvider = 'toss';
      payment.pgTid = paymentKey;
      payment.paymentMethod = tossResponse.method;
      payment.status = PaymentStatus.PAID;
      payment.paidAt = new Date(tossResponse.approvedAt);
      payment.heldAt = new Date(); // Escrow starts now
      payment.receiptUrl = tossResponse.receipt?.url;

      await this.paymentRepository.save(payment);

      this.logger.logPayment('confirmed', {
        paymentId: payment.id,
        orderId,
        amount,
        method: tossResponse.method,
      });

      // Notify helper
      await this.notificationsService.create({
        userId: match.helperId,
        type: NotificationType.MATCH_CREATED,
        title: '결제 완료',
        body: `${match.job?.title || '일자리'} 결제가 완료되었습니다. 작업을 진행해주세요.`,
        referenceType: 'payment',
        referenceId: payment.id,
      });

      return payment;
    } catch (error) {
      this.logger.error(`Payment confirm failed: ${error.message}`, error.stack, 'PaymentsService');

      // Update payment status to failed
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);

      throw error;
    }
  }

  async release(paymentId: string): Promise<Payment> {
    const payment = await this.findById(paymentId);
    const match = await this.matchesService.findById(payment.matchId);

    if (payment.status !== PaymentStatus.HELD && payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('정산할 수 없는 결제 상태입니다');
    }

    if (match.status !== MatchStatus.COMPLETED) {
      throw new BadRequestException('완료된 매칭만 정산할 수 있습니다');
    }

    payment.status = PaymentStatus.RELEASED;
    payment.releasedAt = new Date();
    await this.paymentRepository.save(payment);

    this.logger.logPayment('released', {
      paymentId: payment.id,
      helperPayout: payment.helperPayout,
      platformFee: payment.platformFee,
    });

    // Notify helper about payout
    await this.notificationsService.create({
      userId: match.helperId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: '정산 완료',
      body: `${payment.helperPayout.toLocaleString()}원이 정산되었습니다`,
      referenceType: 'payment',
      referenceId: payment.id,
    });

    return payment;
  }

  async refund(paymentId: string, requesterId: string, reason?: string): Promise<Payment> {
    const payment = await this.findById(paymentId);
    const match = await this.matchesService.findById(payment.matchId);

    if (match.requesterId !== requesterId) {
      throw new ForbiddenException('환불 요청 권한이 없습니다');
    }

    if (payment.status === PaymentStatus.RELEASED) {
      throw new BadRequestException('이미 정산된 결제는 환불할 수 없습니다');
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('이미 환불된 결제입니다');
    }

    if (payment.status !== PaymentStatus.PAID && payment.status !== PaymentStatus.HELD) {
      throw new BadRequestException('환불할 수 없는 결제 상태입니다');
    }

    try {
      // Process refund with Toss Payments
      await this.tossPaymentsService.cancelPayment({
        paymentKey: payment.pgTid,
        cancelReason: reason || '고객 요청 환불',
        cancelAmount: payment.amount,
      });

      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = new Date();
      payment.refundReason = reason;
      await this.paymentRepository.save(payment);

      this.logger.logPayment('refunded', {
        paymentId: payment.id,
        amount: payment.amount,
        reason,
      });

      // Notify helper about cancellation
      await this.notificationsService.create({
        userId: match.helperId,
        type: NotificationType.MATCH_CANCELLED,
        title: '결제 취소',
        body: `${match.job?.title || '일자리'} 결제가 취소되었습니다.`,
        referenceType: 'payment',
        referenceId: payment.id,
      });

      return payment;
    } catch (error) {
      this.logger.error(`Payment refund failed: ${error.message}`, error.stack, 'PaymentsService');
      throw error;
    }
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['match', 'job'],
    });

    if (!payment) {
      throw new NotFoundException('결제를 찾을 수 없습니다');
    }

    return payment;
  }

  async findByMatchId(matchId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { matchId },
    });
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { orderId },
    });
  }

  async getPaymentHistory(userId: string, page = 1, limit = 20): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [payments, total] = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.match', 'match')
      .leftJoinAndSelect('payment.job', 'job')
      .where('match.requesterId = :userId OR match.helperId = :userId', { userId })
      .orderBy('payment.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
