import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261028070000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vitrinaki_booking" add column if not exists "resource_id" text null, add column if not exists "resource_name" text null, add column if not exists "details" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vitrinaki_booking" drop column if exists "resource_id", drop column if exists "resource_name", drop column if exists "details";`);
  }

}
