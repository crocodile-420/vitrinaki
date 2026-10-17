import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { listOffers } from "@/lib/data/offers"
import { OfferCard } from "@/components/organisms/OfferCard/OfferCard"
import type { StoreOffer } from "@/lib/helpers/buybox"

type StorefrontResponse = {
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
    palette: "forest" | "terracotta" | "ocean" | "plum"
    contactEmail?: string | null
    contactPhone?: string | null
  }
}

const paletteStyles = {
  forest: { page: "bg-[#f7f6ef]", ink: "text-[#173f34]", accent: "bg-[#173f34]", soft: "bg-[#e7ede4]" },
  terracotta: { page: "bg-[#fbf4ef]", ink: "text-[#633729]", accent: "bg-[#b95232]", soft: "bg-[#f4e1d7]" },
  ocean: { page: "bg-[#f0f6f7]", ink: "text-[#174757]", accent: "bg-[#1e7184]", soft: "bg-[#dcecef]" },
  plum: { page: "bg-[#f8f3f8]", ink: "text-[#593756]", accent: "bg-[#7e4b78]", soft: "bg-[#efe2ee]" },
}

async function loadStorefront(handle: string): Promise<StorefrontResponse | null> {
  const backend = process.env.MEDUSA_BACKEND_URL || "http://localhost:9100"
  try {
    const response = await fetch(
      `${backend.replace(/\/+$/, "")}/store/vitrinaki/storefronts/${encodeURIComponent(handle)}`,
      { cache: "no-store" }
    )
    if (!response.ok) return null
    return await response.json() as StorefrontResponse
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const data = await loadStorefront(handle)
  if (!data) return { title: "Κατάστημα | Vitrinaki" }
  return {
    title: `${data.storefront.storeName} | Vitrinaki`,
    description: data.storefront.description || data.storefront.tagline,
    robots: { index: true, follow: true },
  }
}

export default async function PublicStorePage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>
}) {
  const { locale, handle } = await params
  const data = await loadStorefront(handle)
  if (!data) notFound()

  const { seller, storefront } = data
  const colors = paletteStyles[storefront.palette] || paletteStyles.forest
  const result = await listOffers({ sellerId: seller.id, countryCode: locale, limit: 24, offset: 0 })
    .catch(() => ({ offers: [], count: 0 }))
  const offers = result.offers as StoreOffer[]
  const isServices = storefront.template === "services"

  return (
    <main className={`min-h-screen ${colors.page} ${colors.ink}`}>
      <header className="border-b border-black/10 bg-white/75">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-5 sm:px-8">
          <Link href={`/${locale}`} className="flex min-w-0 items-center gap-3" aria-label="Vitrinaki">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f15b2a] text-white" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 10h18M5 10v10h14V10M3 10l2-6h14l2 6M9 20v-6h6v6"/></svg>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-extrabold tracking-tight">{storefront.storeName}</span>
              <span className="block text-[11px] font-semibold opacity-60">Μια ανεξάρτητη βιτρίνα στο Vitrinaki</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-4">
            <Link href={`/${locale}/cart`} className="text-sm font-bold opacity-70 hover:opacity-100">Καλάθι</Link>
            <Link href={`/${locale}/categories`} className="text-sm font-bold opacity-70 hover:opacity-100">Ανακάλυψε το Vitrinaki ↗</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        {seller.banner ? <div className="absolute inset-0"><Image src={seller.banner} alt="" fill priority className="object-cover opacity-20" /></div> : null}
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.4fr_0.6fr] lg:items-center lg:py-28">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#e75a2a]">{isServices ? "Υπηρεσίες & εμπειρίες" : "Το κατάστημά μας"}</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">{storefront.storeName}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 opacity-75 sm:text-xl">{storefront.tagline}</p>
            {storefront.description ? <p className="mt-4 max-w-2xl leading-7 opacity-70">{storefront.description}</p> : null}
            <a href="#catalog" className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 font-bold text-white transition hover:opacity-90 ${colors.accent}`}>
              {isServices ? "Δες τις υπηρεσίες" : "Ανακάλυψε τη συλλογή"} <span className="ml-2" aria-hidden="true">↓</span>
            </a>
          </div>
          <div className={`rounded-[2rem] border border-black/5 p-8 shadow-sm ${colors.soft}`}>
            {seller.logo ? <Image src={seller.logo} alt={storefront.storeName} width={96} height={96} className="h-24 w-24 rounded-2xl object-cover" /> : null}
            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] opacity-55">Καλώς ήρθες</p>
            <h2 className="mt-2 text-2xl font-extrabold">Βρες αυτό που σου ταιριάζει.</h2>
            <p className="mt-3 text-sm leading-6 opacity-70">Επικοινώνησε απευθείας με την επιχείρηση για λεπτομέρειες, διαθεσιμότητα ή εξατομικευμένες επιλογές.</p>
            {storefront.contactEmail ? <a className="mt-5 inline-flex font-bold underline underline-offset-4" href={`mailto:${storefront.contactEmail}`}>Επικοινωνία με email</a> : null}
            {storefront.contactPhone ? <a className="mt-2 block font-bold underline underline-offset-4" href={`tel:${storefront.contactPhone}`}>{storefront.contactPhone}</a> : null}
          </div>
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e75a2a]">{isServices ? "Οι προτάσεις μας" : "Επιλεγμένα για σένα"}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{isServices ? "Υπηρεσίες & επιλογές" : "Η συλλογή μας"}</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 opacity-65">Μια ανεξάρτητη online παρουσία της επιχείρησης, με δικό της περιεχόμενο και αισθητική.</p>
        </div>

        {offers.length ? (
          <div className="mt-8 flex flex-wrap gap-4">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} locale={locale} storeHandle={handle} className="!min-w-0 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]" />
            ))}
          </div>
        ) : (
          <div className={`mt-8 rounded-3xl p-8 sm:p-12 ${colors.soft}`}>
            <h3 className="text-xl font-extrabold">Ετοιμάζουμε τη συλλογή μας.</h3>
            <p className="mt-2 max-w-2xl leading-7 opacity-70">Επικοινώνησε μαζί μας για να μάθεις περισσότερα ή επέστρεψε σύντομα για τις νεότερες επιλογές.</p>
          </div>
        )}
      </section>

      <footer className="border-t border-black/10 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} {storefront.storeName}</p>
          <p className="opacity-60">Με την υποστήριξη του Vitrinaki</p>
        </div>
      </footer>
    </main>
  )
}
