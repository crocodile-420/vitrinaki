import {
  affordableRewards,
  DEFAULT_LOYALTY,
  findReward,
  LOYALTY_METADATA_KEY,
  pointsForAmount,
  publicLoyalty,
  readLoyaltySettings,
  rewardCode,
  rewardPromotion,
  validateLoyaltySettings,
  validateReward,
} from "../vitrinaki-loyalty"

describe("vitrinaki loyalty", () => {
  describe("pointsForAmount", () => {
    it("gives whole points per euro, rounded down", () => {
      expect(pointsForAmount(25, 1)).toBe(25)
      expect(pointsForAmount(25.99, 1)).toBe(25)
      expect(pointsForAmount(19.99, 100)).toBe(1999)
      expect(pointsForAmount(10, 0.5)).toBe(5)
      expect(pointsForAmount(3, 0.5)).toBe(1)
      expect(pointsForAmount("12,50", 2)).toBe(25)
      // Medusa BigNumber-like totals
      expect(pointsForAmount({ numeric: 119.04 }, 1)).toBe(119)
      expect(pointsForAmount({ valueOf: () => 40.5 }, 2)).toBe(81)
    })

    it("gives nothing for empty, negative or invalid amounts", () => {
      expect(pointsForAmount(0, 1)).toBe(0)
      expect(pointsForAmount(-5, 1)).toBe(0)
      expect(pointsForAmount(null, 1)).toBe(0)
      expect(pointsForAmount("abc", 1)).toBe(0)
      expect(pointsForAmount(10, 0)).toBe(0)
    })
  })

  describe("validateReward", () => {
    it("accepts an amount off and free shipping", () => {
      expect(validateReward({ id: "rw_a1", points: 100, type: "amount_off", amount: "5,5" })).toEqual({
        reward: { id: "rw_a1", points: 100, type: "amount_off", amount: 5.5 },
      })
      expect(validateReward({ id: "rw_b2", points: "200", type: "free_shipping", amount: 3 })).toEqual({
        reward: { id: "rw_b2", points: 200, type: "free_shipping" },
      })
    })

    it("gives a reward without an id a new one", () => {
      const result = validateReward({ points: 50, type: "free_shipping" })
      expect("reward" in result && result.reward.id).toMatch(/^rw_[0-9a-f]{8}$/)
    })

    it("rejects bad points, amounts and types", () => {
      expect(validateReward({ points: 0, type: "free_shipping" })).toHaveProperty("error")
      expect(validateReward({ points: 10.5, type: "free_shipping" })).toHaveProperty("error")
      expect(validateReward({ points: 100, type: "amount_off", amount: 0 })).toHaveProperty("error")
      expect(validateReward({ points: 100, type: "amount_off", amount: 5000 })).toHaveProperty("error")
      expect(validateReward({ points: 100, type: "percent_off", amount: 10 })).toHaveProperty("error")
      expect(validateReward(null)).toHaveProperty("error")
    })
  })

  describe("validateLoyaltySettings", () => {
    it("keeps valid settings and defaults points per euro to 1", () => {
      const result = validateLoyaltySettings({
        enabled: true,
        rewards: [{ id: "rw_one", points: 100, type: "amount_off", amount: 5 }],
      })
      expect(result).toEqual({
        settings: { enabled: true, pointsPerEuro: 1, rewards: [{ id: "rw_one", points: 100, type: "amount_off", amount: 5 }] },
      })
    })

    it("rejects out-of-range points per euro and too many rewards", () => {
      expect(validateLoyaltySettings({ enabled: true, pointsPerEuro: 0 })).toHaveProperty("error")
      expect(validateLoyaltySettings({ enabled: true, pointsPerEuro: 500 })).toHaveProperty("error")
      const many = Array.from({ length: 7 }, () => ({ points: 10, type: "free_shipping" }))
      expect(validateLoyaltySettings({ enabled: true, rewards: many })).toHaveProperty("error")
    })

    it("only treats enabled: true as on", () => {
      const result = validateLoyaltySettings({ enabled: "yes" })
      expect("settings" in result && result.settings.enabled).toBe(false)
    })

    it("gives duplicate reward ids fresh ones", () => {
      const result = validateLoyaltySettings({
        rewards: [
          { id: "rw_same", points: 10, type: "free_shipping" },
          { id: "rw_same", points: 20, type: "free_shipping" },
        ],
      })
      if (!("settings" in result)) throw new Error("expected settings")
      expect(new Set(result.settings.rewards.map((r) => r.id)).size).toBe(2)
    })
  })

  describe("readLoyaltySettings", () => {
    it("defaults to off when nothing is stored", () => {
      expect(readLoyaltySettings(null)).toEqual(DEFAULT_LOYALTY)
      expect(readLoyaltySettings({ other: 1 })).toEqual(DEFAULT_LOYALTY)
    })

    it("drops broken rewards instead of failing", () => {
      const settings = readLoyaltySettings({
        [LOYALTY_METADATA_KEY]: {
          enabled: true,
          pointsPerEuro: 2,
          rewards: [{ id: "rw_ok", points: 10, type: "free_shipping" }, { points: -1, type: "amount_off" }],
        },
      })
      expect(settings).toEqual({ enabled: true, pointsPerEuro: 2, rewards: [{ id: "rw_ok", points: 10, type: "free_shipping" }] })
    })
  })

  describe("rewards for a balance", () => {
    const settings = {
      enabled: true,
      pointsPerEuro: 1,
      rewards: [
        { id: "rw_small", points: 100, type: "amount_off" as const, amount: 5 },
        { id: "rw_ship", points: 150, type: "free_shipping" as const },
        { id: "rw_big", points: 500, type: "amount_off" as const, amount: 30 },
      ],
    }

    it("lists only what the customer can afford", () => {
      expect(affordableRewards(settings, 99)).toEqual([])
      expect(affordableRewards(settings, 150).map((r) => r.id)).toEqual(["rw_small", "rw_ship"])
      expect(affordableRewards({ ...settings, enabled: false }, 1000)).toEqual([])
    })

    it("finds a reward by id", () => {
      expect(findReward(settings, "rw_ship")?.points).toBe(150)
      expect(findReward(settings, "nope")).toBeUndefined()
    })

    it("shows the store no rewards while the programme is off", () => {
      expect(publicLoyalty({ ...settings, enabled: false }).rewards).toEqual([])
    })
  })

  describe("reward promotion", () => {
    it("makes readable single-use codes", () => {
      expect(rewardCode(Buffer.from([0, 1, 2, 3, 4, 5, 6, 31]))).toBe("PONTOI-ABCDEFG9")
      expect(rewardCode()).toMatch(/^PONTOI-[A-HJ-NP-Z2-9]{8}$/)
    })

    it("builds an amount-off promotion for the customer, usable once", () => {
      const promotion = rewardPromotion({ id: "rw_a", points: 100, type: "amount_off", amount: 5 }, "PONTOI-AAAA", "cus_1")
      expect(promotion).toMatchObject({
        code: "PONTOI-AAAA",
        status: "active",
        limit: 1,
        application_method: { type: "fixed", target_type: "items", allocation: "across", value: 5, currency_code: "eur" },
        rules: [{ attribute: "customer.id", operator: "eq", values: ["cus_1"] }],
      })
    })

    it("builds free shipping as 100% off the shipping method", () => {
      const promotion = rewardPromotion({ id: "rw_s", points: 100, type: "free_shipping" }, "PONTOI-BBBB", "cus_1")
      expect(promotion.application_method).toMatchObject({ type: "percentage", target_type: "shipping_methods", value: 100 })
    })
  })
})
