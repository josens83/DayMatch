import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1701500000000 implements MigrationInterface {
  name = 'InitialSchema1701500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create ENUM types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_status_enum" AS ENUM ('active', 'inactive', 'suspended');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "gender_enum" AS ENUM ('male', 'female', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "job_status_enum" AS ENUM ('open', 'in_progress', 'completed', 'cancelled', 'expired');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "application_status_enum" AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "match_status_enum" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'disputed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'paid', 'held', 'released', 'refunded', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "notification_type_enum" AS ENUM (
          'application_received', 'application_accepted', 'application_rejected',
          'match_created', 'match_started', 'match_completed', 'match_cancelled',
          'payment_received', 'new_message', 'review_received', 'system'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "phone" VARCHAR(20) NOT NULL UNIQUE,
        "password_hash" VARCHAR(255) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "nickname" VARCHAR(50) UNIQUE,
        "profile_image" VARCHAR(500),
        "birth_date" DATE,
        "gender" gender_enum,
        "is_requester" BOOLEAN DEFAULT true,
        "is_helper" BOOLEAN DEFAULT false,
        "is_verified" BOOLEAN DEFAULT false,
        "bio" TEXT,
        "skills" TEXT[],
        "available_areas" TEXT[],
        "rating_as_requester" DECIMAL(2,1) DEFAULT 0,
        "rating_as_helper" DECIMAL(2,1) DEFAULT 0,
        "review_count" INTEGER DEFAULT 0,
        "bank_name" VARCHAR(50),
        "bank_account" VARCHAR(50),
        "account_holder" VARCHAR(50),
        "status" user_status_enum DEFAULT 'active',
        "refresh_token" VARCHAR(255),
        "device_token" VARCHAR(255),
        "device_type" VARCHAR(10),
        "push_enabled" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "icon" VARCHAR(50),
        "description" TEXT,
        "sort_order" INTEGER DEFAULT 0,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sub-categories table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sub_categories" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "category_id" UUID NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
        "name" VARCHAR(100) NOT NULL,
        "sort_order" INTEGER DEFAULT 0,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Jobs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "jobs" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "requester_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "category_id" UUID REFERENCES "categories"("id") ON DELETE SET NULL,
        "title" VARCHAR(200) NOT NULL,
        "description" TEXT NOT NULL,
        "address" VARCHAR(500) NOT NULL,
        "address_detail" VARCHAR(200),
        "latitude" DECIMAL(10,8) NOT NULL,
        "longitude" DECIMAL(11,8) NOT NULL,
        "scheduled_date" TIMESTAMP NOT NULL,
        "estimated_duration" INTEGER NOT NULL,
        "pay" INTEGER NOT NULL,
        "images" TEXT[],
        "status" job_status_enum DEFAULT 'open',
        "view_count" INTEGER DEFAULT 0,
        "application_count" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Applications table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "applications" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "job_id" UUID NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
        "applicant_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "message" TEXT,
        "proposed_pay" INTEGER,
        "status" application_status_enum DEFAULT 'pending',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("job_id", "applicant_id")
      )
    `);

    // Matches table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "matches" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "job_id" UUID NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
        "application_id" UUID NOT NULL REFERENCES "applications"("id") ON DELETE CASCADE,
        "requester_id" UUID NOT NULL REFERENCES "users"("id"),
        "helper_id" UUID NOT NULL REFERENCES "users"("id"),
        "final_pay" INTEGER NOT NULL,
        "status" match_status_enum DEFAULT 'pending',
        "started_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "requester_confirmed" BOOLEAN DEFAULT false,
        "helper_confirmed" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "order_id" VARCHAR(100) UNIQUE,
        "match_id" UUID NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
        "job_id" UUID NOT NULL REFERENCES "jobs"("id"),
        "amount" INTEGER NOT NULL,
        "platform_fee" INTEGER NOT NULL,
        "helper_payout" INTEGER NOT NULL,
        "payment_method" VARCHAR(50),
        "pg_provider" VARCHAR(50),
        "pg_tid" VARCHAR(100),
        "status" payment_status_enum DEFAULT 'pending',
        "paid_at" TIMESTAMP,
        "held_at" TIMESTAMP,
        "released_at" TIMESTAMP,
        "refunded_at" TIMESTAMP,
        "receipt_url" VARCHAR(500),
        "refund_reason" VARCHAR(500),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Chat rooms table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_rooms" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "job_id" UUID NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
        "requester_id" UUID NOT NULL REFERENCES "users"("id"),
        "helper_id" UUID NOT NULL REFERENCES "users"("id"),
        "last_message" TEXT,
        "last_message_at" TIMESTAMP,
        "requester_unread_count" INTEGER DEFAULT 0,
        "helper_unread_count" INTEGER DEFAULT 0,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("job_id", "requester_id", "helper_id")
      )
    `);

    // Messages table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "chat_room_id" UUID NOT NULL REFERENCES "chat_rooms"("id") ON DELETE CASCADE,
        "sender_id" UUID NOT NULL REFERENCES "users"("id"),
        "content" TEXT NOT NULL,
        "is_read" BOOLEAN DEFAULT false,
        "read_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reviews table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "match_id" UUID NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
        "reviewer_id" UUID NOT NULL REFERENCES "users"("id"),
        "reviewee_id" UUID NOT NULL REFERENCES "users"("id"),
        "rating" INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        "comment" TEXT,
        "is_requester_review" BOOLEAN NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("match_id", "reviewer_id")
      )
    `);

    // Notifications table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" notification_type_enum NOT NULL,
        "title" VARCHAR(200) NOT NULL,
        "body" TEXT NOT NULL,
        "reference_type" VARCHAR(50),
        "reference_id" UUID,
        "is_read" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_phone" ON "users"("phone")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_status" ON "users"("status")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_jobs_requester" ON "jobs"("requester_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_jobs_category" ON "jobs"("category_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_jobs_status" ON "jobs"("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_jobs_scheduled_date" ON "jobs"("scheduled_date")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_jobs_location" ON "jobs"("latitude", "longitude")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_applications_job" ON "applications"("job_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_applications_applicant" ON "applications"("applicant_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_applications_status" ON "applications"("status")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_matches_job" ON "matches"("job_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_matches_requester" ON "matches"("requester_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_matches_helper" ON "matches"("helper_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_matches_status" ON "matches"("status")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payments_match" ON "payments"("match_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payments_order" ON "payments"("order_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payments_status" ON "payments"("status")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_chat_rooms_job" ON "chat_rooms"("job_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_chat_rooms_requester" ON "chat_rooms"("requester_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_chat_rooms_helper" ON "chat_rooms"("helper_id")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_messages_chat_room" ON "messages"("chat_room_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_messages_created_at" ON "messages"("created_at")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notifications_user" ON "notifications"("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notifications_is_read" ON "notifications"("is_read")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications"("created_at")`);

    // Create update timestamp trigger function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Apply trigger to tables with updated_at
    const tablesWithUpdatedAt = ['users', 'jobs', 'applications', 'matches'];
    for (const table of tablesWithUpdatedAt) {
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON "${table}";
        CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON "${table}"
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_users_updated_at ON "users"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_jobs_updated_at ON "jobs"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_applications_updated_at ON "applications"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_matches_updated_at ON "matches"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column`);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_rooms" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "matches" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "applications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "jobs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sub_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "match_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "application_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "job_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "gender_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum"`);
  }
}
