import Image from "next/image"
import Link from "next/link"

import { listOffers } from "@/lib/data/offers"
import { convertToLocale } from "@/lib/helpers/money"

type PublicSeller = {
  id?: string
  name?: string
  handle?: string
  metadata?: Record<string, unknown> | null
}

type PublicOffer = {
  id: string
  seller?: PublicSeller | null
  product?: {
    title?: string | null
    handle?: string | null
    thumbnail?: string | null
  } | null
  calculated_price?: {
    calculated_amount?: number | null
    currency_code?: string | null
  } | null
}

function getPublishedShopUrl(seller?: PublicSeller | null): string | null {
  const value = seller?.metadata?.storefront_url
  if (typeof value !== "string" || !value.trim()) return null

  try {
    const parsed = new URL(value.trim())
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null
    return parsed.toString()
  } catch {
    return null
  }
}

export async function FeaturedProductsSection({ locale }: { locale: string }) {
  const response = await listOffers({ countryCode: locale, limit: 8, offset: 0 })
    .catch(() => ({ offers: [], count: 0 }))
  const offers = (response.offers as unknown as PublicOffer[])
    .filter((offer) => offer.id && offer.product?.title && offer.seller)
    .slice(0, 8)

  return (
    <section id="featured-shops" className="border-y border-[#e8e1d6] bg-[#f5f0e7]" aria-labelledby="featured-shops-heading">
      <div className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#f15b2a]">Ανακάλυψε ελληνικές επιχειρήσεις</p>
            <h2 id="featured-shops-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-[#103d32] sm:text-4xl">
              Προϊόντα που αξίζει να ανακαλύψεις.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#61756a] sm:text-base">
              Βρες κάτι που σου αρέσει και συνέχισε στο κατάστημα της επιχείρησης για περισσότερες πληροφορίες και αγορές.
            </p>
          </div>
          <Link href="/categories" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#174739] transition hover:text-[#f15b2a]">
            Όλα τα προϊόντα <span aria-hidden="true">→</span>
          </Link>
        </div>

        {offers.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:gap-5">
            {offers.map((offer) => {
              const shopUrl = getPublishedShopUrl(offer.seller)
              const href = shopUrl || (offer.seller?.handle
                ? `/${locale}/sellers/${encodeURIComponent(offer.seller.handle)}`
                : `/${locale}/categories`)
              const productName = offer.product?.title || "Προϊόν"
              const sellerName = offer.seller?.name || "Ελληνική επιχείρηση"
              const amount = offer.calculated_price?.calculated_amount
              const currency = offer.calculated_price?.currency_code || "eur"
              const price = typeof amount === "number"
                ? convertToLocale({ amount, currency_code: currency })
                : null

              return (
                <article key={offer.id} className="group overflow-hidden rounded-2xl border border-[#e6dfd3] bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#23483a]/10">
                  {shopUrl ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Επίσκεψη στο κατάστημα ${sellerName}`}>
                      <ProductImage src={offer.product?.thumbnail} alt={productName} />
                    </a>
                  ) : (
                    <Link href={href} aria-label={`Δες την επιχείρηση ${sellerName}`}>
                      <ProductImage src={offer.product?.thumbnail} alt={productName} />
                    </Link>
                  )}
                  <div className="p-3 sm:p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b7867] sm:text-xs">{sellerName}</p>
                    <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-extrabold leading-5 text-[#173f34] sm:text-base">{productName}</h3>
                    <div className="mt-2 flex min-h-6 items-center justify-between gap-2">
                      {price ? <p className="text-sm font-semibold text-[#315647]">{price}</p> : <span className="text-xs text-[#718077]">Δες λεπτομέρειες</span>}
                    </div>
                    {shopUrl ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#123f34] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#205a49] sm:text-sm">
                        Επίσκεψη στο κατάστημα <span className="ml-2" aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <Link href={href} className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[#bfd0c4] px-3 py-2.5 text-xs font-bold text-[#174739] transition hover:bg-[#eef3eb] sm:text-sm">
                        Δες την επιχείρηση <span className="ml-2" aria-hidden="true">→</span>
                      </Link>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-[#c9d5cb] bg-white/70 px-6 py-10 text-center">
            <h3 className="text-lg font-extrabold text-[#173f34]">Οι πρώτες βιτρίνες ετοιμάζονται.</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#61756a]">
              Μόλις υπάρχουν δημοσιευμένα προϊόντα από τις επιχειρήσεις, θα εμφανίζονται εδώ. Θέλεις να δημιουργήσεις τη δική σου online βιτρίνα;
            </p>
            <a href={process.env.NEXT_PUBLIC_VENDOR_URL || "http://localhost:7001"} className="mt-5 inline-flex rounded-full bg-[#f15b2a] px-5 py-3 text-sm font-bold text-white hover:bg-[#d94a1f]">
              Ξεκίνα με το Vitrinaki <span className="ml-2" aria-hidden="true">→</span>
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

function ProductImage({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-[#eee8dc]">
      <Image
        src={src || "/images/placeholder.svg"}
        alt={alt}
        fill
        sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
        className="object-cover transition duration-500 group-hover:scale-105"
      />
    </div>
  )
}
