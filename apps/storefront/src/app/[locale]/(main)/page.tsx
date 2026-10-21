import Link from "next/link"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { LiveSitePreview } from "@/components/sections/SitePreview/LiveSitePreview"
import { HeroDemo } from "@/components/sections/HeroDemo/HeroDemo"
import { Reveal } from "@/components/atoms/Reveal/Reveal"
import { HowItWorksScroll } from "@/components/sections/HowItWorksScroll/HowItWorksScroll"
import { TryShop } from "@/components/sections/TryShop/TryShop"
import { listPublishedStorefronts, paletteColors, templateLabels, type DirectoryStorefront } from "@/lib/data/vitrinaki-storefronts"
import { listRegions } from "@/lib/data/regions"
import { getTranslator } from "@/lib/i18n/server"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
  toHreflang,
} from "@/lib/helpers/hreflang"

import { startHref } from "@/lib/vitrinaki-links"

const audiences = [
  { icon: "leaf", title: "Παραγωγοί", text: "Λάδι, μέλι, κρασί, τυριά. Το προϊόν σου, απευθείας στον πελάτη, σε όλη την Ελλάδα." },
  { icon: "hand", title: "Δημιουργοί & χειροποίητα", text: "Κοσμήματα, κεραμικά, ρούχα. Η δουλειά σου, παρουσιασμένη όπως της αξίζει." },
  { icon: "store", title: "Καταστήματα", text: "Το μαγαζί που ξέρει η γειτονιά, ανοιχτό και online, όλο το εικοσιτετράωρο." },
  { icon: "laptop", title: "Freelancers & υπηρεσίες", text: "Graphic designer, online δάσκαλος, φωτογράφος. Δείξε τη δουλειά σου και δέξου κρατήσεις." },
  { icon: "sprout", title: "Νέες επιχειρήσεις", text: "Ξεκίνα από εκεί που βρίσκεσαι σήμερα και μεγάλωσε τη βιτρίνα σου μαζί με την επιχείρηση." },
] as const

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

const bandTiles = [
  { icon: "layout", title: "Έτοιμα templates", bg: "#E4EBDD", color: "#2E4A37" },
  { icon: "cart", title: "e-shop με διαχείριση αποθέματος", bg: "#F5DFD7", color: "#C0503C" },
  { icon: "megaphone", title: "Προβολή στο Vitrinaki", bg: "#DCE7F1", color: "#265E8E" },
  { icon: "support", title: "Υποστήριξη από ανθρώπους", bg: "#EEE7D6", color: "#2E4A37" },
  { icon: "calendar", title: "Κρατήσεις online", bg: "#F5DFD7", color: "#C0503C", soon: true },
] as const

const gallery = [
  { cat: "Μόδα & Αξεσουάρ", icon: "bag", brand: "Lumière", tag: "Μόδα με χαρακτήρα", img: "/home/t-fashion.webp", pos: "center 30%", dark: false },
  { cat: "Σπίτι & Διακόσμηση", icon: "home", brand: "Casa di Terra", tag: "Σπίτι με ψυχή", img: "/home/t-home.webp", pos: "center 55%", dark: false },
  { cat: "Τρόφιμα & Τοπικά προϊόντα", icon: "leaf", brand: "Γεύσεις", tag: "Του τόπου μας", img: "/home/food-dark.webp", pos: "35% center", dark: true },
  { cat: "Ομορφιά & Ευεξία", icon: "drop", brand: "Νέα", tag: "Φυσική ομορφιά", img: "/home/p-oil.webp", pos: "center 40%", dark: false },
  { cat: "Υπηρεσίες", icon: "lotus", brand: "Balance", tag: "Ισορροπία σώματος και μυαλού", img: "/home/t-services.webp", pos: "center 35%", dark: false },
  { cat: "Επαγγελματίες & Portfolio", icon: "brief", brand: "Studio M", tag: "Αρχιτεκτονική & design", img: "/home/t-portfolio.webp", pos: "center", dark: false },
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
  layout: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 9v11" /></>,
  megaphone: <><path d="M4 10v4h3l7 4V6L7 10H4Z" /><path d="M17.5 9.5a3.5 3.5 0 0 1 0 5M7 14l1.5 5h2.5l-1-4.4" /></>,
  support: <><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M19 19c0 1.5-2 2.5-5 2.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M12 14h2M8 17h2" /></>,
  bag: <><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  home: <><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10M10 20v-6h4v6" /></>,
  leaf: <><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19 13 11" /></>,
  drop: <><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></>,
  lotus: <><path d="M12 20c-4 0-8-2.5-9-6 3 0 6 1 9 4 3-3 6-4 9-4-1 3.5-5 6-9 6Z" /><path d="M12 18c-2-2.5-2.5-6 0-11 2.5 5 2 8.5 0 11Z" /></>,
  brief: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5h6v2M3 12h18" /></>,
}

