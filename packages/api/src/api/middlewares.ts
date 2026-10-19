import {
  authenticate,
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import { scrubNested } from "../lib/public-seller-scrub"

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

export default defineMiddlewares({
  routes: [
    { matcher: "/admin/vitrinaki/overview", middlewares: [adminAuth] },
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
