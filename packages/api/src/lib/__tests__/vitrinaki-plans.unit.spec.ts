import { activePlanId, availablePlanIntervals, commitmentCancelAt, commitmentEnd, memberLimitFor, memberLimitMessage, toPublicPrice } from "../vitrinaki-plans"

describe("vitrinaki plans", () => {
  const now = Date.parse("2026-10-20T12:00:00Z")

  it("gives each active plan its team size", () => {
    expect(memberLimitFor({ status: "active", planId: "starter" }, now)).toBe(1)
    expect(memberLimitFor({ status: "active", planId: "growth" }, now)).toBe(3)
    expect(memberLimitFor({ status: "trialing", planId: "pro" }, now)).toBe(5)
    expect(memberLimitFor({ status: "active", plan_id: "business" }, now)).toBe(15)
  })

  it("falls back to the starter limit without an active subscription", () => {
    expect(memberLimitFor(null, now)).toBe(1)
    expect(memberLimitFor({ status: "canceled", planId: "business" }, now)).toBe(1)
    expect(memberLimitFor({ status: "past_due", planId: "pro" }, now)).toBe(1)
    expect(memberLimitFor({ status: "active", planId: "enterprise" }, now)).toBe(1)
    expect(activePlanId({ status: "active", source: "promo", planId: "pro", currentPeriodEnd: "2026-10-01T00:00:00Z" }, now)).toBeNull()
    expect(activePlanId({ status: "active", source: "promo", planId: "pro", currentPeriodEnd: "2026-11-01T00:00:00Z" }, now)).toBe("pro")
  })

  it("lists the Stripe intervals configured per plan", () => {
    expect(availablePlanIntervals({ STRIPE_PRICE_BUSINESS_MONTHLY: "price_1", STRIPE_PRICE_PRO_YEARLY: "price_2" })).toEqual({
      starter: [],
      growth: [],
      pro: ["year"],
      business: ["month"],
    })
  })

  it("explains the limit in Greek", () => {
    expect(memberLimitMessage(15)).toBe("Το πακέτο σου επιτρέπει έως 15 άτομα. Αναβάθμισε για να προσθέσεις κι άλλους.")
  })

  it("keeps only the public parts of a Stripe price", () => {
    expect(toPublicPrice({ id: "price_1", active: true, unit_amount: 1900, currency: "eur", recurring: { interval: "month" }, metadata: { x: 1 } }))
      .toEqual({ amount: 1900, currency: "eur", interval: "month" })
    expect(toPublicPrice({ active: true, unit_amount: 9900, currency: "eur", recurring: null })).toEqual({ amount: 9900, currency: "eur", interval: null })
    expect(toPublicPrice({ active: false, unit_amount: 1900, currency: "eur" })).toBeNull()
    expect(toPublicPrice({ active: true, unit_amount: null, currency: "eur" })).toBeNull()
    expect(toPublicPrice(null)).toBeNull()
  })

  it("ends a commitment twelve months after it starts", () => {
    expect(commitmentEnd(new Date("2026-10-28T10:00:00Z")).toISOString()).toBe("2027-10-28T10:00:00.000Z")
  })

  it("moves a cancellation inside the commitment to its end", () => {
    const periodEnd = Date.parse("2026-12-01T00:00:00Z") / 1000
    const end = "2027-10-28T10:00:00.000Z"
    expect(commitmentCancelAt({ cancel_at_period_end: true, current_period_end: periodEnd }, end)).toBe(Date.parse(end) / 1000)
    expect(commitmentCancelAt({ cancel_at_period_end: false, current_period_end: periodEnd }, end)).toBeNull()
    expect(commitmentCancelAt({ cancel_at_period_end: true, current_period_end: Date.parse("2027-11-01T00:00:00Z") / 1000 }, end)).toBeNull()
    expect(commitmentCancelAt({ cancel_at_period_end: true, current_period_end: periodEnd }, null)).toBeNull()
  })
})