function FeatureIcon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

  const businessUrl = startHref(locale)
  const published = await listPublishedStorefronts()

  // overflow-x-clip, not overflow-hidden: a scroll container would break the sticky "how it works"
  return (
    <main className="overflow-x-clip bg-[#F7F2E8] text-[#2E4A37]">
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

      {/* Brand statement band */}
      <section aria-label={tr("Τι είναι το Vitrinaki")} className="relative isolate overflow-hidden bg-[#F7F2E8]">
        <OliveSprig className="pointer-events-none absolute -left-16 -top-8 -z-10 w-40 -rotate-12 text-[#2E4A37]/20 sm:w-52" />
        <div className={`${WRAP} grid items-center gap-4 py-5 sm:gap-6 sm:py-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:py-5`}>
          <div className="lg:border-l-2 lg:border-[#C0503C]/40 lg:pl-6">
            <p className="text-[1.6rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#1F3628] sm:text-[2rem]">
              {tr("Η ολοκληρωμένη λύση για")}{" "}
              <span className="relative inline-block text-[#C0503C]">
                {tr("μικρές επιχειρήσεις.")}
                <Swoosh className="absolute -bottom-1.5 left-0 h-2 w-full text-[#C0503C]/35" />
              </span>
            </p>
            <p className="mt-2 max-w-lg text-[14px] leading-6 text-[#2E4A37]/75 sm:mt-3 sm:text-[14.5px]">
              {tr("Επαγγελματικό e-shop, διαχείριση προϊόντων και αποθέματος, προβολή στο Vitrinaki. Όλα σε μία πλατφόρμα.")}
            </p>
          </div>
          <ul className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pt-2 [scrollbar-width:none] sm:pt-0 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden">
            {bandTiles.map((t) => (
              <li key={t.title} className="relative flex shrink-0 items-center gap-2.5 rounded-2xl py-2 pl-2 pr-3.5 ring-1 ring-black/[0.04] sm:flex-col sm:justify-center sm:px-2 sm:py-3.5 sm:text-center" style={{ background: t.bg }}>
                {"soon" in t ? <span className="absolute -top-1.5 right-1.5 rounded-full sm:top-1.5 bg-white/80 px-1.5 py-0.5 text-[9.5px] font-bold text-[#265E8E]">{tr("Σύντομα")}</span> : null}
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/70 sm:h-11 sm:w-11" style={{ color: t.color }}>
                  <FeatureIcon name={t.icon} />
                </span>
                <span className="whitespace-nowrap text-[12.5px] font-semibold leading-tight text-[#1F3628] sm:mt-2.5 sm:whitespace-normal">{tr(t.title)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Hero */}
      <section className="relative">
        <HeroDemo
          lang={lang}
          intro={
            <>
              <h1 className="text-[2.15rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#1F3628] sm:text-[3rem] lg:text-[2.85rem] xl:text-[3.35rem]">
                {tr("Το vitrinaki σου, στο ψηφιακό εμπόριο.")}{" "}
                <span className="relative inline-block text-[#C0503C]">
                  {tr("Ποτέ δεν είναι αργά.")}
                  <Swoosh className="absolute -bottom-2 left-0 h-2.5 w-full text-[#C0503C]/45" />
                </span>
              </h1>
              <p className="mt-5 max-w-md text-[15px] leading-7 text-[#1F3628]/75 sm:text-[16px]">
                {tr("Δημιούργησε εύκολα το δικό σου e-shop, πούλα τα προϊόντα σου, διαχειρίσου το απόθεμα και βρες περισσότερους πελάτες μέσα από το Vitrinaki.")}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href={businessUrl} className={primaryBtn}>
                  {tr("Άνοιξε τη βιτρίνα σου")} <Arrow />
                </a>
                <a href="#vitrina" className="group inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#2E4A37]/30 bg-[#F7F2E8]/60 px-6 text-[15px] font-semibold text-[#1F3628] transition hover:border-[#2E4A37] hover:bg-white">
                  {tr("Δες παραδείγματα")}
                </a>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-[#1F3628]/85">
                {["Χωρίς τεχνικές γνώσεις", "Έτοιμα templates", "Άνθρωποι δίπλα σου"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#2E4A37" /><path d="m7.5 12 3 3 6-6" stroke="#F7F2E8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {tr(item)}
                  </li>
                ))}
              </ul>
            </>
          }
        />
      </section>

      {/* Features */}
      <section id="included" className="scroll-mt-20 bg-[#2E4A37] text-[#F7F2E8]">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-xl text-[1.7rem] font-extrabold leading-tight tracking-[-0.02em] text-[#F7F2E8] sm:text-[2rem]">{tr("Ένα ολοκληρωμένο e-shop. Δικό σου.")}</h2>
            <p className="max-w-md text-[15px] leading-7 text-[#F7F2E8]/80">{tr("Όλα όσα χρειάζεσαι για να πουλάς online, σε ένα σημείο.")}</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 60} className="h-full">
                <div className="group relative h-full rounded-2xl border border-[#F7F2E8]/20 bg-[#F7F2E8] p-5 text-[#1F3628] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.6)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_55px_-30px_rgba(0,0,0,0.7)]">
                  {"soon" in f ? <span className="absolute right-2.5 top-2.5 rounded-full bg-[#265E8E]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[#265E8E]">{tr("Σύντομα")}</span> : null}
                  <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: `${f.color}17`, color: f.color }}>
                    <FeatureIcon name={f.icon} size={20} />
                  </span>
                  <h3 className="mt-3 text-[15.5px] font-bold leading-snug text-[#1F3628]">{tr(f.title)}</h3>
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
            <h2 className="max-w-xl text-[1.7rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] sm:text-[2rem]">{tr("Έτοιμα templates για κάθε επιχείρηση.")}</h2>
            <p className={`max-w-md text-[15px] leading-7 ${MUTED}`}>{tr("Ξεκινάς από ένα ύφος και το κάνεις δικό σου με το λογότυπο, τα χρώματα και τις φωτογραφίες σου.")}</p>
          </Reveal>
          {/* phones: a swipeable row; tablet and up: a grid with equal cards */}
          <ul className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
            {gallery.map((g, i) => (
              <li key={g.cat} className="w-[80%] shrink-0 snap-start sm:w-auto">
                <Reveal delay={(i % 3) * 60} className="h-full">
                  <figure className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_18px_40px_-28px_rgba(31,54,40,0.5)] ring-1 ring-[#2E4A37]/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(31,54,40,0.55)] motion-reduce:hover:translate-y-0">
                    <div className="flex items-center justify-between gap-2 border-b border-[#2E4A37]/[0.07] px-3.5 py-2">
                      <span className="truncate text-[12px] font-bold text-[#1F3628]">{g.brand}</span>
                      <span className="flex gap-3 text-[10.5px] text-[#2E4A37]/55"><span>{tr("Αρχική")}</span><span>{tr("Συλλογή")}</span></span>
                    </div>
                    <div className={`relative aspect-[4/3] overflow-hidden ${g.dark ? "bg-[#1F3628]" : "bg-[#F3EDE2]"}`}>
                      <img src={g.img} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100" style={{ objectPosition: g.pos }} />
                      <div className={`absolute inset-0 ${g.dark ? "bg-gradient-to-r from-[#1F3628]/90 via-[#1F3628]/45 to-transparent" : "bg-gradient-to-r from-white/85 via-white/35 to-transparent"}`} />
                      <div className={`relative p-5 ${g.dark ? "text-[#F7F2E8]" : "text-[#1F3628]"}`}>
                        <p className="font-serif text-[28px] leading-none">{g.brand}</p>
                        <p className="mt-2 max-w-[60%] text-[13px] leading-snug opacity-80">{tr(g.tag)}</p>
                        <span className="mt-3 inline-block rounded-md bg-[#C0503C] px-2.5 py-1 text-[11.5px] font-bold text-white">{tr("Ανακάλυψε")}</span>
                      </div>
                    </div>
                    <figcaption className="flex flex-1 items-center justify-between gap-3 px-4 py-3.5">
                      <span className="flex min-w-0 items-center gap-2 text-[14.5px] font-semibold leading-tight text-[#1F3628]">
                        <span className="shrink-0 text-[#C0503C]"><FeatureIcon name={g.icon} size={18} /></span>
                        {tr(g.cat)}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <a href="#try" className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#1F3628] underline-offset-4 transition hover:underline">{tr("Δοκίμασέ το")}</a>
                        <a href={businessUrl} className="rounded-lg bg-[#2E4A37] px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#1F3628]">{tr("Ξεκίνα")}</a>
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              </li>
            ))}
          </ul>
          <Reveal delay={120} className="mt-5">
            <a href={businessUrl} className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-[#2E4A37] px-6 py-5 text-[#F7F2E8] transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between">
              <OliveSprig className="pointer-events-none absolute -bottom-6 right-32 w-36 text-[#F7F2E8]/15" />
              <span className="relative flex items-center gap-3">
                <svg className="h-8 w-8 shrink-0 text-[#E08A76]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17 9 11l4 4 8-8" /><path d="M15 7h6v6" /></svg>
                <span className="text-[18px] font-extrabold leading-tight">{tr("Άνοιξε τη βιτρίνα σου")}</span>
              </span>
              <span className="relative inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#C0503C] px-4 py-2 text-[14px] font-semibold text-white">{tr("Ξεκίνα")} <Arrow /></span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* Try it: the visitor changes a sample shop live */}
      <section id="try" aria-labelledby="try-title" className="scroll-mt-20 border-t border-[#2E4A37]/10 bg-[#EFE7D8]">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>{tr("Δοκίμασέ το")}</Eyebrow>
              <h2 id="try-title" className="mt-4 max-w-xl text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] sm:text-4xl">{tr("Φτιάξε μια βιτρίνα, εδώ, τώρα.")}</h2>
            </div>
            <p className={`max-w-md text-[15px] leading-7 ${MUTED}`}>{tr("Άλλαξε χρώματα, template και όνομα και δες το κατάστημα να αλλάζει αμέσως. Δεν αποθηκεύεται τίποτα.")}</p>
          </Reveal>
          <div className="mt-10">
            <TryShop
              cta={
                <a href={businessUrl} className={`${primaryBtn} shrink-0`}>
                  {tr("Άνοιξε τη βιτρίνα σου")} <Arrow />
                </a>
              }
            />
          </div>
        </div>
      </section>

      {/* Live shops */}
      <section id="vitrina" className="scroll-mt-20 bg-[#2E4A37] text-[#F7F2E8]">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-xl text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-[#F7F2E8] sm:text-4xl">{tr("Επιχειρήσεις που άνοιξαν το e-shop τους.")}</h2>
            <p className="max-w-md text-[15px] leading-7 text-[#F7F2E8]/80">{tr("Κάθε κατάστημα έχει το δικό του όνομα, ύφος και χρώματα. Άνοιξε ένα και δες το όπως θα το έβλεπε ένας πελάτης.")}</p>
          </Reveal>
          {published.length ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {published.map((site, i) => {
                const c = paletteColors[site.palette] || paletteColors.forest
                return (
                  <Reveal key={site.handle} delay={(i % 3) * 80} className="h-full">
                    <Link href={`/${locale}/store/${site.handle}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#F7F2E8]/20 bg-[#F7F2E8] text-[#1F3628] shadow-[0_22px_50px_-32px_rgba(0,0,0,0.65)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_34px_64px_-34px_rgba(0,0,0,0.75)]">
                      <div className="px-4 pt-4" style={{ background: c.soft }}>
                        <div className="translate-y-2 transition duration-500 group-hover:translate-y-0" aria-hidden="true">
                          <LiveSitePreview lang={lang} site={site} src={`/${locale}/store/${site.handle}`} address={siteAddress(site)} className="rounded-b-none shadow-xl" />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: c.accent }}>{tr(templateLabels[site.template]?.name || "")}</p>
                          {site.isFeatured && (
                            <span className="rounded-full bg-[#C0503C] px-2.5 py-0.5 text-[11px] font-semibold text-white">{tr("Προτεινόμενο")}</span>
                          )}
                        </div>
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
            <Reveal className="mt-10 rounded-2xl border border-dashed border-[#F7F2E8]/40 bg-[#F7F2E8]/[0.06] p-10 text-center">
              <h3 className="text-xl font-bold">{tr("Το πρώτο κατάστημα μπορεί να είναι το δικό σου.")}</h3>
              <p className="mt-2 text-sm text-[#F7F2E8]/80">{tr("Ξεκίνα σήμερα και άνοιξε τη βιτρίνα σου στο ψηφιακό εμπόριο.")}</p>
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

      {/* How it works: steps scroll, the shop mockup stays pinned and follows them */}
      <section id="how-it-works" className="scroll-mt-20">
        <div className={`${WRAP} py-14 lg:py-16`}>
          <HowItWorksScroll
            intro={
              <Reveal className="max-w-xl lg:pt-8">
                <Eyebrow>{tr("Πώς ξεκινάς")}</Eyebrow>
                <H2>{tr("Από το template στην πρώτη παραγγελία.")}</H2>
                <p className={`mt-5 max-w-md text-[16px] leading-7 ${MUTED}`}>{tr("Τέσσερα βήματα, με τον δικό σου ρυθμό. Και άνθρωποι δίπλα σου σε κάθε ένα.")}</p>
              </Reveal>
            }
          />
        </div>
      </section>

      {/* Philosophy */}
      <section id="philosophy" className="relative isolate overflow-hidden bg-[#173A57] text-[#F7F2E8]">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_20%_50%,#265E8E_0%,transparent_70%)]" />
        <div aria-hidden="true" className="vk-grain absolute inset-0 -z-10 opacity-20" />
        <OliveBranch className="pointer-events-none absolute -bottom-6 right-0 -z-10 w-[420px] text-[#F7F2E8]/10 lg:w-[620px]" />
        <span aria-hidden="true" className="font-serif pointer-events-none absolute -top-16 right-4 -z-10 text-[22rem] leading-none text-white/[0.04] sm:text-[34rem]">«</span>
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal>
            <Eyebrow light>{tr("Η φιλοσοφία μας")}</Eyebrow>
            <blockquote className="font-serif mt-8 max-w-5xl text-[2.9rem] font-medium italic leading-[1.02] tracking-[-0.02em] sm:text-7xl lg:text-[6.5rem]">
              <span className="text-[#D9806F]">{tr("«Το επιχειρείν")}</span>
              <br />
              {tr("εστίν φιλοσοφείν.»")}
            </blockquote>
          </Reveal>
          <Reveal delay={120} className="mt-10 grid max-w-4xl gap-6 text-[17px] leading-8 text-[#F7F2E8]/75 md:grid-cols-2 md:gap-10">
            <p>{tr("Το επιχειρείν δεν είναι μόνο η πώληση ενός προϊόντος. Είναι η σκέψη, η δημιουργία, η επιμονή και η αναζήτηση ενός καλύτερου τρόπου να προσφέρεις κάτι στον κόσμο.")}</p>
            <p>{tr("Η ιστορία κάθε επιχείρησης έχει αξία. Η τεχνολογία πρέπει να την αναδεικνύει, όχι να μπαίνει εμπόδιο. Γι' αυτό φτιάξαμε το Vitrinaki.")}</p>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-[#2E4A37] text-[#F7F2E8]">
        <div className={`${WRAP} grid gap-10 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-20`}>
          <Reveal>
            <Eyebrow light>{tr("Ερωτήσεις")}</Eyebrow>
            <H2>{tr("Όσα ρωτούν συνήθως πριν ξεκινήσουν.")}</H2>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <Reveal key={item.q} delay={i * 50}>
                <details className="group rounded-2xl border border-[#F7F2E8]/20 bg-[#F7F2E8] px-6 py-5 text-[#1F3628] transition open:shadow-[0_24px_55px_-30px_rgba(0,0,0,0.7)]">
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
      <section className="px-4 py-14 sm:px-6 lg:py-20">
        <Reveal className="relative isolate mx-auto max-w-[1280px] overflow-hidden rounded-[2.5rem] bg-[#1a2e21] px-6 py-16 text-center text-[#F7F2E8] sm:px-12 lg:py-20">
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
