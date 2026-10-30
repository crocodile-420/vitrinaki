import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { premiumActive, premiumConfigured, premiumIncluded } from "../../../../lib/vitrinaki-premium"
import { activePlanId, availablePlanIntervals, PLAN_IDS, PLAN_MEMBER_LIMITS } from "../../../../lib/vitrinaki-plans"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

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
  const intervals = availablePlanIntervals()
  return res.json({
    billingConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    plans: PLAN_IDS.map((id) => ({
      id,
      memberLimit: PLAN_MEMBER_LIMITS[id],
      availableIntervals: intervals[id],
    })),
    setupServices: {
      assisted: Boolean(process.env.STRIPE_PRICE_SETUP_ASSISTED),
      done_for_you: Boolean(process.env.STRIPE_PRICE_SETUP_DONE_FOR_YOU),
    },
    premium: {
      configured: premiumConfigured(),
      included: (() => { const planId = activePlanId(subscription); return planId ? premiumIncluded(planId) : false })(),
      active: premiumActive(subscription),
    },
    subscription: subscription ? {
      planId: subscription.planId || subscription.plan_id,
      interval: subscription.interval || subscription.billing_interval,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd || subscription.current_period_end,
      cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd || subscription.cancel_at_period_end),
      premium: Boolean(subscription.premium),
    } : null,
    setupOrders: Array.isArray(seller?.metadata?.vitrinaki_setup_orders)
      ? seller.metadata.vitrinaki_setup_orders.slice(-20).reverse()
      : [],
  })
}
