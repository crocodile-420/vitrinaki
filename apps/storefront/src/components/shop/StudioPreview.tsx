"use client"

import { useEffect, useRef, useState, type MouseEvent } from "react"

import { getShopBookings, type ShopBookings } from "@/lib/data/bookings"
import { listOffers } from "@/lib/data/offers"
import type { StoreOffer } from "@/lib/helpers/buybox"
import type { Lang } from "@/lib/i18n/vitrinaki"

import type { ShopResponse } from "./shop-data"
import { ShopView, shopOffers } from "./ShopView"

// Draft from the Studio editor: { type: "vk-preview", shop: ShopResponse }.
// The products and bookings shown are the shop's real ones, loaded once.
export function StudioPreview({ locale, lang, origins }: { locale: string; lang: Lang; origins: string[] }) {
  const [shop, setShop] = useState<ShopResponse | null>(null)
  const [offers, setOffers] = useState<StoreOffer[]>([])
  const [bookings, setBookings] = useState<ShopBookings>({ enabled: false })
  const loadedFor = useRef("")

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!origins.includes(event.origin)) return
      const data = event.data as { type?: string; shop?: ShopResponse } | null
      if (data?.type === "vk-preview" && data.shop?.seller?.id && data.shop.storefront) setShop(data.shop)
    }
    window.addEventListener("message", onMessage)
    // Tell the Studio the page is ready; it carries no data.
    window.parent?.postMessage({ type: "vk-preview-ready" }, "*")
    return () => window.removeEventListener("message", onMessage)
  }, [origins])

  useEffect(() => {
    const sellerId = shop?.seller.id
    if (!sellerId || loadedFor.current === sellerId) return
    loadedFor.current = sellerId
    listOffers({ sellerId, countryCode: locale, limit: 500, offset: 0 })
      .then((result) => setOffers(shopOffers(result.offers)))
      .catch(() => setOffers([]))
    getShopBookings(sellerId).then(setBookings).catch(() => setBookings({ enabled: false }))
  }, [shop, locale])

  // A preview, not a shop: links inside the page scroll, everything else
  // (other pages, add to cart, booking) does nothing.
  const stay = (event: MouseEvent) => {
    const target = (event.target as HTMLElement).closest("a, button")
    if (!target) return
    const href = target.getAttribute("href")
    if (target.tagName === "A" && href?.startsWith("#")) return
    event.preventDefault()
    event.stopPropagation()
  }

  if (!shop) {
    return <div className="grid min-h-screen place-items-center bg-[#F7F2E8] text-sm text-[#2E4A37]/60">Φόρτωση προεπισκόπησης…</div>
  }
  const home = `/${locale}/store/${shop.seller.handle}`
  return (
    <div onClickCapture={stay} onSubmitCapture={(event) => event.preventDefault()}>
      <ShopView
        shop={shop}
        offers={offers}
        bookings={bookings}
        paths={{ home, product: (handle) => `${home}/products/${encodeURIComponent(handle)}` }}
        locale={locale}
        lang={lang}
      />
    </div>
  )
}
