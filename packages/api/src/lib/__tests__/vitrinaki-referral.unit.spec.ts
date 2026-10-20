jest.mock("@mercurjs/core/workflows", () => ({ updateSellersWorkflow: jest.fn() }))

import {
  claimRefusal,
  extendedPeriodEnd,
  generateReferralCode,
  isQualifyingPayment,
  monthlyCreditAmount,
  normalizeReferralCode,
  readReferral,
  recordEarnedReward,
  referralCodeBase,
  referralShareUrl,
  referralSummary,
  REWARD_CAP_PER_YEAR,
  rewardPlanFor,
  type ReferralState,
} from "../vitrinaki-referral"
import { applyPendingReferralRewards, qualifyReferral, recordReferralClaim } from "../vitrinaki-referral-rewards"

describe("referral codes", () => {
  it("makes a short readable code from the handle", () => {
    expect(referralCodeBase("fournos-eleni")).toBe("FOURNOS")
    expect(referralCodeBase("to-mpakaliko")).toBe("TOMPAKALIKO")
    expect(referralCodeBase("ab-cd-ef")).toBe("ABCD")
    expect(referralCodeBase("kafekopteio-tis-gitonias")).toBe("KAFEKOPTEIO")
    expect(referralCodeBase("")).toBe("SHOP")
  })

  it("picks the first free code", () => {
    const taken = new Set(["FOURNOS", "FOURNOS2"])
    expect(generateReferralCode("fournos-eleni", (c) => taken.has(c))).toBe("FOURNOS3")
    expect(generateReferralCode("fournos-maria", () => false)).toBe("FOURNOS")
    const many = (c: string) => /^FOURNOS\d*$/.test(c)
    const code = generateReferralCode("fournos", many, () => 0)
    expect(code).toBe("FOURNOSAAAA")
  })

  it("normalizes typed or pasted codes", () => {
    expect(normalizeReferralCode(" fournos ")).toBe("FOURNOS")
    expect(normalizeReferralCode("https://vitrinaki.gr/gr/start?ref=fournos2&x=1")).toBe("FOURNOS2")
    expect(normalizeReferralCode("ab")).toBe("")
    expect(normalizeReferralCode("drop table;")).toBe("")
    expect(normalizeReferralCode(undefined)).toBe("")
  })

  it("builds the share link on the storefront", () => {
    expect(referralShareUrl("FOURNOS", { VITRINAKI_STOREFRONT_URL: "https://vitrinaki.gr/" })).toBe("https://vitrinaki.gr/gr/start?ref=FOURNOS")
  })
})

describe("claiming a code", () => {
  const referrer = { id: "sel_a", email: "a@x.gr", metadata: { vitrinaki_referral: { code: "AAA" } } }

  it("accepts a new shop", () => {
    expect(claimRefusal({ id: "sel_b", email: "b@x.gr", metadata: {} }, referrer)).toBeNull()
  })

  it("refuses unknown codes, itself, a second referrer and shops that already paid", () => {
    expect(claimRefusal({ id: "sel_b" }, null)).toBe("unknown")
    expect(claimRefusal({ id: "sel_a" }, referrer)).toBe("self")
    expect(claimRefusal({ id: "sel_b", email: "A@x.gr " }, referrer)).toBe("self")
    expect(claimRefusal({ id: "sel_b", metadata: { vitrinaki_referral: { referredBy: { sellerId: "sel_c", code: "C", at: "" } } } }, referrer)).toBe("already_referred")
    expect(claimRefusal({ id: "sel_b", metadata: { vitrinaki_subscription: { stripeSubscriptionId: "sub_1" } } }, referrer)).toBe("already_paid")
  })
})

