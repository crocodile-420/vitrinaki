import { notFound } from "next/navigation"

import { BookingStatusCard } from "@/components/shop/BookingStatusCard"
import { ShopFooter, ShopHeader } from "@/components/shop/ShopChrome"
import { loadShop, shopColors, shopPaths } from "@/components/shop/shop-data"
import { getBookingByToken } from "@/lib/data/bookings"
import { getTranslator } from "@/lib/i18n/server"

// «Το ραντεβού μου»: what the customer booked, its status, and a cancel
// button while cancelling online is still allowed. Reached only by the
// secret link shown after booking, so it is kept out of search engines.

export const metadata = { robots: { index: false, follow: false } }

export default async function BookingPage({ params }: { params: Promise<{ locale: string; handle: string; token: string }> }) {
  const { locale, handle, token } = await params
  const [shop, booking] = await Promise.all([loadShop(handle), getBookingByToken(token)])
  if (!shop || !booking || booking.shop.handle !== shop.seller.handle) notFound()
  const { lang } = await getTranslator()
  const colors = shopColors(shop)
  const paths = await shopPaths(shop, locale, handle)

  return (
    <main style={{ background: colors.page, color: colors.ink }} className="min-h-screen">
      <ShopHeader shop={shop} colors={colors} home={paths.home} locale={locale} lang={lang} />
      <BookingStatusCard initial={booking} token={token} colors={colors} home={paths.home} contactPhone={shop.storefront.contactPhone || ""} />
      <ShopFooter shop={shop} colors={colors} lang={lang} />
    </main>
  )
}
