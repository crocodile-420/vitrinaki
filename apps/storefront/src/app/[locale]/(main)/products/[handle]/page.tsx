import { redirect } from "next/navigation"

import { listOffers } from "@/lib/data/offers"
import { listProducts } from "@/lib/data/products"

// Vitrinaki has no shared marketplace catalogue: every product lives in its
// shop, so the old product URL forwards to the same product in that shop.
export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}) {
  const { handle, locale } = await params

  const product = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
  })
    .then(({ response }) => response.products[0])
    .catch(() => undefined)

  const offers = product
    ? await listOffers({ productId: product.id, countryCode: locale, limit: 1, offset: 0 })
        .then((result) => result.offers)
        .catch(() => [])
    : []
  const shop = (offers[0] as { seller?: { handle?: string } } | undefined)?.seller?.handle

  redirect(shop ? `/${locale}/store/${shop}/products/${handle}` : `/${locale}#vitrina`)
}
