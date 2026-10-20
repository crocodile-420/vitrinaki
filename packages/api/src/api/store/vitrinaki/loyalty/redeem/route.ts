import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, PromotionActions } from "@medusajs/framework/utils"
import { updateCartWorkflow } from "@medusajs/medusa/core-flows"
import { updateCartSellerPromotionsWorkflow } from "@mercurjs/core/workflows"

import { findReward, rewardCode } from "../../../../../lib/vitrinaki-loyalty"
import {
  loadLoyaltyCart,
  loadLoyaltyShops,
  pendingCodes,
  PENDING_CODES_KEY,
} from "../../../../../lib/vitrinaki-loyalty-store"
import { redeemLoyaltyRewardWorkflow } from "../../../../../workflows/vitrinaki-loyalty/redeem-reward"

type Body = { reward_id?: unknown; seller_id?: unknown; cart_id?: unknown }

// Trades points for a reward: returns a single-use code for that shop and,
// with cart_id, applies it to the customer's cart. A free-shipping code needs
// a shipping method to discount, so before one is chosen it waits in the
// cart's metadata and the storefront applies it at the shipping step.
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Συνδέσου για να χρησιμοποιήσεις τους πόντους σου." })
  const body = (req.body || {}) as Body
  const cartId = typeof body.cart_id === "string" && body.cart_id ? body.cart_id : null

  let sellerId = typeof body.seller_id === "string" ? body.seller_id : null
  const cart = cartId ? await loadLoyaltyCart(req.scope, cartId) : null
  if (cartId) {
    if (!cart || cart.customer_id !== customerId) {
      return res.status(404).json({ message: "Δεν βρέθηκε το καλάθι σου. Ανανέωσε τη σελίδα και δοκίμασε ξανά." })
    }
    if (!cart.seller_id || (sellerId && sellerId !== cart.seller_id)) {
      return res.status(400).json({ message: "Οι πόντοι ισχύουν μόνο στο κατάστημα που τους κέρδισες." })
    }
    sellerId = cart.seller_id
  }
  if (!sellerId) return res.status(400).json({ message: "Λείπει το κατάστημα." })

  const shop = (await loadLoyaltyShops(req.scope, [sellerId])).get(sellerId)
  if (!shop || !shop.settings.enabled) {
    return res.status(400).json({ message: "Το κατάστημα δεν έχει ενεργούς πόντους αυτή τη στιγμή." })
  }
  const reward = findReward(shop.settings, body.reward_id)
  if (!reward) return res.status(400).json({ message: "Η ανταμοιβή δεν υπάρχει πια. Ανανέωσε τη σελίδα." })

  let result: { code: string; promotion_id: string; balance: number }
  try {
    ;({ result } = await redeemLoyaltyRewardWorkflow(req.scope).run({
      input: { seller_id: sellerId, customer_id: customerId, reward, code: rewardCode() },
    }))
  } catch (error) {
    if (error instanceof MedusaError && error.type === MedusaError.Types.NOT_ALLOWED) {
      return res.status(400).json({ type: "not_allowed", message: error.message })
    }
    throw error
  }

  let applied = false
  let pending = false
  if (cart) {
    try {
      await updateCartSellerPromotionsWorkflow(req.scope).run({
        input: { cart_id: cart.id, promo_codes: [result.code], action: PromotionActions.ADD, force_refresh_payment_collection: true } as any,
      })
      applied = Boolean((await loadLoyaltyCart(req.scope, cart.id))?.promo_codes.includes(result.code))
    } catch {
      applied = false
    }
    if (!applied && reward.type === "free_shipping") {
      try {
        const codes = Array.from(new Set([...pendingCodes(cart.metadata), result.code]))
        await updateCartWorkflow(req.scope).run({
          input: { id: cart.id, metadata: { ...cart.metadata, [PENDING_CODES_KEY]: codes } },
        })
        pending = true
      } catch {
        pending = false
      }
    }
  }

  return res.json({ code: result.code, reward, points: result.balance, applied, pending })
}
