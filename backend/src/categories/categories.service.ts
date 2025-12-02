import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { SubCategory } from './entities/sub-category.entity';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(SubCategory)
    private subCategoryRepository: Repository<SubCategory>,
  ) {}

  async onModuleInit() {
    await this.seedCategories();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      relations: ['subCategories'],
      order: { displayOrder: 'ASC' },
    });
  }

  async findById(id: number): Promise<Category | null> {
    return this.categoryRepository.findOne({
      where: { id },
      relations: ['subCategories'],
    });
  }

  async findSubCategories(categoryId: number): Promise<SubCategory[]> {
    return this.subCategoryRepository.find({
      where: { categoryId },
      order: { displayOrder: 'ASC' },
    });
  }

  private async seedCategories(): Promise<void> {
    const count = await this.categoryRepository.count();
    if (count > 0) return;

    const categories = [
      { name: '생활도움', slug: 'daily-help', icon: '🏠', displayOrder: 1 },
      { name: '계절/농촌', slug: 'seasonal', icon: '🌾', displayOrder: 2 },
      { name: '이동/운전', slug: 'driving', icon: '🚗', displayOrder: 3 },
      { name: '전문서비스', slug: 'professional', icon: '🎓', displayOrder: 4 },
      { name: '이벤트', slug: 'event', icon: '🎉', displayOrder: 5 },
    ];

    const savedCategories = await this.categoryRepository.save(categories);

    const subCategoriesData = [
      { categorySlug: 'daily-help', name: '이사 도우미', slug: 'moving', displayOrder: 1 },
      { categorySlug: 'daily-help', name: '청소/정리', slug: 'cleaning', displayOrder: 2 },
      { categorySlug: 'daily-help', name: '음식 픽업', slug: 'food-pickup', displayOrder: 3 },
      { categorySlug: 'daily-help', name: '줄서기 대행', slug: 'waiting-line', displayOrder: 4 },
      { categorySlug: 'seasonal', name: '김장 도우미', slug: 'kimchi', displayOrder: 1 },
      { categorySlug: 'seasonal', name: '수확철 일손', slug: 'harvest', displayOrder: 2 },
      { categorySlug: 'seasonal', name: '농산물 포장', slug: 'packing', displayOrder: 3 },
      { categorySlug: 'driving', name: '하루 기사', slug: 'driver', displayOrder: 1 },
      { categorySlug: 'driving', name: '공항 픽업', slug: 'airport', displayOrder: 2 },
      { categorySlug: 'professional', name: '과외/튜터링', slug: 'tutoring', displayOrder: 1 },
      { categorySlug: 'professional', name: '통역/번역', slug: 'translation', displayOrder: 2 },
      { categorySlug: 'professional', name: '여행 가이드', slug: 'travel-guide', displayOrder: 3 },
      { categorySlug: 'event', name: '행사 스태프', slug: 'event-staff', displayOrder: 1 },
      { categorySlug: 'event', name: '촬영 보조', slug: 'photo-assist', displayOrder: 2 },
    ];

    const categoryMap = new Map(
      savedCategories.map((cat) => [cat.slug, cat.id]),
    );

    const subCategories = subCategoriesData.map((sub) => ({
      categoryId: categoryMap.get(sub.categorySlug),
      name: sub.name,
      slug: sub.slug,
      displayOrder: sub.displayOrder,
    }));

    await this.subCategoryRepository.save(subCategories);
  }
}
