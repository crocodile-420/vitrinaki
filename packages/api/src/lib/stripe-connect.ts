// Card payments go straight to each shop's own Stripe account ("direct
// charges"): the shop is the merchant, Vitrinaki only connects the account.
// This file holds the pure rules (status, availability, fee, amounts) and the
// small REST helper the Studio routes use, so they can be unit tested without
// Stripe keys.
import { BigNumber, MathBN } from "@medusajs/framework/utils"
import { createHmac, timingSafeEqual } from "node:crypto"

// Where the connected account lives: seller.metadata[STRIPE_CONNECT_METADATA_KEY].
export const STRIPE_CONNECT_METADATA_KEY = "vitrinaki_stripe_connect"
// Key in a payment session's / payment's `data` naming the shop's account.
export const STRIPE_ACCOUNT_DATA_KEY = "stripe_account"
export const SELLER_DATA_KEY = "vitrinaki_seller_id"
// Medusa registers the provider as pp_<identifier>_<id>; we keep Medusa's own
// "stripe" identifier and id so the storefront's isStripe() check still works.
export const STRIPE_PROVIDER_ID = "pp_stripe_stripe"
export const STRIPE_WEBHOOK_PROVIDER = "stripe_stripe"

export type ConnectStatus = "not_connected" | "pending" | "active"

export type StoredConnectAccount = {
  accountId?: string | null
  status?: ConnectStatus
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  detailsSubmitted?: boolean
  requirementsDue?: string[]
  disabledReason?: string | null
  eventCreated?: number | null
  updatedAt?: string
}

export const isStripeProviderId = (providerId: unknown) =>
  typeof providerId === "string" && providerId.startsWith("pp_stripe_")

export const cardPaymentsConfigured = (env: NodeJS.ProcessEnv = process.env) =>
  Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_CONNECT_WEBHOOK_SECRET)

// What we keep from a Stripe Account object. "active" means the shop can take
// card payments now (charges_enabled); anything short of that is "pending".
export function connectStateFromAccount(account: Record<string, any>): StoredConnectAccount {
  const chargesEnabled = account?.charges_enabled === true
  const due = [
    ...(account?.requirements?.currently_due || []),
    ...(account?.requirements?.past_due || []),
  ].map(String)
  return {
    accountId: account?.id ? String(account.id) : null,
    status: chargesEnabled ? "active" : "pending",
    chargesEnabled,
    payoutsEnabled: account?.payouts_enabled === true,
    detailsSubmitted: account?.details_submitted === true,
    requirementsDue: Array.from(new Set(due)),
    disabledReason: account?.requirements?.disabled_reason ?? null,
  }
}

export function connectStatusOf(stored: StoredConnectAccount | null | undefined): ConnectStatus {
  if (!stored?.accountId) return "not_connected"
  return stored.status === "active" && stored.chargesEnabled ? "active" : "pending"
}

export type CardPaymentReason = "not_configured" | "empty_cart" | "mixed_shops" | "not_connected" | null
export type CardPaymentDecision = {
  available: boolean
  reason: CardPaymentReason
  sellerId?: string
  stripeAccount?: string
}

// Direct charges have exactly one merchant per payment, so a cart can be paid
// by card only when all of it belongs to one shop and that shop's Stripe
// account is active.
export function decideCardPayment(
  sellerIds: (string | null | undefined)[],
  connectBySeller: Record<string, StoredConnectAccount | null | undefined>,
  configured = cardPaymentsConfigured()
): CardPaymentDecision {
  if (!configured) return { available: false, reason: "not_configured" }
  const unique = Array.from(new Set(sellerIds.filter((id): id is string => typeof id === "string" && id.length > 0)))
  if (!unique.length) return { available: false, reason: "empty_cart" }
  if (unique.length > 1) return { available: false, reason: "mixed_shops" }
  const sellerId = unique[0]
  const stored = connectBySeller[sellerId]
  if (connectStatusOf(stored) !== "active" || !stored?.accountId) {
    return { available: false, reason: "not_connected", sellerId }
  }
  return { available: true, reason: null, sellerId, stripeAccount: stored.accountId }
}

