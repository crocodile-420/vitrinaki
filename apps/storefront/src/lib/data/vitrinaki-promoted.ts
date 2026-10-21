import { listOffers } from "@/lib/data/offers"
import { getOfferAmount, getOfferStock, rankOffers, type StoreOffer } from "@/lib/helpers/buybox"

import type { DirectoryStorefront } from "./vitrinaki-storefronts"

export type PromotedShop = {
  sellerId: string
  handle: string
  storeName: string
  palette: DirectoryStorefront["palette"]
  customDomain: string
  isFeatured: boolean
  productIds: string[]
}

export type PromotedProduct = {
  offerId: string
  title: string
  handle: string
  thumbnail: string | null
  amount: number | null
  currency: string
  inStock: boolean
  shop: Omit<PromotedShop, "productIds" | "sellerId">
}

// The homepage marketplace: products the Vitrinaki team promotes (picked in the
// admin), taken in turn from each shop so no shop fills the row on its own.
// Prices and stock come from the shop's own offers. [] when nothing is promoted
// or the backend is unreachable.
export async function listPromotedProducts(locale: string, limit = 8): Promise<PromotedProduct[]> {
  const backend = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9100").replace(/\/+$/, "")
  let shops: PromotedShop[] = []
  try {
    const response = await fetch(`${backend}/store/vitrinaki/promoted`, {
      next: { revalidate: 300 },
      headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
    })
    if (!response.ok) return []
    shops = ((await response.json()) as { shops?: PromotedShop[] }).shops || []
  } catch {
    return []
  }

  const perShop = await Promise.all(
    shops.map(async ({ sellerId, productIds, ...shop }) => {
      const { offers } = await listOffers({ sellerId, countryCode: locale, limit: 500, offset: 0 }).catch(() => ({ offers: [] }))
      // Offers are per variant: keep the best-ranked one of each promoted product.
      const best = new Map<string, StoreOffer>()
      for (const offer of rankOffers(offers as StoreOffer[])) {
        if (offer.product_id && productIds.includes(offer.product_id) && !best.has(offer.product_id)) best.set(offer.product_id, offer)
      }
      return productIds.flatMap((id) => {
        const offer = best.get(id)
        if (!offer?.product?.handle) return []
        return [{
          offerId: offer.id,
          title: String(offer.product.title || ""),
          handle: offer.product.handle,
          thumbnail: offer.product.thumbnail || null,
          amount: getOfferAmount(offer),
          currency: offer.calculated_price?.currency_code || "eur",
          inStock: getOfferStock(offer) > 0,
          shop,
        }]
      })
    })
  )

  const mixed: PromotedProduct[] = []
  for (let round = 0; mixed.length < limit && perShop.some((list) => list.length > round); round++) {
    for (const list of perShop) if (list[round] && mixed.length < limit) mixed.push(list[round])
  }
  return mixed
}
