import Link from "next/link"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { SitePreview } from "@/components/sections/SitePreview/SitePreview"
import { HeroDemo } from "@/components/sections/HeroDemo/HeroDemo"
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


const siteAddress = (site: DirectoryStorefront) =>
  site.customDomain || `vitrinaki.gr/${site.handle || site.storeName.toLowerCase().replace(/\s+/g, "-")}`


const features = [
  { icon: "spark", color: "#C0503C", title: "Δημιουργία website σε λίγα λεπτά", text: "Διαλέγεις template, βάζεις όνομα, λογότυπο και χρώματα και το site σου είναι έτοιμο." },
  { icon: "cart", color: "#2E4A37", title: "Online κατάστημα με πλήρη διαχείριση", text: "Προϊόντα, παραλλαγές, απόθεμα, καλάθι και παραγγελίες, όλα σε ένα σημείο." },
  { icon: "globe", color: "#265E8E", title: "Το δικό σου domain", text: "Ξεκινάς στο vitrinaki.gr/το-όνομά-σου ή συνδέεις το δικό σου domain." },
  { icon: "box", color: "#2E4A37", title: "Διαχείριση αποθέματος από το Studio", text: "Βλέπεις τι τελειώνει και ενημερώνεις ποσότητες με ένα κλικ." },
  { icon: "lang", color: "#265E8E", title: "Ελληνικά & Αγγλικά", text: "Το κατάστημά σου μιλά τη γλώσσα των πελατών σου, στην Ελλάδα και στο εξωτερικό." },
  { icon: "heart", color: "#C0503C", title: "Υποστήριξη που σε νοιάζεται", text: "Άνθρωποι δίπλα σου, με οδηγούς και πραγματική βοήθεια όταν τη χρειαστείς." },
  { icon: "card", color: "#2E4A37", title: "Πληρωμές με κάρτα", text: "Οι πελάτες σου θα πληρώνουν με κάρτα απευθείας στο κατάστημά σου.", soon: true },
  { icon: "doc", color: "#265E8E", title: "Τιμολόγια myDATA", text: "Έκδοση παραστατικών με διασύνδεση στο myDATA της ΑΑΔΕ.", soon: true },
] as const

const gallery = [
  { cat: "Μόδα & Αξεσουάρ", brand: "Lumière", tag: "Μόδα με χαρακτήρα", bg: "#F7EFEA", ink: "#5A2A1F", accent: "#C0503C" },
  { cat: "Σπίτι & Διακόσμηση", brand: "Casa di Terra", tag: "Σπίτι με ψυχή", bg: "#F3EDE2", ink: "#3B3328", accent: "#2E4A37" },
  { cat: "Τρόφιμα & Τοπικά προϊόντα", brand: "Γεύσεις", tag: "Του τόπου μας", bg: "#1F3628", ink: "#F7F2E8", accent: "#C0503C" },
  { cat: "Ομορφιά & Ευεξία", brand: "Νέα", tag: "Φυσική ομορφιά", bg: "#FBF6F1", ink: "#5A2A1F", accent: "#C0503C" },
  { cat: "Υπηρεσίες", brand: "Balance", tag: "Ισορροπία σώματος και μυαλού", bg: "#F4F8FB", ink: "#173A57", accent: "#265E8E" },
  { cat: "Επαγγελματίες", brand: "Studio M", tag: "Αρχιτεκτονική & design", bg: "#F7F2E8", ink: "#1F3628", accent: "#265E8E" },
] as const

const iconPaths: Record<string, React.ReactNode> = {
  spark: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 8h18M8 21h8M12 18v3" /></>,
  cart: <><path d="M3 4h2l2.4 11h10.2L20 8H6.2" /><circle cx="9" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></>,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  lang: <><path d="M4 5h9M8.5 3v2M6 5c.8 3.5 3 6 6 7.5M11 5c-.8 3.5-3 6-6 7.5" /><path d="m13 21 4-9 4 9M14.5 18h5" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  doc: <><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v4h4M9 12h6M9 16h4" /></>,
}

function FeatureIcon({ name }: { name: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  )
}

