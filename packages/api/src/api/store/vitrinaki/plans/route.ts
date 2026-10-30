import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { PREMIUM_PRICE_ENV } from "../../../../lib/vitrinaki-premium"
import { PLAN_ACTIVATION_ENV, PLAN_FEATURES, PLAN_IDS, PLAN_LIST_PRICES, PLAN_MEMBER_LIMITS, PLAN_PRICE_ENV, SETUP_LIST_PRICE, SETUP_PRICE_ENV, toPublicPrice, type PublicPrice } from "../../../../lib/vitrinaki-plans"

// The public pricing page: each plan's team size and its Stripe prices ("year":
// the monthly price with a 12-month commitment; "month": the monthly price
// without commitment, plus its one-off setup fee and that fee's full price), plus
// the one-off setup services and the Premium templates add-on. Prices are read
// from Stripe and cached for a few minutes. A plan price without a Stripe Price env var falls back to its
// announced price (PLAN_LIST_PRICES); an unset setup service comes back as null.
const CACHE_MS = 10 * 60 * 1000
const cache = new Map<string, { at: number; price: PublicPrice | null }>()

async function stripePrice(priceId: string | undefined): Promise<PublicPrice | null> {
  if (!priceId || !process.env.STRIPE_SECRET_KEY) return null
  const hit = cache.get(priceId)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.price
  try {
    const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    })
    const price = response.ok ? toPublicPrice(await response.json()) : null
    cache.set(priceId, { at: Date.now(), price })
    return price
  } catch {
    return hit?.price ?? null
  }
}

// The Stripe price when its env var is set (null if Stripe cannot give it),
// otherwise the announced price.
async function planPrice(envName: string | undefined, listAmount: number | null, interval: PublicPrice["interval"]): Promise<PublicPrice | null> {
  const priceId = envName ? process.env[envName] : undefined
  if (priceId) return stripePrice(priceId)
  return listAmount === null ? null : { amount: listAmount, currency: "eur", interval }
}

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const plans = await Promise.all(PLAN_IDS.map(async (id) => ({
    id,
    memberLimit: PLAN_MEMBER_LIMITS[id],
    features: PLAN_FEATURES[id],
    month: await planPrice(PLAN_PRICE_ENV[id].month, PLAN_LIST_PRICES[id].month, "month"),
    year: await planPrice(PLAN_PRICE_ENV[id].year, PLAN_LIST_PRICES[id].year, "month"),
    activation: await planPrice(PLAN_ACTIVATION_ENV[id], PLAN_LIST_PRICES[id].activation, null),
  })))
  const [assisted, doneForYou] = await Promise.all([
    stripePrice(process.env[SETUP_PRICE_ENV.assisted]),
    stripePrice(process.env[SETUP_PRICE_ENV.done_for_you]),
  ])
  const [premiumMonth, premiumActivation] = await Promise.all([
    stripePrice(process.env[PREMIUM_PRICE_ENV.month]),
    stripePrice(process.env[PREMIUM_PRICE_ENV.activation]),
  ])
  return res.json({
    plans,
    setupListPrice: { ...SETUP_LIST_PRICE, interval: null },
    setup: { assisted, done_for_you: doneForYou },
    premium: { month: premiumMonth, activation: premiumActivation },
  })
}
