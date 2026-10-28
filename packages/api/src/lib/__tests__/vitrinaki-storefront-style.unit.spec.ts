import { DEFAULT_STYLE, normalizeStyle } from "../vitrinaki-storefront-style"

describe("vitrinaki storefront style", () => {
  it("keeps valid choices", () => {
    expect(normalizeStyle({ font: "modern", corners: "sharp", buttons: "outline", theme: "dark" }))
      .toEqual({ font: "modern", corners: "sharp", buttons: "outline", theme: "dark" })
  })

  it("falls back to the original look for missing or unknown values", () => {
    expect(normalizeStyle(undefined)).toEqual(DEFAULT_STYLE)
    expect(normalizeStyle({ font: "comic", corners: 3, theme: "dark", extra: "x" }))
      .toEqual({ ...DEFAULT_STYLE, theme: "dark" })
  })
})
