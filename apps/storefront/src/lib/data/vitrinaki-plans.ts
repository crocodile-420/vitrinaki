export type PlanId = "starter" | "growth" | "pro" | "business"

export type PlanPrice = { amount: number; currency: string; interval: "month" | "year" | null }

// "year": monthly price with a 12-month commitment. "month": monthly price
// without commitment, plus the one-off `activation` fee.
export type PlanFeatures = {
  products: number | null
  storageGb: number
  loyalty: boolean
  promoted: "none" | "standard" | "priority"
  support: "email" | "chat" | "priority" | "advisor"
}

export type PublicPlan = {
  id: PlanId
  memberLimit: number
  features: PlanFeatures
  month: PlanPrice | null
  year: PlanPrice | null
  activation?: PlanPrice | null
}

export type PublicPricing = {
  plans: PublicPlan[]
  setup: { assisted: PlanPrice | null; done_for_you: PlanPrice | null }
}

// Team sizes and features from packages/api/src/lib/vitrinaki-plans.ts, used
// when the backend is unreachable so the page still lists the plans (without prices).
const FALLBACK: PublicPricing = {
  plans: [
    { id: "starter", memberLimit: 1, features: { products: 100, storageGb: 2, loyalty: false, promoted: "none", support: "email" }, month: null, year: null },
    { id: "growth", memberLimit: 3, features: { products: 1000, storageGb: 10, loyalty: true, promoted: "none", support: "chat" }, month: null, year: null },
    { id: "pro", memberLimit: 5, features: { products: 5000, storageGb: 30, loyalty: true, promoted: "standard", support: "priority" }, month: null, year: null },
    { id: "business", memberLimit: 15, features: { products: null, storageGb: 100, loyalty: true, promoted: "priority", support: "advisor" }, month: null, year: null },
  ],
  setup: { assisted: null, done_for_you: null },
}

// The pricing page: plans and setup services with the prices set in Stripe.
// A price that is not configured yet comes back as null.
export async function getPublicPricing(): Promise<PublicPricing> {
  const backend = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9100").replace(/\/+$/, "")
  try {
    const response = await fetch(`${backend}/store/vitrinaki/plans`, {
      next: { revalidate: 600 },
      headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
    })
    if (!response.ok) return FALLBACK
    const data = (await response.json()) as Partial<PublicPricing>
    // An older backend may answer without features: take them from the fallback.
    const plans = data.plans?.map((plan) => ({ ...plan, features: plan.features || FALLBACK.plans.find((p) => p.id === plan.id)!.features }))
    return plans?.length ? { plans, setup: data.setup || FALLBACK.setup } : FALLBACK
  } catch {
    return FALLBACK
  }
}

// Formatted by hand rather than with Intl, so the server and the browser
// always print exactly the same string.
export function formatMoney(cents: number, currency: string) {
  const fixed = (cents / 100).toFixed(cents % 100 ? 2 : 0)
  const [int, dec] = fixed.split(".")
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  const symbol = currency.toLowerCase() === "eur" ? "€" : currency.toUpperCase()
  return `${grouped}${dec ? `,${dec}` : ""}\u00A0${symbol}`
}

// «1.000» style grouping, same on server and client.
export const groupThousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".")

export const SUPPORT_LABELS: Record<PlanFeatures["support"], string> = {
  email: "Με email",
  chat: "Email και chat",
  priority: "Με προτεραιότητα",
  advisor: "Προσωπικός σύμβουλος",
}
