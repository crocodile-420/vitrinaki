import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { FeaturedProductsSection } from "@/components/sections/FeaturedProductsSection/FeaturedProductsSection"
import { listRegions } from "@/lib/data/regions"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
  toHreflang,
} from "@/lib/helpers/hreflang"

const businessUrl =
  process.env.NEXT_PUBLIC_VENDOR_URL || "http://localhost:7001"

const featureCards = [
  { icon: "store", title: "Το δικό σου website", text: "Ένα επαγγελματικό online κατάστημα με την ταυτότητα της επιχείρησής σου." },
  { icon: "cart", title: "Προϊόντα & πωλήσεις", text: "Οργάνωσε τον κατάλογό σου και διαχειρίσου τις πωλήσεις από ένα σημείο." },
  { icon: "calendar", title: "Υπηρεσίες & κρατήσεις", text: "Παρουσίασε υπηρεσίες και κάνε εύκολη την επικοινωνία με τους πελάτες σου." },
  { icon: "megaphone", title: "Προβολή στο Vitrinaki", text: "Δώσε στα προϊόντα σου περισσότερες ευκαιρίες να ανακαλυφθούν." },
  { icon: "chart", title: "Στατιστικά", text: "Παρακολούθησε την πορεία της επιχείρησης και εντόπισε ευκαιρίες ανάπτυξης." },
  { icon: "globe", title: "Το δικό σου domain", text: "Χτίσε μια online διεύθυνση που θυμούνται οι πελάτες σου." },
  { icon: "plug", title: "Επεκτάσεις", text: "Δημιούργησε χώρο για χρήσιμα εργαλεία και integrations όσο μεγαλώνεις." },
  { icon: "support", title: "Ανθρώπινη υποστήριξη", text: "Έχεις καθοδήγηση στα επόμενα βήματά σου προς τις online πωλήσεις." },
]

const steps = [
  { number: "01", title: "Δημιούργησε την παρουσία σου", text: "Ξεκίνα με την επιχείρησή σου, τα στοιχεία και την εικόνα του brand σου." },
  { number: "02", title: "Πρόσθεσε ό,τι προσφέρεις", text: "Οργάνωσε προϊόντα ή υπηρεσίες και φτιάξε μια παρουσίαση που σε εκφράζει." },
  { number: "03", title: "Βγες online και μεγάλωσε", text: "Μοιράσου το website σου και δώσε στους πελάτες έναν απλό τρόπο να σε βρουν." },
]

const templates = [
  { name: "Μόδα & αξεσουάρ", label: "Fashion", image: "/images/categories/accessories.png", background: "bg-[#f4e6d8]" },
  { name: "Σπίτι & διακόσμηση", label: "Home & living", image: "/images/categories/shirt.png", background: "bg-[#e4eadf]" },
  { name: "Τοπικά προϊόντα", label: "Local goods", image: "/images/categories/sandals.png", background: "bg-[#f6e9ce]" },
  { name: "Ομορφιά & ευεξία", label: "Beauty & wellness", image: "/images/categories/boots.png", background: "bg-[#f2dfdb]" },
  { name: "Αθλητισμός", label: "Sports", image: "/images/categories/sneakers.png", background: "bg-[#dce9e5]" },
  { name: "Υπηρεσίες", label: "Services", image: "/images/categories/sport.png", background: "bg-[#ece5d9]" },
]

const iconPaths: Record<string, string> = {
  store: "M3 10h18M5 10v10h14V10M3 10l2-6h14l2 6M9 20v-6h6v6",
  cart: "M3 4h2l2.2 10.5a2 2 0 0 0 2 1.5h7.8a2 2 0 0 0 2-1.6L21 8H6M10 20h.01M18 20h.01",
  calendar: "M4 5h16v15H4zM8 3v4M16 3v4M4 9h16",
  megaphone: "M3 10v4h4l11 5V5L7 10H3zM7 14l2 6h4",
  chart: "M4 20V12h4v8H4zM10 20V4h4v16h-4zM16 20v-8h4v8h-4z",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
  plug: "M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-5 5v5M5 8h14",
  support: "M4 13v-2a8 8 0 0 1 16 0v2M4 13h3v5H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 1-2zM20 13h-3v5h2a2 2 0 0 0 2-2v-1a2 2 0 0 0-1-2zM9 21h6",
}

