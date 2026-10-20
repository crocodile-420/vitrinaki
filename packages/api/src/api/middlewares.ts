import {
  authenticate,
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import { scrubNested } from "../lib/public-seller-scrub"
import { memberLimitMessage } from "../lib/vitrinaki-plans"
import { teamSeats } from "../lib/vitrinaki-team-limit"

// Vendor routes need no entry here: Mercur's /vendor/* middleware already
// authenticates the member and sets req.seller_context from x-seller-id.
const adminAuth = authenticate("user", ["session", "bearer", "api-key"])

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

export default defineMiddlewares({
  routes: [
    { matcher: "/admin/vitrinaki/overview", middlewares: [adminAuth] },
    { matcher: "/vendor/sellers/:id/members", methods: ["POST"], middlewares: [enforceTeamLimit] },
    { matcher: "/admin/sellers/:id/members", methods: ["POST"], middlewares: [enforceTeamLimit] },
    { matcher: "/admin/sellers/:id/members/invite", methods: ["POST"], middlewares: [enforceTeamLimit] },
    { matcher: "/store/sellers*", methods: ["GET"], middlewares: [scrubPublicSellers] },
    { matcher: "/store/offers*", methods: ["GET"], middlewares: [scrubPublicSellers] },
    { matcher: "/store/products*", methods: ["GET"], middlewares: [scrubPublicSellers] },
    {
      matcher: "/webhooks/stripe",
      methods: ["POST"],
      bodyParser: { preserveRawBody: true },
    },
  ],
})
