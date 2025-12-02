import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCategories1701500000001 implements MigrationInterface {
  name = 'SeedCategories1701500000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert default categories
    await queryRunner.query(`
      INSERT INTO "categories" ("id", "name", "icon", "description", "sort_order") VALUES
      (uuid_generate_v4(), '이사/운반', '📦', '이사 도우미, 짐 운반 등', 1),
      (uuid_generate_v4(), '청소', '🧹', '집 청소, 사무실 청소 등', 2),
      (uuid_generate_v4(), '심부름', '🏃', '장보기, 서류 전달 등', 3),
      (uuid_generate_v4(), '배달', '🚗', '음식 배달, 물품 배달 등', 4),
      (uuid_generate_v4(), '설치/수리', '🔧', '가구 설치, 간단한 수리 등', 5),
      (uuid_generate_v4(), '펫시터', '🐾', '반려동물 돌봄, 산책 등', 6),
      (uuid_generate_v4(), '줄서기', '⏰', '대기 대행, 줄서기 등', 7),
      (uuid_generate_v4(), '행사도우미', '🎉', '행사 보조, 이벤트 도우미 등', 8),
      (uuid_generate_v4(), '과외/교육', '📚', '과외, 레슨 등', 9),
      (uuid_generate_v4(), '기타', '✨', '기타 도움이 필요한 일', 10)
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "categories"`);
  }
}
