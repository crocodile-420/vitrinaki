"use client"

import type React from "react"
import { useState } from "react"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"

import { StoryCaption, StoryChip, StoryDrop, StoryRoute, storyCss } from "./HeroJourney"

type Palette = { key: string; label: string; page: string; ink: string; accent: string; soft: string }

const palettes: Palette[] = [
  { key: "tile", label: "Κεραμιδί", page: "#FBF6F1", ink: "#5A2A1F", accent: "#C0503C", soft: "#F3DDD3" },
  { key: "cypress", label: "Κυπαρισσί", page: "#F7F2E8", ink: "#1F3628", accent: "#2E4A37", soft: "#E4E8DA" },
  { key: "aegean", label: "Μπλε", page: "#F4F8FB", ink: "#173A57", accent: "#265E8E", soft: "#DBE6F0" },
]

const greekToLatin: Record<string, string> = {
  α: "a", ά: "a", β: "v", γ: "g", δ: "d", ε: "e", έ: "e", ζ: "z", η: "i", ή: "i", θ: "th", ι: "i", ί: "i", ϊ: "i", ΐ: "i",
  κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", ό: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", ύ: "y", ϋ: "y", ΰ: "y",
  φ: "f", χ: "ch", ψ: "ps", ω: "o", ώ: "o",
}

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .split("")
    .map((char) => greekToLatin[char] ?? char)
    .join("")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)

const initialsOf = (value: string) =>
  value.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "V"

/* ---------- small building blocks ---------- */

function Browser({ url, children, className = "", dark = false }: { url: string; children: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-xl bg-white shadow-[0_24px_50px_-24px_rgba(31,54,40,0.45),0_2px_6px_rgba(31,54,40,0.06)] ring-1 ring-[#2E4A37]/10 ${className}`}>
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 ${dark ? "bg-[#1F3628]" : "bg-[#F4F1EA]"}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-[#C0503C]/70" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#2E4A37]/25" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#2E4A37]/25" />
        <span className={`ml-1.5 min-w-0 flex-1 truncate rounded px-2 py-0.5 text-[8px] ${dark ? "bg-white/10 text-white/70" : "bg-white text-[#2E4A37]/60"}`}>{url}</span>
      </div>
      {children}
    </div>
  )
}

/* ---------- interactive Studio products table ---------- */

type Row = { name: string; sku: string; stock: number; price: string; img: string }
const initialRows: Row[] = [
  { name: "Κεραμικό βάζο", sku: "KB-001", stock: 12, price: "32,00 €", img: "/home/p-vase.webp" },
  { name: "Αρωματικό κερί", sku: "AK-002", stock: 4, price: "18,00 €", img: "/home/p-candle.webp" },
  { name: "Σετ δώρου", sku: "SD-003", stock: 0, price: "45,00 €", img: "/home/p-bottles.webp" },
  { name: "Κάκτος σε πήλινη γλάστρα", sku: "KG-004", stock: 26, price: "14,00 €", img: "/home/p-cactus.webp" },
  { name: "Έλαιο τριαντάφυλλου", sku: "ET-005", stock: 7, price: "12,50 €", img: "/home/p-oil.webp" },
]
type Status = "in" | "low" | "out"
const statusOf = (stock: number): Status => (stock === 0 ? "out" : stock <= 5 ? "low" : "in")
const statusMeta: Record<Status, { label: string; cls: string }> = {
  in: { label: "Σε απόθεμα", cls: "bg-[#2E4A37]/10 text-[#2E4A37]" },
  low: { label: "Χαμηλό", cls: "bg-[#265E8E]/10 text-[#265E8E]" },
  out: { label: "Εξαντλημένο", cls: "bg-[#C0503C]/[0.12] text-[#C0503C]" },
}
const tabs: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "Όλα" },
  { key: "in", label: "Σε απόθεμα" },
  { key: "low", label: "Χαμηλό" },
  { key: "out", label: "Εξαντλημένα" },
]
const nav = ["Αρχική", "Προϊόντα", "Παραγγελίες", "Απόθεμα", "Πελάτες", "Ρυθμίσεις"]

