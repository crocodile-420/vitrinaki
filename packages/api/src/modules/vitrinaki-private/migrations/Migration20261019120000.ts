import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// Purely additive: creates one new table for private store details.
export class Migration20261019120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "vitrinaki_seller_private" ("id" text not null, "seller_id" text not null, "legal" jsonb null, "owner" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vitrinaki_seller_private_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vitrinaki_seller_private_seller_id_unique" ON "vitrinaki_seller_private" ("seller_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vitrinaki_seller_private_deleted_at" ON "vitrinaki_seller_private" ("deleted_at") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "vitrinaki_seller_private" cascade;`)
  }
}
