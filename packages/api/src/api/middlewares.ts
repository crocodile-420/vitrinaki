import { authenticate, defineMiddlewares } from "@medusajs/framework/http"

// Vendor routes need no entry here: Mercur's /vendor/* middleware already
// authenticates the member and sets req.seller_context from x-seller-id.
const adminAuth = authenticate("user", ["session", "bearer", "api-key"])

export default defineMiddlewares({
  routes: [
    { matcher: "/admin/vitrinaki/overview", middlewares: [adminAuth] },
    {
      matcher: "/webhooks/stripe",
      methods: ["POST"],
      bodyParser: { preserveRawBody: true },
    },
  ],
})
