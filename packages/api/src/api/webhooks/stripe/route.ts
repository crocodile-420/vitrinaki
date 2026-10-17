import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"
import { createHmac, timingSafeEqual } from "node:crypto"

type StripeEvent = { id: string; type: string; data: { object: Record<string, any> } }

function verifySignature(rawBody: string, header: string, secret: string) {
  const parts = header.split(",").map(value => value.trim().split("="))
  const timestamp = parts.find(([key]) => key === "t")?.[1]
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value)
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return false
  const seconds = Number(timestamp)
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest()
  return signatures.some(value => {
    if (!/^[a-f0-9]{64}$/i.test(value)) return false
    const actual = Buffer.from(value, "hex")
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  })
}

const fromUnix = (value: unknown) => {
  const seconds = typeof value === "number" ? value : Number(value)
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return res.status(503).json({ message: "Το Stripe webhook δεν έχει ρυθμιστεί." })
  const header = req.headers["stripe-signature"]
  const signature = Array.isArray(header) ? header[0] : header
  const raw = (req as unknown as { rawBody?: string | Buffer }).rawBody
  if (!signature || raw === undefined || raw === null) return res.status(400).json({ message: "Λείπει η υπογραφή ή το raw body του Stripe." })
  const rawBody = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw)
  if (!verifySignature(rawBody, signature, secret)) return res.status(400).json({ message: "Η υπογραφή του Stripe δεν είναι έγκυρη." })

  let event: StripeEvent
  try { event = JSON.parse(rawBody) as StripeEvent } catch { return res.status(400).json({ message: "Το event του Stripe δεν είναι έγκυρο JSON." }) }

  const object = event.data?.object || {}
  const supported = [
    "checkout.session.completed", "checkout.session.async_payment_succeeded",
    "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted",
    "invoice.paid", "invoice.payment_failed",
  ]
  if (!supported.includes(event.type)) return res.json({ received: true, ignored: true })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  let sellerId = String(object.metadata?.seller_id || object.client_reference_id || object.subscription_details?.metadata?.seller_id || object.parent?.subscription_details?.metadata?.seller_id || "")
  const subObject = event.type.startsWith("customer.subscription.")
  const subscriptionId = subObject ? String(object.id || "") : String(object.subscription || object.parent?.subscription_details?.subscription || "")
  if (!sellerId && subscriptionId) {
    const all = await query.graph({ entity: "seller", fields: ["id", "metadata"], filters: {} , pagination: { take: 1000 } })
    const match = (all.data || []).find((entry: any) => entry.metadata?.vitrinaki_subscription?.stripeSubscriptionId === subscriptionId)
    sellerId = String((match as any)?.id || "")
  }
  if (!sellerId) return res.json({ received: true, ignored: true, reason: "No seller matched the event." })

  const { data } = await query.graph({ entity: "seller", fields: ["id", "metadata"], filters: { id: sellerId } })
  const seller = data?.[0] as any
  if (!seller) return res.json({ received: true, ignored: true, reason: "Seller no longer exists." })

  const metadata = { ...(seller.metadata || {}) }
  const subscription = { ...(metadata.vitrinaki_subscription || {}) }
  if (subscription.lastEventId === event.id) return res.json({ received: true, duplicate: true })

  const isSetup = event.type.startsWith("checkout.session.") && (object.mode === "payment" || object.metadata?.order_type === "setup_service")
  if (isSetup) {
    const orders = Array.isArray(metadata.vitrinaki_setup_orders) ? metadata.vitrinaki_setup_orders : []
    const paid = event.type === "checkout.session.async_payment_succeeded" || object.payment_status === "paid"
    const next = orders.map((order: any) => order.id === object.id ? {
      ...order,
      status: paid ? "paid" : order.status,
      paymentIntentId: object.payment_intent || order.paymentIntentId || null,
      amountTotal: object.amount_total ?? order.amountTotal ?? null,
      currency: object.currency || order.currency || "eur",
      paidAt: paid ? new Date().toISOString() : order.paidAt || null,
      lastEventId: event.id,
    } : order)
    metadata.vitrinaki_setup_orders = next
    await updateSellersWorkflow(req.scope).run({ input: { selector: { id: sellerId }, update: { metadata } } })
    return res.json({ received: true, setupOrderUpdated: true })
  }

  const subscriptionMetadata = object.metadata || object.subscription_details?.metadata || object.parent?.subscription_details?.metadata || {}
  const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id
  let status = subscription.status || "incomplete"
  let periodStart = subscription.currentPeriodStart || null
  let periodEnd = subscription.currentPeriodEnd || null
  let cancelAtPeriodEnd = Boolean(subscription.cancelAtPeriodEnd)
  if (subObject) {
    status = object.status === "incomplete_expired" ? "canceled" : String(object.status || "incomplete")
    periodStart = fromUnix(object.current_period_start)
    periodEnd = fromUnix(object.current_period_end)
    cancelAtPeriodEnd = Boolean(object.cancel_at_period_end)
  } else if (event.type === "invoice.paid") status = "active"
  else if (event.type === "invoice.payment_failed") status = "past_due"

  const nextSubscription = {
    ...subscription,
    status,
    planId: ["starter", "growth", "pro"].includes(String(subscriptionMetadata.plan_id)) ? subscriptionMetadata.plan_id : subscription.planId,
    interval: ["month", "year"].includes(String(subscriptionMetadata.billing_interval)) ? subscriptionMetadata.billing_interval : subscription.interval,
    stripeCustomerId: customerId || subscription.stripeCustomerId || null,
    stripeSubscriptionId: subscriptionId || subscription.stripeSubscriptionId || null,
    stripePriceId: object.items?.data?.[0]?.price?.id || subscription.stripePriceId || null,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd,
    lastEventId: event.id,
    updatedAt: new Date().toISOString(),
  }
  metadata.vitrinaki_subscription = nextSubscription

  if (!["active", "trialing"].includes(status)) {
    const storefront = { ...(metadata.vitrinaki_storefront || {}) }
    if (storefront.isPublished) {
      storefront.isPublished = false
      storefront.publishedAt = null
      metadata.vitrinaki_storefront = storefront
      const url = metadata.storefront_url
      if (typeof url === "string" && url.includes(`/store/${seller.handle || ""}`)) delete metadata.storefront_url
    }
  }

  await updateSellersWorkflow(req.scope).run({ input: { selector: { id: sellerId }, update: { metadata } } })
  return res.json({ received: true, subscriptionStatus: status })
}
