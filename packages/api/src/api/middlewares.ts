import {
  authenticate,
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import { cardPaymentForCart } from "../lib/card-payments"
import { scrubNested } from "../lib/public-seller-scrub"
import { cardPaymentMessage, isStripeProviderId, SELLER_DATA_KEY, STRIPE_ACCOUNT_DATA_KEY } from "../lib/stripe-connect"
import { memberLimitMessage } from "../lib/vitrinaki-plans"
import { teamSeats } from "../lib/vitrinaki-team-limit"

// Vendor routes need no entry here: Mercur's /vendor/* middleware already
// authenticates the member and sets req.seller_context from x-seller-id.
const adminAuth = authenticate("user", ["session", "bearer", "api-key"])
// Loyalty points (src/api/store/vitrinaki/loyalty): the customer's own
// balances. The cart box also answers guests, inviting them to log in.
const customerAuth = authenticate("customer", ["session", "bearer"])
const optionalCustomerAuth = authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true })

// Public store routes that can embed a seller: strip what shoppers must not see
// (see src/lib/public-seller-scrub.ts).
function scrubPublicSellers(_req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const json = res.json.bind(res)
  res.json = ((body: any) => {
    scrubNested(body)
    return json(body)
  }) as typeof res.json
  next()
}

// Team size per plan (src/lib/vitrinaki-plans.ts). Runs in front of Mercur's
// own invite/add routes, whose workflows expose no hook for this. Requests that
// are not authenticated, or that target another seller than the vendor's
// selected one, pass through untouched so Mercur's own checks reject them.
async function enforceTeamLimit(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const sellerId = req.params?.id
    const auth = (req as any).auth_context
    if (!sellerId || !auth?.actor_id) return next()
    if (auth.actor_type === "member" && (req as any).seller_context?.seller_id !== sellerId) return next()

    const seats = await teamSeats(req.scope, sellerId)
    if (seats && seats.members + seats.pending >= seats.limit) {
      return res.status(400).json({ type: "not_allowed", message: memberLimitMessage(seats.limit) })
    }
    return next()
  } catch (error) {
    return next(error)
  }
}

// Card payment sessions are charged on the shop's own Stripe account. The
// backend decides which account, never the client: a card session is refused
// unless the whole cart is from one shop with an active Stripe account, and
// that account is written into the session data the provider reads.
async function guardCardPaymentSession(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const body = ((req as any).body || {}) as Record<string, any>
    const data = body.data && typeof body.data === "object" && !Array.isArray(body.data) ? { ...body.data } : {}
    delete data[STRIPE_ACCOUNT_DATA_KEY]
    delete data[SELLER_DATA_KEY]
    if (isStripeProviderId(body.provider_id)) {
      const decision = await cardPaymentForCart(req.scope, { paymentCollectionId: req.params?.id })
      if (!decision.available || !decision.stripeAccount) {
        const message = decision.reason ? cardPaymentMessage[decision.reason] : cardPaymentMessage.not_connected
        return res.status(400).json({ type: "not_allowed", message })
      }
      data[STRIPE_ACCOUNT_DATA_KEY] = decision.stripeAccount
      if (decision.sellerId) data[SELLER_DATA_KEY] = decision.sellerId
    }
    ;(req as any).body = { ...body, data }
    if ((req as any).validatedBody) (req as any).validatedBody = { ...(req as any).validatedBody, data }
    return next()
  } catch (error) {
    return next(error)
  }
}

export default defineMiddlewares({
  routes: [
    { matcher: "/admin/vitrinaki/overview", middlewares: [adminAuth] },
    { matcher: "/vendor/sellers/:id/members", methods: ["POST"], middlewares: [enforceTeamLimit] },
    { matcher: "/admin/sellers/:id/members", methods: ["POST"], middlewares: [enforceTeamLimit] },
    { matcher: "/admin/sellers/:id/members/invite", methods: ["POST"], middlewares: [enforceTeamLimit] },
    { matcher: "/store/sellers*", methods: ["GET"], middlewares: [scrubPublicSellers] },
    { matcher: "/store/offers*", methods: ["GET"], middlewares: [scrubPublicSellers] },
    { matcher: "/store/products*", methods: ["GET"], middlewares: [scrubPublicSellers] },
    { matcher: "/store/vitrinaki/loyalty", methods: ["GET"], middlewares: [customerAuth] },
    { matcher: "/store/vitrinaki/loyalty/redeem", methods: ["POST"], middlewares: [customerAuth] },
    { matcher: "/store/vitrinaki/loyalty/carts/:id", methods: ["GET"], middlewares: [optionalCustomerAuth] },
    { matcher: "/store/payment-collections/:id/payment-sessions", methods: ["POST"], middlewares: [guardCardPaymentSession] },
    {
      matcher: "/webhooks/stripe",
      methods: ["POST"],
      bodyParser: { preserveRawBody: true },
    },
    {
      matcher: "/webhooks/stripe-connect",
      methods: ["POST"],
      bodyParser: { preserveRawBody: true },
    },
  ],
})
