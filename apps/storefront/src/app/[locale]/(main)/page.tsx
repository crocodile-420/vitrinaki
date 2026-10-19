import Link from "next/link"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { SitePreview } from "@/components/sections/SitePreview/SitePreview"
import { listPublishedStorefronts, templateLabels, type DirectoryStorefront } from "@/lib/data/vitrinaki-storefronts"
import { listRegions } from "@/lib/data/regions"
import { getTranslator } from "@/lib/i18n/server"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
  toHreflang,
} from "@/lib/helpers/hreflang"

import { studioRegisterUrl as businessUrl } from "@/lib/vitrinaki-links"

const audiences = [
  { icon: "leaf", title: "Παραγωγοί", text: "Λάδι, μέλι, κρασί, τυριά. Το προϊόν σου, απευθείας στον πελάτη, σε όλη την Ελλάδα." },
  { icon: "hand", title: "Δημιουργοί & χειροποίητα", text: "Κοσμήματα, κεραμικά, ρούχα. Η δουλειά σου, παρουσιασμένη όπως της αξίζει." },
  { icon: "store", title: "Καταστήματα", text: "Το μαγαζί που ξέρει η γειτονιά, ανοιχτό και online, όλο το εικοσιτετράωρο." },
  { icon: "laptop", title: "Freelancers & υπηρεσίες", text: "Graphic designer, online δάσκαλος, φωτογράφος. Δείξε τη δουλειά σου και δέξου κρατήσεις." },
  { icon: "sprout", title: "Νέες επιχειρήσεις", text: "Ξεκίνα από εκεί που βρίσκεσαι σήμερα και μεγάλωσε τη βιτρίνα σου μαζί με την επιχείρηση." },
] as const

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

const marketplaceSide = [
  "Είσαι ένα αποτέλεσμα αναζήτησης, δίπλα στον ανταγωνιστή σου.",
  "Ο πελάτης θυμάται την πλατφόρμα, όχι εσένα.",
  "Ανταγωνίζεσαι μόνο στην τιμή.",
  "Οι κανόνες αλλάζουν χωρίς να σε ρωτήσουν.",
]

