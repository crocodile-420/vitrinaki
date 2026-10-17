import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }
const planPrices = {
  starter: { month: "STRIPE_PRICE_STARTER_MONTHLY", year: "STRIPE_PRICE_STARTER_YEARLY" },
  growth: { month: "STRIPE_PRICE_GROWTH_MONTHLY", year: "STRIPE_PRICE_GROWTH_YEARLY" },
  pro: { month: "STRIPE_PRICE_PRO_MONTHLY", year: "STRIPE_PRICE_PRO_YEARLY" },
} as const

export async function GET(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })

  const { data } = await req.scope.resolve(ContainerRegistrationKeys.QUERY).graph({
    entity: "seller",
    fields: ["id", "metadata"],
    filters: { id: sellerId },
  })
  const seller = data?.[0] as any
  const subscription = seller?.metadata?.vitrinaki_subscription || null
  return res.json({
    billingConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    plans: Object.entries(planPrices).map(([id, values]) => ({
      id,
      availableIntervals: (Object.entries(values) as [keyof typeof values, string][])
        .filter(([, key]) => Boolean(process.env[key]))
        .map(([interval]) => interval),
    })),
    setupServices: {
      assisted: Boolean(process.env.STRIPE_PRICE_SETUP_ASSISTED),
      done_for_you: Boolean(process.env.STRIPE_PRICE_SETUP_DONE_FOR_YOU),
    },
    subscription: subscription ? {
      planId: subscription.planId || subscription.plan_id,
      interval: subscription.interval || subscription.billing_interval,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd || subscription.current_period_end,
      cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd || subscription.cancel_at_period_end),
    } : null,
    setupOrders: Array.isArray(seller?.metadata?.vitrinaki_setup_orders)
      ? seller.metadata.vitrinaki_setup_orders.slice(-20).reverse()
      : [],
  })
}
