import Link from "next/link"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { SitePreview } from "@/components/sections/SitePreview/SitePreview"
import { listPublishedStorefronts, templateLabels, type DirectoryStorefront } from "@/lib/data/vitrinaki-storefronts"
import { listRegions } from "@/lib/data/regions"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
  toHreflang,
} from "@/lib/helpers/hreflang"

const businessUrl =
  process.env.NEXT_PUBLIC_VENDOR_URL || "http://localhost:7001"

const audiences = [
  { icon: "leaf", title: "Παραγωγοί", text: "Λάδι, μέλι, κρασί, τυριά. Το προϊόν σου, απευθείας στον πελάτη, σε όλη την Ελλάδα." },
  { icon: "hand", title: "Δημιουργοί & χειροποίητα", text: "Κοσμήματα, κεραμικά, ρούχα. Η δουλειά σου, παρουσιασμένη όπως της αξίζει." },
  { icon: "store", title: "Καταστήματα", text: "Το μαγαζί που ξέρει η γειτονιά, ανοιχτό και online, όλο το εικοσιτετράωρο." },
  { icon: "laptop", title: "Freelancers & υπηρεσίες", text: "Graphic designer, online δάσκαλος, φωτογράφος. Δείξε τη δουλειά σου και δέξου κρατήσεις." },
  { icon: "sprout", title: "Νέες επιχειρήσεις", text: "Ξεκίνα από εκεί που βρίσκεσαι σήμερα και μεγάλωσε τη βιτρίνα σου μαζί με την επιχείρηση." },
] as const

const lineIcons = {
  leaf: "M5 19c0-8 5-14 14-14 0 9-6 14-14 14Zm0 0 7-7",
  hand: "M7 11V6a1.5 1.5 0 0 1 3 0v4m0-5a1.5 1.5 0 0 1 3 0v5m0-4a1.5 1.5 0 0 1 3 0v6c0 4-2.5 7-6 7-2.5 0-4-1.5-5.5-4L4 13a1.5 1.5 0 0 1 2.6-1.5L7 12",
  store: "M4 9l1.5-5h13L20 9M4 9h16M4 9v11h16V9M9 20v-6h6v6",
  laptop: "M5 6h14v9H5zM3 18h18",
  sprout: "M12 20v-8m0 0c0-4-3-6-7-6 0 4 3 6 7 6Zm0 0c0-3 2.5-5 6-5 0 3-2.5 5-6 5Z",
  palette: "M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-1.2-1-1.5-1-2.5s.8-1.5 2-1.5H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5ZM7.5 11h.01M10 7.5h.01M15 7.5h.01",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z",
  bag: "M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2",
  book: "M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm0 13a3 3 0 0 1 3-3h9",
  chart: "M4 20V4m0 16h16M8 16v-4m4 4V8m4 8v-6",
  people: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6m1-9a3 3 0 1 0 0-6m2 15c0-2.6-1.4-4.8-3.5-5.6",
}

function LineIcon({ name, tone = "cypress" }: { name: keyof typeof lineIcons; tone?: "cypress" | "blue" }) {
  const toneClass = tone === "blue" ? "bg-[#265E8E]/[0.08] text-[#265E8E]" : "bg-[#2E4A37]/[0.06] text-[#2E4A37]"
  return (
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={lineIcons[name]} />
      </svg>
    </span>
  )
}

const included = [
  { icon: "palette", title: "Η δική σου ταυτότητα", text: "Το όνομα, το λογότυπο και τα χρώματά σου, σε ύφος που ταιριάζει στη δουλειά σου. Κανένα κατάστημα δεν μοιάζει με αντίγραφο." },
  { icon: "globe", title: "Η δική σου διεύθυνση", text: "Το e-shop σου ανοίγει στο vitrinaki.gr και μπορεί να συνδεθεί με το δικό σου domain." },
  { icon: "bag", title: "Καλάθι και παραγγελίες", text: "Ο πελάτης διαλέγει, βάζει στο καλάθι και παραγγέλνει. Εσύ βλέπεις κάθε παραγγελία σε ένα σημείο." },
  { icon: "book", title: "Η ιστορία σου", text: "Χώρος για το ποιος είσαι, πώς δουλεύεις και τι σε κάνει διαφορετικό, μαζί με τα στοιχεία επικοινωνίας σου." },
  { icon: "chart", title: "Διαχείριση από σένα", text: "Προϊόντα, τιμές και παραγγελίες από τον δικό σου πίνακα, χωρίς να περιμένεις κανέναν για μια απλή αλλαγή." },
  { icon: "people", title: "Άνθρωποι δίπλα σου", text: "Αν κολλήσεις ή θες βοήθεια στο στήσιμο, δεν το κάνεις μόνος σου. Μας ρωτάς και σε καθοδηγούμε." },
] as const

