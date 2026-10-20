// Greek couriers a shop can offer (set up in the Studio, see
// apps/vendor/src/routes/vitrinaki-couriers). The courier is stored on the
// shipping option's metadata and, once shipped, on the fulfillment's metadata;
// the tracking link itself is built by the backend
// (packages/api/src/lib/greek-couriers.ts). Keep codes and names in sync.

const COURIER_NAMES: Record<string, string> = {
  acs: "ACS",
  elta_courier: "ΕΛΤΑ Courier",
  geniki: "Γενική Ταχυδρομική",
  dhl: "DHL",
  box_now: "Box Now",
}

const metaOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {}

/** Courier name for an object carrying `metadata.courier`, if it is one of ours. */
export const courierName = (withMetadata: { metadata?: unknown } | null | undefined): string | null => {
  const code = metaOf(withMetadata?.metadata).courier
  return typeof code === "string" ? COURIER_NAMES[code] ?? null : null
}

/** The shop's free-shipping threshold (€) recorded on a courier option. */
export const freeShippingOver = (withMetadata: { metadata?: unknown } | null | undefined): number | null => {
  const value = Number(metaOf(withMetadata?.metadata).free_shipping_over)
  return Number.isFinite(value) && value > 0 ? value : null
}

/** Only courier links over https are rendered. */
export const safeTrackingUrl = (url: unknown): string | null => {
  if (typeof url !== "string") return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" ? parsed.toString() : null
  } catch {
    return null
  }
}
