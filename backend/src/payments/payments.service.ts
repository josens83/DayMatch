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

const PLATFORM_FEE_RATE = 0.1; // 10%

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private matchesService: MatchesService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
  ) {}

  async prepare(matchId: string, requesterId: string): Promise<Payment> {
    const match = await this.matchesService.findById(matchId);

    if (match.requesterId !== requesterId) {
      throw new ForbiddenException('결제 권한이 없습니다');
    }

    // Check if payment already exists
    const existingPayment = await this.paymentRepository.findOne({
      where: { matchId },
    });

    if (existingPayment) {
      return existingPayment;
    }

    const amount = match.finalPay;
    const platformFee = Math.floor(amount * PLATFORM_FEE_RATE);
    const helperPayout = amount - platformFee;

    const payment = this.paymentRepository.create({
      matchId,
      jobId: match.jobId,
      amount,
      platformFee,
      helperPayout,
      status: PaymentStatus.PENDING,
    });

    return this.paymentRepository.save(payment);
  }

  async confirm(
    paymentId: string,
    requesterId: string,
    pgTid: string,
    paymentMethod: string,
  ): Promise<Payment> {
    const payment = await this.findById(paymentId);
    const match = await this.matchesService.findById(payment.matchId);

    if (match.requesterId !== requesterId) {
      throw new ForbiddenException('결제 확인 권한이 없습니다');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('이미 처리된 결제입니다');
    }

    // In production, verify with PG (Toss Payments)
    payment.pgProvider = 'toss';
    payment.pgTid = pgTid;
    payment.paymentMethod = paymentMethod;
    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date();
    payment.heldAt = new Date(); // Escrow

    await this.paymentRepository.save(payment);

    // Notify helper
    await this.notificationsService.create({
      userId: match.helperId,
      type: NotificationType.MATCH_CREATED,
      title: '결제 완료',
      body: `${match.job.title} 결제가 완료되었습니다. 작업을 진행해주세요.`,
      referenceType: 'payment',
      referenceId: payment.id,
    });

    return payment;
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

  async refund(paymentId: string, requesterId: string): Promise<Payment> {
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

    // In production, process refund with PG
    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    await this.paymentRepository.save(payment);

    return payment;
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
}
