// «Φέρε έναν συνάδελφο, πάρε έναν μήνα δωρεάν»: shop owners refer other
// businesses. Everything lives in seller.metadata.vitrinaki_referral:
//
//   code / codeCreatedAt       the shop's own short code (made lazily)
//   referredBy                 { sellerId, code, at } — who referred this shop (one, set at sign-up)
//   referrals                  shops this one referred: [{ sellerId, name, at, qualifiedAt }]
//   qualifiedAt                when this shop's first real paid subscription started (rewards granted)
//   rewards                    one entry per free month: see ReferralReward
//
// A reward is earned by BOTH shops when the referred shop's first real paid
// Stripe invoice is paid (not promo codes, not trials). It is applied as a
// Stripe customer balance credit (one month of the plan's monthly price), or
// by extending a promo subscription by 30 days, or kept pending until the shop
// subscribes. This file is the pure logic; the side effects are in
// vitrinaki-referral-rewards.ts.

import { isPlanId, PLAN_PRICE_ENV, type PlanId } from "./vitrinaki-plans"

export const REFERRAL_METADATA_KEY = "vitrinaki_referral"
export const REWARD_CAP_PER_YEAR = 12
export const EXTENSION_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

export type ReferralRole = "referrer" | "referred"
export type RewardStatus = "applied" | "pending" | "capped"
export type RewardMethod = "stripe_credit" | "extension"

export type ReferralReward = {
  id: string // `${referralId}:${role}` — one per shop per referral, the idempotency key
  referralId: string
  role: ReferralRole
  otherSellerId: string
  otherName?: string
  earnedAt: string
  status: RewardStatus
  method?: RewardMethod
  amount?: number // minor units (cents), for stripe_credit
  currency?: string
  stripeBalanceTransactionId?: string
  previousPeriodEnd?: string | null
  newPeriodEnd?: string
  appliedAt?: string
  lastError?: string
}

export type ReferralEntry = { sellerId: string; name?: string; at: string; qualifiedAt?: string | null }

export type ReferralState = {
  code?: string
  codeCreatedAt?: string
  referredBy?: { sellerId: string; code: string; at: string } | null
  referrals?: ReferralEntry[]
  qualifiedAt?: string | null
  rewards?: ReferralReward[]
}

export const readReferral = (metadata: any): ReferralState => {
  const value = metadata?.[REFERRAL_METADATA_KEY]
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ReferralState) : {}
}

// ---------- codes ----------

const CODE_RE = /^[A-Z0-9]{3,16}$/

