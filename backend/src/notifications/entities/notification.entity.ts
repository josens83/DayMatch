import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  JOB_APPLIED = 'job_applied',
  APPLICATION_ACCEPTED = 'application_accepted',
  APPLICATION_REJECTED = 'application_rejected',
  MATCH_CREATED = 'match_created',
  MATCH_STARTED = 'match_started',
  MATCH_COMPLETED = 'match_completed',
  MATCH_CANCELLED = 'match_cancelled',
  WORK_STARTED = 'work_started',
  WORK_COMPLETED = 'work_completed',
  PAYMENT_RECEIVED = 'payment_received',
  REVIEW_RECEIVED = 'review_received',
  CHAT_MESSAGE = 'chat_message',
  NEW_MESSAGE = 'new_message',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ name: 'reference_type', length: 50, nullable: true })
  referenceType: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
