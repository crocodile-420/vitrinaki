import { headers } from "next/headers"

import { paletteColors } from "@/lib/data/vitrinaki-storefronts"

export type ShopSection = {
  id: string
  type: "text" | "image" | "feature"
  title: string
  body: string
  imageUrl?: string | null
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
    palette: keyof typeof paletteColors
    contactEmail?: string | null
    contactPhone?: string | null
    customDomain?: string | null
    domainStatus?: string
    sections?: ShopSection[]
  }
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

export const shopColors = (shop: ShopResponse) => paletteColors[shop.storefront.palette] || paletteColors.forest

export const shopInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
