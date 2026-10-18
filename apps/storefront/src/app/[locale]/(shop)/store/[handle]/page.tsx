import { notFound } from "next/navigation"

import { listOffers } from "@/lib/data/offers"
import { rankOffers, type StoreOffer } from "@/lib/helpers/buybox"
import { ShopFooter, ShopHeader } from "@/components/shop/ShopChrome"
import { ShopImage } from "@/components/shop/ShopImage"
import { ShopProductCard } from "@/components/shop/ShopProductCard"
import { loadShop, shopColors, shopPaths } from "@/components/shop/shop-data"

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const shop = await loadShop(handle)
  if (!shop) return { title: "Κατάστημα" }
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

  const { seller, storefront } = shop
  const colors = shopColors(shop)
  const paths = await shopPaths(shop, locale, handle)
  const result = await listOffers({ sellerId: seller.id, countryCode: locale, limit: 500, offset: 0 }).catch(() => ({ offers: [], count: 0 }))

  // Offers are per variant (size); keep the best-ranked offer of each product.
  const seen = new Set<string>()
  const offers = rankOffers(result.offers as StoreOffer[])
    .filter((offer) => {
      const key = offer.product_id || offer.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 24)

  const template = storefront.template
  const isServices = template === "services"
  const featured = template === "atelier" ? offers.slice(0, 3) : []
  const rest = template === "atelier" ? offers.slice(3) : offers
  const hasContact = Boolean(storefront.contactEmail || storefront.contactPhone)
  const primaryCta = isServices && hasContact
    ? { href: "#contact", label: "Κλείσε ραντεβού" }
    : { href: "#catalog", label: isServices ? "Δες τις υπηρεσίες" : "Δες τη συλλογή" }

  return (
    <main style={{ background: colors.page, color: colors.ink }} className="min-h-screen">
      <ShopHeader shop={shop} colors={colors} home={paths.home} locale={locale} />

      {template === "local" ? (
        <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-8 sm:pt-14">
          <div style={{ background: colors.soft }} className="rounded-[2rem] px-6 py-14 text-center sm:px-12 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-60">{storefront.storeName}</p>
            <h1 className="font-serif mx-auto mt-4 max-w-3xl text-4xl font-bold leading-[1.1] sm:text-6xl">{storefront.tagline}</h1>
            {storefront.description ? <p className="mx-auto mt-5 max-w-2xl leading-7 opacity-75 sm:text-lg">{storefront.description}</p> : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={primaryCta.href} style={{ background: colors.accent }} className="rounded-full px-6 py-3 font-bold text-white hover:opacity-90">{primaryCta.label}</a>
              {hasContact ? <a href="#contact" style={{ borderColor: colors.ink }} className="rounded-full border px-6 py-3 font-bold hover:opacity-80">Βρες μας</a> : null}
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p style={{ color: colors.accent }} className="text-xs font-bold uppercase tracking-[0.22em]">
              {isServices ? "Υπηρεσίες" : "Νέα συλλογή"}
            </p>
            <h1 className="font-serif mt-4 text-4xl font-bold leading-[1.08] sm:text-6xl">{storefront.tagline}</h1>
            {storefront.description ? <p className="mt-5 max-w-xl leading-7 opacity-75 sm:text-lg">{storefront.description}</p> : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={primaryCta.href} style={{ background: colors.accent }} className="rounded-full px-6 py-3 font-bold text-white hover:opacity-90">{primaryCta.label}</a>
              {isServices ? <a href="#catalog" style={{ borderColor: colors.ink }} className="rounded-full border px-6 py-3 font-bold hover:opacity-80">Τι προσφέρουμε</a> : null}
            </div>
          </div>
          <ShopImage
            src={seller.banner}
            alt={storefront.storeName}
            label={storefront.storeName}
            accent={colors.accent}
            soft={colors.soft}
            className="aspect-[5/4] w-full rounded-[2rem]"
          />
        </section>
      )}

      {featured.length ? (
        <section className="mx-auto max-w-6xl px-5 pt-6 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {featured.map((offer) => (
              <ShopProductCard key={offer.id} offer={offer} href={paths.product(String(offer.product?.handle || ""))} colors={colors} locale={locale} large />
            ))}
          </div>
        </section>
      ) : null}

      <section id="catalog" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14 sm:px-8 sm:py-20">
        <div className="flex items-end justify-between gap-4 border-b pb-4" style={{ borderColor: `${colors.ink}1f` }}>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">{isServices ? "Τι προσφέρουμε" : featured.length ? "Όλη η συλλογή" : "Η συλλογή μας"}</h2>
          <span className="text-sm opacity-60">{offers.length} {offers.length === 1 ? "επιλογή" : "επιλογές"}</span>
        </div>
        {rest.length ? (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {rest.map((offer) => (
              <ShopProductCard key={offer.id} offer={offer} href={paths.product(String(offer.product?.handle || ""))} colors={colors} locale={locale} />
            ))}
          </div>
        ) : offers.length ? null : (
          <div style={{ background: colors.soft }} className="mt-8 rounded-3xl p-8 sm:p-12">
            <h3 className="text-xl font-bold">Ετοιμάζουμε τη συλλογή μας.</h3>
            <p className="mt-2 max-w-2xl leading-7 opacity-70">Επικοινώνησε μαζί μας για να μάθεις περισσότερα ή πέρασε ξανά σύντομα.</p>
          </div>
        )}
      </section>

      <section id="about" style={{ background: colors.soft }} className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p style={{ color: colors.accent }} className="text-xs font-bold uppercase tracking-[0.22em]">Ποιοι είμαστε</p>
            <h2 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">{storefront.storeName}</h2>
          </div>
          <div className="space-y-8">
            <p className="text-lg leading-8 opacity-80">{storefront.description || seller.description || storefront.tagline}</p>
            {(storefront.sections || []).map((section, index) => (
              <article key={section.id || index} className={section.type === "image" && section.imageUrl ? "grid gap-5 sm:grid-cols-2" : ""}>
                {section.type === "image" && section.imageUrl ? (
                  <ShopImage src={section.imageUrl} alt={section.title || storefront.storeName} accent={colors.accent} soft={colors.page} className="aspect-[4/3] w-full rounded-2xl" />
                ) : null}
                <div>
                  {section.title ? <h3 className="text-xl font-bold">{section.title}</h3> : null}
                  {section.body ? <p className="mt-2 whitespace-pre-line leading-7 opacity-75">{section.body}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-8 sm:grid-cols-2 sm:items-end">
          <div>
            <p style={{ color: colors.accent }} className="text-xs font-bold uppercase tracking-[0.22em]">Επικοινωνία</p>
            <h2 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">
              {isServices ? "Κλείσε ραντεβού ή ρώτησέ μας ό,τι θέλεις." : "Έχεις ερώτηση; Μίλα μαζί μας."}
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            {storefront.contactPhone ? (
              <a href={`tel:${storefront.contactPhone}`} style={{ background: colors.accent }} className="rounded-full px-6 py-3 font-bold text-white hover:opacity-90">Κάλεσε στο {storefront.contactPhone}</a>
            ) : null}
            {storefront.contactEmail ? (
              <a href={`mailto:${storefront.contactEmail}`} style={storefront.contactPhone ? { borderColor: colors.ink } : { background: colors.accent, color: "#fff" }} className="rounded-full border px-6 py-3 font-bold hover:opacity-80">
                {storefront.contactEmail}
              </a>
            ) : null}
            {!hasContact ? <p className="opacity-70">Τα στοιχεία επικοινωνίας θα προστεθούν σύντομα.</p> : null}
          </div>
        </div>
      </section>

      <ShopFooter shop={shop} colors={colors} />
    </main>
  )
}
