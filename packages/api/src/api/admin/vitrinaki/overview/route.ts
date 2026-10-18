import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "handle", "email", "status", "metadata", "created_at"],
    filters: {},
    pagination: { take: 500 },
  })

  const sellers = (data || []) as any[]
  const storefronts = sellers
    .filter(seller => seller.metadata?.vitrinaki_storefront)
    .map(seller => {
      const store = seller.metadata.vitrinaki_storefront
      const subscription = seller.metadata.vitrinaki_subscription || null
      return {
        sellerId: seller.id,
        businessName: seller.name,
        handle: seller.handle,
        status: seller.status,
        email: seller.email,
        createdAt: seller.created_at,
        storefront: {
          name: store.storeName || seller.name,
          template: store.template || "atelier",
          palette: store.palette || "forest",
          isPublished: Boolean(store.isPublished),
          customDomain: store.customDomain || "",
          domainStatus: store.domainStatus || "not_configured",
          publishedAt: store.publishedAt || null,
        },
        subscription: subscription ? {
          planId: subscription.planId || subscription.plan_id || "starter",
          interval: subscription.interval || subscription.billing_interval || "month",
          status: subscription.status || "incomplete",
          currentPeriodEnd: subscription.currentPeriodEnd || subscription.current_period_end || null,
          cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd || subscription.cancel_at_period_end),
        } : null,
        setupOrders: Array.isArray(seller.metadata?.vitrinaki_setup_orders)
          ? seller.metadata.vitrinaki_setup_orders.slice(-10).reverse()
          : [],
      }
    })

  return res.json({
    summary: {
      businesses: sellers.length,
      storefronts: storefronts.length,
      published: storefronts.filter(item => item.storefront.isPublished).length,
      subscriptionsActive: storefronts.filter(item => ["active", "trialing"].includes(String(item.subscription?.status || ""))).length,
      subscriptionsPastDue: storefronts.filter(item => ["past_due", "unpaid"].includes(String(item.subscription?.status || ""))).length,
      domainsPending: storefronts.filter(item => item.storefront.customDomain && item.storefront.domainStatus !== "verified").length,
    },
    storefronts,
    billingConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    customDomainTargetConfigured: Boolean(process.env.VITRINAKI_CUSTOM_DOMAIN_TARGET),
  })
}
