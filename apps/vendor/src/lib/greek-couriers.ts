// Greek couriers a shop can offer as shipping options. Keep codes and names in
// sync with packages/api/src/lib/greek-couriers.ts (which builds the tracking
// links) and apps/storefront/src/lib/helpers/couriers.ts.
//
// `defaultOptionName` is what the shop's customers see at checkout, so it is
// Greek whatever language the Studio is in; the shop can change it.

export const COURIER_METADATA_KEY = "courier"
export const FREE_OVER_METADATA_KEY = "free_shipping_over"

export type CourierCode = "acs" | "elta_courier" | "geniki" | "dhl" | "box_now"

export const GREEK_COURIERS: readonly {
  code: CourierCode
  name: string
  defaultOptionName: string
  /** False when no per-shipment tracking link could be confirmed. */
  trackingLink: boolean
}[] = [
  { code: "acs", name: "ACS", defaultOptionName: "ACS – παράδοση σε 1–3 εργάσιμες", trackingLink: true },
  { code: "elta_courier", name: "ΕΛΤΑ Courier", defaultOptionName: "ΕΛΤΑ Courier – παράδοση σε 2–4 εργάσιμες", trackingLink: true },
  { code: "geniki", name: "Γενική Ταχυδρομική", defaultOptionName: "Γενική Ταχυδρομική – παράδοση σε 1–3 εργάσιμες", trackingLink: true },
  { code: "dhl", name: "DHL", defaultOptionName: "DHL – παράδοση σε 1–2 εργάσιμες", trackingLink: true },
  { code: "box_now", name: "Box Now", defaultOptionName: "Box Now – παραλαβή από locker σε 1–3 εργάσιμες", trackingLink: false },
]

export const findCourier = (code: unknown) =>
  typeof code === "string" ? GREEK_COURIERS.find((c) => c.code === code) : undefined
