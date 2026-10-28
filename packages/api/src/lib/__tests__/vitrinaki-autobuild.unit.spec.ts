import { autoBuildStorefront, DEFAULT_TEXTS, presetFor, STYLE_PRESETS } from "../vitrinaki-autobuild"

describe("vitrinaki auto build", () => {
  it("picks the look for the kind of business and cycles through the presets", () => {
    expect(presetFor("food", 0).palette).toBe("terracotta")
    expect(presetFor("food", STYLE_PRESETS.food.length).index).toBe(0)
    expect(presetFor("food", -1).index).toBe(STYLE_PRESETS.food.length - 1)
    expect(presetFor(undefined, 0).palette).toBe(STYLE_PRESETS.other[0].palette)
  })

  it("fills empty texts and turns photos into a cover and sections", () => {
    const built = autoBuildStorefront({ tagline: "", sections: [] }, { businessType: "crafts", photos: ["https://x/1.jpg", "https://x/2.jpg", "https://x/3.jpg"], preset: 0 })
    expect(built.template).toBe("atelier")
    expect(built.tagline).toBe("Χειροποίητα κομμάτια, φτιαγμένα ένα ένα")
    expect(built.bannerUrl).toBe("https://x/1.jpg")
    expect(built.sections.map((s: any) => s.imageUrl)).toEqual(["https://x/2.jpg", "https://x/3.jpg"])
  })

  it("keeps what the owner wrote and the sections they made", () => {
    const own = { id: "mine", type: "text", title: "Δικό μου", body: "", imageUrl: null }
    const built = autoBuildStorefront({ tagline: "Η φράση μου", description: "Η περιγραφή μου", sections: [own] }, { businessType: "food", photos: ["https://x/1.jpg", "https://x/2.jpg"], preset: 1 })
    expect(built.tagline).toBe("Η φράση μου")
    expect(built.description).toBe("Η περιγραφή μου")
    expect(built.sections).toEqual([own])
  })

  it("rebuilds its own sections when the photos change", () => {
    const first = autoBuildStorefront({ sections: [] }, { businessType: "retail", photos: ["https://x/1.jpg", "https://x/2.jpg"], preset: 0 })
    const again = autoBuildStorefront(first, { businessType: "retail", photos: ["https://x/1.jpg", "https://x/2.jpg", "https://x/3.jpg"], preset: 1 })
    expect(again.sections).toHaveLength(2)
    expect(again.palette).toBe(STYLE_PRESETS.retail[1].palette)
  })
})

describe("appointment kinds of business", () => {
  it("have their own looks and texts", () => {
    for (const type of ["fitness", "lessons", "health", "professional", "events"] as const) {
      const shop = autoBuildStorefront({}, { businessType: type, photos: ["https://x/1.jpg", "https://x/2.jpg"], preset: 0 })
      expect(shop.template).toBe("services")
      expect(shop.tagline).toBe(DEFAULT_TEXTS[type].tagline)
      expect(STYLE_PRESETS[type]).toHaveLength(3)
    }
    expect(presetFor("fitness", 0).palette).toBe("indigo")
    expect(presetFor("health", 0).palette).toBe("sage")
    expect(presetFor("professional", 0).palette).toBe("graphite")
  })
})
