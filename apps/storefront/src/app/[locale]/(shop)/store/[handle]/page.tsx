import { notFound } from "next/navigation"

import { getShopBookings } from "@/lib/data/bookings"
import { listOffers } from "@/lib/data/offers"
import { loadShop, shopPaths } from "@/components/shop/shop-data"
import { ShopView, shopOffers } from "@/components/shop/ShopView"
import { getTranslator } from "@/lib/i18n/server"

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const shop = await loadShop(handle)
  if (!shop) return { title: (await getTranslator()).tr("Κατάστημα") }
  return {
    title: { absolute: shop.storefront.storeName },
    description: shop.storefront.description || shop.storefront.tagline,
    robots: { index: true, follow: true },
  }
}

export default async function ShopPage({ params }: { params: Promise<{ locale: string; handle: string }> }) {
  const { locale, handle } = await params
  const shop = await loadShop(handle)
  if (!shop) notFound()
  const { lang } = await getTranslator()

  const { seller } = shop
  const paths = await shopPaths(shop, locale, handle)
  const [result, bookings] = await Promise.all([
    listOffers({ sellerId: seller.id, countryCode: locale, limit: 500, offset: 0 }).catch(() => ({ offers: [], count: 0 })),
    getShopBookings(seller.id),
  ])

  const offers = shopOffers(result.offers)

  return <ShopView shop={shop} offers={offers} bookings={bookings} paths={paths} locale={locale} lang={lang} />
}
