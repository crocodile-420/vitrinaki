// Vitrinaki subscription plans: the one place that lists them, maps them to
// the Stripe Price env vars and sets how many people each plan allows on a
// seller account. Prices themselves live in Stripe, never in code.

export const PLAN_IDS = ["starter", "growth", "pro", "business"] as const
export type PlanId = (typeof PLAN_IDS)[number]

export const isPlanId = (value: unknown): value is PlanId => PLAN_IDS.includes(value as PlanId)

// Env vars holding the Stripe Price ID of each plan and billing interval.
export const PLAN_PRICE_ENV: Record<PlanId, { month: string; year: string }> = {
  starter: { month: "STRIPE_PRICE_STARTER_MONTHLY", year: "STRIPE_PRICE_STARTER_YEARLY" },
  growth: { month: "STRIPE_PRICE_GROWTH_MONTHLY", year: "STRIPE_PRICE_GROWTH_YEARLY" },
  pro: { month: "STRIPE_PRICE_PRO_MONTHLY", year: "STRIPE_PRICE_PRO_YEARLY" },
  business: { month: "STRIPE_PRICE_BUSINESS_MONTHLY", year: "STRIPE_PRICE_BUSINESS_YEARLY" },
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

// A seller without an active subscription gets the starter limit.
export const memberLimitFor = (subscription: any, now = Date.now()) =>
  PLAN_MEMBER_LIMITS[activePlanId(subscription, now) ?? "starter"]

export const memberLimitMessage = (limit: number) =>
  `Το πακέτο σου επιτρέπει έως ${limit} ${limit === 1 ? "άτομο" : "άτομα"}. Αναβάθμισε για να προσθέσεις κι άλλους.`