const steps = [
  { number: "01", title: "Μας λες ποιος είσαι", text: "Όνομα, λογότυπο, χρώματα, τι πουλάς ή τι προσφέρεις. Αυτό που ήδη ξέρεις για τη δουλειά σου, χωρίς τεχνικούς όρους." },
  { number: "02", title: "Στήνεται η βιτρίνα σου", text: "Ένα ολοκληρωμένο e-shop με τα δικά σου χαρακτηριστικά. Το φτιάχνεις μόνος σου βήμα βήμα, ή το στήνουμε μαζί." },
  { number: "03", title: "Ανοίγεις στο ψηφιακό εμπόριο", text: "Συνδέεις τη διεύθυνσή σου, μοιράζεσαι το link και δέχεσαι παραγγελίες. Από εκεί και πέρα, μεγαλώνεις με τον δικό σου ρυθμό." },
]

const faqs = [
  { q: "Χρειάζομαι τεχνικές γνώσεις;", a: "Όχι. Αν ξέρεις να στέλνεις email και να ανεβάζεις φωτογραφίες, ξέρεις αρκετά. Ό,τι άλλο χρειαστεί, σου το εξηγούμε." },
  { q: "Είναι marketplace όπου ανταγωνίζομαι άλλους πωλητές;", a: "Όχι. Παίρνεις το δικό σου, ανεξάρτητο e-shop με τη δική σου ταυτότητα. Η κοινή βιτρίνα του Vitrinaki απλώς βοηθά περισσότερους να σε ανακαλύψουν." },
  { q: "Μπορώ να έχω το δικό μου domain;", a: "Ναι. Το κατάστημά σου ανοίγει στο vitrinaki.gr και μπορείς να συνδέσεις το δικό σου domain, π.χ. to-magazi-mou.gr." },
  { q: "Πόσο κοστίζει;", a: "Οι τιμές οριστικοποιούνται. Η δέσμευσή μας είναι απλή: πριν ξεκινήσεις θα ξέρεις ακριβώς τι πληρώνεις, τι περιλαμβάνεται και τι όχι." },
  { q: "Κι αν δεν θέλω να το στήσω μόνος μου;", a: "Δεν χρειάζεται. Μπορείς να ξεκινήσεις μόνος σου, με καθοδήγηση, ή να μας ζητήσεις βοήθεια στο αρχικό στήσιμο." },
]

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

  const title = "Η βιτρίνα σου στο ψηφιακό εμπόριο"
  const description =
    "Ένα ολοκληρωμένο e-shop με το όνομα, το λογότυπο και τα χρώματα της επιχείρησής σου. Για παραγωγούς, δημιουργούς, καταστήματα και freelancers."
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


// Shown in the hero when no website is published yet (e.g. a fresh database).
const fallbackSites: DirectoryStorefront[] = [
  { handle: "", storeName: "Φούρνος Ελένη", tagline: "Ζεστό ψωμί κάθε πρωί από το 1987", description: "", template: "local", palette: "terracotta", logo: null, banner: null, customDomain: "" },
  { handle: "", storeName: "Studio Αλκυόνη", tagline: "Pilates και yoga στο κέντρο της πόλης", description: "", template: "services", palette: "plum", logo: null, banner: null, customDomain: "" },
  { handle: "", storeName: "Atelier Μύρτω", tagline: "Χειροποίητα κοσμήματα από ασήμι", description: "", template: "atelier", palette: "ocean", logo: null, banner: null, customDomain: "" },
]

