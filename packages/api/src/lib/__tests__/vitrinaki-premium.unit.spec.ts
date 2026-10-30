import { hasPremiumItem, isPremiumTemplateId, premiumActive, premiumCheckoutItems } from "../vitrinaki-premium"
import { publicShopView } from "../vitrinaki-shop-view"

describe("vitrinaki premium templates", () => {
  const now = Date.parse("2026-10-20T12:00:00Z")
  const env = { STRIPE_PRICE_PREMIUM_MONTHLY: "price_premium", STRIPE_PRICE_PREMIUM_ACTIVATION: "price_premium_once" }

  it("knows the 16 template ids", () => {
    expect(isPremiumTemplateId("glass")).toBe(true)
    expect(isPremiumTemplateId("laser")).toBe(true)
    expect(isPremiumTemplateId("atelier")).toBe(false)
    expect(isPremiumTemplateId(null)).toBe(false)
  })

  it("is active on Business, or with the add-on on any other plan", () => {
    expect(premiumActive({ status: "active", planId: "business" }, now)).toBe(true)
    expect(premiumActive({ status: "active", planId: "starter" }, now)).toBe(false)
    expect(premiumActive({ status: "active", planId: "growth", premium: true }, now)).toBe(true)
    expect(premiumActive({ status: "canceled", planId: "growth", premium: true }, now)).toBe(false)
    expect(premiumActive(null, now)).toBe(false)
  })

  it("adds the monthly price and the one-off activation at checkout, except on Business", () => {
    expect(premiumCheckoutItems("pro", env)).toEqual(["price_premium", "price_premium_once"])
    expect(premiumCheckoutItems("starter", { STRIPE_PRICE_PREMIUM_MONTHLY: "price_premium" })).toEqual(["price_premium"])
    expect(premiumCheckoutItems("business", env)).toEqual([])
    expect(premiumCheckoutItems("growth", {})).toBeNull()
  })

  it("finds the add-on among a Stripe subscription's items", () => {
    expect(hasPremiumItem({ items: { data: [{ price: { id: "price_plan" } }, { price: { id: "price_premium" } }] } }, env)).toBe(true)
    expect(hasPremiumItem({ items: { data: [{ price: { id: "price_plan" } }] } }, env)).toBe(false)
    expect(hasPremiumItem({ items: { data: [{ price: { id: "price_premium" } }] } }, {})).toBe(false)
  })

  it("shows the premium template on the public shop only while it is paid for", () => {
    const seller = (subscription: any) => ({
      id: "sel_1", name: "Ίρις", handle: "iris",
      metadata: { vitrinaki_storefront: { template: "local", premiumTemplate: "glass" }, vitrinaki_subscription: subscription },
    })
    expect(publicShopView(seller({ status: "active", planId: "business" })).storefront.premiumTemplate).toBe("glass")
    expect(publicShopView(seller({ status: "active", planId: "pro", premium: true })).storefront.premiumTemplate).toBe("glass")
    const lapsed = publicShopView(seller({ status: "active", planId: "pro" })).storefront
    expect(lapsed.premiumTemplate).toBeNull()
    expect(lapsed.template).toBe("local")
  })
})
