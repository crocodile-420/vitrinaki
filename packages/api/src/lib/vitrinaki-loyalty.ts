import { randomBytes } from "crypto"

// Loyalty points per shop. Each shop keeps its own rules in
// seller.metadata.vitrinaki_loyalty; balances and the earn/redeem ledger live
// in the vitrinaki-loyalty module. Points are per (shop, customer): what a
// customer earns in one shop can only be spent in that same shop.

export const LOYALTY_METADATA_KEY = "vitrinaki_loyalty"
export const LOYALTY_CURRENCY = "eur"

export const MAX_REWARDS = 6
export const MIN_POINTS_PER_EURO = 0.1
export const MAX_POINTS_PER_EURO = 100
export const MAX_REWARD_POINTS = 1_000_000
export const MAX_REWARD_AMOUNT = 1000

export type LoyaltyReward =
  | { id: string; points: number; type: "amount_off"; amount: number }
  | { id: string; points: number; type: "free_shipping" }

export type LoyaltySettings = {
  enabled: boolean
  pointsPerEuro: number
  rewards: LoyaltyReward[]
}

export const DEFAULT_LOYALTY: LoyaltySettings = { enabled: false, pointsPerEuro: 1, rewards: [] }

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim()) return Number(value.replace(",", ".").trim())
  // Medusa's BigNumber (order and cart totals) carries the value in `numeric`.
  if (value && typeof value === "object") {
    const numeric = (value as { numeric?: unknown }).numeric
    return typeof numeric === "number" ? numeric : Number(value)
  }
  return NaN
}

const round2 = (n: number) => Math.round(n * 100) / 100

export const newRewardId = () => `rw_${randomBytes(4).toString("hex")}`

// Whatever is stored, read it back as valid settings: anything malformed is
// dropped, so a hand-edited metadata value can never break checkout.
export function readLoyaltySettings(metadata: unknown): LoyaltySettings {
  const raw = (metadata && typeof metadata === "object" ? (metadata as Record<string, any>)[LOYALTY_METADATA_KEY] : null) as any
  if (!raw || typeof raw !== "object") return { ...DEFAULT_LOYALTY, rewards: [] }
  const result = validateLoyaltySettings(raw)
  if ("settings" in result) return result.settings
  const ppe = toNumber(raw.pointsPerEuro)
  return {
    enabled: raw.enabled === true,
    pointsPerEuro: ppe >= MIN_POINTS_PER_EURO && ppe <= MAX_POINTS_PER_EURO ? ppe : DEFAULT_LOYALTY.pointsPerEuro,
    rewards: (Array.isArray(raw.rewards) ? raw.rewards : [])
      .map((reward: unknown) => validateReward(reward))
      .filter((r: ReturnType<typeof validateReward>): r is { reward: LoyaltyReward } => "reward" in r)
      .map((r: { reward: LoyaltyReward }) => r.reward)
      .slice(0, MAX_REWARDS),
  }
}

export function validateReward(input: unknown): { reward: LoyaltyReward } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Μη έγκυρη ανταμοιβή." }
  const raw = input as Record<string, unknown>
  const points = toNumber(raw.points)
  if (!Number.isInteger(points) || points < 1 || points > MAX_REWARD_POINTS) {
    return { error: "Οι πόντοι μιας ανταμοιβής πρέπει να είναι ακέραιος αριθμός από 1 και πάνω." }
  }
  const id = typeof raw.id === "string" && /^[a-z0-9_]{3,40}$/i.test(raw.id) ? raw.id : newRewardId()
  if (raw.type === "free_shipping") return { reward: { id, points, type: "free_shipping" } }
  if (raw.type === "amount_off") {
    const amount = round2(toNumber(raw.amount))
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_REWARD_AMOUNT) {
      return { error: `Η έκπτωση πρέπει να είναι από 0,01 έως ${MAX_REWARD_AMOUNT} €.` }
    }
    return { reward: { id, points, type: "amount_off", amount } }
  }
  return { error: "Μη έγκυρος τύπος ανταμοιβής." }
}

