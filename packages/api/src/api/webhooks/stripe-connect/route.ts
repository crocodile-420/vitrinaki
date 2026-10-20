import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules, PaymentWebhookEvents } from "@medusajs/framework/utils"

import {
  connectStateFromAccount,
  STRIPE_CONNECT_METADATA_KEY,
  STRIPE_WEBHOOK_PROVIDER,
  verifyStripeSignature,
} from "../../../lib/stripe-connect"
import { saveConnectState } from "../../../lib/stripe-connect-seller"

// The one Stripe "Connect" webhook endpoint (events on connected accounts).
// - account.updated / account.application.deauthorized: the shop's status.
// - payment_intent.*: handed to Medusa's payment webhook pipeline for the
//   "stripe" provider, exactly like /hooks/payment/stripe_stripe would.
// Subscription billing keeps its own endpoint, /webhooks/stripe.
type ConnectEvent = { id: string; type: string; account?: string; created?: number; data: { object: Record<string, any> } }

async function findSeller(req: MedusaRequest, accountId: string, hintSellerId?: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const matches = (seller: any) => seller?.metadata?.[STRIPE_CONNECT_METADATA_KEY]?.accountId === accountId
  if (hintSellerId) {
    const { data } = await query.graph({ entity: "seller", fields: ["id", "metadata"], filters: { id: hintSellerId } })
    if (matches(data?.[0])) return data[0] as any
  }
  const { data } = await query.graph({ entity: "seller", fields: ["id", "metadata"], filters: {}, pagination: { take: 5000 } })
  return ((data || []) as any[]).find(matches) || null
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET
  if (!secret) return res.status(503).json({ message: "Το Stripe Connect webhook δεν έχει ρυθμιστεί." })
  const header = req.headers["stripe-signature"]
  const signature = Array.isArray(header) ? header[0] : header
  const raw = (req as unknown as { rawBody?: string | Buffer }).rawBody
  if (!signature || raw === undefined || raw === null) return res.status(400).json({ message: "Λείπει η υπογραφή ή το raw body του Stripe." })
  const rawBody = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw)
  if (!verifyStripeSignature(rawBody, signature, secret)) return res.status(400).json({ message: "Η υπογραφή του Stripe δεν είναι έγκυρη." })

  let event: ConnectEvent
  try { event = JSON.parse(rawBody) as ConnectEvent } catch { return res.status(400).json({ message: "Το event του Stripe δεν είναι έγκυρο JSON." }) }

  if (event.type.startsWith("payment_intent.")) {
    // Same event Medusa's /hooks/payment/:provider route emits; the provider
    // verifies the signature again with the same secret.
    const eventBus = req.scope.resolve(Modules.EVENT_BUS)
    await eventBus.emit(
      {
        name: PaymentWebhookEvents.WebhookReceived,
        data: { provider: STRIPE_WEBHOOK_PROVIDER, payload: { data: event, rawData: Buffer.isBuffer(raw) ? raw : Buffer.from(rawBody), headers: req.headers } },
      },
      { delay: 5000, attempts: 3 }
    )
    return res.json({ received: true, forwarded: "payment" })
  }

  if (event.type === "account.updated" || event.type === "account.application.deauthorized") {
    const accountId = event.type === "account.updated" ? String(event.data?.object?.id || event.account || "") : String(event.account || "")
    if (!accountId) return res.json({ received: true, ignored: true })
    const seller = await findSeller(req, accountId, event.data?.object?.metadata?.seller_id)
    if (!seller) return res.json({ received: true, ignored: true, reason: "No seller has this account." })
    const stored = seller.metadata?.[STRIPE_CONNECT_METADATA_KEY] || {}
    // Stripe does not guarantee order; ignore an event older than the last one applied.
    if (event.created && stored.eventCreated && event.created < stored.eventCreated) return res.json({ received: true, stale: true })

    if (event.type === "account.application.deauthorized") {
      // The shop disconnected Vitrinaki from its Stripe account.
      await saveConnectState(req.scope, seller, {
        accountId: null, status: "not_connected", chargesEnabled: false, payoutsEnabled: false,
        detailsSubmitted: false, requirementsDue: [], disabledReason: null, eventCreated: event.created ?? null,
      })
      return res.json({ received: true, status: "not_connected" })
    }
    const next = await saveConnectState(req.scope, seller, { ...connectStateFromAccount(event.data.object), eventCreated: event.created ?? null })
    return res.json({ received: true, status: next.status })
  }

  return res.json({ received: true, ignored: true })
}
