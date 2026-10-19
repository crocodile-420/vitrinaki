import Link from "next/link"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { SitePreview } from "@/components/sections/SitePreview/SitePreview"
import { HeroDemo } from "@/components/sections/HeroDemo/HeroDemo"
import { HeroBackdrop } from "@/components/sections/HeroBackdrop/HeroBackdrop"
import { Reveal } from "@/components/atoms/Reveal/Reveal"
import { listPublishedStorefronts, paletteColors, templateLabels, type DirectoryStorefront } from "@/lib/data/vitrinaki-storefronts"
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

const WRAP = "mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12"
const MUTED = "text-[#2E4A37]/70"

const businessTypes = [
  "Αρτοποιείο", "Κεραμίστας", "Φυσικοθεραπευτής", "Μπουτίκ", "Ελαιόλαδο", "Κομμωτήριο", "Βιβλιοπωλείο",
  "Ζαχαροπλαστείο", "Μελισσοκόμος", "Φωτογράφος", "Οινοποιείο", "Ανθοπωλείο", "Κοσμηματοποιός", "Δάσκαλος γιόγκα",
]

const audienceColors = ["#2E4A37", "#C0503C", "#265E8E", "#265E8E", "#2E4A37"]

function Eyebrow({ children, light = false, center = false }: { children: React.ReactNode; light?: boolean; center?: boolean }) {
  return (
    <p className={`inline-flex items-center gap-2 ${center ? "justify-center" : ""} rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${light ? "border-white/15 bg-white/5 text-[#F7F2E8]/75" : "border-[#2E4A37]/15 bg-white/60 text-[#2E4A37]/70"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-[#C0503C]" />
      {children}
    </p>
  )
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`font-serif mt-5 text-[2.1rem] font-medium leading-[1.06] tracking-[-0.02em] sm:text-5xl lg:text-[3.6rem] ${className}`}>{children}</h2>
}

function OliveBranch({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 120" fill="none" aria-hidden="true">
      <path d="M8 112C60 92 120 60 212 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {[[40,98,-30],[70,86,20],[96,72,-35],[124,58,25],[150,44,-40],[176,30,20]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y - (i % 2 ? -10 : 12)} rx="17" ry="5.5" transform={`rotate(${r} ${x} ${y - (i % 2 ? -10 : 12)})`} fill="currentColor" opacity={0.55 + (i % 3) * 0.15} />
      ))}
      <circle cx="58" cy="104" r="5" fill="currentColor" opacity="0.9" />
      <circle cx="66" cy="110" r="4" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

function Swoosh({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 24" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path d="M4 18C110 2 250 2 396 14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

const primaryBtn =
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#C0503C] px-7 py-3 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(192,80,60,0.8)] transition hover:-translate-y-0.5 hover:bg-[#ad4633] hover:shadow-[0_16px_40px_-12px_rgba(192,80,60,0.9)]"
const Arrow = () => <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>

const tileBase = "relative overflow-hidden rounded-3xl border border-[#2E4A37]/10 p-6 shadow-[0_1px_0_rgba(46,74,55,0.04),0_20px_50px_-35px_rgba(46,74,55,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(46,74,55,0.45)] sm:p-8"

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
  const exampleFor = (template: DirectoryStorefront["template"]) =>
    published.find((site) => site.template === template)
  const [incl0, incl1, incl2, incl3, incl4, incl5] = included

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
      <section className="relative isolate overflow-hidden bg-[#1a2e21] text-[#F7F2E8]">
        <HeroBackdrop />

        <div className={`${WRAP} grid items-center gap-14 pb-20 pt-20 sm:pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:pb-32 lg:pt-24`}>
          <div>
            <Reveal><Eyebrow light>{tr("Το δικό σου e-shop, όχι ένα ακόμη marketplace")}</Eyebrow></Reveal>
            <Reveal delay={80}>
              <h1 className="font-serif mt-7 text-[2.75rem] font-medium leading-[1.02] tracking-[-0.025em] sm:text-6xl lg:text-[4.6rem]">
                {tr("Το vitrinaki σου, στο ψηφιακό εμπόριο.")}
                <span className="relative mt-3 inline-block italic text-[#D9806F]">
                  {tr("Ποτέ δεν είναι αργά.")}
                  <Swoosh className="absolute -bottom-3 left-0 h-3 w-full text-[#265E8E]" />
                </span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-8 max-w-xl text-[17px] leading-8 text-[#F7F2E8]/72">
                {tr("Στα marketplaces είσαι ένα ακόμη προϊόν δίπλα στον ανταγωνιστή σου, με τους δικούς τους κανόνες. Στο Vitrinaki αποκτάς ολοκληρωμένο e-shop με το όνομα, το λογότυπο και τα χρώματά σου, στη δική σου διεύθυνση. Οι πελάτες σου μένουν δικοί σου.")}
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                <a href={businessUrl} className={primaryBtn}>
                  {tr("Άνοιξε τη βιτρίνα σου")} <Arrow />
                </a>
                <a href="#vitrina" className="group inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-[15px] font-semibold text-[#F7F2E8] transition hover:border-white/50 hover:bg-white/5">
                  {tr("Δες καταστήματα")} <Arrow />
                </a>
              </div>
              <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[#F7F2E8]/60">
                {["Χωρίς τεχνικές γνώσεις", "Η δική σου διεύθυνση", "Άνθρωποι δίπλα σου"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 5 5L20 7" stroke="#D9806F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {tr(item)}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={200} className="mx-auto w-full max-w-[580px]">
            <HeroDemo lang={lang} />
          </Reveal>
        </div>
      </section>

      {/* Marquee */}
      <section aria-label={tr("Επαγγέλματα")} className="vk-marquee-wrap relative overflow-hidden border-b border-[#2E4A37]/10 bg-[#F7F2E8] py-6 sm:py-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#F7F2E8] to-transparent sm:w-32" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#F7F2E8] to-transparent sm:w-32" />
        <div className="vk-marquee flex w-max">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
              {businessTypes.map((type, i) => (
                <li key={type} className="font-serif flex items-center whitespace-nowrap text-2xl sm:text-[2rem]">
                  <span className={i % 3 === 1 ? "italic text-[#C0503C]" : i % 3 === 2 ? "text-[#265E8E]" : ""}>{tr(type)}</span>
                  <span className="mx-6 text-base text-[#2E4A37]/30 sm:mx-9" aria-hidden="true">✦</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* Manifesto */}
      <section className="relative">
        <div className={`${WRAP} py-24 lg:py-32`}>
          <Reveal className="mx-auto max-w-4xl text-center">
            <Eyebrow>{tr("Η διαφορά")}</Eyebrow>
            <H2>
              {tr("Στο marketplace είσαι ένα αποτέλεσμα.")}{" "}
              <span className="italic text-[#C0503C]">{tr("Στη βιτρίνα σου είσαι ο προορισμός.")}</span>
            </H2>
          </Reveal>

          <div className="mt-16 grid gap-6 lg:grid-cols-2">
            <Reveal className="rounded-[2rem] border border-black/5 bg-[#E8E6E1] p-6 text-[#5f6a63] sm:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5f6a63]/80">{tr("Σε ξένη πλατφόρμα")}</p>
              <div aria-hidden="true" className="mt-6 grid grid-cols-4 gap-2 rounded-2xl bg-[#d9d7d2] p-3 grayscale sm:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={`rounded-lg bg-[#f2f1ee] p-1.5 ${i === 6 ? "ring-2 ring-[#a3aaa5]" : ""}`}>
                    <div className="aspect-square rounded bg-[#cfcdc8]" />
                    <div className="mt-1.5 h-1 w-4/5 rounded-full bg-[#bdbbb6]" />
                    <div className="mt-1 h-1 w-1/2 rounded-full bg-[#bdbbb6]" />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-[12px] italic text-[#5f6a63]/80">{tr("Ποιο από αυτά είσαι εσύ;")}</p>
              <ul className="mt-8 space-y-3">
                {marketplaceSide.map((line) => (
                  <li key={line} className="flex gap-3 text-[15px] leading-6">
                    <span aria-hidden="true" className="mt-0.5 text-[#a3aaa5]">—</span>
                    {tr(line)}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={120} className="relative overflow-hidden rounded-[2rem] bg-[#C0503C] p-6 text-white shadow-[0_40px_80px_-40px_rgba(192,80,60,0.8)] sm:p-10">
              <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F7F2E8]/40 blur-3xl" />
              <div aria-hidden="true" className="vk-grain absolute inset-0 opacity-20" />
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">{tr("Στο δικό σου vitrinaki")}</p>
              <div aria-hidden="true" className="relative mt-6 overflow-hidden rounded-2xl bg-[#FBF3EE] text-[#5A2A1F] shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="flex items-center gap-2 text-[13px] font-extrabold"><span className="grid h-6 w-6 place-items-center rounded-md bg-[#C0503C] text-[9px] text-white">ΦΕ</span>{tr("Φούρνος Ελένη")}</span>
                  <span className="text-[10px] font-semibold opacity-60">vitrinaki.gr/fournos-eleni</span>
                </div>
                <div className="mx-3 rounded-xl bg-[#F3DDD3] p-5 text-center">
                  <p className="font-serif text-xl font-medium leading-tight sm:text-2xl">{tr("Ζεστό ψωμί κάθε πρωί από το 1987")}</p>
                  <span className="mt-3 inline-block rounded-full bg-[#C0503C] px-3 py-1.5 text-[10px] font-bold text-white">{tr("Βρες μας")}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {[0.35, 0.22, 0.28].map((o, i) => (
                    <div key={i} className="aspect-[5/4] rounded-lg bg-[#C0503C]" style={{ opacity: o }} />
                  ))}
                </div>
              </div>
              <ul className="relative mt-8 space-y-3">
                {vitrinakiSide.map((line) => (
                  <li key={line} className="flex gap-3 text-[16px] font-medium leading-6">
                    <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.2)" /><path d="m7 12 3.5 3.5L17 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {tr(line)}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Who it is for */}
      <section id="for-whom" className="scroll-mt-20 bg-white/50">
        <div className={`${WRAP} py-24 lg:py-32`}>
          <Reveal className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <div>
              <Eyebrow>{tr("Για ποιον είναι")}</Eyebrow>
              <H2>{tr("Όλοι αξίζουν μια θέση στη μεγάλη βιτρίνα.")}</H2>
            </div>
            <p className={`max-w-md text-[16px] leading-7 lg:justify-self-end ${MUTED}`}>{tr("Δεν χρειάζεται να ξέρεις από design, προγραμματισμό ή διαφημίσεις για να μεγαλώσεις την επιχείρησή σου. Και ποτέ δεν είναι αργά για το επόμενο βήμα.")}</p>
          </Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {audiences.map((item, i) => (
              <Reveal key={item.title} delay={i * 70} className="h-full">
                <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#2E4A37]/10 bg-white p-6 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(46,74,55,0.5)]">
                  <span className="font-serif text-5xl font-light leading-none transition-transform duration-500 group-hover:scale-110" style={{ color: audienceColors[i] }}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-serif mt-8 text-xl font-medium">{tr(item.title)}</h3>
                  <p className={`mt-2 text-[14px] leading-6 ${MUTED}`}>{tr(item.text)}</p>
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ background: audienceColors[i] }} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Live shops */}
      <section id="vitrina" className="scroll-mt-20">
        <div className={`${WRAP} py-24 lg:py-32`}>
          <Reveal className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <div>
              <Eyebrow>{tr("Η βιτρίνα")}</Eyebrow>
              <H2>{tr("Επιχειρήσεις που άνοιξαν το e-shop τους.")}</H2>
            </div>
            <p className={`max-w-md text-[16px] leading-7 lg:justify-self-end ${MUTED}`}>{tr("Κάθε κατάστημα έχει το δικό του όνομα, ύφος και χρώματα. Άνοιξε ένα και δες το όπως θα το έβλεπε ένας πελάτης.")}</p>
          </Reveal>

          {published.length ? (
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {published.map((site, i) => {
                const c = paletteColors[site.palette] || paletteColors.forest
                return (
                  <Reveal key={site.handle} delay={(i % 3) * 90} className="h-full">
                    <Link href={`/${locale}/store/${site.handle}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#2E4A37]/10 bg-white transition duration-300 hover:-translate-y-2 hover:shadow-[0_40px_70px_-35px_rgba(46,74,55,0.55)]">
                      <div className="relative px-5 pt-5" style={{ background: `linear-gradient(160deg, ${c.accent}, ${c.ink})` }}>
                        <div className="translate-y-3 transition duration-500 group-hover:translate-y-0" aria-hidden="true">
                          <SitePreview lang={lang} site={site} address={siteAddress(site)} className="rounded-b-none shadow-2xl" />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: c.accent }}>{tr(templateLabels[site.template]?.name || "")}</p>
                        <h3 className="font-serif mt-2 text-2xl font-medium">{site.storeName}</h3>
                        <p className={`mt-1.5 line-clamp-2 text-[14px] leading-6 ${MUTED}`}>{site.description || site.tagline}</p>
                        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold">
                          {tr("Δες τη βιτρίνα")} <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          ) : (
            <Reveal className="mt-14 rounded-3xl border border-dashed border-[#2E4A37]/25 bg-white/60 p-12 text-center">
              <h3 className="font-serif text-2xl">{tr("Το πρώτο κατάστημα μπορεί να είναι το δικό σου.")}</h3>
              <p className={`mt-2 text-sm ${MUTED}`}>{tr("Ξεκίνα σήμερα και άνοιξε τη βιτρίνα σου στο ψηφιακό εμπόριο.")}</p>
            </Reveal>
          )}
        </div>
      </section>

      {/* What you get — bento */}
      <section id="included" className="scroll-mt-20 bg-[#EFE8DA]/60">
        <div className={`${WRAP} py-24 lg:py-32`}>
          <Reveal className="mx-auto max-w-3xl text-center">
            <Eyebrow>{tr("Τι παίρνεις")}</Eyebrow>
            <H2>{tr("Ένα ολοκληρωμένο e-shop. Δικό σου.")}</H2>
          </Reveal>

          <div className="mt-16 grid gap-5 md:grid-cols-6">
            {/* Identity */}
            <Reveal className="md:col-span-4">
              <div className={`${tileBase} h-full bg-white`}>
                <div className="grid gap-8 sm:grid-cols-[1fr_1fr] sm:items-center">
                  <div>
                    <h3 className="font-serif text-2xl font-medium sm:text-3xl">{tr(incl0.title)}</h3>
                    <p className={`mt-3 text-[15px] leading-7 ${MUTED}`}>{tr(incl0.text)}</p>
                  </div>
                  <div aria-hidden="true" className="grid grid-cols-2 gap-3">
                    {[
                      ["#2E4A37", "#E4E8DA", "ΚΛ"],
                      ["#C0503C", "#F3DDD3", "ΦΕ"],
                      ["#265E8E", "#DBE6F0", "AM"],
                      ["#2E4A37", "#F7F2E8", "ΜΘ"],
                    ].map(([accent, soft, ini], i) => (
                      <div key={ini} className={`rounded-2xl p-3 transition duration-500 hover:rotate-0 ${i % 2 ? "rotate-2" : "-rotate-2"}`} style={{ background: soft }}>
                        <span className="grid h-9 w-9 place-items-center rounded-xl text-[11px] font-extrabold text-white" style={{ background: accent }}>{ini}</span>
                        <div className="mt-3 h-1.5 w-3/4 rounded-full opacity-40" style={{ background: accent }} />
                        <div className="mt-1.5 flex gap-1">
                          {[1, 0.6, 0.3].map((o) => <span key={o} className="h-3 w-3 rounded-full" style={{ background: accent, opacity: o }} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Address */}
            <Reveal delay={90} className="md:col-span-2">
              <div className={`${tileBase} h-full bg-[#265E8E] text-white`}>
                <div aria-hidden="true" className="rounded-xl bg-white/10 p-2 ring-1 ring-white/15">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[12px] text-[#173A57]">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" /><path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" /></svg>
                    <span className="truncate font-semibold">to-magazi-mou.gr</span>
                  </div>
                  <p className="mt-2 px-1 text-[11px] text-white/60">vitrinaki.gr/to-magazi-mou</p>
                </div>
                <h3 className="font-serif mt-8 text-2xl font-medium">{tr(incl1.title)}</h3>
                <p className="mt-3 text-[15px] leading-7 text-white/75">{tr(incl1.text)}</p>
              </div>
            </Reveal>

            {/* Cart */}
            <Reveal className="md:col-span-2">
              <div className={`${tileBase} h-full bg-white`}>
                <div aria-hidden="true" className="rounded-2xl bg-[#F7F2E8] p-3">
                  {[["Ελαιόλαδο 1L", "×2"], ["Θυμαρίσιο μέλι", "×1"]].map(([item, qty]) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl bg-white p-2.5 [&+&]:mt-2">
                      <span className="h-8 w-8 rounded-lg bg-[#C0503C]/20" />
                      <span className="flex-1 text-[12px] font-semibold">{tr(item)}</span>
                      <span className="text-[12px] text-[#2E4A37]/60">{qty}</span>
                    </div>
                  ))}
                  <div className="mt-2 rounded-xl bg-[#2E4A37] py-2 text-center text-[12px] font-semibold text-[#F7F2E8]">{tr("Ολοκλήρωση παραγγελίας")}</div>
                </div>
                <h3 className="font-serif mt-8 text-2xl font-medium">{tr(incl2.title)}</h3>
                <p className={`mt-3 text-[15px] leading-7 ${MUTED}`}>{tr(incl2.text)}</p>
              </div>
            </Reveal>

            {/* Management */}
            <Reveal delay={90} className="md:col-span-4">
              <div className={`${tileBase} h-full bg-[#1f3628] text-[#F7F2E8]`}>
                <div className="grid gap-8 sm:grid-cols-[0.9fr_1.1fr] sm:items-center">
                  <div>
                    <h3 className="font-serif text-2xl font-medium sm:text-3xl">{tr(incl4.title)}</h3>
                    <p className="mt-3 text-[15px] leading-7 text-[#F7F2E8]/70">{tr(incl4.text)}</p>
                  </div>
                  <div aria-hidden="true" className="rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
                    <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F7F2E8]/50">{tr("Παραγγελίες")}</p>
                    {[
                      ["#1042", "Νέα", "#D9806F"],
                      ["#1041", "Σε αποστολή", "#8FB3D3"],
                      ["#1040", "Ολοκληρώθηκε", "#A9C3B0"],
                    ].map(([id, status, color]) => (
                      <div key={id} className="mt-2 flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-2.5">
                        <span className="h-7 w-7 rounded-full bg-white/10" />
                        <span className="flex-1">
                          <span className="block text-[12px] font-semibold">{id}</span>
                          <span className="mt-1 block h-1 w-16 rounded-full bg-white/15" />
                        </span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${color}26`, color }}>{tr(status)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Story */}
            <Reveal className="md:col-span-3">
              <div className={`${tileBase} h-full bg-white`}>
                <div aria-hidden="true" className="flex gap-4 rounded-2xl bg-[#F7F2E8] p-4">
                  <span className="font-serif text-5xl leading-none text-[#C0503C]">“</span>
                  <div className="flex-1 space-y-2 pt-2">
                    <div className="h-2 w-full rounded-full bg-[#2E4A37]/15" />
                    <div className="h-2 w-11/12 rounded-full bg-[#2E4A37]/15" />
                    <div className="h-2 w-2/3 rounded-full bg-[#2E4A37]/15" />
                  </div>
                </div>
                <h3 className="font-serif mt-8 text-2xl font-medium">{tr(incl3.title)}</h3>
                <p className={`mt-3 text-[15px] leading-7 ${MUTED}`}>{tr(incl3.text)}</p>
              </div>
            </Reveal>

            {/* People */}
            <Reveal delay={90} className="md:col-span-3">
              <div className={`${tileBase} h-full bg-white`}>
                <div aria-hidden="true" className="space-y-2 rounded-2xl bg-[#F7F2E8] p-4 text-[12px]">
                  <p className="w-fit max-w-[80%] rounded-2xl rounded-bl-sm bg-white px-3 py-2">{tr("Πώς ανεβάζω τις φωτογραφίες μου;")}</p>
                  <p className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-[#2E4A37] px-3 py-2 text-[#F7F2E8]">{tr("Σου δείχνουμε βήμα βήμα.")}</p>
                </div>
                <h3 className="font-serif mt-8 text-2xl font-medium">{tr(incl5.title)}</h3>
                <p className={`mt-3 text-[15px] leading-7 ${MUTED}`}>{tr(incl5.text)}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20">
        <div className={`${WRAP} py-24 lg:py-32`}>
          <Reveal className="max-w-3xl">
            <Eyebrow>{tr("Πώς ξεκινάς")}</Eyebrow>
            <H2>{tr("Τρία βήματα. Και κάποιος δίπλα σου σε κάθε ένα.")}</H2>
          </Reveal>
          <ol className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
            <span aria-hidden="true" className="absolute left-[2.1rem] top-4 h-[calc(100%-2rem)] w-px bg-gradient-to-b from-[#C0503C] via-[#2E4A37]/30 to-transparent md:left-0 md:top-[2.1rem] md:h-px md:w-full md:bg-gradient-to-r" />
            {steps.map((step, i) => (
              <Reveal as="li" key={step.number} delay={i * 120} className="relative grid grid-cols-[4.2rem_1fr] gap-5 md:block">
                <span className="relative grid h-[4.2rem] w-[4.2rem] place-items-center rounded-full border border-[#2E4A37]/15 bg-[#F7F2E8] font-serif text-3xl font-medium italic text-[#C0503C] shadow-[0_10px_30px_-15px_rgba(46,74,55,0.5)]">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-serif text-2xl font-medium md:mt-8">{tr(step.title)}</h3>
                  <p className={`mt-3 text-[15px] leading-7 ${MUTED}`}>{tr(step.text)}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Philosophy */}
      <section id="philosophy" className="relative isolate overflow-hidden bg-[#173A57] text-[#F7F2E8]">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_20%_50%,#265E8E_0%,transparent_70%)]" />
        <div aria-hidden="true" className="vk-grain absolute inset-0 -z-10 opacity-20" />
        <OliveBranch className="pointer-events-none absolute -bottom-6 right-0 -z-10 w-[420px] text-[#F7F2E8]/10 lg:w-[620px]" />
        <span aria-hidden="true" className="font-serif pointer-events-none absolute -top-16 right-4 -z-10 text-[22rem] leading-none text-white/[0.04] sm:text-[34rem]">«</span>
        <div className={`${WRAP} py-28 lg:py-40`}>
          <Reveal>
            <Eyebrow light>{tr("Η φιλοσοφία μας")}</Eyebrow>
            <blockquote className="font-serif mt-8 max-w-5xl text-[2.9rem] font-medium italic leading-[1.02] tracking-[-0.02em] sm:text-7xl lg:text-[6.5rem]">
              <span className="text-[#D9806F]">{tr("«Το επιχειρείν")}</span>
              <br />
              {tr("εστίν φιλοσοφείν.»")}
            </blockquote>
          </Reveal>
          <Reveal delay={120} className="mt-14 grid max-w-4xl gap-6 text-[17px] leading-8 text-[#F7F2E8]/75 md:grid-cols-2 md:gap-10">
            <p>{tr("Το επιχειρείν δεν είναι μόνο η πώληση ενός προϊόντος. Είναι η σκέψη, η δημιουργία, η επιμονή και η αναζήτηση ενός καλύτερου τρόπου να προσφέρεις κάτι στον κόσμο.")}</p>
            <p>{tr("Η ιστορία κάθε επιχείρησης έχει αξία. Η τεχνολογία πρέπει να την αναδεικνύει, όχι να μπαίνει εμπόδιο. Γι' αυτό φτιάξαμε το Vitrinaki.")}</p>
          </Reveal>
        </div>
      </section>

      {/* Styles */}
      <section id="examples" className="scroll-mt-20">
        <div className={`${WRAP} py-24 lg:py-32`}>
          <Reveal className="mx-auto max-w-3xl text-center">
            <Eyebrow>{tr("Ύφος")}</Eyebrow>
            <H2>{tr("Διάλεξε το ύφος που σου μοιάζει.")}</H2>
            <p className={`mx-auto mt-6 max-w-xl text-[16px] leading-7 ${MUTED}`}>{tr("Ξεκινάς από ένα ύφος και το κάνεις δικό σου με το λογότυπο, τα χρώματα και τις φωτογραφίες σου.")}</p>
          </Reveal>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {(Object.keys(templateLabels) as DirectoryStorefront["template"][]).map((template, i) => {
              const example = exampleFor(template) || fallbackSites.find((site) => site.template === template)!
              const label = templateLabels[template]
              const c = paletteColors[example.palette] || paletteColors.forest
              return (
                <Reveal as="article" key={template} delay={i * 100} className="group">
                  <div className="rounded-3xl p-4 transition duration-500 group-hover:-translate-y-2 sm:p-6" style={{ background: c.soft }}>
                    <div className="transition duration-500 group-hover:scale-[1.02]" aria-hidden="true">
                      <SitePreview lang={lang} site={example} address={siteAddress(example)} className="shadow-[0_30px_50px_-30px_rgba(0,0,0,0.45)]" />
                    </div>
                  </div>
                  <h3 className="font-serif mt-6 text-2xl font-medium">{tr(label.name)}</h3>
                  <p className={`mt-2 text-[15px] leading-7 ${MUTED}`}>{tr(label.text)}</p>
                  {example.handle ? (
                    <Link href={`/${locale}/store/${example.handle}`} className="group/link mt-3 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: c.accent }}>
                      {tr("Δες το ζωντανά:")} {example.storeName} <span aria-hidden="true" className="transition-transform group-hover/link:translate-x-1">→</span>
                    </Link>
                  ) : null}
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-white/50">
        <div className={`${WRAP} grid gap-12 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-32`}>
          <Reveal>
            <Eyebrow>{tr("Ερωτήσεις")}</Eyebrow>
            <H2>{tr("Όσα ρωτούν συνήθως πριν ξεκινήσουν.")}</H2>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <Reveal key={item.q} delay={i * 50}>
                <details className="group rounded-2xl border border-[#2E4A37]/10 bg-white px-6 py-5 transition open:shadow-[0_20px_50px_-35px_rgba(46,74,55,0.5)]">
                  <summary className="font-serif flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium sm:text-xl [&::-webkit-details-marker]:hidden">
                    {tr(item.q)}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2E4A37]/[0.07] text-xl font-light transition duration-300 group-open:rotate-45 group-open:bg-[#C0503C] group-open:text-white" aria-hidden="true">+</span>
                  </summary>
                  <p className={`mt-4 max-w-2xl text-[15px] leading-7 ${MUTED}`}>{tr(item.a)}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 lg:py-24">
        <Reveal className="relative isolate mx-auto max-w-[1280px] overflow-hidden rounded-[2.5rem] bg-[#1a2e21] px-6 py-20 text-center text-[#F7F2E8] sm:px-12 lg:py-28">
          <div aria-hidden="true" className="vk-glow absolute -left-20 -top-32 -z-10 h-96 w-96 rounded-full bg-[#C0503C]/35 blur-[100px]" />
          <div aria-hidden="true" className="vk-glow absolute -bottom-40 -right-20 -z-10 h-96 w-96 rounded-full bg-[#265E8E]/40 blur-[100px] [animation-delay:-4s]" />
          <div aria-hidden="true" className="vk-grain absolute inset-0 -z-10 opacity-20" />
          <Eyebrow light>{tr("Το επόμενο βήμα")}</Eyebrow>
          <h2 className="font-serif mx-auto mt-7 max-w-4xl text-[2.4rem] font-medium leading-[1.04] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
            {tr("Ποτέ δεν είναι αργά για να ανοίξεις τη βιτρίνα σου.")}
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-[17px] leading-8 text-[#F7F2E8]/70">{tr("Πες μας για την επιχείρησή σου και κάνε το πρώτο βήμα στο ψηφιακό εμπόριο. Δεν θα το κάνεις μόνος σου.")}</p>
          <a href={businessUrl} className={`mt-10 ${primaryBtn}`}>
            {tr("Άνοιξε τη βιτρίνα σου")} <Arrow />
          </a>
        </Reveal>
      </section>
    </main>
  )
}