const vitrinakiSide = [
  "Είσαι ο προορισμός. Ο πελάτης έρχεται για σένα.",
  "Το όνομα, το λογότυπο και οι πελάτες είναι δικά σου.",
  "Ξεχωρίζεις με την ιστορία και την ποιότητά σου.",
  "Αποφασίζεις εσύ πώς δείχνεις και τι πουλάς.",
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

  const { tr } = await getTranslator()
  const title = tr("Η βιτρίνα σου στο ψηφιακό εμπόριο")
  const description = tr(
    "Ένα ολοκληρωμένο e-shop με το όνομα, το λογότυπο και τα χρώματα της επιχείρησής σου. Για παραγωγούς, δημιουργούς, καταστήματα και freelancers.")
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
      images: [{ url: ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`, width: 1200, height: 630, alt: tr("Vitrinaki — ψηφιακές λύσεις για μικρές επιχειρήσεις") }],
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

const INK = "text-[#2E4A37]"
const MUTED = "text-[#2E4A37]/70"
const RULE = "border-[#2E4A37]/[0.12]"
const WRAP = "mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12"

function Label({ n, children, light = false, center = false }: { n?: string; children: React.ReactNode; light?: boolean; center?: boolean }) {
  return (
    <p className={`flex items-center gap-3 ${center ? "justify-center" : ""} text-[11px] font-semibold uppercase tracking-[0.24em] ${light ? "text-[#F7F2E8]/60" : "text-[#2E4A37]/60"}`}>
      {n ? <span className="font-serif text-[13px] tracking-normal">{n}</span> : null}
      {n ? <span className={`h-px w-8 ${light ? "bg-[#F7F2E8]/30" : "bg-[#2E4A37]/30"}`} /> : null}
      {children}
    </p>
  )
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`font-serif mt-5 text-[2rem] font-medium leading-[1.12] tracking-tight sm:text-[2.75rem] ${className}`}>{children}</h2>
}

const primaryBtn = "inline-flex min-h-12 items-center justify-center rounded-md bg-[#C0503C] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#a5412f]"
const textLink = "inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#2E4A37] underline decoration-[#2E4A37]/30 underline-offset-[6px] transition hover:decoration-[#2E4A37]"

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { lang, tr } = await getTranslator()
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") || "https"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`

  const published = await listPublishedStorefronts()
  const heroSite = [...published, ...fallbackSites][0]
  const exampleFor = (template: DirectoryStorefront["template"]) =>
    published.find((site) => site.template === template)

  return (
    <main className={`overflow-hidden bg-[#F7F2E8] ${INK}`}>
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
      <section className={`border-b ${RULE}`}>
        <div className={`${WRAP} grid items-center gap-14 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:pb-28 lg:pt-28`}>
          <div>
            <h1 className="font-serif text-[2.6rem] font-medium leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.4rem]">
              {tr("Το vitrinaki σου, στο ψηφιακό εμπόριο.")}
              <span className="mt-3 block italic text-[#C0503C]">{tr("Ποτέ δεν είναι αργά.")}</span>
            </h1>
            <p className={`mt-8 max-w-xl text-[17px] leading-8 ${MUTED}`}>
              {tr("Στα marketplaces είσαι ένα ακόμη προϊόν δίπλα στον ανταγωνιστή σου, με τους δικούς τους κανόνες. Στο Vitrinaki αποκτάς ολοκληρωμένο e-shop με το όνομα, το λογότυπο και τα χρώματά σου, στη δική σου διεύθυνση. Οι πελάτες σου μένουν δικοί σου.")}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <a href={businessUrl} className={primaryBtn}>
                {tr("Άνοιξε τη βιτρίνα σου")} <span className="ml-2" aria-hidden="true">→</span>
              </a>
              <a href="#vitrina" className={textLink}>{tr("Δες καταστήματα")}</a>
            </div>
            <p className={`mt-10 border-t ${RULE} pt-5 text-[13px] tracking-wide text-[#2E4A37]/60`}>{tr("Χωρίς τεχνικές γνώσεις. Και χωρίς να το κάνεις μόνος σου.")}</p>
          </div>

          <figure className="mx-auto w-full max-w-[560px]" aria-hidden="true">
            <div className="border border-[#2E4A37]/15 bg-white p-3 sm:p-5">
              <SitePreview lang={lang} site={heroSite} address={siteAddress(heroSite)} />
            </div>
            <figcaption className="mt-4 flex items-center justify-between gap-4 truncate text-[11px] uppercase tracking-[0.22em] text-[#2E4A37]/50">
              <span className="hidden sm:inline">{tr(heroSite.storeName)}</span>
              <span>{siteAddress(heroSite)}</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Manifesto */}
      <section className={`border-b ${RULE}`}>
        <div className={`${WRAP} py-20 lg:py-28`}>
          <div className="max-w-3xl">
            <Label>{tr("Η διαφορά")}</Label>
            <H2>{tr("Στο marketplace είσαι ένα αποτέλεσμα. Στη βιτρίνα σου είσαι ο προορισμός.")}</H2>
          </div>
          <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <p className={`border-b ${RULE} pb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2E4A37]/50`}>{tr("Σε ξένη πλατφόρμα")}</p>
              <ul className={`divide-y ${RULE.replace("border", "divide")}`}>
                {marketplaceSide.map((line) => (
                  <li key={line} className="py-4 text-[16px] leading-7 text-[#2E4A37]/55">{tr(line)}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="border-b border-[#2E4A37]/40 pb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#C0503C]">{tr("Στο δικό σου vitrinaki")}</p>
              <ul className={`divide-y ${RULE.replace("border", "divide")}`}>
                {vitrinakiSide.map((line) => (
                  <li key={line} className="font-serif py-4 text-[18px] leading-7">{tr(line)}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who it is for */}
      <section id="for-whom" className={`scroll-mt-20 border-b ${RULE}`}>
        <div className={`${WRAP} grid gap-12 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:py-28`}>
          <div>
            <Label n="01">{tr("Για ποιον είναι")}</Label>
            <H2>{tr("Όλοι αξίζουν μια θέση στη μεγάλη βιτρίνα.")}</H2>
            <p className={`mt-6 max-w-md leading-7 ${MUTED}`}>{tr("Δεν χρειάζεται να ξέρεις από design, προγραμματισμό ή διαφημίσεις για να μεγαλώσεις την επιχείρησή σου. Και ποτέ δεν είναι αργά για το επόμενο βήμα.")}</p>
          </div>
          <ol className={`border-t ${RULE}`}>
            {audiences.map((item, i) => (
              <li key={item.title} className={`grid grid-cols-[2.5rem_1fr] gap-x-4 border-b ${RULE} py-6 sm:grid-cols-[3rem_14rem_1fr] sm:gap-x-6`}>
                <span className="font-serif text-sm text-[#2E4A37]/45">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-serif text-xl">{tr(item.title)}</h3>
                <p className={`col-start-2 mt-2 text-[15px] leading-7 sm:col-start-3 sm:mt-0 ${MUTED}`}>{tr(item.text)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Live shops */}
      <section id="vitrina" className={`scroll-mt-20 border-b ${RULE}`}>
        <div className={`${WRAP} py-20 lg:py-28`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Label n="02">{tr("Η βιτρίνα")}</Label>
              <H2>{tr("Επιχειρήσεις που άνοιξαν το e-shop τους.")}</H2>
            </div>
            <p className={`max-w-sm text-[15px] leading-7 ${MUTED}`}>{tr("Κάθε κατάστημα έχει το δικό του όνομα, ύφος και χρώματα. Άνοιξε ένα και δες το όπως θα το έβλεπε ένας πελάτης.")}</p>
          </div>

          {published.length ? (
            <div className="mt-14 grid gap-px border border-[#2E4A37]/[0.12] bg-[#2E4A37]/[0.12] sm:grid-cols-2 lg:grid-cols-3">
              {published.map((site) => (
                <Link key={site.handle} href={`/${locale}/store/${site.handle}`} className="group flex flex-col bg-[#F7F2E8] p-6 transition hover:bg-white sm:p-8">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#2E4A37]/50">{tr(templateLabels[site.template]?.name || "")}</p>
                  <h3 className="font-serif mt-3 text-2xl">{site.storeName}</h3>
                  <p className={`mt-2 line-clamp-1 text-[15px] ${MUTED}`}>{site.description || site.tagline}</p>
                  <span className="mt-6 text-sm font-semibold underline decoration-[#2E4A37]/30 underline-offset-[6px] group-hover:decoration-[#2E4A37]">
                    {tr("Δες τη βιτρίνα")} <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className={`mt-14 border ${RULE} p-10 text-center`}>
              <h3 className="font-serif text-2xl">{tr("Το πρώτο κατάστημα μπορεί να είναι το δικό σου.")}</h3>
              <p className={`mt-2 text-sm ${MUTED}`}>{tr("Ξεκίνα σήμερα και άνοιξε τη βιτρίνα σου στο ψηφιακό εμπόριο.")}</p>
            </div>
          )}
        </div>
      </section>

      {/* What you get */}
      <section id="included" className={`scroll-mt-20 border-b ${RULE} bg-white`}>
        <div className={`${WRAP} py-20 lg:py-28`}>
          <div className="max-w-2xl">
            <Label n="03">{tr("Τι παίρνεις")}</Label>
            <H2>{tr("Ένα ολοκληρωμένο e-shop. Δικό σου.")}</H2>
          </div>
          <div className="mt-14 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
            {included.map((item, i) => (
              <div key={item.title} className={`border-t ${RULE} py-8`}>
                <span className="font-serif text-sm text-[#2E4A37]/45">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-serif mt-3 text-xl">{tr(item.title)}</h3>
                <p className={`mt-3 text-[15px] leading-7 ${MUTED}`}>{tr(item.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={`scroll-mt-20 border-b ${RULE}`}>
        <div className={`${WRAP} py-20 lg:py-28`}>
          <div className="max-w-2xl">
            <Label n="04">{tr("Πώς ξεκινάς")}</Label>
            <H2>{tr("Τρία βήματα. Και κάποιος δίπλα σου σε κάθε ένα.")}</H2>
          </div>
          <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-12">
            {steps.map((step) => (
              <li key={step.number} className="border-t border-[#2E4A37]/40 pt-6">
                <span className="font-serif text-5xl font-light text-[#2E4A37]/30">{step.number}</span>
                <h3 className="font-serif mt-5 text-2xl">{tr(step.title)}</h3>
                <p className={`mt-3 text-[15px] leading-7 ${MUTED}`}>{tr(step.text)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Philosophy */}
      <section id="philosophy" className="bg-[#2E4A37] text-[#F7F2E8]">
        <div className={`${WRAP} grid gap-12 py-24 lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-32`}>
          <div>
            <Label n="05" light>{tr("Η φιλοσοφία μας")}</Label>
            <blockquote className="font-serif mt-6 text-4xl font-medium italic leading-[1.15] sm:text-6xl">{tr("«Το επιχειρείν")}<br />{tr("εστίν φιλοσοφείν.»")}</blockquote>
          </div>
          <div className="space-y-5 border-l border-[#F7F2E8]/20 pl-6 text-[17px] leading-8 text-[#F7F2E8]/75 sm:pl-10">
            <p>{tr("Το επιχειρείν δεν είναι μόνο η πώληση ενός προϊόντος. Είναι η σκέψη, η δημιουργία, η επιμονή και η αναζήτηση ενός καλύτερου τρόπου να προσφέρεις κάτι στον κόσμο.")}</p>
            <p>{tr("Η ιστορία κάθε επιχείρησης έχει αξία. Η τεχνολογία πρέπει να την αναδεικνύει, όχι να μπαίνει εμπόδιο. Γι' αυτό φτιάξαμε το Vitrinaki.")}</p>
          </div>
        </div>
      </section>

      {/* Styles */}
      <section id="examples" className={`scroll-mt-20 border-b ${RULE}`}>
        <div className={`${WRAP} py-20 lg:py-28`}>
          <div className="max-w-2xl">
            <Label n="06">{tr("Ύφος")}</Label>
            <H2>{tr("Διάλεξε το ύφος που σου μοιάζει.")}</H2>
            <p className={`mt-6 leading-7 ${MUTED}`}>{tr("Ξεκινάς από ένα ύφος και το κάνεις δικό σου με το λογότυπο, τα χρώματα και τις φωτογραφίες σου.")}</p>
          </div>
          <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
            {(Object.keys(templateLabels) as DirectoryStorefront["template"][]).map((template) => {
              const example = exampleFor(template) || fallbackSites.find((site) => site.template === template)!
              const label = templateLabels[template]
              return (
                <article key={template}>
                  <div className="border border-[#2E4A37]/[0.12] bg-white p-3">
                    <SitePreview lang={lang} site={example} address={siteAddress(example)} />
                  </div>
                  <h3 className="font-serif mt-6 text-2xl">{tr(label.name)}</h3>
                  <p className={`mt-2 text-[15px] leading-7 ${MUTED}`}>{tr(label.text)}</p>
                  {example.handle ? (
                    <Link href={`/${locale}/store/${example.handle}`} className={`mt-4 text-sm ${textLink}`}>
                      {tr("Δες το ζωντανά:")} {example.storeName} →
                    </Link>
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={`scroll-mt-20 border-b ${RULE}`}>
        <div className={`${WRAP} grid gap-12 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-28`}>
          <div>
            <Label n="07">{tr("Ερωτήσεις")}</Label>
            <H2>{tr("Όσα ρωτούν συνήθως πριν ξεκινήσουν.")}</H2>
          </div>
          <div className={`border-t ${RULE}`}>
            {faqs.map((item) => (
              <details key={item.q} className={`group border-b ${RULE} py-6`}>
                <summary className="font-serif flex cursor-pointer list-none items-center justify-between gap-6 text-lg sm:text-xl">
                  {tr(item.q)}
                  <span className="shrink-0 text-2xl font-light text-[#2E4A37]/50 transition group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className={`mt-4 max-w-2xl text-[15px] leading-7 ${MUTED}`}>{tr(item.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className={`${WRAP} py-24 text-center lg:py-32`}>
          <Label center>{tr("Το επόμενο βήμα")}</Label>
          <h2 className="font-serif mx-auto mt-6 max-w-3xl text-[2.2rem] font-medium leading-[1.1] tracking-tight sm:text-6xl">{tr("Ποτέ δεν είναι αργά για να ανοίξεις τη βιτρίνα σου.")}</h2>
          <p className={`mx-auto mt-6 max-w-xl leading-7 ${MUTED}`}>{tr("Πες μας για την επιχείρησή σου και κάνε το πρώτο βήμα στο ψηφιακό εμπόριο. Δεν θα το κάνεις μόνος σου.")}</p>
          <a href={businessUrl} className={`mt-10 ${primaryBtn}`}>
            {tr("Άνοιξε τη βιτρίνα σου")} <span className="ml-2" aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </main>
  )
}
