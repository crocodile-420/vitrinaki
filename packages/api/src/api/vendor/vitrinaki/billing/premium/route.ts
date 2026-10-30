import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

import { PREMIUM_PRICE_ENV, premiumIncluded } from "../../../../../lib/vitrinaki-premium"
import { activePlanId } from "../../../../../lib/vitrinaki-plans"

// Adds the Premium add-on to a running subscription, or takes it off.
// Adding invoices at once: the one-off activation plus the rest of this
// month's add-on. Removing stops it from the next invoice. The webhook keeps
// subscription.premium in step with Stripe; it is set here too so the Studio
// shows the change straight away.

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

const stripe = (path: string, method: string, body?: URLSearchParams) =>
  fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  }).then(async (response) => ({ ok: response.ok, json: (await response.json()) as any }))

export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  const monthPrice = process.env[PREMIUM_PRICE_ENV.month]
  if (!process.env.STRIPE_SECRET_KEY || !monthPrice) {
    return res.status(503).json({ message: "Η προσθήκη Premium δεν έχει ρυθμιστεί ακόμη στο Stripe. Δεν έγινε καμία χρέωση." })
  }
  const action = String((req.body as { action?: string } | undefined)?.action || "")
  if (action !== "add" && action !== "remove") return res.status(400).json({ message: "Άγνωστη ενέργεια." })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "seller", fields: ["id", "metadata"], filters: { id: sellerId } })
  const seller = data?.[0] as any
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })
  const subscription = seller.metadata?.vitrinaki_subscription
  const planId = activePlanId(subscription)
  if (!planId || !subscription?.stripeSubscriptionId) {
    return res.status(409).json({ message: "Χρειάζεται πρώτα ενεργή συνδρομή. Διάλεξε πακέτο και πρόσθεσε το Premium στην ίδια πληρωμή." })
  }
  if (premiumIncluded(planId)) return res.status(409).json({ message: "Το πακέτο σου περιλαμβάνει ήδη όλα τα premium πρότυπα." })

  const current = await stripe(`subscriptions/${subscription.stripeSubscriptionId}`, "GET")
  if (!current.ok) return res.status(502).json({ message: current.json?.error?.message || "Δεν ήταν δυνατή η ανάγνωση της συνδρομής από το Stripe." })
  const item = (current.json.items?.data || []).find((entry: any) => entry?.price?.id === monthPrice)

  if (action === "add" && !item) {
    const form = new URLSearchParams({
      "items[0][price]": monthPrice,
      "items[0][quantity]": "1",
      proration_behavior: "always_invoice",
      "metadata[premium]": "true",
    })
    const activation = process.env[PREMIUM_PRICE_ENV.activation]
    if (activation) form.set("add_invoice_items[0][price]", activation)
    const updated = await stripe(`subscriptions/${subscription.stripeSubscriptionId}`, "POST", form)
    if (!updated.ok) return res.status(502).json({ message: updated.json?.error?.message || "Δεν ήταν δυνατή η προσθήκη του Premium στο Stripe." })
  }
  if (action === "remove" && item) {
    const removed = await stripe(`subscription_items/${item.id}?proration_behavior=none`, "DELETE")
    if (!removed.ok) return res.status(502).json({ message: removed.json?.error?.message || "Δεν ήταν δυνατή η αφαίρεση του Premium στο Stripe." })
  }

  const premium = action === "add"
  const metadata = { ...(seller.metadata || {}), vitrinaki_subscription: { ...subscription, premium, updatedAt: new Date().toISOString() } }
  await updateSellersWorkflow(req.scope).run({ input: { selector: { id: sellerId }, update: { metadata } } })
  return res.json({ premium })
}
