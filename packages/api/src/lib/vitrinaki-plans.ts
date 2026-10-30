// Vitrinaki subscription plans: the one place that lists them, maps them to
// the Stripe Price env vars and sets how many people each plan allows on a
// seller account. Prices themselves live in Stripe, never in code.

export const PLAN_IDS = ["starter", "growth", "pro", "business"] as const
export type PlanId = (typeof PLAN_IDS)[number]

export const isPlanId = (value: unknown): value is PlanId => PLAN_IDS.includes(value as PlanId)

// Two ways to pay, both charged every month:
// - "year": a 12-month commitment at the lower monthly price. Its Stripe Price
//   is a monthly recurring price; cancelling takes effect when the 12 months end.
// - "month": no commitment, at the higher monthly price, plus a one-off
//   activation fee on the first invoice (STRIPE_PRICE_<PLAN>_ACTIVATION).
// The ids stay "month"/"year" because stored subscriptions already use them.
export const COMMITMENT_MONTHS = 12

// Env vars holding the Stripe Price ID of each plan and billing interval.
export const PLAN_PRICE_ENV: Record<PlanId, { month: string; year: string }> = {
  starter: { month: "STRIPE_PRICE_STARTER_MONTHLY", year: "STRIPE_PRICE_STARTER_YEARLY" },
  growth: { month: "STRIPE_PRICE_GROWTH_MONTHLY", year: "STRIPE_PRICE_GROWTH_YEARLY" },
  pro: { month: "STRIPE_PRICE_PRO_MONTHLY", year: "STRIPE_PRICE_PRO_YEARLY" },
  business: { month: "STRIPE_PRICE_BUSINESS_MONTHLY", year: "STRIPE_PRICE_BUSINESS_YEARLY" },
}

// One-off setup fee for the no-commitment option, per plan (optional). The
// Business plan has none: its setup is always included.
export const PLAN_ACTIVATION_ENV: Partial<Record<PlanId, string>> = {
  starter: "STRIPE_PRICE_STARTER_ACTIVATION",
  growth: "STRIPE_PRICE_GROWTH_ACTIVATION",
  pro: "STRIPE_PRICE_PRO_ACTIVATION",
}

// The setup fee's full price, shown struck through next to the Stripe price.
export const SETUP_LIST_PRICE = { amount: 35000, currency: "eur" } as const

export const activationPriceEnv = (planId: PlanId) => {
  const name = PLAN_ACTIVATION_ENV[planId]
  return name ? process.env[name] : undefined
}

// When a 12-month commitment that started at `start` ends.
export function commitmentEnd(start: Date, months = COMMITMENT_MONTHS) {
  const end = new Date(start.getTime())
  end.setUTCMonth(end.getUTCMonth() + months)
  return end
}

// A committed subscription the customer asked to cancel at the end of the
// current month: the cancellation is moved to the end of the commitment.
// Returns the unix time to cancel at, or null when nothing needs to change.
export function commitmentCancelAt(subscription: any, commitmentEndIso: string | null | undefined): number | null {
  if (!subscription?.cancel_at_period_end || !commitmentEndIso) return null
  const end = Math.floor(new Date(commitmentEndIso).getTime() / 1000)
  const periodEnd = Number(subscription.current_period_end || 0)
  return Number.isFinite(end) && end > periodEnd ? end : null
}

// Billing intervals that have a Stripe Price configured, per plan.
export function availablePlanIntervals(env: NodeJS.ProcessEnv = process.env): Record<PlanId, ("month" | "year")[]> {
  return Object.fromEntries(
    PLAN_IDS.map((id) => [id, (["month", "year"] as const).filter((interval) => Boolean(env[PLAN_PRICE_ENV[id][interval]]))])
  ) as Record<PlanId, ("month" | "year")[]>
}