describe("eligibility", () => {
  it("counts only paid subscription invoices", () => {
    expect(isQualifyingPayment("invoice.paid", { subscription: "sub_1", amount_paid: 1900 })).toBe(true)
    expect(isQualifyingPayment("invoice.paid", { parent: { subscription_details: { subscription: "sub_1" } }, amount_paid: 1900 })).toBe(true)
    expect(isQualifyingPayment("invoice.paid", { subscription: "sub_1", amount_paid: 0 })).toBe(false) // trial
    expect(isQualifyingPayment("invoice.paid", { amount_paid: 1900 })).toBe(false) // not a subscription
    expect(isQualifyingPayment("customer.subscription.updated", { subscription: "sub_1", amount_paid: 1900 })).toBe(false)
  })

  it("chooses Stripe credit, promo extension or pending", () => {
    expect(rewardPlanFor({ status: "active", planId: "growth", stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_1" })).toEqual({ kind: "stripe_credit", customerId: "cus_1", planId: "growth" })
    expect(rewardPlanFor({ status: "active", source: "promo", planId: "pro", currentPeriodEnd: "2026-11-01T00:00:00.000Z" })).toEqual({ kind: "extension", currentPeriodEnd: "2026-11-01T00:00:00.000Z" })
    expect(rewardPlanFor({ status: "active", source: "promo", planId: "pro", currentPeriodEnd: null })).toEqual({ kind: "pending" })
    expect(rewardPlanFor({ status: "canceled", planId: "growth", stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_1" })).toEqual({ kind: "pending" })
    expect(rewardPlanFor(null)).toEqual({ kind: "pending" })
  })
})

describe("rewards", () => {
  const now = new Date("2026-10-20T12:00:00Z")
  const input = { referralId: "ref_sel_b", role: "referrer" as const, otherSellerId: "sel_b" }

  it("is idempotent per referral and role", () => {
    const first = recordEarnedReward({}, input, now)
    expect(first.isNew).toBe(true)
    expect(first.reward.status).toBe("pending")
    const again = recordEarnedReward(first.state, input, now)
    expect(again.isNew).toBe(false)
    expect(again.state.rewards).toHaveLength(1)
  })

  it("caps free months at 12 per calendar year", () => {
    const rewards = Array.from({ length: REWARD_CAP_PER_YEAR }, (_, i) => ({
      id: `ref_${i}:referrer`, referralId: `ref_${i}`, role: "referrer" as const, otherSellerId: `s${i}`, earnedAt: "2026-03-01T00:00:00Z", status: "applied" as const,
    }))
    const full: ReferralState = { rewards }
    expect(recordEarnedReward(full, input, now).reward.status).toBe("capped")
    // A new year starts a new count.
    expect(recordEarnedReward(full, input, new Date("2027-01-02T00:00:00Z")).reward.status).toBe("pending")
    // Capped entries do not count towards the cap.
    const withCapped: ReferralState = { rewards: [...rewards.slice(1), { ...rewards[0], status: "capped" }] }
    expect(recordEarnedReward(withCapped, input, now).reward.status).toBe("pending")
  })

  it("credits one month of the plan's monthly price", () => {
    expect(monthlyCreditAmount({ month: { unit_amount: 1900, currency: "EUR", recurring: { interval: "month", interval_count: 1 } } })).toEqual({ amount: 1900, currency: "eur" })
    expect(monthlyCreditAmount({ month: null, year: { unit_amount: 19000, currency: "eur" } })).toEqual({ amount: 1583, currency: "eur" })
    expect(monthlyCreditAmount({ month: { unit_amount: 5400, currency: "eur", recurring: { interval: "month", interval_count: 3 } } })).toEqual({ amount: 1800, currency: "eur" })
    expect(monthlyCreditAmount({})).toBeNull()
  })

  it("extends a promo by 30 days, from today if it already ended", () => {
    expect(extendedPeriodEnd("2026-11-01T00:00:00.000Z", now)).toBe("2026-12-01T00:00:00.000Z")
    expect(extendedPeriodEnd("2026-01-01T00:00:00.000Z", now)).toBe("2026-11-19T12:00:00.000Z")
  })

  it("summarizes for the Studio", () => {
    const state: ReferralState = {
      referrals: [{ sellerId: "a", at: "" , qualifiedAt: "2026-05-01T00:00:00Z" }, { sellerId: "b", at: "" }],
      rewards: [
        { id: "1", referralId: "1", role: "referrer", otherSellerId: "a", earnedAt: "2026-05-01T00:00:00Z", status: "applied" },
        { id: "2", referralId: "2", role: "referrer", otherSellerId: "b", earnedAt: "2026-06-01T00:00:00Z", status: "pending" },
      ],
    }
    expect(referralSummary(state, now)).toEqual({ referredCount: 2, qualifiedCount: 1, monthsEarned: 1, monthsPending: 1, monthsThisYear: 2, cap: 12 })
  })
})

// The whole flow with an in-memory seller table and a mocked Stripe.
describe("qualifying a referral", () => {
  const env = { STRIPE_SECRET_KEY: "sk_test_x", STRIPE_PRICE_GROWTH_MONTHLY: "price_growth_m", STRIPE_PRICE_PRO_MONTHLY: "price_pro_m" }

  function setup(sellers: Record<string, any>) {
    const scope = {
      resolve: () => ({
        graph: async ({ filters }: any) => ({
          data: filters?.id ? (sellers[filters.id] ? [JSON.parse(JSON.stringify(sellers[filters.id]))] : []) : Object.values(sellers),
        }),
      }),
    } as any
    const calls: any[] = []
    const stripe = jest.fn(async (method: string, path: string, form?: any, options?: any) => {
      calls.push({ method, path, form, options })
      if (path.startsWith("/prices/price_growth_m")) return { unit_amount: 1900, currency: "eur", recurring: { interval: "month", interval_count: 1 } }
      if (path.startsWith("/prices/price_pro_m")) return { unit_amount: 3900, currency: "eur", recurring: { interval: "month", interval_count: 1 } }
      if (path.includes("/balance_transactions")) return { id: `cbtxn_${calls.length}` }
      throw new Error("unexpected " + path)
    })
    const deps = {
      stripe: stripe as any,
      env,
      now: () => new Date("2026-10-20T12:00:00Z"),
      writeMetadata: async (id: string, metadata: any) => {
        sellers[id] = { ...sellers[id], metadata: JSON.parse(JSON.stringify(metadata)) }
      },
    }
    return { scope, stripe, calls, deps }
  }

  it("gives both shops a free month, once", async () => {
    const sellers: Record<string, any> = {
      sel_a: { id: "sel_a", name: "Φούρνος Ελένη", metadata: { vitrinaki_referral: { code: "FOURNOS" }, vitrinaki_subscription: { status: "active", planId: "pro", stripeCustomerId: "cus_a", stripeSubscriptionId: "sub_a" } } },
      sel_b: { id: "sel_b", name: "Κεραμικά Νίκος", metadata: { vitrinaki_subscription: { status: "active", planId: "growth", stripeCustomerId: "cus_b", stripeSubscriptionId: "sub_b" } } },
    }
    const { scope, calls, deps } = setup(sellers)
    await recordReferralClaim(scope, sellers.sel_b, sellers.sel_a, "FOURNOS", deps)
    expect(readReferral(sellers.sel_b.metadata).referredBy?.sellerId).toBe("sel_a")
    expect(readReferral(sellers.sel_a.metadata).referrals).toHaveLength(1)

    const result = await qualifyReferral(scope, "sel_b", deps)
    expect(result).toMatchObject({ qualified: true, applied: 2 })

    const credits = calls.filter((c) => c.path.includes("balance_transactions"))
    expect(credits).toHaveLength(2)
    const toB = credits.find((c) => c.path.includes("cus_b"))
    const toA = credits.find((c) => c.path.includes("cus_a"))
    expect(toB.form.amount).toBe("-1900")
    expect(toA.form.amount).toBe("-3900")
    expect(toB.options.idempotencyKey).toBe("vitrinaki-referral-ref_sel_b:referred")
    expect(toA.options.idempotencyKey).toBe("vitrinaki-referral-ref_sel_b:referrer")
    expect(toA.form.description).toContain("Κεραμικά Νίκος")

    const a = readReferral(sellers.sel_a.metadata)
    expect(a.rewards?.[0]).toMatchObject({ status: "applied", method: "stripe_credit", amount: 3900, role: "referrer" })
    expect(a.referrals?.[0].qualifiedAt).toBeTruthy()
    expect(readReferral(sellers.sel_b.metadata).qualifiedAt).toBeTruthy()

    // Webhook retry: nothing more happens.
    expect(await qualifyReferral(scope, "sel_b", deps)).toMatchObject({ qualified: false, reason: "already_qualified" })
    expect(calls.filter((c) => c.path.includes("balance_transactions"))).toHaveLength(2)
  })

  it("extends a promo referrer and keeps a reward pending for a shop without a subscription", async () => {
    const sellers: Record<string, any> = {
      sel_a: { id: "sel_a", name: "A", metadata: { vitrinaki_referral: { code: "AAA", referrals: [{ sellerId: "sel_b", at: "2026-10-01T00:00:00Z" }] }, vitrinaki_subscription: { status: "active", source: "promo", planId: "pro", currentPeriodEnd: "2026-11-01T00:00:00.000Z" } } },
      sel_c: { id: "sel_c", name: "C", metadata: { vitrinaki_referral: { code: "CCC" } } },
      sel_b: { id: "sel_b", name: "B", metadata: { vitrinaki_referral: { referredBy: { sellerId: "sel_a", code: "AAA", at: "2026-10-01T00:00:00Z" } }, vitrinaki_subscription: { status: "active", planId: "growth", stripeCustomerId: "cus_b", stripeSubscriptionId: "sub_b" } } },
      sel_d: { id: "sel_d", name: "D", metadata: { vitrinaki_referral: { referredBy: { sellerId: "sel_c", code: "CCC", at: "2026-10-01T00:00:00Z" } }, vitrinaki_subscription: { status: "active", planId: "growth", stripeCustomerId: "cus_d", stripeSubscriptionId: "sub_d" } } },
    }
    const { scope, deps } = setup(sellers)
    await qualifyReferral(scope, "sel_b", deps)
    expect(sellers.sel_a.metadata.vitrinaki_subscription.currentPeriodEnd).toBe("2026-12-01T00:00:00.000Z")
    expect(readReferral(sellers.sel_a.metadata).rewards?.[0]).toMatchObject({ status: "applied", method: "extension", newPeriodEnd: "2026-12-01T00:00:00.000Z" })

    await qualifyReferral(scope, "sel_d", deps)
    expect(readReferral(sellers.sel_c.metadata).rewards?.[0]).toMatchObject({ status: "pending", role: "referrer" })

    // C subscribes later: the pending month becomes a Stripe credit.
    sellers.sel_c.metadata.vitrinaki_subscription = { status: "active", planId: "growth", stripeCustomerId: "cus_c", stripeSubscriptionId: "sub_c" }
    expect(await applyPendingReferralRewards(scope, "sel_c", deps)).toEqual({ applied: 1 })
    expect(readReferral(sellers.sel_c.metadata).rewards?.[0]).toMatchObject({ status: "applied", method: "stripe_credit", amount: 1900 })
    expect(await applyPendingReferralRewards(scope, "sel_c", deps)).toEqual({ applied: 0 })
  })

  it("keeps the reward pending when Stripe fails, to retry later", async () => {
    const sellers: Record<string, any> = {
      sel_a: { id: "sel_a", name: "A", metadata: { vitrinaki_referral: { code: "AAA" } } },
      sel_b: { id: "sel_b", name: "B", metadata: { vitrinaki_referral: { referredBy: { sellerId: "sel_a", code: "AAA", at: "" } }, vitrinaki_subscription: { status: "active", planId: "growth", stripeCustomerId: "cus_b", stripeSubscriptionId: "sub_b" } } },
    }
    const { scope, deps } = setup(sellers)
    deps.stripe = jest.fn(async () => { throw new Error("Stripe down") }) as any
    await qualifyReferral(scope, "sel_b", deps)
    expect(readReferral(sellers.sel_b.metadata).rewards?.[0]).toMatchObject({ status: "pending", lastError: "Stripe down" })
  })
})
