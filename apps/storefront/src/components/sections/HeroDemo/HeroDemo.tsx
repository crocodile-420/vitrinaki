"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"

import { HeroShowcase, SCENE_MS, type Scene, showcaseCss } from "./HeroShowcase"
import { palettes, sites } from "./sites"
import { SitePreview } from "./SitePreview"
import { CustomerScene, PackagingScene, RatingScene, WorldScene } from "./StoryScenes"

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
                className={`-mb-px shrink-0 border-b-2 px-1.5 pb-1.5 font-semibold transition ${tab === t.key ? "border-[#265E8E] text-[#1F3628]" : "border-transparent text-[#2E4A37]/55 hover:text-[#1F3628]"}`}
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
                        <button type="button" aria-label={`${tr("Μείωση αποθέματος")}: ${tr(r.name)}`} onClick={() => change(r.sku, -1)} className="grid h-[18px] w-[18px] place-items-center rounded border border-[#2E4A37]/15 text-[11px] leading-none transition hover:border-[#265E8E] hover:text-[#265E8E]">−</button>
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


/* soft blue / cypress hills along the bottom of the hero */
function Hills({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 150" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M900 150C1010 70 1120 40 1250 36c80-3 140 4 190 12v102z" fill="#2E4A37" fillOpacity=".85" />
      <path d="M0 150V96c120-30 260-44 400-30 150 14 250 60 400 58 150-2 290-50 440-70 80-10 150-10 200-6v102z" fill="#173A57" />
      <path d="M0 110c140-34 280-46 420-32 150 14 250 60 400 58 150-2 290-50 440-70" fill="none" stroke="#D9B26F" strokeOpacity=".5" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const STORY_LENGTH = 5

const fadeCss = `.vk-fade{animation:vkFade .6s ease both}@keyframes vkFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.vk-fade{animation:none}}`

export function HeroDemo({ lang, intro }: { lang: Lang; intro: React.ReactNode }) {
  const tr = translator(lang)
  const [name, setName] = useState("")
  const [paletteKey, setPaletteKey] = useState<string | null>(null)
  const [scene, setScene] = useState(0)
  const [siteIdx, setSiteIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(true)
  const heroRef = useRef<HTMLDivElement>(null)

  // The hero tells a story: the product on its shop page, packaging, a happy customer, a good
  // rating and orders from further away. Each round shows the next example shop. Typing a name
  // or picking colours turns that shop into "your" website and holds it on screen; clearing them
  // lets the story play again.
  const custom = name.trim() !== "" || paletteKey !== null
  const chosen = palettes.find((x) => x.key === paletteKey)
  const shown = sites.map((site, i) =>
    custom && i === siteIdx ? { ...site, name: name.trim() || site.name, slug: slugify(name) || site.slug, palette: chosen ?? site.palette } : site,
  )
  const current = shown[siteIdx]
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
    if (!rotating) return
    const timer = window.setTimeout(() => {
      const next = (scene + 1) % STORY_LENGTH
      if (next === 0) setSiteIdx((i) => (i + 1) % sites.length)
      setScene(next)
    }, SCENE_MS)
    return () => window.clearTimeout(timer)
  }, [rotating, scene])

  // a name or colour only shows on the product page, so jump back to it
  useEffect(() => {
    if (custom) setScene(0)
  }, [custom])

  // pause while the visitor points at or tabs into the showcase
  const hold = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
    },
  }

  const scenes: Scene[] = [
    { key: "product", step: "Προϊόν", label: "Το προϊόν σου στη βιτρίνα σου", text: current.industry, content: <SitePreview site={current} lang={lang} eager className="h-full ring-0" /> },
    { key: "packaging", step: "Συσκευασία", label: "Το τυλίγεις με φροντίδα", text: "έτοιμο για αποστολή", content: <PackagingScene lang={lang} /> },
    { key: "customer", step: "Πελάτης", label: "Ο πελάτης το παραλαμβάνει", text: "και χαίρεται", content: <CustomerScene lang={lang} /> },
    { key: "rating", step: "Αξιολόγηση", label: "Σε αξιολογεί με 5 αστέρια", text: "και φέρνει νέους πελάτες", content: <RatingScene lang={lang} /> },
    { key: "world", step: "Ανάπτυξη", label: "Μεγαλώνεις", text: "με πελάτες στην Ελλάδα και στο εξωτερικό", content: <WorldScene lang={lang} /> },
  ]

  return (
    <>
      <style>{showcaseCss + fadeCss}</style>
      <div ref={heroRef} id="top" className="relative isolate scroll-mt-20 overflow-hidden bg-[#F5EEE1] text-[#1F3628]">
        {/* watercolour washes and the cypress / terracotta hills of the Greek landscape */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_40%_45%_at_70%_30%,rgba(46,74,55,0.10),transparent_70%),radial-gradient(ellipse_30%_40%_at_92%_8%,rgba(38,94,142,0.08),transparent_70%),radial-gradient(ellipse_45%_40%_at_10%_0%,rgba(192,80,60,0.06),transparent_70%)]" />
        <Hills className="absolute bottom-0 left-0 -z-10 h-[70px] w-full sm:h-[110px] lg:h-[150px]" />
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-5 pb-14 pt-8 sm:px-8 sm:pb-20 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-12 lg:px-12 lg:pb-24 lg:pt-14 xl:gap-14">
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
            className="relative mx-auto w-full max-w-[720px] rounded-2xl bg-[#F5EEE1]/80 lg:max-w-none"
            {...hold}
          />
        </div>
      </div>
      {/* Try it: name & colour, big enough to invite a click */}
      <div className="relative overflow-hidden border-b border-[#F7F2E8]/10 bg-[#173A57] text-[#F7F2E8]">
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
              className="w-full rounded-xl border-2 border-transparent bg-[#F7F2E8] px-5 py-4 text-[18px] font-semibold text-[#1F3628] outline-none transition placeholder:font-normal placeholder:text-[#2E4A37]/60 focus:border-[#265E8E] focus:ring-4 focus:ring-[#265E8E]/25 sm:text-[20px]"
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

    </>
  )
}
