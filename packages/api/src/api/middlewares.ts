import { authenticate, defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/vendor/vitrinaki/*",
      middlewares: [authenticate("seller", ["session", "bearer"])],
    },
    {
      matcher: "/admin/vitrinaki/*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/webhooks/stripe",
      methods: ["POST"],
      bodyParser: { preserveRawBody: true },
    },
  ],
})
