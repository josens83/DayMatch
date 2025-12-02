import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Match } from '../../matches/entities/match.entity';
import { Job } from '../../jobs/entities/job.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  HELD = 'held',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', unique: true, nullable: true })
  orderId: string;

  @Column({ name: 'match_id' })
  matchId: string;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'job_id' })
  jobId: string;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column()
  amount: number;

  @Column({ name: 'platform_fee' })
  platformFee: number;

  @Column({ name: 'helper_payout' })
  helperPayout: number;

  @Column({ name: 'payment_method', length: 50, nullable: true })
  paymentMethod: string;

  @Column({ name: 'pg_provider', length: 50, nullable: true })
  pgProvider: string;

  @Column({ name: 'pg_tid', length: 100, nullable: true })
  pgTid: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ name: 'held_at', type: 'timestamp', nullable: true })
  heldAt: Date;

  @Column({ name: 'released_at', type: 'timestamp', nullable: true })
  releasedAt: Date;

  @Column({ name: 'refunded_at', type: 'timestamp', nullable: true })
  refundedAt: Date;

  @Column({ name: 'receipt_url', length: 500, nullable: true })
  receiptUrl: string;

  @Column({ name: 'refund_reason', length: 500, nullable: true })
  refundReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
