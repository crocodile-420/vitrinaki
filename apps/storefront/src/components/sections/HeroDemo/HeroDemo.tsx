"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"

import { HeroShowcase, SCENE_MS, type Scene, showcaseCss } from "./HeroShowcase"

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

export function Browser({ url, children, className = "", dark = false }: { url: React.ReactNode; children: React.ReactNode; className?: string; dark?: boolean }) {
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

/* Example shops the stage-3 mockups rotate through: different kinds of business, each with
   its own name, address and colours. They are examples, not customers. */
type Example = {
  key: string
  kind: string
  name: string
  slug: string
  palette: Palette
  hero: { title: string; text: string; cta: string; img: string; pos?: string }
  products: { name: string; price: string; img?: string; meta?: string }[]
  phone: { img: string; pos?: string; picks: string[]; cta: string }
  studio: { label: string; rows: { name: string; value: string; s: Status; tag?: string }[] }
  order: { no: number; item: string; price: string }
}

const rose: Palette = { key: "rose", label: "Ρόδι", page: "#FBF4F2", ink: "#4A2430", accent: "#A8475A", soft: "#F2DDE0" }

const examples: Example[] = [
  {
    key: "mano",
    kind: "Χειροποίητα",
    name: "Mano Χειροποίητα",
    slug: "mano",
    palette: palettes[0],
    hero: { title: "Νέα", text: "Φυσική ομορφιά για καθημερινές στιγμές", cta: "Ανακάλυψε", img: "/home/p-desk-plant.webp", pos: "object-[45%_center]" },
    products: [
      { name: "Κεραμικό βάζο", price: "32 €", img: "/home/p-vase.webp" },
      { name: "Παιώνιες σε βάζο", price: "24 €", img: "/home/p-peony.webp" },
      { name: "Αρωματικό κερί", price: "18 €", img: "/home/p-candle.webp" },
    ],
    phone: { img: "/home/p-aloe.webp", picks: ["/home/p-tulips.webp", "/home/p-succulents.webp"], cta: "Στο καλάθι" },
    studio: {
      label: "Προϊόντα",
      rows: [
        { name: "Κεραμικό βάζο", value: "12", s: "in" },
        { name: "Αρωματικό κερί", value: "4", s: "low" },
        { name: "Σετ δώρου", value: "0", s: "out" },
      ],
    },
    order: { no: 1024, item: "Αρωματικό κερί", price: "18,00 €" },
  },
  {
    key: "plants",
    kind: "Φυτά & ανθοπωλείο",
    name: "Πράσινη Γωνιά",
    slug: "prasini-gonia",
    palette: palettes[1],
    hero: { title: "Φυτά για κάθε γωνιά", text: "Φροντισμένα φυτά, έτοιμα για το σπίτι σου", cta: "Δες τα φυτά", img: "/home/t-home.webp", pos: "object-[center_70%]" },
    products: [
      { name: "Κάκτος σε πήλινη γλάστρα", price: "14 €", img: "/home/p-cactus.webp" },
      { name: "Παχύφυτα σε γλάστρα", price: "22 €", img: "/home/p-succulents.webp" },
      { name: "Τουλίπες εποχής", price: "16 €", img: "/home/p-tulips.webp" },
    ],
    phone: { img: "/home/p-succulents.webp", picks: ["/home/p-aloe.webp", "/home/p-cactus.webp"], cta: "Στο καλάθι" },
    studio: {
      label: "Προϊόντα",
      rows: [
        { name: "Κάκτος σε πήλινη γλάστρα", value: "18", s: "in" },
        { name: "Παχύφυτα σε γλάστρα", value: "3", s: "low" },
        { name: "Τουλίπες εποχής", value: "0", s: "out" },
      ],
    },
    order: { no: 1025, item: "Παχύφυτα σε γλάστρα", price: "22,00 €" },
  },
  {
    key: "beauty",
    kind: "Ομορφιά",
    name: "Ρόδι Natural Care",
    slug: "rodi-natural",
    palette: rose,
    hero: { title: "Φροντίδα από τη φύση", text: "Έλαια και κεριά με ελληνικά βότανα", cta: "Ανακάλυψε", img: "/home/p-oil.webp", pos: "object-[center_40%]" },
    products: [
      { name: "Ορός προσώπου", price: "24 €", img: "/home/p-bottles.webp" },
      { name: "Κερί σόγιας", price: "16 €", img: "/home/p-candle.webp" },
      { name: "Κεραμικός διαχυτής", price: "28 €", img: "/home/p-vase.webp" },
    ],
    phone: { img: "/home/t-fashion.webp", pos: "object-[center_20%]", picks: ["/home/p-bottles.webp", "/home/p-candle.webp"], cta: "Στο καλάθι" },
    studio: {
      label: "Προϊόντα",
      rows: [
        { name: "Ορός προσώπου", value: "9", s: "in" },
        { name: "Κερί σόγιας", value: "2", s: "low" },
        { name: "Κεραμικός διαχυτής", value: "0", s: "out" },
      ],
    },
    order: { no: 1026, item: "Ορός προσώπου", price: "24,00 €" },
  },
  {
    key: "services",
    kind: "Υπηρεσίες",
    name: "Studio Κίνηση",
    slug: "studio-kinisi",
    palette: palettes[2],
    hero: { title: "Yoga & pilates", text: "Μικρά τμήματα, στον ρυθμό σου", cta: "Δες το πρόγραμμα", img: "/home/t-services.webp", pos: "object-[center_35%]" },
    products: [
      { name: "Yoga αρχαρίων", price: "12 €", meta: "60′" },
      { name: "Pilates mat", price: "14 €", meta: "50′" },
      { name: "Πακέτο 8 μαθημάτων", price: "80 €", meta: "×8" },
    ],
    phone: { img: "/home/t-services.webp", pos: "object-[center_35%]", picks: ["/home/t-home.webp", "/home/t-portfolio.webp"], cta: "Επικοινωνία" },
    studio: {
      label: "Υπηρεσίες",
      rows: [
        { name: "Yoga αρχαρίων", value: "12 €", s: "in", tag: "Ενεργή" },
        { name: "Pilates mat", value: "14 €", s: "in", tag: "Ενεργή" },
        { name: "Πακέτο 8 μαθημάτων", value: "80 €", s: "in", tag: "Ενεργή" },
      ],
    },
    order: { no: 1027, item: "Πακέτο 8 μαθημάτων", price: "80,00 €" },
  },
]

function Photo({ src, className = "", alt = "" }: { src: string; className?: string; alt?: string }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={`block h-full w-full object-cover ${className}`} />
}

/* All examples share one grid cell and crossfade, so the box keeps the tallest one's size:
   no layout shift while rotating. Only the active layer is exposed to assistive tech. */
function Stack({ items, active, render, className = "" }: { items: Example[]; active: number; render: (ex: Example) => React.ReactNode; className?: string }) {
  return (
    <div className={`grid ${className}`}>
      {items.map((ex, i) => (
        <div
          key={ex.key}
          aria-hidden={i === active ? undefined : true}
          className={`col-start-1 row-start-1 min-w-0 transition-opacity duration-700 ease-out motion-reduce:transition-none ${i === active ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          {render(ex)}
        </div>
      ))}
    </div>
  )
}

type ShopProps = { lang: Lang; shops: Example[]; active: number; className?: string }

function ShopBrowser({ lang, shops, active, controls, className = "" }: ShopProps & { controls?: React.ReactNode }) {
  const tr = translator(lang)
  return (
    <Browser url={<Stack items={shops} active={active} render={(ex) => <span className="block truncate">vitrinaki.gr/{ex.slug}</span>} />} className={className}>
      <div className="relative">
        {/* carousel-style controls on the banner photo's corner (same spot in every example) */}
        {controls ? <div className="absolute right-[18px] top-[46px] z-10">{controls}</div> : null}
        <Stack
          items={shops}
          active={active}
          render={({ palette: p, ...ex }) => (
            <div className="h-full p-2.5 sm:p-3" style={{ background: p.page, color: p.ink }}>
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-extrabold">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded text-[7px] text-white" style={{ background: p.accent }}>{initialsOf(ex.name)}</span>
                  <span className="truncate">{ex.name}</span>
                </span>
                <span className="flex shrink-0 gap-2 text-[7px] font-semibold opacity-60">
                  <span>{tr("Αρχική")}</span><span>{tr(ex.key === "services" ? "Πρόγραμμα" : "Συλλογή")}</span>
                </span>
              </div>
              <div className="mt-2 grid grid-cols-[1fr_1fr] overflow-hidden rounded-lg" style={{ background: p.soft }}>
                <div className="flex flex-col justify-center p-2.5">
                  <p className="font-serif text-[15px] leading-tight sm:text-[17px]">{tr(ex.hero.title)}</p>
                  <p className="mt-0.5 text-[7px] opacity-70 sm:text-[7.5px]">{tr(ex.hero.text)}</p>
                  <span className="mt-1.5 w-fit rounded px-1.5 py-0.5 text-[7px] font-bold text-white" style={{ background: p.accent }}>{tr(ex.hero.cta)}</span>
                </div>
                <div className="aspect-[4/3]"><Photo src={ex.hero.img} className={ex.hero.pos} /></div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {ex.products.map((item) => (
                  <div key={item.name} className="rounded-md bg-white p-1">
                    <div className="aspect-square overflow-hidden rounded">
                      {item.img ? (
                        <Photo src={item.img} />
                      ) : (
                        <span className="grid h-full w-full place-items-center font-serif text-[15px] sm:text-[17px]" style={{ background: p.soft, color: p.accent }}>{item.meta}</span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-[6.5px] font-semibold sm:text-[7px]">{tr(item.name)}</p>
                    <p className="text-[6.5px] font-bold sm:text-[7px]" style={{ color: p.accent }}>{item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        />
      </div>
    </Browser>
  )
}

/* New-order notification; the text fades to the current example. */
function OrderToast({ lang, ex, className = "" }: { lang: Lang; ex: Example; className?: string }) {
  const tr = translator(lang)
  return (
    <div className={`flex items-center gap-2 rounded-xl bg-white/95 px-2.5 py-2 text-left shadow-[0_14px_30px_-12px_rgba(31,54,40,0.55)] ring-1 ring-[#2E4A37]/10 backdrop-blur ${className}`}>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#2E4A37] text-[#F7F2E8]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <span key={ex.key} className="vk-fade min-w-0 leading-tight">
        <span className="block truncate text-[11px] font-bold text-[#1F3628]">{tr("Νέα παραγγελία")} #{ex.order.no}</span>
        <span className="block truncate text-[10px] font-semibold text-[#2E4A37]/70">{tr(ex.order.item)} · {ex.order.price}</span>
      </span>
    </div>
  )
}

function PhoneShop({ lang, shops, active, className = "" }: ShopProps) {
  const tr = translator(lang)
  return (
    <div className={`rounded-[1.4rem] bg-[#0F1C14] p-1.5 shadow-[0_30px_60px_-20px_rgba(15,28,20,0.7)] ring-1 ring-black/10 ${className}`}>
      <div className="overflow-hidden rounded-[1.1rem]">
        <Stack
          items={shops}
          active={active}
          render={({ palette: p, ...ex }) => (
            <div className="h-full" style={{ background: p.page, color: p.ink }}>
              <div className="mx-auto mt-1 h-1.5 w-10 rounded-full bg-[#0F1C14]" />
              <div className="p-2">
                <p className="truncate text-[8px] font-extrabold">{ex.name}</p>
                <div className="mt-1 rounded bg-white px-1.5 py-0.5 text-[6px] opacity-60">{tr("Αναζήτηση προϊόντων…")}</div>
                <div className="mt-1.5 aspect-[4/3] overflow-hidden rounded-md"><Photo src={ex.phone.img} className={ex.phone.pos} /></div>
                <p className="mt-1 text-[7px] font-semibold">{tr("Προτεινόμενα")}</p>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  {ex.phone.picks.map((src) => (
                    <div key={src} className="aspect-square overflow-hidden rounded bg-white"><Photo src={src} /></div>
                  ))}
                </div>
                <div className="mt-1.5 rounded py-1 text-center text-[6.5px] font-bold text-white" style={{ background: p.accent }}>{tr(ex.phone.cta)}</div>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  )
}

/* "You manage it from here": a small, static glimpse of the Studio (the full,
   interactive table sits right under the hero), showing the current example's items. */
function StudioMini({ lang, ex, className = "" }: { lang: Lang; ex: Example; className?: string }) {
  const tr = translator(lang)
  return (
    <div className={`overflow-hidden rounded-xl bg-white shadow-[0_24px_50px_-24px_rgba(31,54,40,0.45),0_2px_6px_rgba(31,54,40,0.06)] ring-1 ring-[#2E4A37]/10 ${className}`}>
      <div className="flex items-center justify-between bg-[#2E4A37] px-2.5 py-1.5 text-[#F7F2E8]">
        <span className="text-[10px] font-extrabold tracking-tight">vitrinaki<span className="text-[#E8A493]">.</span> <span className="font-semibold uppercase tracking-[0.18em] text-[#F7F2E8]/60">Studio</span></span>
        <span key={ex.key} className="vk-fade text-[8.5px] font-semibold text-[#F7F2E8]/75">{tr(ex.studio.label)}</span>
      </div>
      <ul key={ex.key} className="vk-fade px-2.5 py-1.5 text-[9.5px] text-[#1F3628]">
        {ex.studio.rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-2 border-t border-[#2E4A37]/[0.07] py-1 first:border-t-0">
            <span className="truncate font-medium">{tr(r.name)}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              <span className="tabular-nums text-[#2E4A37]/60">{r.value}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${statusMeta[r.s].cls}`}>{tr(r.tag ?? statusMeta[r.s].label)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const rotationCss = `.vk-fade{animation:vkFade .6s ease both}@keyframes vkFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
.vk-scene[data-on] .vk-pop{animation:vkPop .6s cubic-bezier(.2,1.4,.4,1) .7s both}@keyframes vkPop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.vk-fade,.vk-scene[data-on] .vk-pop{animation:none}}`

/* A small white card floating on a scene photo (example shop, not a customer). */
function SceneCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`vk-pop absolute rounded-2xl bg-white/95 p-2.5 text-[#1F3628] shadow-[0_18px_40px_-18px_rgba(15,28,20,0.6)] ring-1 ring-black/5 sm:p-3 ${className}`}>{children}</div>
}

function ScenePhoto({ src, srcSet, sizes, className = "", eager = false }: { src: string; srcSet?: string; sizes?: string; className?: string; eager?: boolean }) {
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt=""
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      className={`vk-zoom absolute inset-0 h-full w-full object-cover ${className}`}
    />
  )
}

const ONLINE = 3

export function HeroDemo({ lang, intro }: { lang: Lang; intro: React.ReactNode }) {
  const tr = translator(lang)
  const [name, setName] = useState("")
  const [paletteKey, setPaletteKey] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [scene, setScene] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(true)
  const heroRef = useRef<HTMLDivElement>(null)

  // Typing a name or picking colours turns the current example into "your" shop, shows it
  // in the online-selling scene and holds it still; clearing them lets the scenes rotate again.
  const custom = name.trim() !== "" || paletteKey !== null
  const chosen = palettes.find((x) => x.key === paletteKey)
  const shops = examples.map((ex, i) =>
    custom && i === index
      ? { ...ex, name: name.trim() || tr(ex.name), slug: slugify(name) || ex.slug, palette: chosen ?? ex.palette }
      : { ...ex, name: tr(ex.name) },
  )
  const current = shops[index]
  const rotating = playing && !hovered && !focused && !custom && visible

  // no auto-rotation for people who ask for reduced motion (they can still press play)
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (query.matches) setPlaying(false)
    const onChange = (e: MediaQueryListEvent) => e.matches && setPlaying(false)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  // stop rotating while the tab is in the background or the hero is scrolled away
  useEffect(() => {
    let onScreen = true
    const update = () => setVisible(onScreen && document.visibilityState === "visible")
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      update()
    })
    if (observer && heroRef.current) observer.observe(heroRef.current)
    document.addEventListener("visibilitychange", update)
    return () => {
      observer?.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])

  useEffect(() => {
    if (custom) setScene(ONLINE)
  }, [custom])

  // each pass through the online-selling scene shows the next example shop
  useEffect(() => {
    if (!rotating) return
    const timer = window.setTimeout(() => {
      if (scene === ONLINE) setIndex((i) => (i + 1) % examples.length)
      setScene((s) => (s + 1) % 4)
    }, SCENE_MS)
    return () => window.clearTimeout(timer)
  }, [rotating, scene])

  // pause while the visitor points at or tabs into the showcase
  const hold = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
    },
  }
  const shop = { lang, shops, active: index }

  const scenes: Scene[] = [
    {
      key: "local",
      label: "Τοπικά προϊόντα",
      text: "Λάδι, μέλι, τυριά και κεραμικά, με τη συσκευασία που τους αξίζει",
      content: (
        <>
          <ScenePhoto src="/home/scene-local.webp" eager className="object-[30%_center]" />
          <SceneCard className="bottom-4 right-4 w-[46%] max-w-[230px] sm:bottom-6 sm:right-6">
            <p className="text-[11px] font-bold tracking-[0.04em] text-[#C0503C]">{tr("Γεύσεις")}</p>
            <p className="mt-1 text-[13px] font-bold leading-tight sm:text-[15px]">{tr("Ελαιόλαδο 500ml")}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold tabular-nums">12,00 €</span>
              <span className="rounded-md bg-[#2E4A37] px-2 py-1 text-[10px] font-semibold text-white sm:text-[11px]">{tr("Στο καλάθι")}</span>
            </div>
          </SceneCard>
        </>
      ),
    },
    {
      key: "boutique",
      label: "Μπουτίκ & lifestyle",
      text: "Μόδα, αξεσουάρ και αντικείμενα με το δικό σου ύφος",
      content: (
        <>
          <ScenePhoto
            src="/home/scene-boutique-1400.webp"
            srcSet="/home/scene-boutique-760.webp 760w, /home/scene-boutique-1400.webp 1400w"
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-[60%_center]"
          />
          <SceneCard className="bottom-4 left-4 w-[52%] max-w-[260px] sm:bottom-6 sm:left-6">
            <div className="flex items-center gap-2.5">
              <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg sm:h-14 sm:w-11"><Photo src="/home/t-fashion.webp" className="object-[center_25%]" /></span>
              <span className="min-w-0">
                <span className="block font-serif text-[17px] leading-none sm:text-[19px]">Lumière</span>
                <span className="mt-1 block truncate text-[11px] text-[#2E4A37]/70">{tr("Μόδα με χαρακτήρα")}</span>
              </span>
            </div>
            <p className="mt-2 truncate rounded-md bg-[#F4F1EA] px-2 py-1 text-[10.5px] text-[#2E4A37]/70">vitrinaki.gr/lumiere</p>
          </SceneCard>
        </>
      ),
    },
    {
      key: "handmade",
      label: "Χειροποίητα & ομορφιά",
      text: "Κοσμήματα, κεριά και φυσικά καλλυντικά, σε προσεγμένες φωτογραφίες",
      content: (
        <div className="absolute inset-0 grid grid-cols-[1.15fr_1fr] gap-2 bg-[#F3DDD3] p-2">
          <div className="relative overflow-hidden rounded-[1.25rem]"><ScenePhoto src="/home/p-oil.webp" className="object-[center_40%]" /></div>
          <div className="grid grid-rows-[1.2fr_1fr] gap-2">
            <div className="relative overflow-hidden rounded-[1.25rem]"><ScenePhoto src="/home/p-peony.webp" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative overflow-hidden rounded-[1.25rem]"><ScenePhoto src="/home/p-candle.webp" /></div>
              <div className="relative overflow-hidden rounded-[1.25rem]"><ScenePhoto src="/home/p-bottles.webp" /></div>
            </div>
          </div>
          <SceneCard className="bottom-5 left-5 w-[44%] max-w-[220px] sm:bottom-7 sm:left-7">
            <p className="text-[11px] font-bold tracking-[0.04em] text-[#A8475A]">{tr("Ρόδι Natural Care")}</p>
            <p className="mt-1 text-[13px] font-bold leading-tight sm:text-[15px]">{tr("Ορός προσώπου")}</p>
            <p className="mt-1 text-[13px] font-bold tabular-nums text-[#A8475A]">24,00 €</p>
          </SceneCard>
        </div>
      ),
    },
    {
      key: "online",
      label: "Πούλα online",
      text: "Το κατάστημά σου, στο κινητό των πελατών, και οι παραγγελίες στο Studio",
      content: (
        <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_80%_70%_at_30%_20%,#F7F2E8,#EADFCB)]">
          <div className="absolute left-[5%] top-[7%] w-[70%]">
            <ShopBrowser {...shop} />
          </div>
          <div className="absolute bottom-[6%] right-[5%] w-[25%]">
            <PhoneShop {...shop} />
          </div>
          <div className="vk-pop absolute right-[4%] top-[4%] w-[56%] sm:w-[38%]">
            <OrderToast lang={lang} ex={current} />
          </div>
          <div className="vk-pop absolute bottom-[6%] left-[5%] hidden w-[46%] sm:block">
            <StudioMini lang={lang} ex={current} />
          </div>
        </div>
      ),
    },
  ]

  return (
    <>
      <style>{showcaseCss + rotationCss}</style>
      <div ref={heroRef} className="relative isolate overflow-hidden bg-[#F5EEE1] text-[#1F3628]">
        {/* watercolour washes */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_40%_45%_at_70%_30%,rgba(46,74,55,0.10),transparent_70%),radial-gradient(ellipse_30%_40%_at_92%_8%,rgba(38,94,142,0.08),transparent_70%),radial-gradient(ellipse_45%_40%_at_10%_0%,rgba(192,80,60,0.06),transparent_70%)]" />
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-5 pb-10 pt-7 sm:px-8 sm:pb-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 lg:px-12 lg:pb-14 lg:pt-12 xl:gap-16">
          <div className="relative z-10">{intro}</div>
          <HeroShowcase
            lang={lang}
            scenes={scenes}
            active={scene}
            onPick={setScene}
            playing={playing}
            rotating={rotating}
            onToggle={() => setPlaying((v) => !v)}
            showToggle={!custom}
            className="mx-auto w-full max-w-[640px] lg:max-w-none"
            {...hold}
          />
        </div>
      </div>
      {/* Try it: name & colour, big enough to invite a click */}
      <div className="relative overflow-hidden border-b border-[#F7F2E8]/10 bg-[#2E4A37] text-[#F7F2E8]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#C0503C]/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-[#265E8E]/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-[1280px] gap-6 px-5 py-10 sm:px-8 md:py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12 lg:px-12">
          <div>
            <p className="flex items-center gap-2 text-[12px] font-bold tracking-[0.16em] text-[#F2B8A8]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#C0503C] motion-reduce:animate-none" />
              {tr("Δοκίμασέ το τώρα")}
            </p>
            <label htmlFor="vk-demo-name" className="mt-3 block text-[1.75rem] font-extrabold leading-tight tracking-[-0.02em] text-[#F7F2E8] sm:text-[2.1rem]">
              {tr("Γράψε το όνομα της επιχείρησής σου και δες τη βιτρίνα σου να ζωντανεύει.")}
            </label>
          </div>
          <div className="rounded-2xl border border-[#F7F2E8]/15 bg-[#F7F2E8]/[0.06] p-4 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.8)] backdrop-blur sm:p-5">
            <input
              id="vk-demo-name"
              type="text"
              value={name}
              maxLength={32}
              autoComplete="off"
              placeholder={tr("Το όνομα της επιχείρησής σου")}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border-2 border-transparent bg-[#F7F2E8] px-5 py-4 text-[18px] font-semibold text-[#1F3628] outline-none transition placeholder:font-normal placeholder:text-[#2E4A37]/60 focus:border-[#C0503C] focus:ring-4 focus:ring-[#C0503C]/25 sm:text-[20px]"
            />
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div role="radiogroup" aria-label={tr("Χρώματα")} className="flex flex-wrap gap-2">
                {palettes.map((x) => {
                  const on = x.key === current.palette.key
                  return (
                    <button
                      key={x.key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setPaletteKey(x.key)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${on ? "border-[#F7F2E8] bg-[#F7F2E8] text-[#1F3628]" : "border-[#F7F2E8]/30 text-[#F7F2E8] hover:border-[#F7F2E8]/70"}`}
                    >
                      <span className="h-4 w-4 rounded-full ring-2 ring-[#F7F2E8]" style={{ background: x.accent }} />
                      {tr(x.label)}
                    </button>
                  )
                })}
              </div>
              <p className="flex min-w-0 items-center gap-2 rounded-full bg-[#1F3628] px-4 py-2 text-[14px] text-[#F7F2E8]/80">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#7FC28F]" />
                <span className="truncate">
                  <span className="sr-only">{tr("Η διεύθυνσή σου:")} </span>vitrinaki.gr/<span className="font-bold text-[#F7F2E8]">{current.slug}</span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The Studio, interactive: on every width, right under the hero */}
      <div className="bg-[#F7F2E8]">
        <div className="mx-auto grid max-w-[1280px] items-center gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-12 lg:px-12 lg:py-14">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#C0503C]">{tr("Δοκίμασε τη διαχείριση αποθέματος")}</p>
            <h2 className="mt-2 text-[1.6rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] sm:text-[1.9rem]">{tr("Η διαχείριση, απλή σαν λίστα.")}</h2>
            <p className="mt-3 max-w-md text-[15px] leading-7 text-[#2E4A37]/75">{tr("Πάτησε + και − για να αλλάξεις το απόθεμα. Το ίδιο κάνεις από το Studio, για κάθε προϊόν σου.")}</p>
          </div>
          <StudioTable lang={lang} className="lg:[zoom:1.15]" />
        </div>
      </div>
    </>
  )
}
