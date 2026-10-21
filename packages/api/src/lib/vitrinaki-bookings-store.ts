import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { localDate, localTime, readBookingSettings, type BookingSettings } from "./vitrinaki-bookings"

export type BookingShop = {
  id: string
  name: string
  handle: string
  // Published with an active plan: the same rule as the public shop page
  // (store/vitrinaki/storefronts/[handle]).
  open: boolean
  settings: BookingSettings | null
  metadata: Record<string, any>
}

export function shopIsOpen(metadata: Record<string, any> | null | undefined, now = new Date()): boolean {
  const storefront = metadata?.vitrinaki_storefront
  const subscription = metadata?.vitrinaki_subscription
  if (!storefront?.isPublished || !subscription) return false
  if (!["active", "trialing"].includes(String(subscription.status))) return false
  const promoExpired =
    subscription.source === "promo" &&
    Boolean(subscription.currentPeriodEnd) &&
    new Date(String(subscription.currentPeriodEnd)).getTime() < now.getTime()
  return !promoExpired
}

// Shop name/handle and booking rules. The rest of seller.metadata stays on
// the server: routes must not send `metadata` to a shopper.
export async function loadBookingShop(scope: MedusaContainer, sellerId: string): Promise<BookingShop | null> {
  if (!sellerId || !/^[a-z0-9_]{3,80}$/i.test(sellerId)) return null
  const { data } = await scope.resolve(ContainerRegistrationKeys.QUERY).graph({
    entity: "seller",
    fields: ["id", "name", "handle", "metadata"],
    filters: { id: sellerId },
  })
  const seller = data?.[0] as any
  if (!seller) return null
  const metadata = (seller.metadata || {}) as Record<string, any>
  const storeName = typeof metadata.vitrinaki_storefront?.storeName === "string" ? metadata.vitrinaki_storefront.storeName : ""
  return {
    id: seller.id,
    name: storeName || String(seller.name || ""),
    handle: String(seller.handle || ""),
    open: shopIsOpen(metadata),
    settings: readBookingSettings(metadata),
    metadata,
  }
}

const iso = (value: unknown) => new Date(value as string).toISOString()

// What the Studio sees of a booking.
export function vendorBookingView(row: any) {
  const start = new Date(row.start_at)
  return {
    id: row.id,
    service_id: row.service_id ?? null,
    service_name: row.service_name,
    duration_minutes: Number(row.duration_minutes),
    price: row.price || "",
    start_at: iso(row.start_at),
    end_at: iso(row.end_at),
    date: localDate(start),
    time: localTime(start),
    end_time: localTime(new Date(row.end_at)),
    status: row.status,
    source: row.source,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_email: row.customer_email || "",
    customer_note: row.customer_note || "",
    shop_note: row.shop_note || "",
    cancelled_by: row.cancelled_by || null,
    created_at: iso(row.created_at),
  }
}

// What the customer sees of their own booking (by its secret link): no shop
// note, no other bookings.
export function customerBookingView(row: any, shop: Pick<BookingShop, "id" | "name" | "handle">, canCancel: boolean) {
  const start = new Date(row.start_at)
  return {
    shop: { id: shop.id, name: shop.name, handle: shop.handle },
    service_name: row.service_name,
    duration_minutes: Number(row.duration_minutes),
    price: row.price || "",
    start_at: iso(row.start_at),
    date: localDate(start),
    time: localTime(start),
    end_time: localTime(new Date(row.end_at)),
    status: row.status,
    customer_name: row.customer_name,
    can_cancel: canCancel,
  }
}
