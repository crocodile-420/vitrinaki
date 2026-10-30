// Premium templates: the motion templates of the Premium category. A shop can
// pick one and preview it any time; it shows on the public site while the
// plan includes premium (Business) or the subscription carries the monthly
// premium add-on. Prices live in Stripe: a monthly recurring price for the
// add-on and a one-off activation fee charged with it.

import { activePlanId, PLAN_FEATURES, type PlanId } from "./vitrinaki-plans"

// Same ids as the storefront gallery (apps/storefront/.../premium-templates.ts).
export const PREMIUM_TEMPLATE_IDS = [
  "salon", "taverna", "bakery", "photo", "gym", "accounting", "trades", "boutique",
  "rooms", "physio", "florist", "jewelry", "tech", "laser", "street", "glass",
] as const
export type PremiumTemplateId = (typeof PREMIUM_TEMPLATE_IDS)[number]

export const isPremiumTemplateId = (value: unknown): value is PremiumTemplateId =>
  PREMIUM_TEMPLATE_IDS.includes(value as PremiumTemplateId)

export const PREMIUM_PRICE_ENV = {
  month: "STRIPE_PRICE_PREMIUM_MONTHLY",
  activation: "STRIPE_PRICE_PREMIUM_ACTIVATION",
} as const

export const PREMIUM_REQUIRED_MESSAGE =
  "Το premium πρότυπο χρειάζεται την προσθήκη Premium στη συνδρομή σου (ή το πακέτο Business). Πρόσθεσέ τη από την ενότητα Συνδρομή ή διάλεξε απλό πρότυπο."

export const premiumIncluded = (planId: PlanId) => PLAN_FEATURES[planId].premium === "included"

// Whether a stored seller.metadata.vitrinaki_subscription may show a premium template.
export function premiumActive(subscription: any, now = Date.now()) {
  const planId = activePlanId(subscription, now)
  if (!planId) return false
  return premiumIncluded(planId) || Boolean(subscription?.premium)
}

// The Stripe line items the premium add-on adds to a new subscription's
// checkout: the monthly price and the one-off activation. None on a plan that
// includes premium; null when the add-on has no price configured.
export function premiumCheckoutItems(planId: PlanId, env: NodeJS.ProcessEnv = process.env): string[] | null {
  if (premiumIncluded(planId)) return []
  const month = env[PREMIUM_PRICE_ENV.month]
  if (!month) return null
  const activation = env[PREMIUM_PRICE_ENV.activation]
  return activation ? [month, activation] : [month]
}

// Whether a Stripe subscription object carries the premium add-on.
export function hasPremiumItem(stripeSubscription: any, env: NodeJS.ProcessEnv = process.env) {
  const month = env[PREMIUM_PRICE_ENV.month]
  if (!month) return false
  return (stripeSubscription?.items?.data || []).some((item: any) => item?.price?.id === month)
}

export const premiumConfigured = (env: NodeJS.ProcessEnv = process.env) => Boolean(env[PREMIUM_PRICE_ENV.month])
