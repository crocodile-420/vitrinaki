export type PlanId = "starter" | "growth" | "pro" | "business"

export type PlanPrice = { amount: number; currency: string; interval: "month" | "year" | null }

export type PublicPlan = { id: PlanId; memberLimit: number; month: PlanPrice | null; year: PlanPrice | null }

export type PublicPricing = {
  plans: PublicPlan[]
  setup: { assisted: PlanPrice | null; done_for_you: PlanPrice | null }
}

// Team sizes from packages/api/src/lib/vitrinaki-plans.ts, used when the
// backend is unreachable so the page still lists the plans (without prices).
const FALLBACK: PublicPricing = {
  plans: [
    { id: "starter", memberLimit: 1, month: null, year: null },
    { id: "growth", memberLimit: 3, month: null, year: null },
    { id: "pro", memberLimit: 5, month: null, year: null },
    { id: "business", memberLimit: 15, month: null, year: null },
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
    return data.plans?.length ? { plans: data.plans, setup: data.setup || FALLBACK.setup } : FALLBACK
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
