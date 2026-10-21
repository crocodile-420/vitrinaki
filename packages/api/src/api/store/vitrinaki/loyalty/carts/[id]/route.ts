import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { affordableRewards, pointsForAmount } from "../../../../../../lib/vitrinaki-loyalty"
import { loadLoyaltyCart, loadLoyaltyShops, pendingCodes, shopView } from "../../../../../../lib/vitrinaki-loyalty-store"
import { VITRINAKI_LOYALTY_MODULE } from "../../../../../../modules/vitrinaki-loyalty"
import type VitrinakiLoyaltyModuleService from "../../../../../../modules/vitrinaki-loyalty/service"

// The cart page's points box: does this cart's shop give points, how many
// this cart earns and, for a logged-in customer, their points in that shop.
// Works without login (the box then invites the customer to log in).
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cart = await loadLoyaltyCart(req.scope, req.params.id)
  if (!cart || !cart.seller_id) return res.json({ enabled: false })
  const shop = (await loadLoyaltyShops(req.scope, [cart.seller_id])).get(cart.seller_id)
  if (!shop || !shop.settings.enabled) return res.json({ enabled: false })

  const customerId = req.auth_context?.actor_id || null
  let points: number | null = null
  if (customerId) {
    const loyalty = req.scope.resolve<VitrinakiLoyaltyModuleService>(VITRINAKI_LOYALTY_MODULE)
    const [balance] = await loyalty.listLoyaltyBalances({ seller_id: shop.id, customer_id: customerId }, { take: 1 })
    points = balance?.points ?? 0
  }

  return res.json({
    ...shopView(shop),
    logged_in: Boolean(customerId),
    points,
    earn: pointsForAmount(cart.item_total, shop.settings.pointsPerEuro),
    affordable: points == null ? [] : affordableRewards(shop.settings, points).map((r) => r.id),
    // Only for the cart's own customer: codes waiting for a shipping method.
    pending_codes: customerId && cart.customer_id === customerId
      ? pendingCodes(cart.metadata).filter((code) => !cart.promo_codes.includes(code))
      : [],
  })
}