function FeatureIcon({ name }: { name: string }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e3eddf] text-[#124638]">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={iconPaths[name] || iconPaths.store} />
      </svg>
    </span>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") || "https"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`

  let locales: string[] = []
  try {
    locales = getStorefrontLocales(await listRegions())
  } catch {
    locales = [locale]
  }

  const { canonical, languages } = buildHreflangAlternates({
    baseUrl,
    path: "",
    locale,
    locales,
  })

  const title = "Ανακάλυψε ελληνικές επιχειρήσεις και δημιούργησε τη δική σου online βιτρίνα"
  const description =
    "Ανακάλυψε προϊόντα από ελληνικές επιχειρήσεις και δημιούργησε το δικό σου επαγγελματικό website με το Vitrinaki."
  const ogImage = "/B2C_Storefront_Open_Graph.png"

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    },
    alternates: { canonical, languages },
    openGraph: {
      title: `${title} | Vitrinaki`,
      description,
      url: canonical,
      siteName: "Vitrinaki",
      type: "website",
      images: [{ url: ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`, width: 1200, height: 630, alt: "Vitrinaki — ψηφιακές λύσεις για μικρές επιχειρήσεις" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`],
    },
  }
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") || "https"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`

  return (
    <main className="overflow-hidden bg-[#fffaf3] text-[#143f34]">
      <Script
        id="ld-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Vitrinaki",
            url: `${baseUrl}/${locale}`,
            logo: `${baseUrl}/Logo.svg`,
          }),
        }}
      />
      <Script
        id="ld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Vitrinaki",
            url: `${baseUrl}/${locale}`,
            inLanguage: toHreflang(locale),
          }),
        }}
      />

      <section className="relative border-b border-[#eee4d6] bg-[radial-gradient(circle_at_0%_0%,#f4e6d5_0,transparent_40%),#fffaf3]">
        <div className="mx-auto grid max-w-[1600px] items-center gap-8 px-5 py-12 sm:px-8 md:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:px-10 lg:py-20">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d9e5d9] bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#245746]">
              <span className="h-2 w-2 rounded-full bg-[#f15b2a]" />
              Η ψηφιακή πλατφόρμα για μικρές επιχειρήσεις
            </div>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight text-[#103d32] sm:text-5xl lg:text-6xl">
              Ανακάλυψε ελληνικές επιχειρήσεις. <span className="text-[#f15b2a]">Χτίσε τη δική σου online βιτρίνα.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#456257] sm:text-lg">
              Ανακάλυψε προϊόντα από μικρές ελληνικές επιχειρήσεις ή δημιούργησε το δικό σου website για να παρουσιάσεις το brand, τα προϊόντα και τις υπηρεσίες σου. Το Vitrinaki συνδέει την ανακάλυψη με τα ανεξάρτητα καταστήματα των επαγγελματιών.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/categories" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f15b2a] px-6 py-3 font-bold text-white shadow-lg shadow-[#f15b2a]/20 transition hover:-translate-y-0.5 hover:bg-[#d94a1f]">
                Ανακάλυψε προϊόντα <span className="ml-2" aria-hidden="true">→</span>
              </Link>
              <a href={businessUrl} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#aabdb1] bg-white/80 px-6 py-3 font-bold text-[#16483a] transition hover:bg-white">
                Δημιούργησε το δικό σου website
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[#426456]">
              <span>✓ Εύκολη διαχείριση</span>
              <span>✓ Έτοιμα templates</span>
              <span>✓ Μεγαλώνεις με τον ρυθμό σου</span>
            </div>
          </div>

          <div className="relative mx-auto min-h-[430px] w-full max-w-[780px] sm:min-h-[500px]">
            <div className="absolute inset-x-0 top-4 bottom-8 rounded-[2rem] bg-[#e7e2d6]" />
            <div className="absolute left-0 top-0 w-[69%] overflow-hidden rounded-2xl border border-[#e7dfd2] bg-white shadow-2xl shadow-[#23483a]/15">
              <div className="flex items-center gap-1.5 border-b border-[#eee7dc] bg-white px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-[#f15b2a]" />
                <span className="h-2 w-2 rounded-full bg-[#e7c16f]" />
                <span className="h-2 w-2 rounded-full bg-[#9dbba5]" />
                <span className="ml-3 h-2 w-24 rounded-full bg-[#ece9e2]" />
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold tracking-tight text-[#173f34]">néa.</span>
                  <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#728078]">Home & living</span>
                </div>
                <div className="mt-4 grid grid-cols-[1.1fr_0.9fr] gap-3">
                  <div className="flex flex-col justify-center rounded-xl bg-[#f4eee4] p-3 sm:p-4">
                    <span className="text-[9px] uppercase tracking-[0.12em] text-[#8e6a4f]">Μικρές λεπτομέρειες</span>
                    <span className="mt-2 text-lg font-bold leading-tight text-[#183f34] sm:text-2xl">Σπίτι με τη δική σου ιστορία.</span>
                    <span className="mt-3 inline-flex w-fit rounded-full bg-[#a8663e] px-3 py-1.5 text-[9px] font-bold text-white">Ανακάλυψε</span>
                  </div>
                  <div className="relative min-h-[150px] overflow-hidden rounded-xl bg-[#e3dfd3] sm:min-h-[190px]">
                    <Image src="/images/categories/accessories.png" alt="Παράδειγμα εικόνας προϊόντων για κατάστημα" fill className="object-cover" sizes="(min-width: 1024px) 24vw, 40vw" />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { image: "/images/categories/sandals.png", label: "Χειροποίητα" },
                    { image: "/images/categories/shirt.png", label: "Καθημερινά" },
                    { image: "/images/categories/sneakers.png", label: "Νέα άφιξη" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f0e9dc]">
                        <Image src={item.image} alt={item.label} fill className="object-cover" sizes="18vw" />
                      </div>
                      <p className="mt-1.5 text-[9px] font-semibold text-[#415b4f]">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 right-0 w-[57%] overflow-hidden rounded-2xl border border-[#d9e2da] bg-white shadow-2xl shadow-[#153c31]/20">
              <div className="flex items-center justify-between bg-[#103d32] px-3 py-3 text-white sm:px-4">
                <span className="text-xs font-bold">Vitrinaki Studio</span>
                <span className="rounded-full bg-white/15 px-2 py-1 text-[8px]">Πίνακας επιχείρησης</span>
              </div>
              <div className="grid grid-cols-[76px_1fr] sm:grid-cols-[95px_1fr]">
                <div className="space-y-3 bg-[#f1f4ef] p-3 text-[8px] font-semibold text-[#547166] sm:text-[9px]">
                  <p className="rounded-md bg-[#d9e8dc] p-2 text-[#164638]">Προϊόντα</p>
                  <p>Παραγγελίες</p>
                  <p>Απόθεμα</p>
                  <p>Προβολή</p>
                  <p>Ρυθμίσεις</p>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#173f34] sm:text-sm">Τα προϊόντα σου</span>
                    <span className="rounded-md bg-[#f15b2a] px-2 py-1 text-[8px] font-bold text-white">+ Νέο</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {[
                      { image: "/images/categories/accessories.png", name: "Κεραμικό βάζο", price: "32,00 €", status: "Σε απόθεμα" },
                      { image: "/images/categories/shirt.png", name: "Αρωματικό κερί", price: "18,00 €", status: "Χαμηλό" },
                      { image: "/images/categories/sandals.png", name: "Σετ δώρου", price: "28,00 €", status: "Σε απόθεμα" },
                    ].map((item) => (
                      <div key={item.name} className="grid grid-cols-[28px_1fr_auto] items-center gap-2 rounded-lg border border-[#eeeae2] p-2">
                        <div className="relative h-7 w-7 overflow-hidden rounded-md bg-[#f0e8dd]">
                          <Image src={item.image} alt="" fill className="object-cover" sizes="28px" />
                        </div>
                        <span className="text-[8px] font-semibold text-[#355548] sm:text-[9px]">{item.name}</span>
                        <span className="text-[8px] font-bold text-[#355548] sm:text-[9px]">{item.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg bg-[#f5eee2] px-3 py-2 text-[8px] text-[#6a796f]">Ενδεικτική προεπισκόπηση διαχείρισης</div>
                </div>
              </div>
            </div>
            <div className="absolute right-2 top-2 rounded-xl border border-[#e6dfd2] bg-white px-3 py-2 text-xs font-bold text-[#174739] shadow-lg sm:right-5 sm:top-5 sm:px-4 sm:py-3">
              <span className="mr-2 text-[#f15b2a]">↗</span>Η δική σου online βιτρίνα
            </div>
          </div>
        </div>
      </section>

      <FeaturedProductsSection locale={locale} />

      <section id="solutions" className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#f15b2a]">Μία πλατφόρμα, πολλές δυνατότητες</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#103d32] sm:text-3xl">Όλα όσα χρειάζεται η επιχείρησή σου για να προχωρήσει online.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#61756a]">Μια ψηφιακή βάση που μπορεί να εξελίσσεται μαζί με την επιχείρησή σου.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          {featureCards.map((item) => (
            <article key={item.title} className="rounded-2xl border border-[#eae3d8] bg-white/80 p-4 transition hover:-translate-y-1 hover:border-[#d2dfd2] hover:shadow-lg hover:shadow-[#1d4939]/5 sm:p-5">
              <FeatureIcon name={item.icon} />
              <h3 className="mt-4 text-sm font-extrabold leading-snug text-[#153f33]">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-[#63766c]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#e8e1d6] bg-[#f1eee4]">
        <div className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#f15b2a]">Απλά βήματα</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-[#103d32] sm:text-4xl">Από την ιδέα στην online παρουσία σου.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="rounded-2xl border border-[#e1d9cb] bg-[#fffaf3] p-6 sm:p-7">
                <span className="text-sm font-extrabold tracking-[0.16em] text-[#f15b2a]">{step.number}</span>
                <h3 className="mt-4 text-xl font-extrabold text-[#153f33]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#61756a]">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="examples" className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#f15b2a]">Η δική σου ταυτότητα</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#103d32] sm:text-4xl">Ένα website που ταιριάζει σε αυτό που κάνεις.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#61756a]">Τα παρακάτω είναι ενδεικτικές κατευθύνσεις εμφάνισης. Η προσαρμογή templates και η δημοσίευση ανεξάρτητων websites αποτελούν μέρος του στόχου ανάπτυξης του Vitrinaki.</p>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {templates.map((template) => (
            <article key={template.name} className="group overflow-hidden rounded-2xl border border-[#e6dfd3] bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#23483a]/10">
              <div className={`relative aspect-[4/5] overflow-hidden ${template.background}`}>
                <Image src={template.image} alt={`Ενδεικτική εικόνα για ${template.name}`} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(min-width: 1024px) 16vw, 45vw" />
                <span className="absolute left-3 top-3 rounded-full bg-[#fffaf3]/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#244a3d]">{template.label}</span>
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="text-sm font-extrabold text-[#173f34]">{template.name}</h3>
                <p className="mt-1 text-xs text-[#718077]">Ενδεικτικό template</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-14 sm:px-8 lg:px-10 lg:pb-20">
        <div className="relative mx-auto flex max-w-[1520px] flex-col gap-7 overflow-hidden rounded-[2rem] bg-[#103d32] px-6 py-9 text-white sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:px-14">
          <div className="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full border-[40px] border-white/5" />
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#ff9b78]">Το επόμενο βήμα ξεκινά εδώ</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Η επιχείρησή σου αξίζει να είναι online.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#d6e3db] sm:text-base">Χτίσε σταδιακά τη δική σου ψηφιακή παρουσία, με εργαλεία που έχουν στο επίκεντρο τις ανάγκες της ελληνικής μικρής επιχείρησης.</p>
          </div>
          <a href={businessUrl} className="relative z-10 inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#f15b2a] px-6 py-3 font-bold text-white transition hover:bg-[#d94a1f]">
            Ξεκίνα σήμερα <span className="ml-2" aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </main>
  )
}
