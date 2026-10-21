"use client"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"
import { PALETTES, TEMPLATE_FOR_TYPE, caps, type BusinessType, type Palette } from "@/lib/vitrinaki-start"

// A live miniature of the shop being created: it follows what the person types
// (name, address, colour, kind of business, tagline, logo, city, phone).
// Purely visual (aria-hidden); the form itself carries all the information.

const HERO_IMAGE: Record<BusinessType | "none", { src: string; pos: string }> = {
  none: { src: "/home/t-home.webp", pos: "center 55%" },
  retail: { src: "/home/t-fashion.webp", pos: "center 30%" },
  crafts: { src: "/home/p-vase.webp", pos: "center" },
  food: { src: "/home/food-dark.webp", pos: "30% center" },
  beauty: { src: "/home/t-services.webp", pos: "center 35%" },
  services: { src: "/home/p-desk-plant.webp", pos: "center" },
  portfolio: { src: "/home/t-portfolio.webp", pos: "center" },
  other: { src: "/home/t-home.webp", pos: "center 55%" },
}
const PRODUCTS = [
  { src: "/home/p-candle.webp", name: "Αρωματικό κερί", price: "18,00 €" },
  { src: "/home/p-succulents.webp", name: "Παχύφυτα σε γλάστρα", price: "24,00 €" },
  { src: "/home/p-peony.webp", name: "Παιώνιες", price: "32,00 €" },
]
const FOOD = [
  { src: "/home/p-oil.webp", name: "Ελαιόλαδο 500ml", price: "9,50 €" },
  { src: "/home/p-bottles.webp", name: "Κρασί λευκό", price: "14,00 €" },
  { src: "/home/p-tulips.webp", name: "Δώρο εποχής", price: "22,00 €" },
]
const SERVICES = [
  { name: "Πρώτη συνάντηση", meta: "30′", price: "Δωρεάν" },
  { name: "Βασική υπηρεσία", meta: "60′", price: "από 40 €" },
  { name: "Πακέτο 5 συναντήσεων", meta: "5 × 60′", price: "180 €" },
]

export function ShopPreview({
  lang,
  name,
  handle,
  palette,
  businessType,
  tagline,
  logoUrl,
  city,
  phone,
  instagram,
  className = "",
}: {
  lang: Lang
  name: string
  handle: string
  palette: Palette
  businessType: BusinessType | ""
  tagline: string
  logoUrl: string
  city: string
  phone: string
  instagram: string
  className?: string
}) {
  const tr = translator(lang)
  const c = PALETTES.find((p) => p.value === palette) || PALETTES[0]
  const template = businessType ? TEMPLATE_FOR_TYPE[businessType] : "atelier"
  const shownName = name.trim() || tr("Το κατάστημά σου")
  const initials = (name.trim() || "V")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const hero = HERO_IMAGE[businessType || "none"]
  const shownTagline = tagline.trim() || tr("Καλώς ήρθες στη βιτρίνα μας")
  const isServices = template === "services"
  const items = businessType === "food" ? FOOD : PRODUCTS

  return (
    <div aria-hidden="true" className={`overflow-hidden rounded-2xl bg-white shadow-[0_40px_80px_-40px_rgba(31,54,40,0.55)] ring-1 ring-[#2E4A37]/10 ${className}`}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-black/5 bg-[#FBFAF7] px-3.5 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E8DCD3]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E9E2CF]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#D8E2D6]" />
        </span>
        <span className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] text-[#5E6B63] ring-1 ring-black/5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          <span className="truncate">
            vitrinaki.gr/store/<span className="font-semibold text-[#1F3628]">{handle || tr("to-onoma-sou")}</span>
          </span>
        </span>
      </div>

      <div style={{ background: c.page, color: c.ink }} className="transition-colors duration-500">
        {/* Shop header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="flex min-w-0 items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-7 w-7 shrink-0 rounded-md bg-white object-contain ring-1 ring-black/5" />
            ) : (
              <span style={{ background: c.color }} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[10px] font-bold text-white transition-colors duration-500">
                {initials}
              </span>
            )}
            <span className="truncate text-[14px] font-extrabold tracking-tight">{shownName}</span>
          </span>
          <span className="hidden shrink-0 items-center gap-3 text-[10px] font-semibold opacity-60 sm:flex">
            <span>{tr("Αρχική")}</span>
            <span>{tr(isServices ? "Υπηρεσίες" : "Συλλογή")}</span>
            <span>{tr("Επικοινωνία")}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 11h10.2L20 8H6.2" /><circle cx="9" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></svg>
          </span>
        </div>

        {/* Hero */}
        <div className="px-4">
          {template === "local" ? (
            <div className="relative overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero.src} alt="" className="h-36 w-full object-cover" style={{ objectPosition: hero.pos }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                <p className="text-[9px] font-bold tracking-[0.2em] opacity-80">{caps(city.trim() || tr("Στη γειτονιά σου"))}</p>
                <p className="mt-1 max-w-[85%] text-[17px] font-extrabold leading-tight">{shownTagline}</p>
                <span style={{ background: c.color }} className="mt-2 inline-block rounded-md px-2.5 py-1 text-[10px] font-bold text-white">{tr("Δες τα προϊόντα")}</span>
              </div>
            </div>
          ) : (
            <div style={{ background: c.soft }} className="grid grid-cols-[1.15fr_0.85fr] overflow-hidden rounded-xl transition-colors duration-500">
              <div className="flex flex-col justify-center p-4">
                <p className="text-[9px] font-bold tracking-[0.2em] opacity-60">{caps(tr(isServices ? "Κλείσε ραντεβού" : "Νέα συλλογή"))}</p>
                <p className="mt-1.5 text-[17px] font-extrabold leading-[1.15]">{shownTagline}</p>
                <span style={{ background: c.color }} className="mt-3 inline-block w-fit rounded-md px-2.5 py-1 text-[10px] font-bold text-white transition-colors duration-500">
                  {tr(isServices ? "Ζήτησε ραντεβού" : "Ανακάλυψε")}
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero.src} alt="" className="h-36 w-full object-cover" style={{ objectPosition: hero.pos }} />
            </div>
          )}
        </div>

        {/* Catalogue / services */}
        <div className="px-4 pb-3 pt-3">
          {isServices ? (
            <div className="divide-y divide-black/5 overflow-hidden rounded-xl bg-white/70 ring-1 ring-black/5">
              {SERVICES.map((s) => (
                <div key={s.name} className="flex items-center justify-between px-3 py-2 text-[11px]">
                  <span className="font-semibold">{tr(s.name)} <span className="font-normal opacity-50">· {s.meta}</span></span>
                  <span style={{ color: c.color }} className="font-bold">{tr(s.price)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {items.map((p) => (
                <div key={p.name} className="overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt="" className="aspect-[4/3] w-full object-cover" />
                  <div className="px-2 py-1.5">
                    <p className="truncate text-[10px] font-semibold">{tr(p.name)}</p>
                    <p style={{ color: c.color }} className="text-[10px] font-bold">{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: contact as typed */}
        <div style={{ background: c.color }} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-[10px] font-medium text-white/90 transition-colors duration-500">
          <span className="font-bold text-white">{shownName}</span>
          {city.trim() ? <span>· {city.trim()}</span> : null}
          {phone.trim() ? <span>· {phone.trim()}</span> : null}
          {instagram.trim() ? <span>· @{instagram.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "")}</span> : null}
        </div>
      </div>
    </div>
  )
}