// Validates what the Studio sends. Errors are Greek, shown as they are.
export function validateLoyaltySettings(input: unknown): { settings: LoyaltySettings } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Μη έγκυρες ρυθμίσεις." }
  const raw = input as Record<string, unknown>
  const pointsPerEuro = raw.pointsPerEuro === undefined ? DEFAULT_LOYALTY.pointsPerEuro : toNumber(raw.pointsPerEuro)
  if (!Number.isFinite(pointsPerEuro) || pointsPerEuro < MIN_POINTS_PER_EURO || pointsPerEuro > MAX_POINTS_PER_EURO) {
    return { error: "Οι πόντοι ανά 1 € πρέπει να είναι από 0,1 έως 100." }
  }
  const list = raw.rewards === undefined ? [] : raw.rewards
  if (!Array.isArray(list)) return { error: "Μη έγκυρη λίστα ανταμοιβών." }
  if (list.length > MAX_REWARDS) return { error: `Μέχρι ${MAX_REWARDS} ανταμοιβές.` }
  const rewards: LoyaltyReward[] = []
  const seen = new Set<string>()
  for (const item of list) {
    const result = validateReward(item)
    if ("error" in result) return result
    let reward = result.reward
    if (seen.has(reward.id)) reward = { ...reward, id: newRewardId() }
    seen.add(reward.id)
    rewards.push(reward)
  }
  return { settings: { enabled: raw.enabled === true, pointsPerEuro: round2(pointsPerEuro), rewards } }
}

// Points for an amount spent (in euros): whole points, rounded down.
export function pointsForAmount(amount: unknown, pointsPerEuro: number): number {
  const value = toNumber(amount)
  if (!Number.isFinite(value) || value <= 0 || !(pointsPerEuro > 0)) return 0
  // The epsilon keeps 19.99 * 100 from landing on 1998.9999…
  return Math.max(0, Math.floor(value * pointsPerEuro + 1e-9))
}

export const findReward = (settings: LoyaltySettings, rewardId: unknown) =>
  settings.rewards.find((reward) => reward.id === rewardId)

export const affordableRewards = (settings: LoyaltySettings, balance: number) =>
  settings.enabled ? settings.rewards.filter((reward) => reward.points <= balance) : []

// What the store may see of a shop's rules (nothing else from metadata).
export const publicLoyalty = (settings: LoyaltySettings) => ({
  enabled: settings.enabled,
  pointsPerEuro: settings.pointsPerEuro,
  rewards: settings.enabled ? settings.rewards : [],
})

// Unambiguous characters only (no 0/O, 1/I), so a code read aloud still works.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export function rewardCode(bytes: Buffer = randomBytes(8)): string {
  let out = ""
  for (let i = 0; i < 8; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  return `PONTOI-${out}`
}

// The single-use promotion a redeemed reward becomes. It is scoped to the
// shop by the seller link (Mercur), to the customer by a rule on the cart's
// customer, and to one use by `limit`.
export function rewardPromotion(reward: LoyaltyReward, code: string, customerId: string) {
  const application_method =
    reward.type === "free_shipping"
      ? { type: "percentage", target_type: "shipping_methods", allocation: "each", value: 100, max_quantity: 1 }
      : { type: "fixed", target_type: "items", allocation: "across", value: reward.amount, currency_code: LOYALTY_CURRENCY }
  return {
    code,
    type: "standard",
    status: "active",
    is_automatic: false,
    // «5 € off» means 5 € off the price the customer sees (VAT included).
    is_tax_inclusive: true,
    limit: 1,
    application_method,
    rules: [{ attribute: "customer.id", operator: "eq", values: [customerId] }],
    metadata: { vitrinaki_loyalty_reward: reward.id },
  }
}