const siteAddress = (site: DirectoryStorefront) =>
  site.customDomain || `vitrinaki.gr/${site.handle || site.storeName.toLowerCase().replace(/\s+/g, "-")}`

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`text-xs font-extrabold uppercase tracking-[0.18em] ${light ? "text-[#f2a28f]" : "text-[#C0503C]"}`}>{children}</p>
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

  const published = await listPublishedStorefronts()
  const heroSites = [...published, ...fallbackSites].slice(0, 3)
  const exampleFor = (template: DirectoryStorefront["template"]) =>
    published.find((site) => site.template === template)

  return (
    <main className="overflow-hidden bg-[#F7F2E8] text-[#2E4A37]">
      <Script
        id="ld-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Vitrinaki",
            url: `${baseUrl}/${locale}`,
            logo: `${baseUrl}/brand/vitrinaki-logo.png`,
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

      {/* Hero */}
      <section className="relative border-b border-[#eee4d6] bg-[radial-gradient(circle_at_0%_0%,#f4e6d5_0,transparent_40%),#F7F2E8]">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-12 sm:px-8 md:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:px-10 lg:py-20">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#e3d8c6] bg-white/70 px-3 py-1 text-xs font-bold text-[#2E4A37]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C0503C]" />
              ΤΟ <span className="text-[#265E8E]">vitrinaki</span> σου, στο ψηφιακό εμπόριο
            </p>
            <h1 className="font-serif mt-6 max-w-2xl text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              Η βιτρίνα σου <span className="text-[#C0503C]">στο ψηφιακό εμπόριο.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#456257] sm:text-lg">
              Ένα ολοκληρωμένο, επαγγελματικό e-shop με το όνομα, το λογότυπο και τα χρώματα της επιχείρησής σου, στη δική σου διεύθυνση. Εσύ μας λες τι κάνεις. Εμείς σε βάζουμε στη μεγάλη βιτρίνα.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={businessUrl} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#C0503C] px-6 py-3 font-bold text-white shadow-lg shadow-[#C0503C]/20 transition hover:-translate-y-0.5 hover:bg-[#a5412f]">
                Ξεκίνα το e-shop σου <span className="ml-2" aria-hidden="true">→</span>
              </a>
              <a href="#vitrina" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#aabdb1] bg-white/80 px-6 py-3 font-bold transition hover:bg-white">
                Δες καταστήματα
              </a>
            </div>
            <p className="mt-6 text-sm text-[#5c7268]">Χωρίς τεχνικές γνώσεις. Και χωρίς να το κάνεις μόνος σου.</p>
          </div>

          <div className="relative mx-auto min-h-[420px] w-full max-w-[720px] sm:min-h-[480px]" aria-hidden="true">
            <div className="absolute inset-x-6 top-6 bottom-2 rounded-[2rem] bg-[#e7e2d6]" />
            <SitePreview site={heroSites[0]} address={siteAddress(heroSites[0])} className="absolute left-0 top-0 w-[64%] -rotate-2" />
            <SitePreview site={heroSites[1]} address={siteAddress(heroSites[1])} className="absolute right-0 top-14 w-[56%] rotate-2" />
            <SitePreview site={heroSites[2]} address={siteAddress(heroSites[2])} className="absolute bottom-0 left-[18%] w-[58%]" />
          </div>
        </div>
      </section>

      {/* Who it is for */}
      <section id="for-whom" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 pt-14 sm:px-8 lg:px-10 lg:pt-20">
        <div className="max-w-2xl">
          <Eyebrow>Για ποιον είναι</Eyebrow>
          <h2 className="font-serif mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Όλοι αξίζουν μια θέση στη μεγάλη βιτρίνα.</h2>
          <p className="mt-3 leading-7 text-[#5c7268]">Δεν χρειάζεται να ξέρεις από design, προγραμματισμό ή διαφημίσεις για να μεγαλώσεις την επιχείρησή σου. Και ποτέ δεν είναι αργά για το επόμενο βήμα.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {audiences.map((item) => (
            <article key={item.title} className="rounded-2xl border border-[#eae3d8] bg-white/80 p-6">
              <LineIcon name={item.icon} />
              <h3 className="mt-4 text-base font-extrabold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#63766c]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Live shops */}
      <section id="vitrina" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Η βιτρίνα</Eyebrow>
            <h2 className="font-serif mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Επιχειρήσεις που άνοιξαν το e-shop τους.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#61756a]">Κάθε κατάστημα έχει το δικό του όνομα, ύφος και χρώματα. Άνοιξε ένα και δες το όπως θα το έβλεπε ένας πελάτης.</p>
        </div>

        {published.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {published.map((site) => (
              <Link key={site.handle} href={`/${locale}/store/${site.handle}`} className="group rounded-3xl border border-[#e6dfd3] bg-white p-3 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#23483a]/10">
                <SitePreview site={site} address={siteAddress(site)} className="shadow-none" />
                <div className="px-2 pb-2 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-extrabold">{site.storeName}</h3>
                    <span className="rounded-full bg-[#F7F2E8] px-2.5 py-1 text-[11px] font-bold text-[#5c7268]">{templateLabels[site.template]?.name}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#61756a]">{site.description || site.tagline}</p>
                  <span className="mt-3 inline-flex text-sm font-bold text-[#C0503C]">Άνοιξε το κατάστημα <span className="ml-1 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-[#d8cfbf] bg-white/60 p-10 text-center">
            <h3 className="text-xl font-extrabold">Το πρώτο κατάστημα μπορεί να είναι το δικό σου.</h3>
            <p className="mt-2 text-sm text-[#61756a]">Ξεκίνα σήμερα και άνοιξε τη βιτρίνα σου στο ψηφιακό εμπόριο.</p>
          </div>
        )}
      </section>

      {/* What you get */}
      <section id="included" className="border-y border-[#e8e1d6] bg-white/60">
        <div className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="max-w-2xl">
            <Eyebrow>Τι παίρνεις</Eyebrow>
            <h2 className="font-serif mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Ένα ολοκληρωμένο e-shop. Δικό σου.</h2>
          </div>
          <div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {included.map((item) => (
              <div key={item.title} className="flex gap-4">
                <LineIcon name={item.icon} tone="blue" />
                <div>
                  <h3 className="font-extrabold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#61756a]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="max-w-2xl">
          <Eyebrow>Πώς ξεκινάς</Eyebrow>
          <h2 className="font-serif mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Τρία βήματα. Και κάποιος δίπλα σου σε κάθε ένα.</h2>
        </div>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step) => (
            <li key={step.number} className="relative border-t-2 border-[#2E4A37] pt-6">
              <span className="font-serif text-4xl font-extrabold text-[#C0503C]">{step.number}</span>
              <h3 className="mt-3 text-xl font-extrabold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#61756a]">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Philosophy */}
      <section id="philosophy" className="px-5 sm:px-8 lg:px-10">
        <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[2rem] bg-[#2E4A37] px-6 py-14 text-[#F7F2E8] sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border-[48px] border-white/[0.04]" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <Eyebrow light>Η φιλοσοφία μας</Eyebrow>
              <blockquote className="font-serif mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">«Το επιχειρείν<br />εστίν φιλοσοφείν.»</blockquote>
            </div>
            <div className="space-y-4 text-base leading-7 text-[#d6e3db] sm:text-lg">
              <p>Το επιχειρείν δεν είναι μόνο η πώληση ενός προϊόντος. Είναι η σκέψη, η δημιουργία, η επιμονή και η αναζήτηση ενός καλύτερου τρόπου να προσφέρεις κάτι στον κόσμο.</p>
              <p>Η ιστορία κάθε επιχείρησης έχει αξία. Η τεχνολογία πρέπει να την αναδεικνύει, όχι να μπαίνει εμπόδιο. Γι' αυτό φτιάξαμε το Vitrinaki.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Styles */}
      <section id="examples" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="max-w-2xl">
          <Eyebrow>Ύφος</Eyebrow>
          <h2 className="font-serif mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Διάλεξε το ύφος που σου μοιάζει.</h2>
          <p className="mt-3 leading-7 text-[#5c7268]">Ξεκινάς από ένα ύφος και το κάνεις δικό σου με το λογότυπο, τα χρώματα και τις φωτογραφίες σου.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {(Object.keys(templateLabels) as DirectoryStorefront["template"][]).map((template) => {
            const example = exampleFor(template) || fallbackSites.find((site) => site.template === template)!
            const label = templateLabels[template]
            return (
              <article key={template} className="rounded-3xl border border-[#e6dfd3] bg-white p-3">
                <SitePreview site={example} address={siteAddress(example)} className="shadow-none" />
                <div className="px-2 pb-2 pt-4">
                  <h3 className="text-lg font-extrabold">{label.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#61756a]">{label.text}</p>
                  {example.handle ? (
                    <Link href={`/${locale}/store/${example.handle}`} className="mt-3 inline-flex text-sm font-bold text-[#C0503C]">
                      Δες το ζωντανά: {example.storeName} →
                    </Link>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-[#e8e1d6] bg-white/60">
        <div className="mx-auto grid max-w-[1400px] scroll-mt-20 gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-20">
          <div>
            <Eyebrow>Ερωτήσεις</Eyebrow>
            <h2 className="font-serif mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Όσα ρωτούν συνήθως πριν ξεκινήσουν.</h2>
          </div>
          <div className="divide-y divide-[#e6dfd3] border-y border-[#e6dfd3]">
            {faqs.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-extrabold">
                  {item.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#d8cfbf] text-[#C0503C] transition group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#61756a]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-7 rounded-[2rem] border border-[#e3d8c6] bg-[#fbf8f2] px-6 py-10 sm:px-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>Το επόμενο βήμα</Eyebrow>
            <h2 className="font-serif mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Ποτέ δεν είναι αργά για να ανοίξεις τη βιτρίνα σου.</h2>
            <p className="mt-3 max-w-xl text-[#5c7268]">Πες μας για την επιχείρησή σου και κάνε το πρώτο βήμα στο ψηφιακό εμπόριο. Δεν θα το κάνεις μόνος σου.</p>
          </div>
          <a href={businessUrl} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#C0503C] px-7 py-3 font-bold text-white shadow-lg shadow-[#C0503C]/20 transition hover:bg-[#a5412f]">
            Ξεκίνα το e-shop σου <span className="ml-2" aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </main>
  )
}
