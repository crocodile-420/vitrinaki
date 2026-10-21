import Link from "next/link"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { LiveSitePreview } from "@/components/sections/SitePreview/LiveSitePreview"
import { HeroDemo, StudioTable } from "@/components/sections/HeroDemo/HeroDemo"
import { PromotedMarket } from "@/components/sections/PromotedMarket/PromotedMarket"
import { SitePreview } from "@/components/sections/HeroDemo/SitePreview"
import { sites } from "@/components/sections/HeroDemo/sites"
import { Reveal } from "@/components/atoms/Reveal/Reveal"
import { HowItWorksScroll } from "@/components/sections/HowItWorksScroll/HowItWorksScroll"
import { TryShop } from "@/components/sections/TryShop/TryShop"
import { listPromotedProducts } from "@/lib/data/vitrinaki-promoted"
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


// Everything else that comes with a shop, next to the six main tools.
const extras = [
  { icon: "globe", title: "Το δικό σου domain", text: "Ξεκινάς στο vitrinaki.gr/το-όνομά-σου ή συνδέεις το δικό σου domain." },
  { icon: "lang", title: "Ελληνικά & Αγγλικά", text: "Το κατάστημά σου μιλά τη γλώσσα των πελατών σου, στην Ελλάδα και στο εξωτερικό." },
  { icon: "megaphone", title: "Προβολή στο Vitrinaki", text: "Η κοινή βιτρίνα βοηθά περισσότερους να σε ανακαλύψουν." },
  { icon: "heart", title: "Υποστήριξη που σε νοιάζεται", text: "Άνθρωποι δίπλα σου, με οδηγούς και πραγματική βοήθεια όταν τη χρειαστείς." },
  { icon: "calendar", title: "Κρατήσεις online", text: "Ραντεβού και κρατήσεις κατευθείαν από την ιστοσελίδα σου.", soon: true },
  { icon: "doc", title: "Τιμολόγια myDATA", text: "Έκδοση παραστατικών με διασύνδεση στο myDATA της ΑΑΔΕ.", soon: true },
] as const

// Same plans and team sizes as the Studio's «Ενεργοποίηση» step (PLAN_MEMBER_LIMITS in
// packages/api/src/lib/vitrinaki-plans.ts). Prices live in Stripe and are not shown yet.
const plans = [
  { id: "starter", label: "Starter", team: "1 άτομο", text: "Η βιτρίνα σου με όλα τα βασικά." },
  { id: "growth", label: "Growth", team: "έως 3 άτομα", text: "Για καταστήματα που μεγαλώνουν." },
  { id: "pro", label: "Pro", team: "έως 5 άτομα", text: "Ρόλους για την ομάδα σου." },
  { id: "business", label: "Επιχείρηση", team: "έως 15 άτομα", text: "Πολλά καταστήματα από έναν λογαριασμό, δωρεάν στήσιμο από την ομάδα μας και προτεραιότητα στην υποστήριξη." },
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
  orders: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>,
  truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
}

function FeatureIcon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  )
}

function Capability({ icon, color, title, text, tr, className = "", children }: { icon: string; color: string; title: string; text: string; tr: (s: string) => string; className?: string; children: React.ReactNode }) {
  return (
    <Reveal className={`h-full ${className}`}>
      <div className="flex h-full flex-col rounded-2xl bg-[#F7F2E8] p-6 ring-1 ring-[#2E4A37]/10">
        <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: `${color}17`, color }}>
          <FeatureIcon name={icon} size={20} />
        </span>
        <h3 className="mt-3 text-[17px] font-bold text-[#1F3628]">{tr(title)}</h3>
        <p className={`mt-1.5 max-w-xl text-[14px] leading-6 ${MUTED}`}>{tr(text)}</p>
        <div className="mt-5 flex-1">{children}</div>
      </div>
    </Reveal>
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

const audienceColors = ["#2E4A37", "#C0503C", "#265E8E", "#C0503C", "#2E4A37"]

