import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { affordableRewards } from "../../../../lib/vitrinaki-loyalty"
import { loadLoyaltyShops, shopView } from "../../../../lib/vitrinaki-loyalty-store"
import { VITRINAKI_LOYALTY_MODULE } from "../../../../modules/vitrinaki-loyalty"
import type VitrinakiLoyaltyModuleService from "../../../../modules/vitrinaki-loyalty/service"

// «Οι πόντοι μου»: the logged-in customer's points in every shop they have
// earned in, with each shop's current rewards. (Customer auth: middlewares.ts)
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Συνδέσου για να δεις τους πόντους σου." })

  const loyalty = req.scope.resolve<VitrinakiLoyaltyModuleService>(VITRINAKI_LOYALTY_MODULE)
  const balances = await loyalty.listLoyaltyBalances({ customer_id: customerId }, { order: { updated_at: "DESC" }, take: 200 })
  const shops = await loadLoyaltyShops(req.scope, balances.map((b) => b.seller_id))

  return res.json({
    shops: balances.flatMap((balance) => {
      const shop = shops.get(balance.seller_id)
      if (!shop) return []
      return [
        {
          ...shopView(shop),
          points: balance.points,
          affordable: affordableRewards(shop.settings, balance.points).map((r) => r.id),
        },
      ]
    }),
  })
}
