import { headers } from "next/headers"

import { themedColors, type ShopStyle } from "./shop-style"

export type ShopSection = {
  id: string
  type: "text" | "image" | "feature"
  title: string
  body: string
  imageUrl?: string | null
}

export type BusinessType =
  | "retail" | "crafts" | "food" | "beauty" | "fitness" | "lessons" | "health" | "professional" | "events" | "services" | "portfolio" | "other"
export type ShopDay = { closed: boolean; open: string; close: string; open2: string; close2: string }

// Public part of the Studio store profile (see packages/api/src/lib/vitrinaki-profile.ts).
export type ShopProfile = {
  businessType: BusinessType | null
  businessTypeOther: string
  story: string
  introVideo?: string
  whatsapp: string
  viber: string
  address: { street: string; area: string; city: string; postalCode: string; showMap: boolean }
  hours: Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", ShopDay> | null
  byAppointment: boolean
  hoursNote: string
  socials: { instagram: string; facebook: string; tiktok: string; website: string }
  languages: string[]
  delivery: { shipping: boolean; shippingAreas: string; pickup: boolean; pickupNote: string; localDelivery: boolean; localDeliveryAreas: string; note: string }
  returnPolicy: string
  retail: { categories: string; brands: string }
  food: { region: string; origin: string; certifications: string[]; certificationsOther: string; ingredientsNote: string; producerSince: string }
  crafts: { materials: string; techniques: string; madeToOrder: boolean; leadTime: string; customOrders: boolean }
  services: { items: { name: string; duration: string; price: string; description: string }[]; serviceArea: string; online: boolean; atClient: boolean }
  beauty: { specialties: string; brands: string }
  portfolio: { skills: string[]; projects: { title: string; description: string; imageUrl: string; link: string; year: string }[]; clients: string; availability: string }
  credentials: string
}

export type ShopResponse = {
  seller: {
    id: string
    name: string
    handle: string
    description?: string | null
    logo?: string | null
    banner?: string | null
  }
  storefront: {
    handle: string
    storeName: string
    tagline: string
    description: string
    template: "atelier" | "local" | "services"
    palette: "forest" | "terracotta" | "ocean" | "plum" | "indigo" | "sage" | "graphite"
    contactEmail?: string | null
    contactPhone?: string | null
    customDomain?: string | null
    domainStatus?: string
    sections?: ShopSection[]
    style?: Partial<ShopStyle>
  }
  profile?: ShopProfile | null
}

export async function loadShop(handle: string): Promise<ShopResponse | null> {
  const backend = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9100").replace(/\/+$/, "")
  try {
    const response = await fetch(`${backend}/store/vitrinaki/storefronts/${encodeURIComponent(handle)}`, {
      cache: "no-store",
      headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
    })
    return response.ok ? ((await response.json()) as ShopResponse) : null
  } catch {
    return null
  }
}

// On a verified custom domain the shop lives at "/", otherwise under
// /<locale>/store/<handle> on the platform.
export async function shopPaths(shop: ShopResponse, locale: string, handle: string) {
  const host = ((await headers()).get("host") || "").toLowerCase().split(":")[0]
  const { customDomain, domainStatus } = shop.storefront
  const customDomainMode = Boolean(customDomain && domainStatus === "verified" && host === customDomain.toLowerCase())
  const home = customDomainMode ? "/" : `/${locale}/store/${handle}`
  const product = (productHandle: string) =>
    customDomainMode
      ? `/products/${encodeURIComponent(productHandle)}`
      : `/${locale}/store/${encodeURIComponent(handle)}/products/${encodeURIComponent(productHandle)}`
  return { customDomainMode, home, product }
}

export const shopColors = (shop: ShopResponse) => themedColors(shop.storefront.palette, shop.storefront.style?.theme || "light")

export { shopInitials } from "./shop-style"
