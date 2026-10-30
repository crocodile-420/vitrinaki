import { NO_PRODUCT, productIdFilter, shopProductIdsFrom } from "../vitrinaki-shop-catalog"

describe("vitrinaki shop catalog", () => {
  it("joins created, assigned and offered products without blanks or repeats", () => {
    expect(
      shopProductIdsFrom({ created: ["prod_1", ""], assigned: ["prod_2", null], offered: ["prod_1", "prod_3", undefined] }).sort()
    ).toEqual(["prod_1", "prod_2", "prod_3"])
  })

  it("matches no product for a brand-new shop instead of every product", () => {
    expect(shopProductIdsFrom({})).toEqual([])
    expect(productIdFilter([])).toEqual([NO_PRODUCT])
    expect(productIdFilter(["prod_1"])).toEqual(["prod_1"])
  })
})
