import { createHmac } from "node:crypto"

import {
  applicationFeeAmount,
  applicationFeePercent,
  connectStateFromAccount,
  connectStatusOf,
  decideCardPayment,
  toMinorUnit,
  verifyStripeSignature,
} from "../stripe-connect"

describe("stripe connect rules", () => {
  it("maps a Stripe account to not connected / pending / active", () => {
    expect(connectStatusOf(null)).toBe("not_connected")
    expect(connectStatusOf({ accountId: null })).toBe("not_connected")
    const pending = connectStateFromAccount({
      id: "acct_1", charges_enabled: false, details_submitted: true,
      requirements: { currently_due: ["external_account"], past_due: ["external_account", "tos_acceptance.date"], disabled_reason: "requirements.past_due" },
    })
    expect(pending).toMatchObject({ accountId: "acct_1", status: "pending", detailsSubmitted: true, disabledReason: "requirements.past_due" })
    expect(pending.requirementsDue).toEqual(["external_account", "tos_acceptance.date"])
    expect(connectStatusOf(pending)).toBe("pending")
    const active = connectStateFromAccount({ id: "acct_1", charges_enabled: true, payouts_enabled: true, details_submitted: true })
    expect(connectStatusOf(active)).toBe("active")
  })

  it("offers card only for a one-shop cart whose account is active", () => {
    const active = { accountId: "acct_A", status: "active" as const, chargesEnabled: true }
    expect(decideCardPayment(["sel_A"], { sel_A: active }, false)).toEqual({ available: false, reason: "not_configured" })
    expect(decideCardPayment([], {}, true)).toEqual({ available: false, reason: "empty_cart" })
    expect(decideCardPayment(["sel_A", "sel_B"], { sel_A: active }, true)).toEqual({ available: false, reason: "mixed_shops" })
    expect(decideCardPayment(["sel_A"], {}, true)).toMatchObject({ available: false, reason: "not_connected" })
    expect(decideCardPayment(["sel_A"], { sel_A: { accountId: "acct_A", status: "pending" } }, true)).toMatchObject({ available: false, reason: "not_connected" })
    expect(decideCardPayment(["sel_A", "sel_A", null], { sel_A: active }, true)).toEqual({ available: true, reason: null, sellerId: "sel_A", stripeAccount: "acct_A" })
  })

  it("application fee defaults to 0 and is capped", () => {
    expect(applicationFeePercent(undefined)).toBe(0)
    expect(applicationFeePercent("")).toBe(0)
    expect(applicationFeePercent("abc")).toBe(0)
    expect(applicationFeePercent("1.5")).toBe(1.5)
    expect(applicationFeePercent("90")).toBe(20)
    expect(applicationFeeAmount(4999, 0)).toBe(0)
    expect(applicationFeeAmount(4999, 1.5)).toBe(75)
  })

  it("converts amounts to the smallest unit like Medusa's provider", () => {
    expect(toMinorUnit(49.99, "eur")).toBe(4999)
    expect(toMinorUnit(10, "jpy")).toBe(10)
    expect(toMinorUnit(1.234, "kwd")).toBe(1240)
  })

  it("verifies Stripe webhook signatures", () => {
    const now = 1_760_000_000
    const body = '{"id":"evt_1"}'
    const sig = createHmac("sha256", "whsec_x").update(`${now}.${body}`, "utf8").digest("hex")
    expect(verifyStripeSignature(body, `t=${now},v1=${sig}`, "whsec_x", now)).toBe(true)
    expect(verifyStripeSignature(body, `t=${now},v1=${sig}`, "whsec_other", now)).toBe(false)
    expect(verifyStripeSignature(body + " ", `t=${now},v1=${sig}`, "whsec_x", now)).toBe(false)
    expect(verifyStripeSignature(body, `t=${now},v1=${sig}`, "whsec_x", now + 1000)).toBe(false)
  })
})
