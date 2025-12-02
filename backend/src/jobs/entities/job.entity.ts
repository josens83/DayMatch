import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { SubCategory } from '../../categories/entities/sub-category.entity';

export enum PayType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  FIXED = 'fixed',
}

export enum JobStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

export enum GenderPrefer {
  ANY = 'any',
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('jobs')
@Index(['status'])
@Index(['workDate'])
@Index(['sido', 'sigungu'])
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'requester_id' })
  requesterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'sub_category_id', nullable: true })
  subCategoryId: number;

  @ManyToOne(() => SubCategory)
  @JoinColumn({ name: 'sub_category_id' })
  subCategory: SubCategory;

  @Column({ name: 'work_date', type: 'date' })
  workDate: Date;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string;

  @Column({
    name: 'duration_hours',
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  durationHours: number;

  @Column({ length: 300 })
  address: string;

  @Column({ name: 'address_detail', length: 100, nullable: true })
  addressDetail: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ length: 20, nullable: true })
  sido: string;

  @Column({ length: 20, nullable: true })
  sigungu: string;

  @Column({
    name: 'pay_type',
    type: 'enum',
    enum: PayType,
  })
  payType: PayType;

  @Column({ name: 'pay_amount' })
  payAmount: number;

  @Column({ name: 'is_negotiable', default: false })
  isNegotiable: boolean;

  @Column({ name: 'helper_count', default: 1 })
  helperCount: number;

  @Column({ name: 'applied_count', default: 0 })
  appliedCount: number;

  @Column({ name: 'matched_count', default: 0 })
  matchedCount: number;

  @Column({ type: 'text', nullable: true })
  requirements: string;

  @Column({ type: 'text', nullable: true })
  preferred: string;

  @Column({
    name: 'gender_prefer',
    type: 'enum',
    enum: GenderPrefer,
    default: GenderPrefer.ANY,
  })
  genderPrefer: GenderPrefer;

  @Column('text', { array: true, nullable: true })
  images: string[];

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.OPEN,
  })
  status: JobStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
