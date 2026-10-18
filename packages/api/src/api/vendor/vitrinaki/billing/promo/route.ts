import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

// Promo codes activate a subscription without Stripe (testing, early
// customers). Codes live in VITRINAKI_PROMO_CODES as "CODE:plan:days",
// comma separated; days is optional and omitted means no expiry.
type PromoCode = { code: string; planId: string; days: number | null }

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
        planId: planId.trim() || "starter",
        days: Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : null,
      }
    })
}

export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })

  const code = String((req.body as { code?: string } | undefined)?.code || "").trim().toUpperCase()
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

  const currentPeriodEnd = promo.days
    ? new Date(Date.now() + promo.days * 24 * 60 * 60 * 1000).toISOString()
    : null
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
  return res.json({ status: "active", planId: promo.planId, currentPeriodEnd })
}
