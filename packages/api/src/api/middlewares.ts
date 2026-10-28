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
import { memberLimitMessage, productLimitMessage } from "../lib/vitrinaki-plans"
import { exceedsProductLimit } from "../lib/vitrinaki-product-limit"
import { addStorageUsage, storageLimitBytes, storageLimitMessage, storageUsedBytes, wouldExceedStorage } from "../lib/vitrinaki-storage"
import { keepServerOwnedMetadata } from "../lib/server-metadata"
import { loadSeller } from "../lib/vitrinaki-referral-rewards"
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

// Products per plan (PLAN_FEATURES.products): a new product, or an offer on a
// product the shop does not sell yet, is refused once the shop is at its limit.
// Runs in front of Mercur's own routes, like the team limit above.
async function enforceProductLimit(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const sellerId = (req as any).seller_context?.seller_id
    if (!sellerId) return next()
    const body = ((req as any).validatedBody || (req as any).body || {}) as Record<string, any>
    const path = String(req.originalUrl || req.url || "").split("?")[0]
    const adding = /\/vendor\/products\/?$/.test(path)
      ? { newProducts: 1 }
      : { variantIds: (Array.isArray(body.offers) ? body.offers : [body]).map((offer: any) => String(offer?.variant_id || "")) }
    const limit = await exceedsProductLimit(req.scope, sellerId, adding)
    if (limit !== null) return res.status(400).json({ type: "not_allowed", message: productLimitMessage(limit) })
    return next()
  } catch (error) {
    return next(error)
  }
}

// Space per plan (PLAN_FEATURES.storageGb) for Studio uploads. Before Mercur's
// upload route: refuse when the request would go over the limit (its size is
// known from Content-Length before the files are parsed). After a successful
// upload: add the files' size to the shop's usage.
async function enforceStorageLimit(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const sellerId = (req as any).seller_context?.seller_id
    if (!sellerId) return next()
    const seller = await loadSeller(req.scope, sellerId)
    if (!seller) return next()
    const limit = storageLimitBytes(seller.metadata?.vitrinaki_subscription)
    const incoming = Number(req.headers["content-length"] || 0)
    if (wouldExceedStorage(storageUsedBytes(seller.metadata), incoming, limit)) {
      return res.status(400).json({ type: "not_allowed", message: storageLimitMessage(limit) })
    }
    const json = res.json.bind(res)
    res.json = ((body: any) => {
      if (res.statusCode < 400) {
        const files = ((req as any).files || []) as { size?: number }[]
        const bytes = files.reduce((sum, file) => sum + (Number(file.size) || 0), 0) || incoming
        addStorageUsage(req.scope, sellerId, bytes).catch((error) =>
          req.scope.resolve("logger").error(`[vitrinaki/storage] ${sellerId}: ${error instanceof Error ? error.message : String(error)}`)
        )
      }
      return json(body)
    }) as typeof res.json
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

// Server-owned seller.metadata keys (subscription, Stripe Connect account,
// referral programme; see src/lib/server-metadata.ts) are written only by the
// backend. Mercur's vendor seller routes accept any metadata, so here the
// client's copy of those keys is replaced by the stored one (or dropped when
// there is none, e.g. on create).
async function keepServerOwnedSellerMetadata(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const bodies = [(req as any).body, (req as any).validatedBody].filter((body) => body?.metadata && typeof body.metadata === "object")
    if (!bodies.length) return next()
    // POST /vendor/sellers creates a shop: nothing stored, forged keys dropped.
    const isMe = /\/vendor\/sellers\/me\/?$/.test(String(req.originalUrl || req.url || "").split("?")[0]) || req.params?.id === "me"
    const sellerId = isMe ? (req as any).seller_context?.seller_id : req.params?.id
    const stored = sellerId ? (await loadSeller(req.scope, sellerId))?.metadata : null
    for (const body of bodies) body.metadata = keepServerOwnedMetadata(body.metadata, stored)
    return next()
  } catch (error) {
    return next(error)
  }
}

export default defineMiddlewares({
  routes: [
    { matcher: "/admin/vitrinaki/overview", middlewares: [adminAuth] },
    { matcher: "/admin/vitrinaki/promoted", middlewares: [adminAuth] },
    { matcher: "/vendor/sellers/:id/members", methods: ["POST"], middlewares: [enforceTeamLimit] },
    { matcher: "/admin/sellers/:id/members", methods: ["POST"], middlewares: [enforceTeamLimit] },
    { matcher: "/admin/sellers/:id/members/invite", methods: ["POST"], middlewares: [enforceTeamLimit] },
    { matcher: "/vendor/products", methods: ["POST"], middlewares: [enforceProductLimit] },
    { matcher: "/vendor/uploads", methods: ["POST"], middlewares: [enforceStorageLimit] },
    { matcher: "/vendor/offers", methods: ["POST"], middlewares: [enforceProductLimit] },
    { matcher: "/vendor/offers/batch", methods: ["POST"], middlewares: [enforceProductLimit] },
    { matcher: "/vendor/sellers", methods: ["POST"], middlewares: [keepServerOwnedSellerMetadata] },
    { matcher: "/vendor/sellers/:id", methods: ["POST"], middlewares: [keepServerOwnedSellerMetadata] },
    // Its own static route, which the :id matcher above does not reach.
    { matcher: "/vendor/sellers/me", methods: ["POST"], middlewares: [keepServerOwnedSellerMetadata] },
    { matcher: "/store/sellers*", methods: ["GET"], middlewares: [scrubPublicSellers] },
    { matcher: "/store/offers*", methods: ["GET"], middlewares: [scrubPublicSellers] },
    { matcher: "/store/products*", methods: ["GET"], middlewares: [scrubPublicSellers] },
    { matcher: "/store/vitrinaki/loyalty", methods: ["GET"], middlewares: [customerAuth] },
    { matcher: "/store/vitrinaki/loyalty/redeem", methods: ["POST"], middlewares: [customerAuth] },
    { matcher: "/store/vitrinaki/loyalty/carts/:id", methods: ["GET"], middlewares: [optionalCustomerAuth] },
    // Online bookings: a logged-in customer's booking is linked to their account.
    { matcher: "/store/vitrinaki/bookings/shops/:id", methods: ["POST"], middlewares: [optionalCustomerAuth] },
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
