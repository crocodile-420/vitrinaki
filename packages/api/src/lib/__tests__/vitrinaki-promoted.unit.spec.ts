import { isStorefrontVisible, MAX_PROMOTED_PER_SHOP, promotedIds } from "../vitrinaki-promoted"

describe("promoted products", () => {
  it("reads only string ids, capped per shop", () => {
    expect(promotedIds(undefined)).toEqual([])
    expect(promotedIds({ vitrinaki_promoted: "prod_1" })).toEqual([])
    expect(promotedIds({ vitrinaki_promoted: ["prod_1", 2, null, "prod_2"] })).toEqual(["prod_1", "prod_2"])
    const many = Array.from({ length: 20 }, (_, i) => `prod_${i}`)
    expect(promotedIds({ vitrinaki_promoted: many })).toHaveLength(MAX_PROMOTED_PER_SHOP)
  })

  it("shows a shop only while it is published and paid for", () => {
    const now = Date.parse("2026-10-21T00:00:00Z")
    const shop = (storefront: any, subscription: any) => ({ metadata: { vitrinaki_storefront: storefront, vitrinaki_subscription: subscription } })
    expect(isStorefrontVisible(shop({ isPublished: true }, { status: "active" }), now)).toBe(true)
    expect(isStorefrontVisible(shop({ isPublished: true }, { status: "trialing" }), now)).toBe(true)
    expect(isStorefrontVisible(shop({ isPublished: false }, { status: "active" }), now)).toBe(false)
    expect(isStorefrontVisible(shop({ isPublished: true }, { status: "past_due" }), now)).toBe(false)
    expect(isStorefrontVisible(shop({ isPublished: true }, undefined), now)).toBe(false)
    expect(isStorefrontVisible(shop({ isPublished: true }, { status: "active", source: "promo", currentPeriodEnd: "2026-10-01" }), now)).toBe(false)
  })
})