// People who can access the seller account: members plus pending invites.
export const PLAN_MEMBER_LIMITS: Record<PlanId, number> = {
  starter: 1,
  growth: 3,
  pro: 5,
  business: 15,
}

// The plan in force for a stored seller.metadata.vitrinaki_subscription, or
// null when there is no active subscription (same rule the public storefront
// uses: active/trialing, and a promo past its end date no longer counts).
export function activePlanId(subscription: any, now = Date.now()): PlanId | null {
  if (!subscription || !["active", "trialing"].includes(String(subscription.status))) return null
  const end = subscription.currentPeriodEnd || subscription.current_period_end
  if (subscription.source === "promo" && end && new Date(String(end)).getTime() < now) return null
  const planId = subscription.planId || subscription.plan_id
  return isPlanId(planId) ? planId : null
}

// What each plan includes besides team size. The single source for the
// limits the backend enforces and the comparison on the pricing page
// (served by /store/vitrinaki/plans).
// - products: distinct products a shop can sell (null = no limit)
// - storageGb: space for the photos and files the shop uploads in the Studio
// - loyalty: customer loyalty points
// - promoted: products shown on the Vitrinaki homepage ("priority" first)
// - support: email / chat / priority / a personal advisor
// - premium: premium templates as a paid monthly add-on, or all included
export type PlanFeatures = {
  products: number | null
  storageGb: number
  loyalty: boolean
  promoted: "none" | "standard" | "priority"
  support: "email" | "chat" | "priority" | "advisor"
  premium: "addon" | "included"
}

export const PLAN_FEATURES: Record<PlanId, PlanFeatures> = {
  starter: { products: 100, storageGb: 2, loyalty: false, promoted: "none", support: "email", premium: "addon" },
  growth: { products: 1000, storageGb: 10, loyalty: true, promoted: "none", support: "chat", premium: "addon" },
  pro: { products: 5000, storageGb: 30, loyalty: true, promoted: "standard", support: "priority", premium: "addon" },
  business: { products: null, storageGb: 100, loyalty: true, promoted: "priority", support: "advisor", premium: "included" },
}

// A seller without an active subscription gets the starter features.
export const planFeaturesFor = (subscription: any, now = Date.now()) =>
  PLAN_FEATURES[activePlanId(subscription, now) ?? "starter"]

export const productLimitMessage = (limit: number) =>
  `Το πακέτο σου επιτρέπει έως ${limit} προϊόντα. Αναβάθμισε για να προσθέσεις κι άλλα.`

export const LOYALTY_PLAN_MESSAGE = "Οι πόντοι επιβράβευσης είναι διαθέσιμοι από το πακέτο Growth και πάνω."

// A seller without an active subscription gets the starter limit.
export const memberLimitFor = (subscription: any, now = Date.now()) =>
  PLAN_MEMBER_LIMITS[activePlanId(subscription, now) ?? "starter"]

export const memberLimitMessage = (limit: number) =>
  `Το πακέτο σου επιτρέπει έως ${limit} ${limit === 1 ? "άτομο" : "άτομα"}. Αναβάθμισε για να προσθέσεις κι άλλους.`

// Env vars holding the Stripe Price ID of each one-off setup service.
export const SETUP_PRICE_ENV = {
  assisted: "STRIPE_PRICE_SETUP_ASSISTED",
  done_for_you: "STRIPE_PRICE_SETUP_DONE_FOR_YOU",
} as const

export type PublicPrice = { amount: number; currency: string; interval: "month" | "year" | null }

// What the public pricing page may show of a Stripe Price: the amount in cents,
// the currency and the billing interval. null for an archived or metered price.
export function toPublicPrice(price: any): PublicPrice | null {
  if (!price || price.active === false || typeof price.unit_amount !== "number") return null
  const interval = price.recurring?.interval
  return {
    amount: price.unit_amount,
    currency: String(price.currency || "eur"),
    interval: interval === "month" || interval === "year" ? interval : null,
  }
}