export function StudioTable({ lang, className = "" }: { lang: Lang; className?: string }) {
  const tr = translator(lang)
  const [rows, setRows] = useState(initialRows)
  const [tab, setTab] = useState<"all" | Status>("all")
  const count = (key: "all" | Status) => (key === "all" ? rows.length : rows.filter((r) => statusOf(r.stock) === key).length)
  const change = (sku: string, delta: number) =>
    setRows((list) => list.map((r) => (r.sku === sku ? { ...r, stock: Math.max(0, Math.min(99, r.stock + delta)) } : r)))
  const visible = rows.filter((r) => tab === "all" || statusOf(r.stock) === tab)

  return (
    <div className={`overflow-hidden rounded-2xl bg-white shadow-[0_40px_80px_-40px_rgba(31,54,40,0.55),0_2px_8px_rgba(31,54,40,0.06)] ring-1 ring-[#2E4A37]/10 ${className}`}>
      <div className="flex">
        <aside className="hidden w-[96px] shrink-0 bg-[#2E4A37] px-2 py-3 text-[#F7F2E8] sm:block">
          <p className="px-1.5 text-[13px] font-extrabold tracking-tight">vitrinaki<span className="text-[#E8A493]">.</span></p>
          <p className="px-1.5 text-[8px] uppercase tracking-[0.2em] text-[#F7F2E8]/50">Studio</p>
          <ul className="mt-4 space-y-0.5 text-[10.5px]">
            {nav.map((item) => (
              <li key={item} className={`rounded-md px-2 py-1.5 ${item === "Προϊόντα" ? "bg-white/15 font-semibold" : "text-[#F7F2E8]/70"}`}>{tr(item)}</li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[15px] font-bold text-[#1F3628]">{tr("Προϊόντα")}</p>
            <span className="rounded-md bg-[#2E4A37] px-2 py-1 text-[10px] font-semibold text-white">+ {tr("Νέο προϊόν")}</span>
          </div>
          <div role="tablist" aria-label={tr("Φίλτρο αποθέματος")} className="mt-2.5 flex gap-1 overflow-x-auto border-b border-[#2E4A37]/10 text-[10.5px]">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`-mb-px shrink-0 border-b-2 px-1.5 pb-1.5 font-semibold transition ${tab === t.key ? "border-[#C0503C] text-[#1F3628]" : "border-transparent text-[#2E4A37]/55 hover:text-[#1F3628]"}`}
              >
                {tr(t.label)} <span className="font-normal opacity-60">({count(t.key)})</span>
              </button>
            ))}
          </div>
          <table className="mt-1 w-full text-left text-[10px] text-[#1F3628] [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
            <thead className="text-[9px] uppercase tracking-wider text-[#2E4A37]/50">
              <tr>
                <th className="py-1.5 font-semibold">{tr("Προϊόν")}</th>
                <th className="hidden py-1.5 font-semibold sm:table-cell">SKU</th>
                <th className="py-1.5 text-center font-semibold">{tr("Απόθεμα")}</th>
                <th className="hidden py-1.5 font-semibold min-[420px]:table-cell">{tr("Τιμή")}</th>
                <th className="py-1.5 text-right font-semibold">{tr("Κατάσταση")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const s = statusMeta[statusOf(r.stock)]
                return (
                  <tr key={r.sku} className="border-t border-[#2E4A37]/[0.07]">
                    <td className="py-1.5 pr-1">
                      <span className="flex items-center gap-1.5">
                        <img src={r.img} alt="" width={20} height={20} loading="lazy" decoding="async" className="h-5 w-5 shrink-0 rounded object-cover" />
                        <span className="truncate font-medium">{tr(r.name)}</span>
                      </span>
                    </td>
                    <td className="hidden py-1.5 text-[#2E4A37]/60 sm:table-cell">{r.sku}</td>
                    <td className="py-1.5">
                      <span className="mx-auto flex w-fit items-center gap-1">
                        <button type="button" aria-label={`${tr("Μείωση αποθέματος")}: ${tr(r.name)}`} onClick={() => change(r.sku, -1)} className="grid h-[18px] w-[18px] place-items-center rounded border border-[#2E4A37]/15 text-[11px] leading-none transition hover:border-[#C0503C] hover:text-[#C0503C]">−</button>
                        <span className="w-5 text-center font-semibold tabular-nums">{r.stock}</span>
                        <button type="button" aria-label={`${tr("Αύξηση αποθέματος")}: ${tr(r.name)}`} onClick={() => change(r.sku, 1)} className="grid h-[18px] w-[18px] place-items-center rounded border border-[#2E4A37]/15 text-[11px] leading-none transition hover:border-[#2E4A37] hover:bg-[#2E4A37] hover:text-white">+</button>
                      </span>
                    </td>
                    <td className="hidden py-1.5 tabular-nums min-[420px]:table-cell">{r.price}</td>
                    <td className="py-1.5 text-right">
                      <span className={`inline-block whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-semibold transition-colors ${s.cls}`}>{tr(s.label)}</span>
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 ? (
                <tr><td colSpan={5} className="py-4 text-center text-[#2E4A37]/50">{tr("Κανένα προϊόν σε αυτή την κατηγορία")}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


/* ---------- The hero story: Greek tradition → the world → your own e-shop ---------- */

const shopProducts = [
  { name: "Κεραμικό βάζο", price: "32 €", img: "/home/p-vase.webp" },
  { name: "Παιώνιες σε βάζο", price: "24 €", img: "/home/p-peony.webp" },
  { name: "Αρωματικό κερί", price: "18 €", img: "/home/p-candle.webp" },
]

function Photo({ src, className = "", alt = "" }: { src: string; className?: string; alt?: string }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={`block h-full w-full object-cover ${className}`} />
}

type ShopProps = { lang: Lang; p: Palette; shopName: string; slug: string; className?: string }

function ShopBrowser({ lang, p, shopName, slug, className = "" }: ShopProps) {
  const tr = translator(lang)
  return (
    <Browser url={`vitrinaki.gr/${slug}`} className={className}>
      <div className="p-2.5 transition-colors duration-500 sm:p-3" style={{ background: p.page, color: p.ink }} aria-live="polite">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-extrabold">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded text-[7px] text-white transition-colors duration-500" style={{ background: p.accent }}>{initialsOf(shopName)}</span>
            <span className="truncate">{shopName}</span>
          </span>
          <span className="flex shrink-0 gap-2 text-[7px] font-semibold opacity-60">
            <span>{tr("Αρχική")}</span><span>{tr("Συλλογή")}</span>
          </span>
        </div>
        <div className="mt-2 grid grid-cols-[1fr_1fr] overflow-hidden rounded-lg transition-colors duration-500" style={{ background: p.soft }}>
          <div className="flex flex-col justify-center p-2.5">
            <p className="font-serif text-[15px] leading-tight sm:text-[17px]">{tr("Νέα")}</p>
            <p className="text-[7px] opacity-70 sm:text-[7.5px]">{tr("Φυσική ομορφιά για καθημερινές στιγμές")}</p>
            <span className="mt-1.5 w-fit rounded px-1.5 py-0.5 text-[7px] font-bold text-white transition-colors duration-500" style={{ background: p.accent }}>{tr("Ανακάλυψε")}</span>
          </div>
          <div className="aspect-[4/3]"><Photo src="/home/p-desk-plant.webp" className="object-[45%_center]" /></div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {shopProducts.map((item) => (
            <div key={item.img} className="rounded-md bg-white p-1">
              <div className="aspect-square overflow-hidden rounded"><Photo src={item.img} /></div>
              <p className="mt-1 truncate text-[6.5px] font-semibold sm:text-[7px]">{tr(item.name)}</p>
              <p className="text-[6.5px] font-bold transition-colors duration-500 sm:text-[7px]" style={{ color: p.accent }}>{item.price}</p>
            </div>
          ))}
        </div>
      </div>
    </Browser>
  )
}

function OrderToast({ lang, className = "" }: { lang: Lang; className?: string }) {
  const tr = translator(lang)
  return (
    <div className={`vk-toast vk-toast-loop flex items-center gap-2 rounded-xl bg-white/95 px-2.5 py-2 text-left shadow-[0_14px_30px_-12px_rgba(31,54,40,0.55)] ring-1 ring-[#2E4A37]/10 backdrop-blur ${className}`}>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#2E4A37] text-[#F7F2E8]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[11px] font-bold text-[#1F3628]">{tr("Νέα παραγγελία")}</span>
        <span className="block truncate text-[10px] font-semibold text-[#2E4A37]/70">#1024 · {tr("Παραδόθηκε")}</span>
      </span>
    </div>
  )
}

function PhoneShop({ lang, p, shopName, className = "" }: Omit<ShopProps, "slug">) {
  const tr = translator(lang)
  return (
    <div className={`rounded-[1.4rem] bg-[#0F1C14] p-1.5 shadow-[0_30px_60px_-20px_rgba(15,28,20,0.7)] ring-1 ring-black/10 ${className}`}>
      <div className="overflow-hidden rounded-[1.1rem] transition-colors duration-500" style={{ background: p.page, color: p.ink }}>
        <div className="mx-auto mt-1 h-1.5 w-10 rounded-full bg-[#0F1C14]" />
        <div className="p-2">
          <p className="truncate text-[8px] font-extrabold">{shopName}</p>
          <div className="mt-1 rounded bg-white px-1.5 py-0.5 text-[6px] opacity-60">{tr("Αναζήτηση προϊόντων…")}</div>
          <div className="mt-1.5 aspect-[4/3] overflow-hidden rounded-md"><Photo src="/home/p-aloe.webp" /></div>
          <p className="mt-1 text-[7px] font-semibold">{tr("Προτεινόμενα")}</p>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {["/home/p-tulips.webp", "/home/p-succulents.webp"].map((src) => (
              <div key={src} className="aspect-square overflow-hidden rounded bg-white"><Photo src={src} /></div>
            ))}
          </div>
          <div className="mt-1.5 rounded py-1 text-center text-[6.5px] font-bold text-white transition-colors duration-500" style={{ background: p.accent }}>{tr("Στο καλάθι")}</div>
        </div>
      </div>
    </div>
  )
}

/* soft cypress / terracotta hills under the globe and the shop (stage units, 1440×650) */
function Hills({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-300 0 2040 170" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M940 170C1060 70 1180 34 1320 30c140-4 300 10 420 26v114z" fill="#C0503C" fillOpacity=".92" />
      <path d="M480 170c110-70 250-120 420-110 150 9 250 62 400 60 150-2 290-40 440-56v106z" fill="#2E4A37" />
      <path d="M560 150c100-58 210-92 340-90 150 3 250 62 400 60 150-2 290-40 440-56" fill="none" stroke="#D9B26F" strokeOpacity=".55" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function HeroDemo({ lang, intro }: { lang: Lang; intro: React.ReactNode }) {
  const tr = translator(lang)
  const [name, setName] = useState("")
  const [paletteKey, setPaletteKey] = useState(palettes[0].key)
  const p = palettes.find((x) => x.key === paletteKey) || palettes[0]
  const shopName = name.trim() || tr("Mano Χειροποίητα")
  const slug = slugify(name) || "mano"
  const shop = { lang, p, shopName, slug }

  return (
    <>
      <style>{storyCss}</style>
      <div className="relative isolate overflow-hidden bg-[#F5EEE1] text-[#1F3628]">
        {/* watercolour washes */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_40%_45%_at_58%_30%,rgba(46,74,55,0.10),transparent_70%),radial-gradient(ellipse_30%_40%_at_92%_8%,rgba(38,94,142,0.08),transparent_70%),radial-gradient(ellipse_45%_40%_at_10%_0%,rgba(192,80,60,0.06),transparent_70%)]" />

        <div className="relative mx-auto w-full max-w-[1600px] xl:aspect-[1440/650]">
          {/* Desktop panorama: Greece (left) → globe (middle) → the seller's e-shop (right) */}
          <div aria-hidden="true" className="hidden xl:block">
            <img src="/home/story-greece.webp" alt="" width={799} height={544} fetchPriority="high" decoding="async" className="absolute bottom-0 left-[-1.5%] w-[46%] [mask-image:linear-gradient(90deg,transparent,#000_7%)]" />
            <img src="/home/story-globe.webp" alt="" width={730} height={603} decoding="async" className="absolute left-[37%] top-[7%] w-[37%]" />
            <Hills className="absolute bottom-0 left-[-20.8%] h-[25%] w-[141.7%]" />
          </div>

          {/* Headline, subtitle, CTAs: in flow on mobile, over the panorama's "sky" on desktop */}
          <div className="relative z-40 px-5 pt-9 sm:px-8 xl:absolute xl:left-[3.3%] xl:top-[6.5%] xl:w-[38%] xl:max-w-[560px] xl:p-0">
            <div aria-hidden="true" className="absolute -inset-x-20 -bottom-24 -top-10 -z-10 hidden bg-[radial-gradient(closest-side,rgba(245,238,225,0.96)_62%,rgba(245,238,225,0.65)_84%,transparent_100%)] xl:block" />
            {intro}
          </div>

          <div className="hidden xl:block" aria-label={tr("Προεπισκόπηση καταστήματος")}>
            <div className="absolute right-[1.2%] top-[3%] z-10 hidden w-[480px] origin-top-right scale-[0.62] xl:block min-[1400px]:scale-[0.68] min-[1560px]:scale-[0.76]">
              <StudioTable lang={lang} />
            </div>
            <ShopBrowser {...shop} className="absolute left-[68.5%] top-[30%] z-20 w-[20.5%]" />
            <div className="absolute right-[2.5%] top-[38%] z-30 w-[10%]">
              <OrderToast lang={lang} className="absolute -top-14 right-[-6%] w-[190px]" />
              <PhoneShop {...shop} />
            </div>
            <StoryRoute lang={lang} />
            <div className="absolute left-[31.5%] top-[76.5%] z-30"><StoryChip n={1}>{tr("Ελληνική παράδοση")}</StoryChip></div>
            <div className="absolute left-[48.5%] top-[73%] z-30"><StoryChip n={2}>{tr("Πελάτες παντού, μέσω vitrinaki.gr")}</StoryChip></div>
            <div className="absolute left-[69%] top-[78%] z-30"><StoryChip n={3}>{tr("Το δικό σου e-shop")}</StoryChip></div>
            <StoryCaption lang={lang} className="absolute bottom-[3%] left-[56.5%] z-30 w-max -translate-x-1/2" />
          </div>

          {/* Mobile / tablet: the same story, stacked */}
          <div className="relative px-5 pb-10 pt-8 sm:px-8 xl:hidden">
            <div className="mx-auto max-w-[560px] md:max-w-[640px]">
              <div className="relative">
                <img src="/home/story-greece.webp" alt="" width={799} height={544} decoding="async" className="block w-full" />
                <StoryChip n={1} className="absolute bottom-3 left-3">{tr("Ελληνική παράδοση")}</StoryChip>
              </div>
              <StoryDrop className="-mt-1" />
              <div className="relative">
                <img src="/home/story-globe.webp" alt="" width={730} height={603} decoding="async" className="mx-auto block w-[94%]" />
                <StoryChip n={2} className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">{tr("Πελάτες παντού, μέσω vitrinaki.gr")}</StoryChip>
              </div>
              <StoryDrop />
              <div className="relative">
                <StoryChip n={3} className="mb-3">{tr("Το δικό σου e-shop")}</StoryChip>
                <div className="relative pb-[6%] pr-[22%]" aria-label={tr("Προεπισκόπηση καταστήματος")}>
                  <ShopBrowser {...shop} className="w-full" />
                  <div className="absolute bottom-0 right-0 w-[30%]">
                    <PhoneShop {...shop} />
                  </div>
                  <OrderToast lang={lang} className="absolute -top-2 right-0 w-[176px]" />
                </div>
              </div>
              <StoryCaption lang={lang} tone="dark" className="mt-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Try it: compact name & colour strip */}
      <div className="border-b border-[#2E4A37]/10 bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-5 py-4 sm:px-8 md:flex-row md:items-center md:gap-5 lg:px-12">
          <label htmlFor="vk-demo-name" className="flex shrink-0 items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#2E4A37]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C0503C]" />
            {tr("Δοκίμασέ το με το όνομά σου")}
          </label>
          <div className="flex min-w-0 flex-1 items-center gap-2 md:max-w-[460px]">
            <input
              id="vk-demo-name"
              type="text"
              value={name}
              maxLength={32}
              autoComplete="off"
              placeholder={tr("Το όνομα της επιχείρησής σου")}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-[#2E4A37]/15 bg-[#FBF9F4] px-3 py-2 text-[14px] text-[#1F3628] outline-none transition placeholder:text-[#2E4A37]/40 focus:border-[#C0503C] focus:ring-2 focus:ring-[#C0503C]/20"
            />
            <div role="radiogroup" aria-label={tr("Χρώματα")} className="flex shrink-0 gap-1.5">
              {palettes.map((x) => (
                <button
                  key={x.key}
                  type="button"
                  role="radio"
                  aria-checked={x.key === paletteKey}
                  aria-label={tr(x.label)}
                  title={tr(x.label)}
                  onClick={() => setPaletteKey(x.key)}
                  className={`h-7 w-7 rounded-full ring-offset-2 transition hover:scale-110 ${x.key === paletteKey ? "ring-2 ring-[#1F3628]" : ""}`}
                  style={{ background: x.accent }}
                />
              ))}
            </div>
          </div>
          <p className="truncate text-[13px] text-[#2E4A37]/70">
            {tr("Η διεύθυνσή σου:")} vitrinaki.gr/<span className="font-semibold text-[#265E8E]">{slug}</span>
          </p>
        </div>
      </div>

      {/* Studio on small screens */}
      <div className="bg-[#F7F2E8] px-5 py-8 sm:px-8 xl:hidden">
        <p className="mb-2 text-[12px] font-semibold text-[#2E4A37]/70">{tr("Δοκίμασε τη διαχείριση αποθέματος:")}</p>
        <StudioTable lang={lang} />
      </div>
    </>
  )
}
