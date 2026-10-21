import { keepServerOwnedMetadata, SERVER_OWNED_SELLER_METADATA_KEYS } from "../server-metadata"
import { laterPeriodEnd } from "../vitrinaki-referral"

describe("server-owned seller metadata", () => {
  const stored = {
    vitrinaki_subscription: { status: "canceled", planId: "starter" },
    vitrinaki_stripe_connect: { accountId: "acct_real", status: "active" },
    vitrinaki_referral: { code: "FOURNOS", rewards: [] },
    vitrinaki_profile: { story: "old" },
  }

  it("covers subscription, Stripe Connect and referral", () => {
    expect([...SERVER_OWNED_SELLER_METADATA_KEYS].sort()).toEqual(["vitrinaki_loyalty", "vitrinaki_promoted", "vitrinaki_referral", "vitrinaki_stripe_connect", "vitrinaki_subscription"])
  })

  it("restores stored values over forged ones and keeps the rest of the client's metadata", () => {
    const incoming = {
      vitrinaki_subscription: { status: "active", planId: "business" },
      vitrinaki_stripe_connect: { accountId: "acct_attacker", status: "active" },
      vitrinaki_referral: { code: "HACK", rewards: [{ id: "x", status: "pending" }] },
      vitrinaki_profile: { story: "new" },
    }
    expect(keepServerOwnedMetadata(incoming, stored)).toEqual({ ...stored, vitrinaki_profile: { story: "new" } })
  })

  it("puts back stored keys the client left out", () => {
    expect(keepServerOwnedMetadata({ vitrinaki_profile: { story: "new" } }, stored)).toEqual({ ...stored, vitrinaki_profile: { story: "new" } })
  })

  it("drops forged keys when nothing is stored (e.g. a new shop)", () => {
    const incoming = { vitrinaki_signup: { source: "start_page" }, vitrinaki_subscription: { status: "active", planId: "pro" }, vitrinaki_stripe_connect: { accountId: "acct_x" } }
    expect(keepServerOwnedMetadata(incoming, null)).toEqual({ vitrinaki_signup: { source: "start_page" } })
    expect(keepServerOwnedMetadata(incoming, { vitrinaki_subscription: null })).toEqual({ vitrinaki_signup: { source: "start_page" } })
  })
})

describe("promo code end date", () => {
  it("keeps a later end already on the subscription", () => {
    expect(laterPeriodEnd("2026-11-19T00:00:00.000Z", "2026-12-19T00:00:00.000Z")).toBe("2026-12-19T00:00:00.000Z")
  })
  it("uses the promo end when it is later or nothing is there", () => {
    expect(laterPeriodEnd("2026-11-19T00:00:00.000Z", "2026-10-01T00:00:00.000Z")).toBe("2026-11-19T00:00:00.000Z")
    expect(laterPeriodEnd("2026-11-19T00:00:00.000Z", null)).toBe("2026-11-19T00:00:00.000Z")
    expect(laterPeriodEnd("2026-11-19T00:00:00.000Z", "not a date")).toBe("2026-11-19T00:00:00.000Z")
  })
  it("keeps a promo without expiry unlimited", () => {
    expect(laterPeriodEnd(null, "2026-12-19T00:00:00.000Z")).toBeNull()
  })
})
