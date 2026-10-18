import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ message: "Οι πληρωμές δεν έχουν ρυθμιστεί ακόμη. Δεν έγινε καμία χρέωση." })
  }

  const body = (req.body || {}) as { packageId?: string }
  const packageId = String(body.packageId || "")
  const envKey = packageId === "assisted"
    ? "STRIPE_PRICE_SETUP_ASSISTED"
    : packageId === "done_for_you"
      ? "STRIPE_PRICE_SETUP_DONE_FOR_YOU"
      : null
  if (!envKey) return res.status(400).json({ message: "Διάλεξε έγκυρη υπηρεσία setup." })
  const priceId = process.env[envKey]
  if (!priceId) return res.status(503).json({ message: "Αυτή η υπηρεσία δεν έχει ρυθμιστεί ακόμη στο Stripe. Δεν έγινε καμία χρέωση." })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "seller", fields: ["id", "name", "handle", "email", "metadata"], filters: { id: sellerId } })
  const seller = data?.[0] as any
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })

  const studioUrl = (process.env.VITRINAKI_STUDIO_URL || process.env.NEXT_PUBLIC_VENDOR_URL || "http://localhost:7001").replace(/\/+$/, "")
  const form = new URLSearchParams({
    mode: "payment",
    success_url: `${studioUrl}/vitrinaki-storefront?setup=success`,
    cancel_url: `${studioUrl}/vitrinaki-storefront?setup=cancelled`,
    client_reference_id: sellerId,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "metadata[order_type]": "setup_service",
    "metadata[seller_id]": sellerId,
    "metadata[setup_package]": packageId,
    "payment_intent_data[metadata][order_type]": "setup_service",
    "payment_intent_data[metadata][seller_id]": sellerId,
    "payment_intent_data[metadata][setup_package]": packageId,
  })
  if (seller.email) form.set("customer_email", seller.email)

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  })
  const session = await response.json() as { id?: string; url?: string; amount_total?: number; currency?: string; error?: { message?: string } }
  if (!response.ok || !session.url || !session.id) return res.status(502).json({ message: session.error?.message || "Δεν ήταν δυνατή η δημιουργία checkout." })

  const metadata = { ...(seller.metadata || {}) }
  const orders = Array.isArray(metadata.vitrinaki_setup_orders) ? metadata.vitrinaki_setup_orders : []
  metadata.vitrinaki_setup_orders = [...orders, {
    id: session.id, packageId, status: "checkout_created", amountTotal: session.amount_total || null,
    currency: session.currency || "eur", createdAt: new Date().toISOString(),
  }].slice(-50)
  await updateSellersWorkflow(req.scope).run({ input: { selector: { id: sellerId }, update: { metadata } } })
  return res.json({ url: session.url, sessionId: session.id })
}
