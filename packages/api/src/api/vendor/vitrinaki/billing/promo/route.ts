import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

import { isPlanId, type PlanId } from "../../../../../lib/vitrinaki-plans"
import { laterPeriodEnd } from "../../../../../lib/vitrinaki-referral"
import { applyPendingReferralRewards, loadSeller } from "../../../../../lib/vitrinaki-referral-rewards"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

// Promo codes activate a subscription without Stripe (testing, early
// customers). Codes live in VITRINAKI_PROMO_CODES as "CODE:plan:days",
// comma separated; plan is one of PLAN_IDS (starter, growth, pro, business),
// defaults to starter; days is optional and omitted means no expiry. A code
// naming an unknown plan is ignored rather than granting a plan that has no limits.
type PromoCode = { code: string; planId: PlanId; days: number | null }

function configuredCodes(): PromoCode[] {
  return (process.env.VITRINAKI_PROMO_CODES || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [code, planId = "starter", days] = entry.split(":")
      const parsedDays = Number(days)
      return {
        code: code.trim().toUpperCase(),
        planId: planId.trim().toLowerCase() || "starter",
        days: Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : null,
      }
    })
    .filter((entry): entry is PromoCode => isPlanId(entry.planId))
}

export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })

  // Only the code part counts, so "VITRINAKI-TEST:pro" copied from the .env works too.
  const code = String((req.body as { code?: string } | undefined)?.code || "").split(":")[0].trim().toUpperCase()
  const promo = configuredCodes().find((entry) => entry.code === code)
  if (!code || !promo) return res.status(400).json({ message: "Ο κωδικός δεν είναι έγκυρος." })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "seller", fields: ["id", "metadata"], filters: { id: sellerId } })
  const seller = data?.[0] as any
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })

  const current = seller.metadata?.vitrinaki_subscription
  if (current?.stripeSubscriptionId && ["active", "trialing", "past_due"].includes(String(current.status))) {
    return res.status(409).json({ message: "Υπάρχει ήδη συνδρομή μέσω Stripe. Δεν χρειάζεται κωδικός." })
  }

  // A later end already on the subscription (e.g. a referral extension) is kept.
  const currentPeriodEnd = laterPeriodEnd(
    promo.days ? new Date(Date.now() + promo.days * 24 * 60 * 60 * 1000).toISOString() : null,
    current?.currentPeriodEnd
  )
  const metadata = {
    ...(seller.metadata || {}),
    vitrinaki_subscription: {
      status: "active",
      source: "promo",
      promoCode: promo.code,
      planId: promo.planId,
      interval: null,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      updatedAt: new Date().toISOString(),
    },
  }
  await updateSellersWorkflow(req.scope).run({ input: { selector: { id: sellerId }, update: { metadata } } })

  // Free months from referrals that were waiting for a subscription extend the promo.
  let end = currentPeriodEnd
  if (currentPeriodEnd) {
    const { applied } = await applyPendingReferralRewards(req.scope, sellerId).catch(() => ({ applied: 0 }))
    if (applied) end = (await loadSeller(req.scope, sellerId))?.metadata?.vitrinaki_subscription?.currentPeriodEnd || end
  }
  return res.json({ status: "active", planId: promo.planId, currentPeriodEnd: end })
}
