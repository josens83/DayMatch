import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Job } from '../../jobs/entities/job.entity';
import { Application } from '../../applications/entities/application.entity';

export enum MatchStatus {
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id' })
  jobId: string;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => Application)
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ name: 'helper_id' })
  helperId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'helper_id' })
  helper: User;

  @Column({ name: 'requester_id' })
  requesterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ name: 'final_pay' })
  finalPay: number;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.CONFIRMED,
  })
  status: MatchStatus;

  @Column({ name: 'helper_started_at', type: 'timestamp', nullable: true })
  helperStartedAt: Date;

  @Column({ name: 'helper_completed_at', type: 'timestamp', nullable: true })
  helperCompletedAt: Date;

  @Column({ name: 'requester_confirmed_at', type: 'timestamp', nullable: true })
  requesterConfirmedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;
}
