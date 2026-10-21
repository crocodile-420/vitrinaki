import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261021125849 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vitrinaki_booking" drop constraint if exists "vitrinaki_booking_cancel_token_unique";`);
    this.addSql(`create table if not exists "vitrinaki_booking" ("id" text not null, "seller_id" text not null, "service_id" text null, "service_name" text not null, "duration_minutes" integer not null, "price" text null, "start_at" timestamptz not null, "end_at" timestamptz not null, "status" text check ("status" in ('pending', 'confirmed', 'declined', 'cancelled', 'completed', 'no_show')) not null default 'pending', "source" text check ("source" in ('online', 'studio')) not null default 'online', "customer_id" text null, "customer_name" text not null, "customer_phone" text not null, "customer_email" text null, "customer_note" text null, "shop_note" text null, "cancel_token" text not null, "cancelled_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vitrinaki_booking_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vitrinaki_booking_cancel_token_unique" ON "vitrinaki_booking" ("cancel_token") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vitrinaki_booking_deleted_at" ON "vitrinaki_booking" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vitrinaki_booking_seller_id_start_at" ON "vitrinaki_booking" ("seller_id", "start_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "vitrinaki_booking" cascade;`);
  }

}
