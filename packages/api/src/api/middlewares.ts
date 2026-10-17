import { authenticate, defineMiddlewares } from "@medusajs/medusa"

const sellerAuth = authenticate("seller", ["session", "bearer"])
const adminAuth = authenticate("user", ["session", "bearer", "api-key"])

export default defineMiddlewares({
  routes: [
    { matcher: "/vendor/vitrinaki/storefront", middlewares: [sellerAuth] },
    { matcher: "/vendor/vitrinaki/storefront/domain/verify", middlewares: [sellerAuth] },
    { matcher: "/vendor/vitrinaki/billing", middlewares: [sellerAuth] },
    { matcher: "/vendor/vitrinaki/billing/checkout", middlewares: [sellerAuth] },
    { matcher: "/vendor/vitrinaki/billing/portal", middlewares: [sellerAuth] },
    { matcher: "/vendor/vitrinaki/billing/setup-checkout", middlewares: [sellerAuth] },
    { matcher: "/admin/vitrinaki/overview", middlewares: [adminAuth] },
    {
      matcher: "/webhooks/stripe",
      methods: ["POST"],
      bodyParser: { preserveRawBody: true },
    },
  ],
})
