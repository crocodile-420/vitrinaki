import { model } from "@medusajs/framework/utils"

// The ledger behind each balance: one row per change.
//   earn     +N  an order was placed (order_id)
//   reverse  -N  that order was canceled (order_id)
//   redeem   -N  the customer took a reward (promotion_id, code, reward)
const LoyaltyEntry = model
  .define("vitrinaki_loyalty_entry", {
    id: model.id({ prefix: "vkle" }).primaryKey(),
    seller_id: model.text().index(),
    customer_id: model.text().index(),
    type: model.enum(["earn", "reverse", "redeem"]),
    points: model.number(),
    order_id: model.text().nullable(),
    promotion_id: model.text().nullable(),
    code: model.text().nullable(),
    reward: model.json().nullable(),
  })
  .indexes([
    // An order earns once and is reversed at most once.
    {
      on: ["order_id", "type"],
      unique: true,
      where: "deleted_at IS NULL AND order_id IS NOT NULL",
    },
  ])

export default LoyaltyEntry
