import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

import { stripeRequest } from "./stripe-connect"
import {
  extendedPeriodEnd,
  extensionDaysFor,
  percentForRole,
  rewardPercent,
  scaledCredit,
  generateReferralCode,
  monthlyCreditAmount,
  planPriceIds,
  readReferral,
  recordEarnedReward,
  referralIdFor,
  REFERRAL_METADATA_KEY,
  rewardPlanFor,
  stripeCreditDescription,
  stripeIdempotencyKey,
  type ReferralReward,
  type ReferralState,
  type StripePriceLike,
} from "./vitrinaki-referral"

// Side effects of the referral programme (see vitrinaki-referral.ts): reading
// and writing seller.metadata.vitrinaki_referral and crediting Stripe. Stripe
// and the metadata write can be swapped in tests.

type Seller = { id: string; name?: string; handle?: string; email?: string | null; metadata?: Record<string, any> | null }

export type ReferralDeps = {
  stripe?: <T = any>(method: "GET" | "POST", path: string, form?: Record<string, string | undefined>, options?: { idempotencyKey?: string }) => Promise<T>
  writeMetadata?: (sellerId: string, metadata: Record<string, any>) => Promise<void>
  now?: () => Date
  env?: NodeJS.ProcessEnv
}

const SELLER_FIELDS = ["id", "name", "handle", "email", "metadata"]

export async function loadSeller(scope: MedusaContainer, sellerId: string): Promise<Seller | null> {
  const { data } = await scope.resolve(ContainerRegistrationKeys.QUERY).graph({ entity: "seller", fields: SELLER_FIELDS, filters: { id: sellerId } })
  return (data?.[0] as Seller) || null
}

// Codes live in metadata, so finding one walks the sellers page by page.
async function allSellers(scope: MedusaContainer): Promise<Seller[]> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const out: Seller[] = []
  for (let skip = 0; ; skip += 500) {
    const { data } = await query.graph({ entity: "seller", fields: SELLER_FIELDS, filters: {}, pagination: { skip, take: 500 } })
    out.push(...((data || []) as Seller[]))
    if (!data || data.length < 500) return out
  }
}

export async function findSellerByReferralCode(scope: MedusaContainer, code: string): Promise<Seller | null> {
  if (!code) return null
  return (await allSellers(scope)).find((seller) => readReferral(seller.metadata).code === code) || null
}

const defaultWrite = (scope: MedusaContainer) => async (sellerId: string, metadata: Record<string, any>) => {
  await updateSellersWorkflow(scope).run({ input: { selector: { id: sellerId }, update: { metadata } } })
}

// Re-reads the seller right before writing so a change made meanwhile (e.g. by
// the subscription part of the same webhook) is not overwritten.
async function updateReferral(
  scope: MedusaContainer,
  sellerId: string,
  deps: ReferralDeps,
  change: (state: ReferralState, metadata: Record<string, any>) => ReferralState
) {
  const seller = await loadSeller(scope, sellerId)
  if (!seller) return null
  const metadata = { ...(seller.metadata || {}) }
  const next = change(readReferral(metadata), metadata)
  metadata[REFERRAL_METADATA_KEY] = next
  await (deps.writeMetadata || defaultWrite(scope))(sellerId, metadata)
  return next
}

// The shop's own code, made on first use.
export async function ensureReferralCode(scope: MedusaContainer, seller: Seller, deps: ReferralDeps = {}): Promise<string> {
  const existing = readReferral(seller.metadata).code
  if (existing) return existing
  const taken = new Set((await allSellers(scope)).map((entry) => readReferral(entry.metadata).code).filter(Boolean) as string[])
  const code = generateReferralCode(seller.handle || seller.name || "", (candidate) => taken.has(candidate))
  const now = (deps.now || (() => new Date()))().toISOString()
  const state = await updateReferral(scope, seller.id, deps, (current) => (current.code ? current : { ...current, code, codeCreatedAt: now }))
  return state?.code || code
}

// Records referredBy on the new shop and the referral on the referrer.
export async function recordReferralClaim(scope: MedusaContainer, seller: Seller, referrer: Seller, code: string, deps: ReferralDeps = {}) {
  const at = (deps.now || (() => new Date()))().toISOString()
  await updateReferral(scope, seller.id, deps, (state) => (state.referredBy ? state : { ...state, referredBy: { sellerId: referrer.id, code, at } }))
  await updateReferral(scope, referrer.id, deps, (state) => {
    const referrals = state.referrals || []
    if (referrals.some((entry) => entry.sellerId === seller.id)) return state
    return { ...state, referrals: [...referrals, { sellerId: seller.id, name: seller.name, at, qualifiedAt: null }] }
  })
}

// ---------- applying rewards ----------

async function creditFor(planId: Parameters<typeof planPriceIds>[0], deps: Required<Pick<ReferralDeps, "stripe">> & ReferralDeps) {
  const ids = planPriceIds(planId, deps.env || process.env)
  const fetchPrice = async (id: string | null) => (id ? deps.stripe<StripePriceLike>("GET", `/prices/${encodeURIComponent(id)}`) : null)
  const month = await fetchPrice(ids.month)
  const credit = monthlyCreditAmount({ month, year: month ? null : await fetchPrice(ids.year) })
  if (!credit) throw new Error(`No Stripe price configured for plan ${planId}.`)
  return credit
}

