import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Match } from '../../matches/entities/match.entity';

export enum ReviewType {
  TO_HELPER = 'to_helper',
  TO_REQUESTER = 'to_requester',
}

@Entity('reviews')
@Unique(['matchId', 'reviewerId'])
@Check(`"rating" >= 1 AND "rating" <= 5`)
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'match_id' })
  matchId: string;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'reviewer_id' })
  reviewerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'reviewee_id' })
  revieweeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewee_id' })
  reviewee: User;

  @Column({
    name: 'review_type',
    type: 'enum',
    enum: ReviewType,
  })
  reviewType: ReviewType;

  @Column()
  rating: number;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  punctuality: number;

  @Column({ nullable: true })
  communication: number;

  @Column({ nullable: true })
  quality: number;

  @Column('text', { array: true, nullable: true })
  images: string[];

  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