export const cardPaymentMessage: Record<Exclude<CardPaymentReason, null>, string> = {
  not_configured: "Οι πληρωμές με κάρτα δεν έχουν ρυθμιστεί ακόμη.",
  empty_cart: "Το καλάθι είναι άδειο.",
  mixed_shops: "Η πληρωμή με κάρτα γίνεται για ένα κατάστημα τη φορά. Ολοκλήρωσε χωριστά την παραγγελία κάθε καταστήματος.",
  not_connected: "Αυτό το κατάστημα δεν δέχεται ακόμη πληρωμές με κάρτα.",
}

// Optional platform fee on each charge, in percent (STRIPE_APPLICATION_FEE_PERCENT,
// default 0 = no fee). Capped at 20% so a typo can't take a shop's sale.
export function applicationFeePercent(value: unknown = process.env.STRIPE_APPLICATION_FEE_PERCENT): number {
  const percent = Number(value)
  if (!Number.isFinite(percent) || percent <= 0) return 0
  return Math.min(percent, 20)
}

export function applicationFeeAmount(amountMinor: number, percent: number): number {
  if (!(percent > 0) || !(amountMinor > 0)) return 0
  return Math.round((amountMinor * percent) / 100)
}

// Same conversion as Medusa's Stripe provider (its helper is not exported).
function currencyMultiplier(currency: string) {
  const code = String(currency || "").toUpperCase()
  const zero = ["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]
  const three = ["BHD", "IQD", "JOD", "KWD", "OMR", "TND"]
  return Math.pow(10, zero.includes(code) ? 0 : three.includes(code) ? 3 : 2)
}

export function toMinorUnit(amount: unknown, currency: string): number {
  const multiplier = currencyMultiplier(currency)
  const rounded = Math.round(new BigNumber(MathBN.mult(amount as any, multiplier)).numeric) / multiplier
  let numeric = new BigNumber(MathBN.mult(rounded, multiplier)).numeric
  if (multiplier === 1e3) numeric = Math.ceil(numeric / 10) * 10
  return parseInt(numeric.toString().split(".")[0], 10)
}

export function fromMinorUnit(amount: unknown, currency: string): number {
  return new BigNumber(MathBN.div(amount as any, currencyMultiplier(currency))).numeric
}

// Stripe webhook signature check (v1 scheme, 5 minute tolerance).
export function verifyStripeSignature(rawBody: string, header: string, secret: string, nowSeconds = Date.now() / 1000) {
  const parts = header.split(",").map(value => value.trim().split("="))
  const timestamp = parts.find(([key]) => key === "t")?.[1]
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value)
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return false
  const seconds = Number(timestamp)
  if (!Number.isFinite(seconds) || Math.abs(nowSeconds - seconds) > 300) return false
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest()
  return signatures.some(value => {
    if (!/^[a-f0-9]{64}$/i.test(value)) return false
    const actual = Buffer.from(value, "hex")
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  })
}

// Minimal Stripe REST call for the Studio routes (same approach as billing:
// the API package has no direct Stripe SDK dependency).
export async function stripeRequest<T = any>(
  method: "GET" | "POST",
  path: string,
  form?: Record<string, string | undefined>,
  options: { idempotencyKey?: string; fetchImpl?: typeof fetch; apiKey?: string } = {}
): Promise<T> {
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(form || {})) if (value !== undefined && value !== "") body.set(key, value)
  const headers: Record<string, string> = { Authorization: `Bearer ${options.apiKey ?? process.env.STRIPE_SECRET_KEY}` }
  if (method === "POST") headers["Content-Type"] = "application/x-www-form-urlencoded"
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey
  let response: Response
  try {
    response = await (options.fetchImpl || fetch)(`https://api.stripe.com/v1${path}`, {
      method,
      headers,
      ...(method === "POST" ? { body } : {}),
    })
  } catch {
    throw new Error("Δεν ήταν δυνατή η επικοινωνία με το Stripe. Δοκίμασε ξανά σε λίγο.")
  }
  const json = (await response.json().catch(() => ({}))) as any
  if (!response.ok) throw new Error(json?.error?.message || `Stripe request failed (${response.status}).`)
  return json as T
}
