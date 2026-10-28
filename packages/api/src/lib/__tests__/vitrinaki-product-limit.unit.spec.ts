import { productsAfter } from "../vitrinaki-product-limit"

describe("vitrinaki product limit", () => {
  it("counts distinct products, so more variants of one product do not add up", () => {
    expect(productsAfter(["prod_1", "prod_1", "prod_2"], [])).toBe(2)
    expect(productsAfter(["prod_1", "prod_2"], ["prod_2"])).toBe(2)
    expect(productsAfter(["prod_1"], ["prod_3", "", "prod_3"])).toBe(2)
  })
})
