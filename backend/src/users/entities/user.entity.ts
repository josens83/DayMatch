import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, length: 20 })
  phone: string;

  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true, nullable: true })
  nickname: string;

  @Column({ name: 'profile_image', length: 500, nullable: true })
  profileImage: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({ name: 'is_requester', default: true })
  isRequester: boolean;

  @Column({ name: 'is_helper', default: false })
  isHelper: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column('text', { array: true, nullable: true })
  skills: string[];

  @Column('text', { name: 'available_areas', array: true, nullable: true })
  availableAreas: string[];

  @Column({
    name: 'rating_as_requester',
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
  })
  ratingAsRequester: number;

  @Column({
    name: 'rating_as_helper',
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
  })
  ratingAsHelper: number;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ name: 'bank_name', length: 50, nullable: true })
  bankName: string;

  @Column({ name: 'bank_account', length: 50, nullable: true })
  bankAccount: string;

  @Column({ name: 'account_holder', length: 50, nullable: true })
  accountHolder: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ name: 'refresh_token', nullable: true })
  @Exclude()
  refreshToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
