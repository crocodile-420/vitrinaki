import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ message: "Η διαχείριση συνδρομής δεν είναι διαθέσιμη ακόμη." })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "seller", fields: ["id", "metadata"], filters: { id: sellerId } })
  const seller = data?.[0] as any
  const customerId = seller?.metadata?.vitrinaki_subscription?.stripeCustomerId
  if (!customerId) return res.status(404).json({ message: "Δεν βρέθηκε λογαριασμός χρέωσης. Ξεκίνα πρώτα μια συνδρομή." })

  const studioUrl = (process.env.VITRINAKI_STUDIO_URL || process.env.NEXT_PUBLIC_VENDOR_URL || "http://localhost:7001").replace(/\/+$/, "")
  const form = new URLSearchParams({ customer: String(customerId), return_url: `${studioUrl}/vitrinaki-storefront?billing=returned` })
  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  })
  const session = await response.json() as { url?: string; error?: { message?: string } }
  if (!response.ok || !session.url) return res.status(502).json({ message: session.error?.message || "Δεν ήταν δυνατή η δημιουργία της πύλης χρέωσης." })
  return res.json({ url: session.url })
}
