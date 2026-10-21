import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261020211501 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vitrinaki_loyalty_entry" drop constraint if exists "vitrinaki_loyalty_entry_order_id_type_unique";`);
    this.addSql(`alter table if exists "vitrinaki_loyalty_balance" drop constraint if exists "vitrinaki_loyalty_balance_seller_id_customer_id_unique";`);
    this.addSql(`create table if not exists "vitrinaki_loyalty_balance" ("id" text not null, "seller_id" text not null, "customer_id" text not null, "points" integer not null default 0, "earned_total" integer not null default 0, "redeemed_total" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vitrinaki_loyalty_balance_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vitrinaki_loyalty_balance_customer_id" ON "vitrinaki_loyalty_balance" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vitrinaki_loyalty_balance_deleted_at" ON "vitrinaki_loyalty_balance" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vitrinaki_loyalty_balance_seller_id_customer_id_unique" ON "vitrinaki_loyalty_balance" ("seller_id", "customer_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "vitrinaki_loyalty_entry" ("id" text not null, "seller_id" text not null, "customer_id" text not null, "type" text check ("type" in ('earn', 'reverse', 'redeem')) not null, "points" integer not null, "order_id" text null, "promotion_id" text null, "code" text null, "reward" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vitrinaki_loyalty_entry_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vitrinaki_loyalty_entry_seller_id" ON "vitrinaki_loyalty_entry" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vitrinaki_loyalty_entry_customer_id" ON "vitrinaki_loyalty_entry" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vitrinaki_loyalty_entry_deleted_at" ON "vitrinaki_loyalty_entry" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vitrinaki_loyalty_entry_order_id_type_unique" ON "vitrinaki_loyalty_entry" ("order_id", "type") WHERE deleted_at IS NULL AND order_id IS NOT NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "vitrinaki_loyalty_balance" cascade;`);

    this.addSql(`drop table if exists "vitrinaki_loyalty_entry" cascade;`);
  }

}
