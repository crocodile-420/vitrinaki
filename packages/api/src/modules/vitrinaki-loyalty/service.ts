import type { Context } from "@medusajs/framework/types"
import {
  generateEntityId,
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils"

import LoyaltyBalance from "./models/loyalty-balance"
import LoyaltyEntry from "./models/loyalty-entry"

type SqlManager = { execute: (sql: string, params?: unknown[]) => Promise<any[]> }

const manager = (context: Context, transactional: boolean) =>
  (transactional ? context.transactionManager : context.manager) as unknown as SqlManager

// Balances only ever change through the methods below, each a single
// conditional SQL statement, so two requests at the same moment cannot spend
// the same points twice or award the same order twice.
class VitrinakiLoyaltyModuleService extends MedusaService({ LoyaltyBalance, LoyaltyEntry }) {
  // Adds an order's points. Idempotent per order: the ledger's unique
  // (order_id, type) index makes a second call a no-op. Returns the points
  // added (0 when the order had already earned).
  @InjectTransactionManager()
  async earnForOrder(
    input: { seller_id: string; customer_id: string; order_id: string; points: number },
    @MedusaContext() context: Context = {}
  ): Promise<number> {
    const points = Math.floor(input.points)
    if (!(points > 0)) return 0
    const em = manager(context, true)
    const inserted = await em.execute(
      `insert into "vitrinaki_loyalty_entry" ("id", "seller_id", "customer_id", "type", "points", "order_id")
       values (?, ?, ?, 'earn', ?, ?) on conflict do nothing returning "id"`,
      [generateEntityId(undefined, "vkle"), input.seller_id, input.customer_id, points, input.order_id]
    )
    if (!inserted.length) return 0
    await em.execute(
      `insert into "vitrinaki_loyalty_balance" ("id", "seller_id", "customer_id", "points", "earned_total", "redeemed_total")
       values (?, ?, ?, ?, ?, 0)
       on conflict ("seller_id", "customer_id") where "deleted_at" is null do update set
         "points" = "vitrinaki_loyalty_balance"."points" + excluded."points",
         "earned_total" = "vitrinaki_loyalty_balance"."earned_total" + excluded."earned_total",
         "updated_at" = now()`,
      [generateEntityId(undefined, "vklb"), input.seller_id, input.customer_id, points, points]
    )
    return points
  }

  // Takes back what a canceled order earned (once). The balance never goes
  // below zero: points already spent on a reward stay spent.
  @InjectTransactionManager()
  async reverseOrder(orderId: string, @MedusaContext() context: Context = {}): Promise<number> {
    const em = manager(context, true)
    const [earned] = await em.execute(
      `select "seller_id", "customer_id", "points" from "vitrinaki_loyalty_entry"
       where "order_id" = ? and "type" = 'earn' and "deleted_at" is null`,
      [orderId]
    )
    if (!earned) return 0
    const points = Number(earned.points)
    const inserted = await em.execute(
      `insert into "vitrinaki_loyalty_entry" ("id", "seller_id", "customer_id", "type", "points", "order_id")
       values (?, ?, ?, 'reverse', ?, ?) on conflict do nothing returning "id"`,
      [generateEntityId(undefined, "vkle"), earned.seller_id, earned.customer_id, -points, orderId]
    )
    if (!inserted.length) return 0
    await em.execute(
      `update "vitrinaki_loyalty_balance" set
         "points" = greatest("points" - ?, 0),
         "earned_total" = greatest("earned_total" - ?, 0),
         "updated_at" = now()
       where "seller_id" = ? and "customer_id" = ? and "deleted_at" is null`,
      [points, points, earned.seller_id, earned.customer_id]
    )
    return points
  }

  // Spends points on a reward. The balance check and the deduction are one
  // statement: it only matches while the customer still has enough points.
  @InjectTransactionManager()
  async spendPoints(
    input: { seller_id: string; customer_id: string; points: number; code: string; reward: Record<string, unknown> },
    @MedusaContext() context: Context = {}
  ): Promise<{ entry_id: string; balance: number }> {
    const points = Math.floor(input.points)
    if (!(points > 0)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Μη έγκυρη ανταμοιβή.")
    const em = manager(context, true)
    const [row] = await em.execute(
      `update "vitrinaki_loyalty_balance" set
         "points" = "points" - ?,
         "redeemed_total" = "redeemed_total" + ?,
         "updated_at" = now()
       where "seller_id" = ? and "customer_id" = ? and "deleted_at" is null and "points" >= ?
       returning "points"`,
      [points, points, input.seller_id, input.customer_id, points]
    )
    if (!row) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Δεν έχεις αρκετούς πόντους για αυτή την ανταμοιβή.")
    const entryId = generateEntityId(undefined, "vkle")
    await em.execute(
      `insert into "vitrinaki_loyalty_entry" ("id", "seller_id", "customer_id", "type", "points", "code", "reward")
       values (?, ?, ?, 'redeem', ?, ?, ?::jsonb)`,
      [entryId, input.seller_id, input.customer_id, -points, input.code, JSON.stringify(input.reward)]
    )
    return { entry_id: entryId, balance: Number(row.points) }
  }

  // Undoes spendPoints (the redeem workflow's compensation).
  @InjectTransactionManager()
  async refundSpend(entryId: string, @MedusaContext() context: Context = {}): Promise<void> {
    const em = manager(context, true)
    const [entry] = await em.execute(
      `delete from "vitrinaki_loyalty_entry" where "id" = ? and "type" = 'redeem' returning "seller_id", "customer_id", "points"`,
      [entryId]
    )
    if (!entry) return
    const points = Math.abs(Number(entry.points))
    await em.execute(
      `update "vitrinaki_loyalty_balance" set
         "points" = "points" + ?,
         "redeemed_total" = greatest("redeemed_total" - ?, 0),
         "updated_at" = now()
       where "seller_id" = ? and "customer_id" = ? and "deleted_at" is null`,
      [points, points, entry.seller_id, entry.customer_id]
    )
  }

  // The Studio's numbers for one shop.
  @InjectManager()
  async sellerStats(sellerId: string, @MedusaContext() context: Context = {}) {
    const em = manager(context, false)
    const [balances] = await em.execute(
      `select count(*)::int as "members",
              coalesce(sum("earned_total"), 0)::bigint as "issued",
              coalesce(sum("redeemed_total"), 0)::bigint as "redeemed",
              coalesce(sum("points"), 0)::bigint as "outstanding"
       from "vitrinaki_loyalty_balance" where "seller_id" = ? and "deleted_at" is null`,
      [sellerId]
    )
    const [entries] = await em.execute(
      `select count(*)::int as "rewards" from "vitrinaki_loyalty_entry"
       where "seller_id" = ? and "type" = 'redeem' and "deleted_at" is null`,
      [sellerId]
    )
    return {
      members: Number(balances?.members ?? 0),
      pointsIssued: Number(balances?.issued ?? 0),
      pointsRedeemed: Number(balances?.redeemed ?? 0),
      pointsOutstanding: Number(balances?.outstanding ?? 0),
      rewardsRedeemed: Number(entries?.rewards ?? 0),
    }
  }
}

export default VitrinakiLoyaltyModuleService
