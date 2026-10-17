import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { headers } from "next/headers"

import { OfferCard } from "@/components/organisms/OfferCard/OfferCard"
import { listOffers } from "@/lib/data/offers"
import type { StoreOffer } from "@/lib/helpers/buybox"

type StoreResponse = {
  seller: { id: string; name: string; handle: string; logo?: string | null }
  storefront: { storeName: string; palette: "forest" | "terracotta" | "ocean" | "plum"; tagline: string; customDomain?: string; domainStatus?: string }
}

async function loadStore(handle: string): Promise<StoreResponse | null> {
  const backend = process.env.MEDUSA_BACKEND_URL || "http://localhost:9100"
  try {
    const response = await fetch(`${backend.replace(/\/+$/, "")}/store/vitrinaki/storefronts/${encodeURIComponent(handle)}`, { cache: "no-store" })
    return response.ok ? await response.json() as StoreResponse : null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string; productHandle: string }> }) {
  const { handle, productHandle } = await params
  const shop = await loadStore(handle)
  return { title: shop ? `${productHandle.replace(/-/g, " ")} | ${shop.storefront.storeName}` : "Προϊόν | Vitrinaki" }
}

const palettes = {
  forest: "bg-[#f7f6ef] text-[#173f34]",
  terracotta: "bg-[#fbf4ef] text-[#633729]",
  ocean: "bg-[#f0f6f7] text-[#174757]",
  plum: "bg-[#f8f3f8] text-[#593756]",
}

export default async function StoreProductPage({ params }: { params: Promise<{ locale: string; handle: string; productHandle: string }> }) {
  const { locale, handle, productHandle } = await params
  const shop = await loadStore(handle)
  if (!shop) notFound()
  const result = await listOffers({ sellerId: shop.seller.id, countryCode: locale, limit: 100, offset: 0 })
  const offer = (result.offers as StoreOffer[]).find(item => item.product?.handle === productHandle)
  if (!offer) notFound()
  const requestHeaders = await headers()
  const requestHost = (requestHeaders.get("host") || "").toLowerCase().split(":")[0]
  const isCustomDomain = Boolean(
    shop.storefront.customDomain &&
    shop.storefront.domainStatus === "verified" &&
    requestHost === shop.storefront.customDomain.toLowerCase()
  )
  const shopHome = isCustomDomain ? "/" : `/${locale}/store/${handle}`
  const colors = palettes[shop.storefront.palette] || palettes.forest
  const product = offer.product
  return (
    <main className={`min-h-screen ${colors}`}>
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        <Link href={shopHome} className="text-sm font-semibold opacity-70 hover:opacity-100">← Επιστροφή στο {shop.storefront.storeName}</Link>
        <div className="mt-7 grid gap-8 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f0eee8]">
            <Image src={product?.thumbnail || "/images/placeholder.svg"} alt={product?.title || "Προϊόν"} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-contain p-4" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e75a2a]">{shop.storefront.storeName}</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{product?.title}</h1>
            <p className="mt-4 leading-7 opacity-70">{shop.storefront.tagline}</p>
            <p className="mt-3 text-sm opacity-65">Δες τη διαθεσιμότητα και συνέχισε με την επιχείρηση.</p>
            <div className="mt-6 max-w-sm">
              <OfferCard offer={offer} locale={locale} storeHandle={handle} customDomainMode={isCustomDomain} className="!w-full !min-w-0" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
