import { model } from "@medusajs/framework/utils"

// A customer's points in one shop. One row per (seller, customer); points
// earned in a shop can only be spent in that shop. Not linked to the seller or
// customer entities, so no store query.graph can traverse to it: only the
// /store/vitrinaki/loyalty routes (for the customer's own rows) and the
// /vendor/vitrinaki/loyalty stats read it.
const LoyaltyBalance = model
  .define("vitrinaki_loyalty_balance", {
    id: model.id({ prefix: "vklb" }).primaryKey(),
    seller_id: model.text(),
    customer_id: model.text().index(),
    points: model.number().default(0),
    earned_total: model.number().default(0),
    redeemed_total: model.number().default(0),
  })
  .indexes([
    {
      on: ["seller_id", "customer_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default LoyaltyBalance
