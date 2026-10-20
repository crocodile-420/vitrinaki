import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { cardPaymentForCart } from "../../../../../../lib/card-payments"
import { cardPaymentMessage } from "../../../../../../lib/stripe-connect"

// Checkout asks this before offering «Πιστωτική κάρτα»: card is offered only
// when the whole cart is from one shop whose Stripe account is active.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const decision = await cardPaymentForCart(req.scope, { cartId: req.params.id })
  return res.json({
    available: decision.available,
    reason: decision.reason,
    message: decision.reason ? cardPaymentMessage[decision.reason] : null,
  })
}
