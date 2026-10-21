import { notFound } from "next/navigation"

import { getShopBookings } from "@/lib/data/bookings"
import { listOffers } from "@/lib/data/offers"
import { rankOffers, type StoreOffer } from "@/lib/helpers/buybox"
import { ShopBooking } from "@/components/shop/ShopBooking"
import { ShopFooter, ShopHeader } from "@/components/shop/ShopChrome"
import { ShopImage } from "@/components/shop/ShopImage"
import { ShopProductCard } from "@/components/shop/ShopProductCard"
import { loadShop, shopColors, shopPaths } from "@/components/shop/shop-data"
import {
  AreaSection,
  CraftSection,
  DeliverySection,
  HERO_COPY,
  LanguagesLine,
  OriginSection,
  ProjectsSection,
  SECTION_ORDER,
  ServicesSection,
  SkillsSection,
  VisitSection,
  CERT_LABELS,
  intlNumber,
  mapUrl,
  sectionHasData,
} from "@/components/shop/ShopProfileSections"
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
  const { lang, tr } = await getTranslator()

  const { seller, storefront } = shop
  const colors = shopColors(shop)
  const paths = await shopPaths(shop, locale, handle)
  const [result, bookings] = await Promise.all([
    listOffers({ sellerId: seller.id, countryCode: locale, limit: 500, offset: 0 }).catch(() => ({ offers: [], count: 0 })),
    getShopBookings(seller.id),
  ])

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

  const profile = shop.profile || null
  const type = profile?.businessType || null
  const template = storefront.template
  // Sellers without a Studio profile keep the template-based page.
  const isServices = type ? ["services", "beauty", "portfolio"].includes(type) : template === "services"
  const productFirst = !type || !["services", "beauty", "portfolio"].includes(type)
  const featured = template === "atelier" && productFirst && offers.length > 4 ? offers.slice(0, 3) : []
  const rest = featured.length ? offers.slice(3) : offers
  const whatsapp = profile?.whatsapp ? intlNumber(profile.whatsapp) : ""
  const viber = profile?.viber ? intlNumber(profile.viber) : ""
  const hasContact = Boolean(storefront.contactEmail || storefront.contactPhone || whatsapp || viber)
  const copy = type ? HERO_COPY[type] : null
  // Online bookings (Studio → Κρατήσεις): the booking box goes right after the
  // price list, or before the contact block when there is none.
  const baseOrder = SECTION_ORDER[type || "legacy"]
  const order = bookings.enabled
    ? baseOrder.includes("services") && sectionHasData("services", profile)
      ? baseOrder.flatMap((id) => (id === "services" ? ["services", "booking"] : [id]))
      : baseOrder.flatMap((id) => (id === "contact" ? ["booking", "contact"] : [id]))
    : baseOrder
  const showSection = (id: string) =>
    id === "catalog" ? productFirst || offers.length > 0 : id === "booking" ? bookings.enabled : sectionHasData(id, profile)
  const secondaryOk = (href: string) => href === "#contact" ? true : showSection(href.slice(1) === "about" ? "story" : href.slice(1))

  const bookCta = { href: "#booking", label: tr("Κλείσε ραντεβού") }
  const primaryCta = bookings.enabled
    ? bookCta
    : copy
    ? { href: copy.ctaHref, label: tr(copy.cta) }
    : isServices && hasContact
      ? { href: "#contact", label: tr("Κλείσε ραντεβού") }
      : { href: "#catalog", label: tr(isServices ? "Δες τις υπηρεσίες" : "Δες τη συλλογή") }
  const secondaryCta = bookings.enabled
    ? copy && secondaryOk(copy.ctaHref) ? { href: copy.ctaHref, label: tr(copy.cta) } : null
    : copy && secondaryOk(copy.secondaryHref) ? { href: copy.secondaryHref, label: tr(copy.secondary) } : null
  const eyebrow = copy
    ? type === "other" && profile?.businessTypeOther
      ? profile.businessTypeOther
      : `${tr(copy.eyebrow)}${type === "food" && profile?.food.region ? ` · ${profile.food.region}` : ""}`
    : tr(isServices ? "Υπηρεσίες" : "Νέα συλλογή")

  // Small facts under the hero, chosen per type from what the seller filled.
  const heroFacts: string[] = []
  if (bookings.enabled) heroFacts.push(tr("Online κρατήσεις"))
  if (profile) {
    if (type === "food") {
      if (profile.food.producerSince) heroFacts.push(`${tr("Από το")} ${profile.food.producerSince}`)
      profile.food.certifications.filter((c) => c !== "other").slice(0, 3).forEach((c) => heroFacts.push(tr(CERT_LABELS[c] || c)))
    }
    if (type === "crafts") {
      if (profile.crafts.madeToOrder) heroFacts.push(tr("Κατά παραγγελία"))
      if (profile.crafts.customOrders) heroFacts.push(tr("Εξατομίκευση"))
    }
    if (type === "services" || type === "beauty") {
      if (profile.services.atClient) heroFacts.push(tr("Ερχόμαστε σε εσένα"))
      if (profile.services.online) heroFacts.push(tr("Και online"))
      if (profile.byAppointment) heroFacts.push(tr("Κατόπιν ραντεβού"))
    }
    if (type === "portfolio" && profile.portfolio.availability) heroFacts.push(profile.portfolio.availability)
    if (profile.delivery.shipping && productFirst) heroFacts.push(tr("Αποστολή σε όλη την Ελλάδα"))
    if (profile.delivery.pickup && productFirst) heroFacts.push(tr("Παραλαβή από το κατάστημα"))
    const place = [profile.address.area, profile.address.city].filter(Boolean).join(", ")
    if (place && type !== "food") heroFacts.push(place)
  }

  const heroButtons = (center: boolean) => (
    <div className={`mt-8 flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
      <a href={primaryCta.href} style={{ background: colors.accent }} className="rounded-full px-6 py-3 font-bold text-white hover:opacity-90">{primaryCta.label}</a>
      {secondaryCta ? (
        <a href={secondaryCta.href} style={{ borderColor: colors.ink }} className="rounded-full border px-6 py-3 font-bold hover:opacity-80">{secondaryCta.label}</a>
      ) : !copy && (template === "local" ? hasContact : isServices) ? (
        <a href={template === "local" ? "#contact" : "#catalog"} style={{ borderColor: colors.ink }} className="rounded-full border px-6 py-3 font-bold hover:opacity-80">{tr(template === "local" ? "Βρες μας" : "Τι προσφέρουμε")}</a>
      ) : null}
      {whatsapp ? (
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ borderColor: colors.ink }} className="rounded-full border px-6 py-3 font-bold hover:opacity-80">WhatsApp</a>
      ) : null}
    </div>
  )
  const heroFactsRow = (center: boolean) => heroFacts.length ? (
    <ul className={`mt-6 flex flex-wrap gap-2 text-sm font-semibold ${center ? "justify-center" : ""}`}>
      {heroFacts.map((fact) => <li key={fact} style={{ borderColor: `${colors.ink}33` }} className="rounded-full border bg-white/50 px-3 py-1">{fact}</li>)}
    </ul>
  ) : null

  const sections: Record<string, (soft: boolean) => React.JSX.Element | null> = {
    catalog: () => (
      <section key="catalog" id="catalog" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14 sm:px-8 sm:py-20">
        <div className="flex items-end justify-between gap-4 border-b pb-4" style={{ borderColor: `${colors.ink}1f` }}>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">{tr(!productFirst ? "Προϊόντα" : isServices ? "Τι προσφέρουμε" : "Η συλλογή μας")}</h2>
          <span className="text-sm opacity-60">{offers.length} {tr(offers.length === 1 ? "επιλογή" : "επιλογές")}</span>
        </div>
        {profile?.retail.categories ? <p className="mt-4 opacity-70">{profile.retail.categories}{profile.retail.brands ? ` · ${profile.retail.brands}` : ""}</p> : null}
        {featured.length ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {featured.map((offer) => (
              <ShopProductCard key={offer.id} offer={offer} href={paths.product(String(offer.product?.handle || ""))} colors={colors} locale={locale} large lang={lang} />
            ))}
          </div>
        ) : null}
        {rest.length ? (
          <div className={`${featured.length ? "mt-10" : "mt-8"} grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4`}>
            {rest.map((offer) => (
              <ShopProductCard key={offer.id} offer={offer} href={paths.product(String(offer.product?.handle || ""))} colors={colors} locale={locale} lang={lang} />
            ))}
          </div>
        ) : offers.length ? null : (
          <div style={{ background: colors.soft }} className="mt-8 rounded-3xl p-8 sm:p-12">
            <h3 className="text-xl font-bold">{tr("Ετοιμάζουμε τη συλλογή μας.")}</h3>
            <p className="mt-2 max-w-2xl leading-7 opacity-70">{tr("Επικοινώνησε μαζί μας για να μάθεις περισσότερα ή πέρασε ξανά σύντομα.")}</p>
          </div>
        )}
      </section>
    ),
    story: (soft) => (profile?.story || storefront.description || seller.description || (storefront.sections || []).length || !profile) ? (
      <section key="story" id="about" style={soft ? { background: colors.soft } : undefined} className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p style={{ color: colors.accent }} className="text-xs font-bold uppercase tracking-[0.22em]">{tr(type === "portfolio" ? "Λίγα λόγια για μένα" : "Ποιοι είμαστε")}</p>
            <h2 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">{profile?.story ? tr(type === "portfolio" ? "Η διαδρομή μου" : "Η ιστορία μας") : storefront.storeName}</h2>
          </div>
          <div className="space-y-8">
            <p className="whitespace-pre-line text-lg leading-8 opacity-80">{profile?.story || storefront.description || seller.description || storefront.tagline}</p>
            {profile?.credentials ? <p style={{ background: soft ? colors.page : colors.soft }} className="rounded-2xl p-5 leading-7"><span className="font-bold">{tr("Εμπειρία & διακρίσεις")}: </span>{profile.credentials}</p> : null}
            {profile ? <LanguagesLine p={profile} tr={tr} /> : null}
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
    ) : null,
    origin: (soft) => profile ? <OriginSection key="origin" p={profile} colors={colors} tr={tr} soft={soft} /> : null,
    craft: (soft) => profile ? <CraftSection key="craft" p={profile} colors={colors} tr={tr} soft={soft} /> : null,
    services: (soft) => profile ? <ServicesSection key="services" p={profile} colors={colors} tr={tr} soft={soft} booking={bookings.enabled} /> : null,
    booking: (soft) => bookings.enabled ? (
      <ShopBooking
        key="booking"
        sellerId={seller.id}
        services={bookings.services}
        autoConfirm={bookings.autoConfirm}
        note={bookings.note}
        cancelHours={bookings.cancelHours}
        colors={colors}
        soft={soft}
        manageBase={`${paths.home === "/" ? "" : paths.home}/booking`}
      />
    ) : null,
    projects: (soft) => profile ? <ProjectsSection key="projects" p={profile} colors={colors} tr={tr} soft={soft} /> : null,
    skills: (soft) => profile ? <SkillsSection key="skills" p={profile} colors={colors} tr={tr} soft={soft} /> : null,
    visit: (soft) => profile ? <VisitSection key="visit" p={profile} colors={colors} tr={tr} soft={soft} /> : null,
    area: (soft) => profile ? <AreaSection key="area" p={profile} colors={colors} tr={tr} soft={soft} /> : null,
    delivery: (soft) => profile ? <DeliverySection key="delivery" p={profile} colors={colors} tr={tr} soft={soft} /> : null,
    contact: () => (
      <section key="contact" id="contact" style={{ background: colors.ink, color: colors.page }} className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2 sm:items-end sm:px-8 sm:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-70">{tr("Επικοινωνία")}</p>
            <h2 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">
              {tr(type === "portfolio" ? "Έχεις ένα έργο στο μυαλό σου; Ας μιλήσουμε." : isServices ? "Ζήτησε ραντεβού ή ρώτησέ μας ό,τι θέλεις." : "Έχεις ερώτηση; Μίλα μαζί μας.")}
            </h2>
            {profile && (profile.socials.instagram || profile.socials.facebook || profile.socials.tiktok || profile.socials.website) ? (
              <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold">
                {profile.socials.instagram ? <a href={profile.socials.instagram} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">Instagram</a> : null}
                {profile.socials.facebook ? <a href={profile.socials.facebook} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">Facebook</a> : null}
                {profile.socials.tiktok ? <a href={profile.socials.tiktok} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">TikTok</a> : null}
                {profile.socials.website ? <a href={profile.socials.website} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">Website</a> : null}
              </div>
            ) : null}
            {profile?.address.showMap && mapUrl(profile) && !showSection("visit") ? <a href={mapUrl(profile)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-bold underline underline-offset-4">{tr("Δες στον χάρτη")} ↗</a> : null}
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            {whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ background: colors.page, color: colors.ink }} className="rounded-full px-6 py-3 font-bold hover:opacity-90">{tr("Στείλε μήνυμα στο WhatsApp")}</a> : null}
            {viber ? <a href={`viber://chat?number=%2B${viber}`} style={{ borderColor: colors.page }} className="rounded-full border px-6 py-3 font-bold hover:opacity-80">Viber</a> : null}
            {storefront.contactPhone ? (
              <a href={`tel:${storefront.contactPhone}`} style={whatsapp ? { borderColor: colors.page } : { background: colors.page, color: colors.ink }} className="rounded-full border px-6 py-3 font-bold hover:opacity-90">{tr("Κάλεσε στο")} {storefront.contactPhone}</a>
            ) : null}
            {storefront.contactEmail ? (
              <a href={`mailto:${storefront.contactEmail}`} style={{ borderColor: colors.page }} className="rounded-full border px-6 py-3 font-bold hover:opacity-80">
                {storefront.contactEmail}
              </a>
            ) : null}
            {!hasContact ? <p className="opacity-70">{tr("Τα στοιχεία επικοινωνίας θα προστεθούν σύντομα.")}</p> : null}
          </div>
        </div>
      </section>
    ),
  }

  const centeredHero = template === "local"

  return (
    <main style={{ background: colors.page, color: colors.ink }} className="min-h-screen">
      <ShopHeader shop={shop} colors={colors} home={paths.home} locale={locale} lang={lang} />

      {centeredHero ? (
        <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-8 sm:pt-14">
          <div style={{ background: colors.soft }} className="relative overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12 sm:py-20">
            {seller.banner && profile ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seller.banner} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-20" />
            ) : null}
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-60">{copy ? eyebrow : storefront.storeName}</p>
              <h1 className="font-serif mx-auto mt-4 max-w-3xl text-4xl font-bold leading-[1.1] sm:text-6xl">{storefront.tagline}</h1>
              {storefront.description ? <p className="mx-auto mt-5 max-w-2xl leading-7 opacity-75 sm:text-lg">{storefront.description}</p> : null}
              {heroButtons(true)}
              {heroFactsRow(true)}
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p style={{ color: colors.accent }} className="text-xs font-bold uppercase tracking-[0.22em]">{eyebrow}</p>
            <h1 className="font-serif mt-4 text-4xl font-bold leading-[1.08] sm:text-6xl">{storefront.tagline}</h1>
            {storefront.description ? <p className="mt-5 max-w-xl leading-7 opacity-75 sm:text-lg">{storefront.description}</p> : null}
            {heroButtons(false)}
            {heroFactsRow(false)}
          </div>
          {!seller.banner && profile ? (
            // No cover photo: show a quick-info card built from the profile instead of an empty tile.
            <div style={{ background: colors.soft }} className="rounded-[2rem] p-7 sm:p-9">
              <p style={{ color: colors.accent }} className="text-xs font-bold uppercase tracking-[0.22em]">{storefront.storeName}</p>
              {profile.services.items.length ? (
                <ul className="mt-5 space-y-3">
                  {profile.services.items.slice(0, 4).map((item, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-4 border-b pb-3" style={{ borderColor: `${colors.ink}1a` }}>
                      <span className="font-semibold">{item.name}</span>
                      {item.price ? <span style={{ color: colors.accent }} className="shrink-0 font-extrabold">{item.price}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-6 space-y-1.5 text-sm">
                {profile.services.serviceArea || profile.address.city ? <p><span className="font-bold">{tr("Περιοχή εξυπηρέτησης")}:</span> {profile.services.serviceArea || [profile.address.area, profile.address.city].filter(Boolean).join(", ")}</p> : null}
                {storefront.contactPhone ? <p><a href={`tel:${storefront.contactPhone}`} className="font-bold underline-offset-4 hover:underline">{storefront.contactPhone}</a></p> : null}
              </div>
            </div>
          ) : (
            <ShopImage
              src={seller.banner}
              alt={storefront.storeName}
              label={storefront.storeName}
              accent={colors.accent}
              soft={colors.soft}
              className="aspect-[5/4] w-full rounded-[2rem]"
            />
          )}
        </section>
      )}

      {/* Sections alternate between page and soft backgrounds; the product grid
          stays on the page colour and the contact block is always dark. */}
      {(() => {
        let tone = 0
        return order.filter(showSection).map((id) => {
          if (id === "catalog" || id === "contact") {
            tone = 0
            return sections[id](false)
          }
          tone += 1
          return sections[id](tone % 2 === 1)
        })
      })()}

      <ShopFooter shop={shop} colors={colors} lang={lang} />
    </main>
  )
}