// Turns this shop's pending rewards into a Stripe credit or a promo extension
// where it can; the rest stay pending until the shop subscribes. Safe to call
// repeatedly: applied rewards are skipped and each Stripe credit carries an
// idempotency key per reward.
export async function applyPendingReferralRewards(scope: MedusaContainer, sellerId: string, deps: ReferralDeps = {}) {
  const seller = await loadSeller(scope, sellerId)
  if (!seller) return { applied: 0 }
  const pending = (readReferral(seller.metadata).rewards || []).filter((reward) => reward.status === "pending")
  if (!pending.length) return { applied: 0 }

  const now = (deps.now || (() => new Date()))()
  const stripe = deps.stripe || (stripeRequest as NonNullable<ReferralDeps["stripe"]>)
  const subscription = { ...(seller.metadata?.vitrinaki_subscription || {}) }
  const updates = new Map<string, Partial<ReferralReward>>()
  let periodEnd: string | null = null

  for (const reward of pending) {
    const plan = rewardPlanFor(periodEnd ? { ...subscription, currentPeriodEnd: periodEnd } : subscription)
    if (plan.kind === "pending") continue
    if (plan.kind === "extension") {
      const days = extensionDaysFor(rewardPercent(reward))
      const newEnd = extendedPeriodEnd(plan.currentPeriodEnd, now, days)
      updates.set(reward.id, { status: "applied", method: "extension", extensionDays: days, previousPeriodEnd: plan.currentPeriodEnd, newPeriodEnd: newEnd, appliedAt: now.toISOString(), lastError: undefined })
      periodEnd = newEnd
      continue
    }
    if (!(deps.env || process.env).STRIPE_SECRET_KEY && !deps.stripe) {
      updates.set(reward.id, { lastError: "Stripe is not configured." })
      continue
    }
    try {
      const month = await creditFor(plan.planId, { ...deps, stripe })
      const credit = { amount: scaledCredit(month.amount, rewardPercent(reward)), currency: month.currency }
      const transaction = await stripe<{ id: string }>(
        "POST",
        `/customers/${encodeURIComponent(plan.customerId)}/balance_transactions`,
        {
          amount: String(-credit.amount),
          currency: credit.currency,
          description: stripeCreditDescription(reward.role, reward.otherName, rewardPercent(reward)),
          "metadata[vitrinaki_referral_id]": reward.referralId,
          "metadata[vitrinaki_reward_id]": reward.id,
          "metadata[seller_id]": seller.id,
        },
        { idempotencyKey: stripeIdempotencyKey(reward.id) }
      )
      updates.set(reward.id, {
        status: "applied",
        method: "stripe_credit",
        amount: credit.amount,
        currency: credit.currency,
        stripeBalanceTransactionId: transaction.id,
        appliedAt: now.toISOString(),
        lastError: undefined,
      })
    } catch (error) {
      updates.set(reward.id, { lastError: error instanceof Error ? error.message.slice(0, 300) : "Stripe credit failed." })
    }
  }
  if (!updates.size) return { applied: 0 }

  await updateReferral(scope, sellerId, deps, (state, metadata) => {
    if (periodEnd) {
      metadata.vitrinaki_subscription = { ...(metadata.vitrinaki_subscription || {}), currentPeriodEnd: periodEnd, updatedAt: now.toISOString() }
    }
    return {
      ...state,
      rewards: (state.rewards || []).map((reward) => {
        const update = updates.get(reward.id)
        // Only a reward still pending in the fresh read is changed.
        if (!update || reward.status !== "pending") return reward
        const next = { ...reward, ...update }
        if (update.lastError === undefined) delete next.lastError
        return next
      }),
    }
  })
  return { applied: [...updates.values()].filter((update) => update.status === "applied").length }
}

// The referred shop's first real paid subscription: both shops earn a free
// month. Idempotent: rewards are keyed by referral and role, and a shop that
// has already qualified is left alone.
export async function qualifyReferral(scope: MedusaContainer, referredSellerId: string, deps: ReferralDeps = {}) {
  const referred = await loadSeller(scope, referredSellerId)
  if (!referred) return { qualified: false as const, reason: "no_seller" }
  const state = readReferral(referred.metadata)
  const referrerId = state.referredBy?.sellerId
  if (!referrerId || referrerId === referred.id) return { qualified: false as const, reason: "not_referred" }
  if (state.qualifiedAt) return { qualified: false as const, reason: "already_qualified" }
  const referrer = await loadSeller(scope, referrerId)
  const now = (deps.now || (() => new Date()))()
  const referralId = referralIdFor(referred.id)

  await updateReferral(scope, referred.id, deps, (current) => {
    if (current.qualifiedAt) return current
    const earned = referrer
      ? recordEarnedReward(current, { referralId, role: "referred", otherSellerId: referrer.id, otherName: referrer.name, percent: percentForRole("referred", deps.env || process.env) }, now).state
      : current
    return { ...earned, qualifiedAt: now.toISOString() }
  })
  if (referrer) {
    await updateReferral(scope, referrer.id, deps, (current) => {
      const earned = recordEarnedReward(current, { referralId, role: "referrer", otherSellerId: referred.id, otherName: referred.name, percent: percentForRole("referrer", deps.env || process.env) }, now).state
      const referrals = earned.referrals || []
      const known = referrals.some((entry) => entry.sellerId === referred.id)
      return {
        ...earned,
        referrals: known
          ? referrals.map((entry) => (entry.sellerId === referred.id ? { ...entry, qualifiedAt: entry.qualifiedAt || now.toISOString() } : entry))
          : [...referrals, { sellerId: referred.id, name: referred.name, at: state.referredBy?.at || now.toISOString(), qualifiedAt: now.toISOString() }],
      }
    })
  }

  const results = await Promise.all([
    applyPendingReferralRewards(scope, referred.id, deps),
    referrer ? applyPendingReferralRewards(scope, referrer.id, deps) : Promise.resolve({ applied: 0 }),
  ])
  return { qualified: true as const, referralId, applied: results[0].applied + results[1].applied }
}
