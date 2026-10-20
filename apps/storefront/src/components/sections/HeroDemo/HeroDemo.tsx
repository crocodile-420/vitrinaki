"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"

import { Callout, StoryCaption, StoryChip, StoryDrop, StoryRoute, storyCss } from "./HeroJourney"

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

function Browser({ url, children, className = "", dark = false }: { url: React.ReactNode; children: React.ReactNode; className?: string; dark?: boolean }) {
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

/* The toast frame stays mounted (its notification animation keeps looping); only the
   text fades to the current example. */
function OrderToast({ lang, ex, className = "" }: { lang: Lang; ex: Example; className?: string }) {
  const tr = translator(lang)
  return (
    <div className={`vk-toast vk-toast-loop flex items-center gap-2 rounded-xl bg-white/95 px-2.5 py-2 text-left shadow-[0_14px_30px_-12px_rgba(31,54,40,0.55)] ring-1 ring-[#2E4A37]/10 backdrop-blur ${className}`}>
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

/* Which example is showing: clickable dots plus a pause / play control (WCAG 2.2.2).
   `compact` fits it into the shop window's address bar (desktop stage). */
function ExampleSwitcher({ lang, shops, active, onPick, playing, onToggle, showToggle, compact = false, className = "" }: {
  lang: Lang
  shops: Example[]
  active: number
  onPick: (i: number) => void
  playing: boolean
  onToggle: () => void
  showToggle: boolean
  compact?: boolean
  className?: string
}) {
  const tr = translator(lang)
  return (
    <div
      className={`inline-flex shrink-0 items-center text-[#1F3628] ${compact ? "gap-0.5 rounded-full bg-white/85 py-0.5 pl-1 pr-0.5 shadow-[0_4px_10px_-4px_rgba(15,28,20,0.5)] backdrop-blur" : "gap-2 rounded-full bg-[#F7F2E8]/95 py-1 pl-2.5 pr-1 shadow-[0_6px_18px_-8px_rgba(31,54,40,0.45)] ring-1 ring-[#2E4A37]/10 backdrop-blur"} ${className}`}
    >
      {compact ? null : (
        <span className="whitespace-nowrap text-[10.5px] font-semibold">
          <span className="text-[#2E4A37]/60">{tr("Παράδειγμα")}:</span>{" "}
          {/* every label shares one cell so the pill keeps its width */}
          <span className="inline-grid align-bottom">
            {shops.map((ex, i) => (
              <span key={i === active ? `${ex.key}-on` : ex.key} aria-hidden={i === active ? undefined : true} className={`col-start-1 row-start-1 ${i === active ? "vk-fade" : "invisible"}`}>{tr(ex.kind)}</span>
            ))}
          </span>
        </span>
      )}
      <span className="flex items-center">
        {shops.map((ex, i) => (
          <button
            key={ex.key}
            type="button"
            aria-pressed={i === active}
            aria-label={`${tr("Παράδειγμα")}: ${tr(ex.kind)}`}
            title={tr(ex.kind)}
            onClick={() => onPick(i)}
            className={`grid place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2E4A37] ${compact ? "h-4 w-3.5" : "h-6 w-5"}`}
          >
            <span
              className={`block rounded-full transition-all duration-300 motion-reduce:transition-none ${compact ? "h-1" : "h-1.5"} ${i === active ? (compact ? "w-3" : "w-4") : `${compact ? "w-1" : "w-1.5"} bg-[#2E4A37]/25 hover:bg-[#2E4A37]/50`}`}
              style={i === active ? { background: ex.palette.accent } : undefined}
            />
          </button>
        ))}
      </span>
      {showToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={tr(playing ? "Παύση εναλλαγής" : "Συνέχιση εναλλαγής")}
          title={tr(playing ? "Παύση εναλλαγής" : "Συνέχιση εναλλαγής")}
          className={`grid shrink-0 place-items-center rounded-full bg-[#2E4A37] text-[#F7F2E8] transition hover:bg-[#1F3628] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E4A37] ${compact ? "ml-0.5 h-4 w-4" : "h-6 w-6"}`}
        >
          <svg width={compact ? 6 : 9} height={compact ? 6 : 9} viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
            {playing ? <><rect x="1.5" y="1" width="2.5" height="8" rx=".6" /><rect x="6" y="1" width="2.5" height="8" rx=".6" /></> : <path d="M2.5 1.2v7.6L9 5z" />}
          </svg>
        </button>
      ) : null}
    </div>
  )
}

const rotationCss = `.vk-fade{animation:vkFade .6s ease both}@media (prefers-reduced-motion:reduce){.vk-fade{animation:none}}@keyframes vkFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}`
const ROTATE_MS = 4500

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
  const [paletteKey, setPaletteKey] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  // Typing a name or picking colours turns the current example into "your" shop and
  // holds it still; clearing them lets the examples rotate again.
  const custom = name.trim() !== "" || paletteKey !== null
  const chosen = palettes.find((x) => x.key === paletteKey)
  const shops = examples.map((ex, i) =>
    custom && i === index
      ? { ...ex, name: name.trim() || tr(ex.name), slug: slugify(name) || ex.slug, palette: chosen ?? ex.palette }
      : { ...ex, name: tr(ex.name) },
  )
  const current = shops[index]
  const rotating = playing && !hovered && !focused && !custom

  // no auto-rotation for people who ask for reduced motion (they can still press play)
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (query.matches) setPlaying(false)
    const onChange = (e: MediaQueryListEvent) => e.matches && setPlaying(false)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    if (!rotating) return
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % examples.length), ROTATE_MS)
    return () => window.clearTimeout(timer)
  }, [rotating, index])

  // pause while the visitor points at or tabs into the shop mockups
  const hold = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
    },
  }
  const shop = { lang, shops, active: index }
  const switcher = (compact = false) => (
    <ExampleSwitcher
      compact={compact}
      lang={lang}
      shops={shops}
      active={index}
      onPick={setIndex}
      playing={playing}
      onToggle={() => setPlaying((v) => !v)}
      showToggle={!custom}
    />
  )

  return (
    <>
      <style>{storyCss + rotationCss}</style>
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
            {/* Part 3, the seller's e-shop: the shop is the main piece with the phone beside it,
                the Studio a small "you manage it from here" card, the order a notification. */}
            <div className="absolute left-[67.5%] top-[13%] z-30 w-[14.5%]"><StoryChip n={3} title={tr("Το δικό σου e-shop")} text={tr("Εσύ το διαχειρίζεσαι, οι πελάτες παραγγέλνουν")} /></div>
            <div className="absolute left-[67.5%] top-[31%] z-20 w-[21.5%]" {...hold}>
              <ShopBrowser {...shop} controls={switcher(true)} />
              <Callout icon="shop" className="mt-2 whitespace-nowrap">{tr("Οι πελάτες σου: vitrinaki.gr/το-όνομά-σου")}</Callout>
            </div>
            {/* the seller's side: Studio and order notifications */}
            <div className="absolute right-[1.6%] top-[4%] z-20 flex w-[15.5%] flex-col items-end" {...hold}>
              <Callout icon="studio" className="mb-1.5 whitespace-nowrap">{tr("Εσύ: προϊόντα & απόθεμα στο Studio")}</Callout>
              <StudioMini lang={lang} ex={current} className="w-full" />
              <OrderToast lang={lang} ex={current} className="mt-3 w-full" />
              <Callout icon="bell" className="mt-1.5 whitespace-nowrap">{tr("Σε ειδοποιεί για κάθε παραγγελία")}</Callout>
            </div>
            <div className="absolute right-[2.4%] top-[49%] z-30 flex w-[7.8%] flex-col items-end" {...hold}>
              <PhoneShop {...shop} className="w-full" />
              <Callout icon="phone" className="mt-2 whitespace-nowrap">{tr("Έτοιμο για κινητά")}</Callout>
            </div>
            <StoryRoute lang={lang} />
            <div className="absolute left-[23%] top-[74%] z-30"><StoryChip n={1} title={tr("Η επιχείρησή σου")} text={tr("Εδώ, στην Ελλάδα, όπως τη δουλεύεις σήμερα")} /></div>
            <div className="absolute left-[44.5%] top-[71%] z-30"><StoryChip n={2} title={tr("Το vitrinaki.gr σε βγάζει online")} text={tr("Η γραμμή δείχνει τη διαδρομή: πελάτες από παντού σε βρίσκουν και φτάνουν στο κατάστημά σου")} /></div>
            <StoryCaption lang={lang} className="absolute bottom-[3%] left-[56.5%] z-30 w-max -translate-x-1/2" />
          </div>

          {/* Mobile / tablet: the same story, stacked */}
          <div className="relative px-5 pb-10 pt-8 sm:px-8 xl:hidden">
            <div className="mx-auto max-w-[560px] md:max-w-[640px]">
              <div className="relative">
                <img src="/home/story-greece.webp" alt="" width={799} height={544} decoding="async" className="block w-full" />
                <StoryChip n={1} title={tr("Η επιχείρησή σου")} text={tr("Εδώ, στην Ελλάδα, όπως τη δουλεύεις σήμερα")} className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)]" />
              </div>
              <StoryDrop className="-mt-1" />
              <div className="relative">
                <img src="/home/story-globe.webp" alt="" width={730} height={603} decoding="async" className="mx-auto block w-[94%]" />
                <StoryChip n={2} title={tr("Το vitrinaki.gr σε βγάζει online")} text={tr("Πελάτες από παντού σε βρίσκουν και φτάνουν στο κατάστημά σου")} className="absolute bottom-2 left-1/2 w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2" />
              </div>
              <StoryDrop />
              <div className="relative">
                <StoryChip n={3} title={tr("Το δικό σου e-shop")} text={tr("Εσύ το διαχειρίζεσαι, οι πελάτες παραγγέλνουν")} className="mb-3" />
                <div {...hold}>
                  <div className="relative pb-[6%] pr-[22%]" aria-label={tr("Προεπισκόπηση καταστήματος")}>
                    <ShopBrowser {...shop} className="w-full" />
                    <div className="absolute bottom-0 right-0 w-[30%]">
                      <PhoneShop {...shop} />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-center">{switcher()}</div>
                </div>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  <li><Callout icon="shop">{tr("Οι πελάτες σου: vitrinaki.gr/το-όνομά-σου")}</Callout></li>
                  <li><Callout icon="phone">{tr("Έτοιμο για κινητά")}</Callout></li>
                  <li><Callout icon="studio">{tr("Εσύ: προϊόντα & απόθεμα στο Studio")}</Callout></li>
                  <li><Callout icon="bell">{tr("Σε ειδοποιεί για κάθε παραγγελία")}</Callout></li>
                </ul>
                <OrderToast lang={lang} ex={current} className="mt-2 w-[220px]" />
              </div>
              <StoryCaption lang={lang} tone="dark" className="mt-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Try it: compact name & colour strip */}
      <div className="border-b border-[#F7F2E8]/10 bg-[#2E4A37] text-[#F7F2E8]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-5 py-4 sm:px-8 md:flex-row md:items-center md:gap-5 lg:px-12">
          <label htmlFor="vk-demo-name" className="flex shrink-0 items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#F7F2E8]">
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
              className="min-w-0 flex-1 rounded-lg border border-[#F7F2E8]/30 bg-[#F7F2E8] px-3 py-2 text-[14px] text-[#1F3628] outline-none transition placeholder:text-[#2E4A37]/70 focus:border-[#F7F2E8] focus:ring-2 focus:ring-[#F7F2E8]/40"
            />
            <div role="radiogroup" aria-label={tr("Χρώματα")} className="flex shrink-0 gap-1.5">
              {palettes.map((x) => (
                <button
                  key={x.key}
                  type="button"
                  role="radio"
                  aria-checked={x.key === current.palette.key}
                  aria-label={tr(x.label)}
                  title={tr(x.label)}
                  onClick={() => setPaletteKey(x.key)}
                  className={`h-7 w-7 rounded-full border-2 border-[#F7F2E8]/70 ring-offset-2 ring-offset-[#2E4A37] transition hover:scale-110 ${x.key === current.palette.key ? "ring-2 ring-[#F7F2E8]" : ""}`}
                  style={{ background: x.accent }}
                />
              ))}
            </div>
          </div>
          <p className="truncate text-[13px] text-[#F7F2E8]/80">
            {tr("Η διεύθυνσή σου:")} vitrinaki.gr/<span className="font-semibold text-[#F7F2E8] underline decoration-[#C0503C] decoration-2 underline-offset-4">{current.slug}</span>
          </p>
        </div>
      </div>

      {/* The Studio, interactive: on every width, right under the story */}
      <div className="bg-[#F7F2E8] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[720px]">
          <p className="mb-2 text-[12px] font-semibold text-[#2E4A37]/70">{tr("Δοκίμασε τη διαχείριση αποθέματος:")}</p>
          <StudioTable lang={lang} />
        </div>
      </div>
    </>
  )
}