function OliveSprig({ className = "" }: { className?: string }) {
  const leaves: [number, number, number][] = [[30, 40, -40], [46, 66, 35], [62, 52, -35], [80, 82, 40], [96, 66, -30], [116, 96, 35], [132, 80, -25], [154, 104, 30]]
  return (
    <svg className={className} viewBox="0 0 200 140" fill="none" aria-hidden="true">
      <path d="M10 20C60 50 120 90 196 124" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {leaves.map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y}c8-6 20-6 28 0-8 6-20 6-28 0Z`} transform={`rotate(${r} ${x} ${y})`} fill="currentColor" opacity={0.6 + (i % 3) * 0.15} />
      ))}
      <circle cx="70" cy="74" r="4.5" fill="currentColor" />
    </svg>
  )
}

const WRAP = "mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12"
const MUTED = "text-[#2E4A37]/70"

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
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C0503C] px-7 py-3 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(192,80,60,0.8)] transition hover:-translate-y-0.5 hover:bg-[#ad4633] hover:shadow-[0_16px_40px_-12px_rgba(192,80,60,0.9)]"
const Arrow = () => <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>


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
      <section className="relative isolate overflow-hidden bg-[#F7F2E8]">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_60%_at_78%_35%,#ffffff_0%,transparent_70%)]" />
        <OliveSprig className="pointer-events-none absolute -left-16 -top-6 -z-10 w-40 -rotate-12 text-[#2E4A37]/25 sm:w-56" />
        <OliveSprig className="pointer-events-none absolute -right-8 bottom-0 -z-10 hidden w-56 rotate-[160deg] text-[#2E4A37]/20 lg:block" />
        <div className={`${WRAP} pb-14 pt-10 sm:pt-14 lg:pb-16 lg:pt-12`}>
          <HeroDemo
            lang={lang}
            intro={
              <>
                <h1 className="text-[2.5rem] font-extrabold leading-[1.04] tracking-[-0.03em] text-[#1F3628] sm:text-[3.2rem] lg:text-[3.15rem] xl:text-[3.4rem]">
                  {tr("Το vitrinaki σου, στο ψηφιακό εμπόριο.")}{" "}
                  <span className="relative inline-block text-[#C0503C]">
                    {tr("Ποτέ δεν είναι αργά.")}
                    <Swoosh className="absolute -bottom-2 left-0 h-2.5 w-full text-[#C0503C]/40" />
                  </span>
                </h1>
                <p className="mt-5 max-w-lg text-[16px] leading-7 text-[#2E4A37]/75">
                  {tr("Στα marketplaces είσαι ένα ακόμη προϊόν δίπλα στον ανταγωνιστή σου, με τους δικούς τους κανόνες. Στο Vitrinaki αποκτάς ολοκληρωμένο e-shop με το όνομα, το λογότυπο και τα χρώματά σου, στη δική σου διεύθυνση. Οι πελάτες σου μένουν δικοί σου.")}
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a href={businessUrl} className={primaryBtn}>
                    {tr("Άνοιξε τη βιτρίνα σου")} <Arrow />
                  </a>
                  <a href="#vitrina" className="group inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#2E4A37]/20 bg-white px-6 text-[15px] font-semibold text-[#1F3628] transition hover:border-[#2E4A37]/50">
                    {tr("Δες παραδείγματα")}
                  </a>
                </div>
                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-[#2E4A37]/75">
                  {["Χωρίς τεχνικές γνώσεις", "Έτοιμα templates", "Άνθρωποι δίπλα σου"].map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#2E4A37" fillOpacity=".1" /><path d="m7.5 12 3 3 6-6" stroke="#2E4A37" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {tr(item)}
                    </li>
                  ))}
                </ul>
              </>
            }
          />
        </div>
      </section>

      {/* Features */}
      <section id="included" className="scroll-mt-20 border-y border-[#2E4A37]/10 bg-white">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-xl text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] sm:text-4xl">{tr("Ένα ολοκληρωμένο e-shop. Δικό σου.")}</h2>
            <p className={`max-w-md text-[15px] leading-7 ${MUTED}`}>{tr("Όλα όσα χρειάζεσαι για να πουλάς online, σε ένα σημείο.")}</p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 60} className="h-full">
                <div className="group h-full rounded-2xl border border-[#2E4A37]/10 bg-[#FBF9F4] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#2E4A37]/20 hover:bg-white hover:shadow-[0_24px_50px_-30px_rgba(46,74,55,0.45)]">
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${f.color}14`, color: f.color }}>
                      <FeatureIcon name={f.icon} />
                    </span>
                    {"soon" in f ? <span className="rounded-full bg-[#265E8E]/10 px-2 py-0.5 text-[11px] font-semibold text-[#265E8E]">{tr("Σύντομα")}</span> : null}
                  </div>
                  <h3 className="mt-4 text-[16px] font-bold leading-snug text-[#1F3628]">{tr(f.title)}</h3>
                  <p className={`mt-1.5 text-[14px] leading-6 ${MUTED}`}>{tr(f.text)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Template gallery */}
      <section id="examples" className="scroll-mt-20">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-xl text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] sm:text-4xl">{tr("Έτοιμα templates για κάθε επιχείρηση.")}</h2>
            <p className={`max-w-md text-[15px] leading-7 ${MUTED}`}>{tr("Ξεκινάς από ένα ύφος και το κάνεις δικό σου με το λογότυπο, τα χρώματα και τις φωτογραφίες σου.")}</p>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
            {gallery.map((g, i) => (
              <Reveal key={g.cat} delay={(i % 4) * 60}>
                <figure className="group">
                  <div className="overflow-hidden rounded-xl bg-white shadow-[0_14px_30px_-22px_rgba(31,54,40,0.5)] ring-1 ring-[#2E4A37]/10 transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_26px_50px_-26px_rgba(31,54,40,0.55)]">
                    <div className="flex gap-1 px-2 py-1.5"><span className="h-1 w-1 rounded-full bg-[#2E4A37]/25" /><span className="h-1 w-1 rounded-full bg-[#2E4A37]/25" /><span className="h-1 w-1 rounded-full bg-[#2E4A37]/25" /></div>
                    <div className="relative aspect-[4/3.4] p-3" style={{ background: g.bg, color: g.ink }}>
                      <p className="font-serif text-[17px] leading-none">{g.brand}</p>
                      <p className="mt-1 text-[9px] opacity-70">{tr(g.tag)}</p>
                      <span className="mt-2 inline-block rounded px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: g.accent }}>{tr("Ανακάλυψε")}</span>
                      <div className="absolute bottom-0 right-2 h-[55%] w-[42%] rounded-t-full" style={{ background: g.accent, opacity: 0.85 }} />
                      <div className="absolute bottom-2 right-[30%] h-[28%] w-[18%] rounded-t-xl bg-white/70" />
                    </div>
                  </div>
                  <figcaption className="mt-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#1F3628]">
                    <span className="h-2 w-2 rounded-full" style={{ background: g.accent }} />
                    {tr(g.cat)}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
            <Reveal delay={120} className="col-span-2 md:col-span-4 lg:col-span-1">
              <a href={businessUrl} className="group relative flex h-full min-h-[180px] flex-col justify-between overflow-hidden rounded-xl bg-[#2E4A37] p-4 text-[#F7F2E8] transition hover:-translate-y-1.5">
                <OliveSprig className="pointer-events-none absolute -bottom-4 -right-6 w-32 text-[#F7F2E8]/20" />
                <p className="relative text-[18px] font-extrabold leading-tight">{tr("Άνοιξε τη βιτρίνα σου")}</p>
                <span className="relative mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#C0503C] px-3 py-2 text-[13px] font-semibold text-white">{tr("Ξεκίνα")} <Arrow /></span>
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Live shops */}
      <section id="vitrina" className="scroll-mt-20 bg-white">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-xl text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] sm:text-4xl">{tr("Επιχειρήσεις που άνοιξαν το e-shop τους.")}</h2>
            <p className={`max-w-md text-[15px] leading-7 ${MUTED}`}>{tr("Κάθε κατάστημα έχει το δικό του όνομα, ύφος και χρώματα. Άνοιξε ένα και δες το όπως θα το έβλεπε ένας πελάτης.")}</p>
          </Reveal>
          {published.length ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {published.map((site, i) => {
                const c = paletteColors[site.palette] || paletteColors.forest
                return (
                  <Reveal key={site.handle} delay={(i % 3) * 80} className="h-full">
                    <Link href={`/${locale}/store/${site.handle}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#2E4A37]/10 bg-[#FBF9F4] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-35px_rgba(46,74,55,0.55)]">
                      <div className="px-4 pt-4" style={{ background: c.soft }}>
                        <div className="translate-y-2 transition duration-500 group-hover:translate-y-0" aria-hidden="true">
                          <SitePreview lang={lang} site={site} address={siteAddress(site)} className="rounded-b-none shadow-xl" />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: c.accent }}>{tr(templateLabels[site.template]?.name || "")}</p>
                        <h3 className="mt-1 text-xl font-bold text-[#1F3628]">{site.storeName}</h3>
                        <p className={`mt-1 line-clamp-2 text-[14px] leading-6 ${MUTED}`}>{site.description || site.tagline}</p>
                        <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-[#C0503C]">
                          {tr("Δες τη βιτρίνα")} <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          ) : (
            <Reveal className="mt-10 rounded-2xl border border-dashed border-[#2E4A37]/25 bg-[#FBF9F4] p-10 text-center">
              <h3 className="text-xl font-bold">{tr("Το πρώτο κατάστημα μπορεί να είναι το δικό σου.")}</h3>
              <p className={`mt-2 text-sm ${MUTED}`}>{tr("Ξεκίνα σήμερα και άνοιξε τη βιτρίνα σου στο ψηφιακό εμπόριο.")}</p>
            </Reveal>
          )}
        </div>
      </section>

      {/* Who it is for */}
      <section id="for-whom" className="scroll-mt-20">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-xl text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] sm:text-4xl">{tr("Όλοι αξίζουν μια θέση στη μεγάλη βιτρίνα.")}</h2>
            <p className={`max-w-md text-[15px] leading-7 ${MUTED}`}>{tr("Δεν χρειάζεται να ξέρεις από design, προγραμματισμό ή διαφημίσεις για να μεγαλώσεις την επιχείρησή σου. Και ποτέ δεν είναι αργά για το επόμενο βήμα.")}</p>
          </Reveal>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {audiences.map((item, i) => (
              <Reveal key={item.title} delay={i * 60} className="h-full">
                <div className="h-full rounded-2xl border border-[#2E4A37]/10 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(46,74,55,0.45)]">
                  <span className="text-[13px] font-bold" style={{ color: audienceColors[i] }}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 text-[16px] font-bold text-[#1F3628]">{tr(item.title)}</h3>
                  <p className={`mt-1.5 text-[14px] leading-6 ${MUTED}`}>{tr(item.text)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20">
        <div className={`${WRAP} py-14 lg:py-20`}>
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
        <div className={`${WRAP} py-16 lg:py-24`}>
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
