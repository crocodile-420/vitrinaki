// Greek couriers a shop can offer as shipping options.
//
// v1 calls no courier API. A courier option is an ordinary Medusa shipping
// option on the manual fulfillment provider, created by the shop in the Studio
// (apps/vendor/src/routes/vitrinaki-couriers), with the courier recorded in
// `shipping_option.metadata.courier`. When the shop marks a fulfillment as
// shipped with a tracking number, the shipmentCreated hook
// (src/workflows/hooks/courier-tracking.ts) fills in the courier's public
// tracking link.
//
// Keep the codes and names in sync with apps/vendor/src/lib/greek-couriers.ts
// and apps/storefront/src/lib/helpers/couriers.ts.

export const COURIER_METADATA_KEY = "courier"
/** Fulfillment metadata key holding [{ number, url }] for the customer. */
export const TRACKING_METADATA_KEY = "tracking"

export type CourierCode = "acs" | "elta_courier" | "geniki" | "dhl" | "box_now"

type Courier = {
  code: CourierCode
  name: string
  /**
   * Public tracking page for one shipment, or null when we could not confirm a
   * per-shipment URL (then no link is generated and the tracking number is
   * shown on its own).
   */
  trackingUrl: ((trackingNumber: string) => string) | null
}

const enc = encodeURIComponent

export const GREEK_COURIERS: readonly Courier[] = [
  {
    code: "acs",
    name: "ACS",
    trackingUrl: (n) =>
      `https://www.acscourier.net/el/myacs/anafores-apostolwn/anazitisi-apostolwn/?trackingNumber=${enc(n)}`,
  },
  {
    code: "elta_courier",
    name: "ΕΛΤΑ Courier",
    trackingUrl: (n) => `https://www.elta-courier.gr/search?br=${enc(n)}`,
  },
  {
    code: "geniki",
    name: "Γενική Ταχυδρομική",
    trackingUrl: (n) => `https://www.taxydromiki.com/track/${enc(n)}`,
  },
  {
    code: "dhl",
    name: "DHL",
    trackingUrl: (n) =>
      `https://www.dhl.com/global-en/home/tracking/tracking-parcel.html?submit=1&tracking-id=${enc(n)}`,
  },
  {
    // Box Now's tracking page (boxnow.gr/track) takes the number in a form;
    // no per-shipment URL could be confirmed, so no link is generated.
    code: "box_now",
    name: "Box Now",
    trackingUrl: null,
  },
]

export function findCourier(code: unknown): Courier | undefined {
  if (typeof code !== "string") return undefined
  return GREEK_COURIERS.find((c) => c.code === code)
}

/** The courier recorded on a shipping option's metadata, if any. */
export function courierFromMetadata(metadata: unknown): Courier | undefined {
  if (!metadata || typeof metadata !== "object") return undefined
  return findCourier((metadata as Record<string, unknown>)[COURIER_METADATA_KEY])
}

/** Public tracking link for a courier shipment, or null when there is none. */
export function courierTrackingUrl(code: unknown, trackingNumber: unknown): string | null {
  const courier = findCourier(code)
  const number = typeof trackingNumber === "string" ? trackingNumber.trim() : ""
  if (!courier?.trackingUrl || !number) return null
  // Tracking numbers are letters, digits and a few separators. Anything else is
  // a typo or something pasted by mistake; don't build a link from it.
  if (!/^[A-Za-z0-9][A-Za-z0-9 \-_.\/]{0,63}$/.test(number)) return null
  return courier.trackingUrl(number)
}

/**
 * Tracking numbers and links of a fulfillment's labels, in the shape stored on
 * fulfillment metadata for the customer (the store API hides labels). Only
 * https links are kept.
 */
export function trackingForCustomer(labels: Label[] | null | undefined): { number: string; url: string | null }[] {
  return (labels ?? [])
    .filter((label) => typeof label.tracking_number === "string" && label.tracking_number.trim())
    .map((label) => {
      const url = (label.tracking_url || "").trim()
      return { number: label.tracking_number!.trim(), url: /^https:\/\//i.test(url) ? url : null }
    })
}

type Label = { id?: string; tracking_number?: string | null; tracking_url?: string | null; label_url?: string | null }

/**
 * Labels with the courier's tracking link added where the shop entered a
 * tracking number but no link of its own. Returns null when nothing changes.
 */
export function withCourierTrackingUrls(code: unknown, labels: Label[] | null | undefined): Label[] | null {
  if (!labels?.length || !findCourier(code)) return null
  let changed = false
  const next = labels.map((label) => {
    const current = (label.tracking_url || "").trim()
    // The vendor panel's tracking-link input shows a "/" prefix; a bare "/" or
    // "#" means the shop left it empty.
    if (current && current !== "/" && current !== "#") return label
    const url = courierTrackingUrl(code, label.tracking_number)
    if (!url) return label
    changed = true
    return { ...label, tracking_url: url }
  })
  return changed ? next : null
}
