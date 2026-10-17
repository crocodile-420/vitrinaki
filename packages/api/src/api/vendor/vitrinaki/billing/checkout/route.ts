import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }
const prices: Record<string, Record<string, string>> = {
  starter: { month: "STRIPE_PRICE_STARTER_MONTHLY", year: "STRIPE_PRICE_STARTER_YEARLY" },
  growth: { month: "STRIPE_PRICE_GROWTH_MONTHLY", year: "STRIPE_PRICE_GROWTH_YEARLY" },
  pro: { month: "STRIPE_PRICE_PRO_MONTHLY", year: "STRIPE_PRICE_PRO_YEARLY" },
}

export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ message: "Οι πληρωμές δεν έχουν ρυθμιστεί ακόμη. Δεν έγινε καμία χρέωση." })
  }

  const body = (req.body || {}) as { planId?: string; interval?: string }
  const planId = String(body.planId || "")
  const interval = String(body.interval || "")
  if (!prices[planId] || !["month", "year"].includes(interval)) {
    return res.status(400).json({ message: "Διάλεξε έγκυρο πλάνο και περίοδο χρέωσης." })
  }
  const priceId = process.env[prices[planId][interval]]
  if (!priceId) return res.status(503).json({ message: "Το συγκεκριμένο πλάνο δεν έχει ρυθμιστεί στο Stripe. Δεν έγινε καμία χρέωση." })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "seller", fields: ["id", "name", "handle", "email", "metadata"], filters: { id: sellerId } })
  const seller = data?.[0] as any
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })
  const current = seller.metadata?.vitrinaki_subscription
  if (current && ["active", "trialing", "past_due", "unpaid"].includes(String(current.status))) {
    return res.status(409).json({ message: "Υπάρχει ήδη ενεργή συνδρομή ή εκκρεμεί πληρωμή. Χρησιμοποίησε τη διαχείριση συνδρομής." })
  }

  const studioUrl = (process.env.VITRINAKI_STUDIO_URL || process.env.NEXT_PUBLIC_VENDOR_URL || "http://localhost:7001").replace(/\/+$/, "")
  const form = new URLSearchParams({
    mode: "subscription",
    success_url: `${studioUrl}/vitrinaki-storefront?billing=success`,
    cancel_url: `${studioUrl}/vitrinaki-storefront?billing=cancelled`,
    client_reference_id: sellerId,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "metadata[seller_id]": sellerId,
    "metadata[plan_id]": planId,
    "metadata[billing_interval]": interval,
    "subscription_data[metadata][seller_id]": sellerId,
    "subscription_data[metadata][plan_id]": planId,
    "subscription_data[metadata][billing_interval]": interval,
  })
  if (seller.email) form.set("customer_email", seller.email)
  if (current?.stripeCustomerId) {
    form.delete("customer_email")
    form.set("customer", String(current.stripeCustomerId))
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  })
  const session = await response.json() as { id?: string; url?: string; customer?: string; error?: { message?: string } }
  if (!response.ok || !session.id || !session.url) {
    return res.status(502).json({ message: session.error?.message || "Δεν ήταν δυνατή η δημιουργία συνδρομής στο Stripe." })
  }

  const metadata = { ...(seller.metadata || {}), vitrinaki_subscription: {
    status: "incomplete",
    planId,
    interval,
    stripePriceId: priceId,
    stripeCheckoutSessionId: session.id,
    stripeCustomerId: session.customer || current?.stripeCustomerId || null,
    cancelAtPeriodEnd: false,
    updatedAt: new Date().toISOString(),
  } }
  await updateSellersWorkflow(req.scope).run({ input: { selector: { id: sellerId }, update: { metadata } } })
  return res.json({ url: session.url, sessionId: session.id })
}