// What someone typed or pasted: "eleni", " Eleni ", or the whole share link.
export function normalizeReferralCode(input: unknown): string {
  let value = typeof input === "string" ? input.trim() : ""
  if (!value) return ""
  const fromUrl = value.match(/[?&]ref=([^&#\s]+)/i)
  if (fromUrl) value = decodeURIComponent(fromUrl[1])
  value = value.toUpperCase().replace(/[\s-]+/g, "")
  return CODE_RE.test(value) ? value : ""
}

// A readable code from the shop's address: "fournos-eleni" → "FOURNOS",
// "to-mpakaliko" → "TOMPAKALIKO": whole words until there are at least 4
// letters, at most 12 (a long first word is cut).
export function referralCodeBase(handle: string): string {
  const words = String(handle || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  let base = ""
  for (const word of words) {
    if (base.length >= 4) break
    const next = base + word
    if (base && next.length > 12) break
    base = next.slice(0, 12)
  }
  base = base.toUpperCase()
  return base.length >= 3 ? base : (base + "SHOP").slice(0, 6)
}

// The first free code: BASE, BASE2 … BASE99, then BASE + 4 random characters.
export function generateReferralCode(handle: string, isTaken: (code: string) => boolean, random: () => number = Math.random): string {
  const base = referralCodeBase(handle)
  if (!isTaken(base)) return base
  for (let n = 2; n < 100; n++) {
    const candidate = `${base.slice(0, 14)}${n}`
    if (!isTaken(candidate)) return candidate
  }
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no 0/O, 1/I
  for (;;) {
    let suffix = ""
    for (let i = 0; i < 4; i++) suffix += alphabet[Math.floor(random() * alphabet.length)]
    const candidate = `${base.slice(0, 12)}${suffix}`
    if (!isTaken(candidate)) return candidate
  }
}

// The link a shop shares: sign-up page with the code filled in.
export function referralShareUrl(code: string, env: NodeJS.ProcessEnv = process.env): string {
  const base = (env.VITRINAKI_STOREFRONT_URL || env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100").replace(/\/+$/, "")
  const locale = env.VITRINAKI_DEFAULT_LOCALE || "gr"
  return `${base}/${locale}/start?ref=${encodeURIComponent(code)}`
}

// ---------- claiming a code at sign-up ----------

export type ClaimRefusal = "unknown" | "self" | "already_referred" | "already_paid"

export const CLAIM_MESSAGES: Record<ClaimRefusal, string> = {
  unknown: "Δεν βρήκαμε αυτόν τον κωδικό σύστασης. Μπορείς να συνεχίσεις και χωρίς.",
  self: "Δεν μπορείς να χρησιμοποιήσεις τον δικό σου κωδικό σύστασης.",
  already_referred: "Έχεις ήδη χρησιμοποιήσει κωδικό σύστασης.",
  already_paid: "Ο κωδικός σύστασης ισχύει μόνο για νέα καταστήματα.",
}

type SellerLike = { id: string; email?: string | null; metadata?: any }

export function claimRefusal(seller: SellerLike, referrer: SellerLike | null | undefined): ClaimRefusal | null {
  if (!referrer) return "unknown"
  const sameEmail = Boolean(seller.email && referrer.email && seller.email.trim().toLowerCase() === referrer.email.trim().toLowerCase())
  if (referrer.id === seller.id || sameEmail) return "self"
  const state = readReferral(seller.metadata)
  if (state.referredBy?.sellerId) return "already_referred"
  // Only for shops that have never paid through Stripe: the reward is for
  // bringing a new paying business.
  if (state.qualifiedAt || seller.metadata?.vitrinaki_subscription?.stripeSubscriptionId) return "already_paid"
  return null
}

// ---------- when a reward is earned ----------

// The referred shop's first real paid subscription: a paid Stripe invoice with
// money in it, for a subscription. Trials (€0 invoices) and promo codes
// (no Stripe at all) do not count.
export function isQualifyingPayment(eventType: string, invoice: Record<string, any>): boolean {
  if (eventType !== "invoice.paid") return false
  const subscription = invoice.subscription || invoice.parent?.subscription_details?.subscription
  return Boolean(subscription) && Number(invoice.amount_paid) > 0
}

export const referralIdFor = (referredSellerId: string) => `ref_${referredSellerId}`
export const rewardIdFor = (referralId: string, role: ReferralRole) => `${referralId}:${role}`

const yearOf = (iso: string | undefined) => (iso ? new Date(iso).getUTCFullYear() : NaN)

// Free months already earned in a calendar year (applied or waiting).
export const rewardsInYear = (state: ReferralState, year: number) =>
  (state.rewards || []).filter((reward) => reward.status !== "capped" && yearOf(reward.earnedAt) === year).length

// Adds the reward for one shop, unless it is already there (webhook retries)
// or the shop reached its yearly cap. Returns the new state and the reward.
export function recordEarnedReward(
  state: ReferralState,
  input: { referralId: string; role: ReferralRole; otherSellerId: string; otherName?: string },
  now = new Date()
): { state: ReferralState; reward: ReferralReward; isNew: boolean } {
  const id = rewardIdFor(input.referralId, input.role)
  const existing = (state.rewards || []).find((reward) => reward.id === id)
  if (existing) return { state, reward: existing, isNew: false }
  const earnedAt = now.toISOString()
  const capped = rewardsInYear(state, now.getUTCFullYear()) >= REWARD_CAP_PER_YEAR
  const reward: ReferralReward = { id, ...input, earnedAt, status: capped ? "capped" : "pending" }
  return { state: { ...state, rewards: [...(state.rewards || []), reward] }, reward, isNew: true }
}

// ---------- how a reward is applied ----------

export type RewardPlan =
  | { kind: "stripe_credit"; customerId: string; planId: PlanId }
  | { kind: "extension"; currentPeriodEnd: string }
  | { kind: "pending" }

export function rewardPlanFor(subscription: any): RewardPlan {
  const status = String(subscription?.status || "")
  const planId = subscription?.planId || subscription?.plan_id
  if (
    subscription?.stripeCustomerId &&
    subscription?.stripeSubscriptionId &&
    ["active", "trialing", "past_due"].includes(status) &&
    isPlanId(planId)
  ) {
    return { kind: "stripe_credit", customerId: String(subscription.stripeCustomerId), planId }
  }
  const end = subscription?.currentPeriodEnd || subscription?.current_period_end
  if (subscription?.source === "promo" && status === "active" && end && !subscription?.stripeSubscriptionId) {
    return { kind: "extension", currentPeriodEnd: String(end) }
  }
  return { kind: "pending" }
}

// One month of the plan, in minor units: its monthly Stripe price, or a
// twelfth of the yearly price when only a yearly price exists.
export type StripePriceLike = { unit_amount?: number | null; currency?: string | null; recurring?: { interval?: string; interval_count?: number } | null }

export function monthlyCreditAmount(prices: { month?: StripePriceLike | null; year?: StripePriceLike | null }): { amount: number; currency: string } | null {
  const month = prices.month
  if (month && Number(month.unit_amount) > 0 && month.currency) {
    const count = month.recurring?.interval === "month" ? Math.max(1, Number(month.recurring.interval_count) || 1) : 1
    return { amount: Math.round(Number(month.unit_amount) / count), currency: month.currency.toLowerCase() }
  }
  const year = prices.year
  if (year && Number(year.unit_amount) > 0 && year.currency) {
    return { amount: Math.round(Number(year.unit_amount) / 12), currency: year.currency.toLowerCase() }
  }
  return null
}

export const planPriceIds = (planId: PlanId, env: NodeJS.ProcessEnv = process.env) => ({
  month: env[PLAN_PRICE_ENV[planId].month] || null,
  year: env[PLAN_PRICE_ENV[planId].year] || null,
})

// A promo end date pushed 30 days further (from today if it already passed).
export function extendedPeriodEnd(currentPeriodEnd: string, now = new Date(), days = EXTENSION_DAYS): string {
  const end = new Date(currentPeriodEnd).getTime()
  const from = Number.isFinite(end) ? Math.max(end, now.getTime()) : now.getTime()
  return new Date(from + days * DAY_MS).toISOString()
}

// A promo code activated on a shop whose subscription already runs later (for
// example after a referral extension) keeps the later end. No end (null) means
// no expiry and wins.
export function laterPeriodEnd(promoEnd: string | null, currentEnd: unknown): string | null {
  if (!promoEnd) return null
  const current = typeof currentEnd === "string" ? new Date(currentEnd).getTime() : NaN
  return Number.isFinite(current) && current > new Date(promoEnd).getTime() ? new Date(current).toISOString() : promoEnd
}

export const stripeIdempotencyKey =(rewardId: string) => `vitrinaki-referral-${rewardId}`

export const stripeCreditDescription = (role: ReferralRole, otherName?: string) =>
  role === "referrer"
    ? `Vitrinaki: ένας μήνας δωρεάν για τη σύσταση${otherName ? ` του «${otherName}»` : ""}`
    : `Vitrinaki: ένας μήνας δωρεάν με κωδικό σύστασης${otherName ? ` από «${otherName}»` : ""}`

// ---------- Studio summary ----------

export function referralSummary(state: ReferralState, now = new Date()) {
  const rewards = state.rewards || []
  return {
    referredCount: (state.referrals || []).length,
    qualifiedCount: (state.referrals || []).filter((entry) => entry.qualifiedAt).length,
    monthsEarned: rewards.filter((reward) => reward.status === "applied").length,
    monthsPending: rewards.filter((reward) => reward.status === "pending").length,
    monthsThisYear: rewardsInYear(state, now.getUTCFullYear()),
    cap: REWARD_CAP_PER_YEAR,
  }
}
