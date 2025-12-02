import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('sub_categories')
export class SubCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.subCategories)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50 })
  slug: string;

  @Column({ length: 100, nullable: true })
  icon: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;
}