function Eyebrow({ children, light = false, center = false }: { children: React.ReactNode; light?: boolean; center?: boolean }) {
  return (
    <p className={`inline-flex items-center gap-2 ${center ? "justify-center" : ""} rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${light ? "border-white/15 bg-white/5 text-[#F7F2E8]/75" : "border-[#2E4A37]/15 bg-white/60 text-[#2E4A37]/70"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${light ? "bg-[#D9806F]" : "bg-[#C0503C]"}`} />
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
  const [published, promoted] = await Promise.all([listPublishedStorefronts(), listPromotedProducts(locale)])

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

      {/* Hero */}
      <section className="relative">
        <HeroDemo
          lang={lang}
          intro={
            <>
              <p className="mb-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#2E4A37]/75">
                <span className="h-1.5 w-1.5 rounded-full bg-[#265E8E]" />
                {tr("Για κάθε επιχείρηση, σε όλη την Ελλάδα")}
              </p>
              <h1 className="text-[2.15rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#1F3628] sm:text-[3rem] lg:text-[2.6rem] xl:text-[3rem]">
                {tr("Το vitrinaki σου, στο ψηφιακό εμπόριο.")}{" "}
                <span className="relative inline-block text-[#C0503C]">
                  {tr("Από την ιστοσελίδα ως την παραγγελία.")}
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
                <a href="#try" className="group inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#2E4A37]/30 bg-[#F7F2E8]/60 px-6 text-[15px] font-semibold text-[#1F3628] transition hover:border-[#2E4A37] hover:bg-white">
                  {tr("Δοκίμασέ το")}
                </a>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-[#1F3628]/85">
                {["Χωρίς τεχνικές γνώσεις", "Στα μέτρα της επιχείρησής σου", "Άνθρωποι δίπλα σου"].map((item) => (
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

      {/* Try it: the visitor changes a sample shop live */}
      <section id="try" aria-labelledby="try-title" className="scroll-mt-20 border-t border-[#2E4A37]/10 bg-[#EFE7D8]">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>Custom</Eyebrow>
              <h2 id="try-title" className="mt-4 max-w-xl text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] sm:text-4xl">{tr("Φτιάξε τη βιτρίνα όπως τη θες.")}</h2>
            </div>
            <p className={`max-w-md text-[15px] leading-7 ${MUTED}`}>{tr("Template, χρώματα, γραμματοσειρά, στυλ, λογότυπο, εξώφυλλο, ενότητες και domain. Δες το κατάστημα να αλλάζει αμέσως. Δεν αποθηκεύεται τίποτα.")}</p>
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

      {/* All-in-one: the business tools under one roof */}
      <section id="included" aria-labelledby="included-title" className="scroll-mt-20 border-t border-[#2E4A37]/10 bg-[#EFE7D8]">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>{tr("Όλα σε μία πλατφόρμα")}</Eyebrow>
              <h2 id="included-title" className="mt-4 max-w-xl text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] sm:text-4xl">
                {tr("Η ολοκληρωμένη λύση για")}{" "}
                <span className="relative inline-block text-[#C0503C]">
                  {tr("μικρές επιχειρήσεις.")}
                  <Swoosh className="absolute -bottom-1.5 left-0 h-2 w-full text-[#C0503C]/35" />
                </span>
              </h2>
            </div>
            <p className={`max-w-md text-[15px] leading-7 ${MUTED}`}>{tr("Ιστοσελίδα, e-shop, απόθεμα, παραγγελίες, πληρωμές και αποστολές. Τα βασικά εργαλεία της επιχείρησής σου, μαζί, σε ένα Studio.")}</p>
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Capability className="md:col-span-2" icon="spark" color="#C0503C" title="Ιστοσελίδα & e-shop" text="Έτοιμα templates με το όνομα, το λογότυπο και τα χρώματά σου, στο vitrinaki.gr/το-όνομά-σου ή στο δικό σου domain, σε Ελληνικά και Αγγλικά." tr={tr}>
              <div className="grid grid-cols-2 gap-3">
                <SitePreview site={sites[0]} lang={lang} />
                <SitePreview site={sites[2]} lang={lang} />
              </div>
            </Capability>
            <Capability icon="card" color="#265E8E" title="Πληρωμές με κάρτα" text="Οι πελάτες πληρώνουν με κάρτα μέσω Stripe και τα χρήματα πηγαίνουν απευθείας στον λογαριασμό του καταστήματός σου." tr={tr}>
              <div className="rounded-xl bg-white p-4 ring-1 ring-[#2E4A37]/10">
                <p className="text-[12px] font-semibold text-[#2E4A37]/60">{tr("Πληρωμή με κάρτα")}</p>
                <p className="mt-2 rounded-lg border border-[#2E4A37]/15 px-3 py-2 font-mono text-[13px] tracking-wider text-[#1F3628]">•••• •••• •••• 4242</p>
                <span className="mt-3 block rounded-lg bg-[#2E4A37] py-2 text-center text-[13px] font-bold text-white">{tr("Πλήρωσε")} 48,00 €</span>
                <p className="mt-2 text-center text-[11.5px] text-[#2E4A37]/55">{tr("Ασφαλής πληρωμή μέσω Stripe")}</p>
              </div>
            </Capability>
            <Capability icon="orders" color="#2E4A37" title="Παραγγελίες & πελάτες" text="Κάθε παραγγελία με τα στοιχεία του πελάτη και την κατάστασή της. Κωδικοί έκπτωσης και πόντοι επιβράβευσης για όσους ξαναγοράζουν." tr={tr}>
              <ul className="divide-y divide-[#2E4A37]/[0.07] rounded-xl bg-white px-4 py-1 text-[13px] ring-1 ring-[#2E4A37]/10">
                {[["#1042", "Μαρία Κ.", "Νέα", "bg-[#C0503C]/[0.12] text-[#C0503C]"], ["#1041", "Γιώργος Π.", "Σε αποστολή", "bg-[#265E8E]/10 text-[#265E8E]"], ["#1040", "Ελένη Δ.", "Ολοκληρώθηκε", "bg-[#2E4A37]/10 text-[#2E4A37]"]].map(([no, who, status, cls]) => (
                  <li key={no} className="flex items-center justify-between gap-2 py-2.5">
                    <span className="min-w-0 truncate"><span className="font-bold tabular-nums">{no}</span> <span className="text-[#2E4A37]/70">· {tr(who)}</span></span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{tr(status)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex flex-wrap gap-2 text-[12px] font-semibold">
                <span className="rounded-full bg-white px-2.5 py-1 text-[#C0503C] ring-1 ring-[#C0503C]/20">{tr("Κωδικός έκπτωσης")}</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[#2E4A37] ring-1 ring-[#2E4A37]/15">{tr("Πόντοι επιβράβευσης")}</span>
              </p>
            </Capability>
            <Capability className="md:col-span-2" icon="box" color="#2E4A37" title="Απόθεμα & προϊόντα" text="Προϊόντα, παραλλαγές και ποσότητες. Βλέπεις τι τελειώνει και το ενημερώνεις με ένα κλικ. Δοκίμασέ το εδώ: πάτησε + και −." tr={tr}>
              <StudioTable lang={lang} />
            </Capability>
            <Capability icon="truck" color="#265E8E" title="Αποστολές με courier" text="Δίνεις στους πελάτες σου επιλογές αποστολής με τις εταιρείες που συνεργάζεσαι. Με τον αριθμό αποστολής, ο πελάτης βλέπει πού είναι το δέμα του." tr={tr}>
              <ul className="flex flex-wrap gap-2">
                {["ACS", "ΕΛΤΑ Courier", "Γενική Ταχυδρομική", "DHL", "Box Now"].map((c) => (
                  <li key={c} className="rounded-lg bg-white px-3 py-1.5 text-[13px] font-bold text-[#1F3628] ring-1 ring-[#2E4A37]/10">{tr(c)}</li>
                ))}
              </ul>
            </Capability>
            <Capability icon="layout" color="#265E8E" title="Όλη η επιχείρηση σε ένα Studio" text="Από ένα σημείο βλέπεις και διαχειρίζεσαι τα πάντα, μαζί με την ομάδα σου." tr={tr}>
              <ul className="grid grid-cols-2 gap-1.5 text-[13px] font-semibold text-[#1F3628]">
                {["Προϊόντα", "Παραγγελίες", "Απόθεμα", "Πληρωμές με κάρτα", "Courier", "Πόντοι επιβράβευσης", "Η βιτρίνα σου", "Ομάδα"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-[#2E4A37]/10">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#265E8E]" />
                    <span className="truncate">{tr(item)}</span>
                  </li>
                ))}
              </ul>
            </Capability>
            <Reveal className="h-full">
              <div className="flex h-full flex-col rounded-2xl bg-[#2E4A37] p-6 text-[#F7F2E8]">
                <h3 className="text-[17px] font-bold">{tr("Και επίσης")}</h3>
                <ul className="mt-4 space-y-3">
                  {extras.map((x) => (
                    <li key={x.title} className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 text-[#E8A493]"><FeatureIcon name={x.icon} size={18} /></span>
                      <span className="text-[14px] leading-snug">
                        <span className="font-semibold">{tr(x.title)}</span>
                        {"soon" in x ? <span className="ml-1.5 rounded-full bg-[#F7F2E8]/15 px-1.5 py-0.5 text-[10.5px] font-semibold">{tr("Σύντομα")}</span> : null}
                        <span className="block text-[13px] text-[#F7F2E8]/70">{tr(x.text)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
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
                        <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-[#265E8E]">
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

      {/* Marketplace: products promoted from Vitrinaki shops, each with a way to the shop */}
      <section id="marketplace" aria-labelledby="marketplace-title" className="scroll-mt-20">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>{tr("Marketplace")}</Eyebrow>
              <h2 id="marketplace-title" className="mt-4 max-w-xl text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] sm:text-4xl">{tr("Ανακάλυψε προϊόντα από ελληνικά καταστήματα.")}</h2>
            </div>
            <p className={`max-w-md text-[15px] leading-7 ${MUTED}`}>{tr("Προϊόντα που ξεχωρίσαμε από τις βιτρίνες του Vitrinaki. Άνοιξε ένα για να το δεις ή πήγαινε κατευθείαν στο κατάστημα.")}</p>
          </Reveal>
          {promoted.length ? (
            <Reveal className="mt-8">
              <PromotedMarket products={promoted} lang={lang} locale={locale} />
            </Reveal>
          ) : (
            <Reveal className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-[#2E4A37]/25 bg-white/50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <h3 className="text-lg font-bold text-[#1F3628]">{tr("Σύντομα εδώ, προϊόντα από τα καταστήματά μας.")}</h3>
                <p className={`mt-1 text-[14.5px] leading-6 ${MUTED}`}>{tr("Άνοιξε τη βιτρίνα σου και τα προϊόντα σου μπορεί να είναι από τα πρώτα.")}</p>
              </div>
              <a href={businessUrl} className={`${primaryBtn} shrink-0`}>
                {tr("Άνοιξε τη βιτρίνα σου")} <Arrow />
              </a>
            </Reveal>
          )}
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

      {/* Who it is for */}
      <section id="for-whom" className="scroll-mt-20">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-xl text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] sm:text-4xl">{tr("Όλοι αξίζουν μια θέση στη μεγάλη βιτρίνα.")}</h2>
            <p className={`max-w-md text-[15px] leading-7 ${MUTED}`}>{tr("Δεν χρειάζεται να ξέρεις από design, προγραμματισμό ή διαφημίσεις για να μεγαλώσεις την επιχείρησή σου.")}</p>
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

      {/* Subscription: one plan, every tool */}
      <section id="pricing" aria-labelledby="pricing-title" className="relative isolate scroll-mt-20 overflow-hidden bg-[#173A57] text-[#F7F2E8]">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_75%_at_85%_40%,#265E8E_0%,transparent_70%)] opacity-80" />
        <OliveBranch className="pointer-events-none absolute -bottom-6 -left-10 -z-10 w-[360px] text-[#F7F2E8]/[0.07] lg:w-[520px]" />
        <div className={`${WRAP} grid gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-20`}>
          <Reveal>
            <Eyebrow light>{tr("Συνδρομή")}</Eyebrow>
            <h2 id="pricing-title" className="mt-4 text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">{tr("Μία συνδρομή. Όλα τα εργαλεία μαζί.")}</h2>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-[#F7F2E8]/80">{tr("Δεν χρειάζεται να πληρώνεις χωριστά για ιστοσελίδα, e-shop και διαχείριση, ούτε να τα κάνεις να μιλήσουν μεταξύ τους. Με το Vitrinaki τα έχεις έτοιμα και συνδεδεμένα από την πρώτη μέρα.")}</p>
            <ul className="mt-6 grid gap-2.5 text-[14.5px] sm:grid-cols-2">
              {["Ιστοσελίδα & e-shop", "Απόθεμα & προϊόντα", "Παραγγελίες & πελάτες", "Πληρωμές με κάρτα", "Αποστολές με courier", "Υποστήριξη από ανθρώπους"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#8DB8DE" /><path d="m7.5 12 3 3 6-6" stroke="#173A57" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {tr(item)}
                </li>
              ))}
            </ul>
            <a href={businessUrl} className={`mt-8 ${primaryBtn} !bg-[#F7F2E8] !text-[#173A57] hover:!bg-white`}>
              {tr("Άνοιξε τη βιτρίνα σου")} <Arrow />
            </a>
          </Reveal>
          <Reveal delay={120}>
            <p className="text-[13px] font-semibold text-[#F7F2E8]/70">{tr("Τα πακέτα διαφέρουν στο μέγεθος της ομάδας και στη βοήθεια που παίρνεις. Όλα έχουν τα παραπάνω.")}</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {plans.map((plan) => (
                <li key={plan.id} className="rounded-2xl bg-[#F7F2E8] p-5 text-[#1F3628]">
                  <p className="text-[17px] font-extrabold">{tr(plan.label)}</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#265E8E]">{tr(plan.team)}</p>
                  <p className={`mt-2 text-[13.5px] leading-6 ${MUTED}`}>{tr(plan.text)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-6 text-[#F7F2E8]/70">{tr("Οι τιμές οριστικοποιούνται. Πριν ξεκινήσεις θα ξέρεις ακριβώς τι πληρώνεις. Ήρθες με σύσταση από άλλο κατάστημα; Ο πρώτος σου μήνας είναι δωρεάν.")}</p>
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
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2E4A37]/[0.07] text-xl font-light transition duration-300 group-open:rotate-45 group-open:bg-[#265E8E] group-open:text-white" aria-hidden="true">+</span>
                  </summary>
                  <p className={`mt-4 max-w-2xl text-[15px] leading-7 ${MUTED}`}>{tr(item.a)}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" aria-labelledby="about-title" className="scroll-mt-20 px-4 py-14 sm:px-6 lg:py-20">
        <Reveal className="relative isolate mx-auto grid max-w-[1280px] gap-10 overflow-hidden rounded-[2.5rem] bg-[#1a2e21] px-6 py-14 text-[#F7F2E8] sm:px-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16 lg:px-16 lg:py-20">
          <div aria-hidden="true" className="vk-glow absolute -left-20 -top-32 -z-10 h-96 w-96 rounded-full bg-[#C0503C]/35 blur-[100px]" />
          <div aria-hidden="true" className="vk-glow absolute -bottom-40 -right-20 -z-10 h-96 w-96 rounded-full bg-[#265E8E]/40 blur-[100px] [animation-delay:-4s]" />
          <div aria-hidden="true" className="vk-grain absolute inset-0 -z-10 opacity-20" />
          <div>
            <Eyebrow light>{tr("Σχετικά με εμάς")}</Eyebrow>
            <h2 id="about-title" className="font-serif mt-7 text-[2.4rem] font-medium leading-[1.04] tracking-[-0.02em] sm:text-6xl">
              {tr("Σχετικά με το")} <span className="whitespace-nowrap">vitrinaki<span className="text-[#D9806F]">.gr</span></span>
            </h2>
          </div>
          <div className="text-[17px] leading-8 text-[#F7F2E8]/75">
            <p>{tr("Το vitrinaki.gr δίνει σε κάθε επιχείρηση τη δική της ψηφιακή βιτρίνα: ιστοσελίδα και e-shop με το όνομά της, και ένα Studio για προϊόντα, παραγγελίες και πελάτες.")}</p>
            <p className="mt-5">{tr("Το φτιάξαμε για τα μαγαζιά της γειτονιάς, τους παραγωγούς και τους δημιουργούς, ώστε να στέκονται online με τη δική τους ταυτότητα, χωρίς τεχνικές γνώσεις και με ανθρώπους δίπλα τους.")}</p>
            <a href={businessUrl} className={`mt-9 ${primaryBtn}`}>
              {tr("Άνοιξε τη βιτρίνα σου")} <Arrow />
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
