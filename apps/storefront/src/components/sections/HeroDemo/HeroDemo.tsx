"use client"

import type React from "react"
import { useState } from "react"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"

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

function Vase({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 40 50" className={className} aria-hidden="true">
      <path d="M20 4c4 6-2 8 3 12" stroke="#2E4A37" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <ellipse cx="17" cy="8" rx="4" ry="1.6" fill="#5C7A55" transform="rotate(-30 17 8)" />
      <ellipse cx="24" cy="11" rx="4" ry="1.6" fill="#7E9A6E" transform="rotate(30 24 11)" />
      <path d="M14 18h12c0 4 6 8 6 16s-5 13-12 13S8 42 8 34s6-12 6-16Z" fill={color} />
      <path d="M14 18h12" stroke="#fff" strokeOpacity=".5" />
    </svg>
  )
}

/* ---------- interactive Studio products table ---------- */

type Row = { name: string; sku: string; stock: number; price: string; tone: string }
const initialRows: Row[] = [
  { name: "Κεραμικό βάζο", sku: "KB-001", stock: 12, price: "32,00 €", tone: "#C0503C" },
  { name: "Αρωματικό κερί", sku: "AK-002", stock: 4, price: "18,00 €", tone: "#265E8E" },
  { name: "Σετ δώρου", sku: "SD-003", stock: 0, price: "45,00 €", tone: "#2E4A37" },
  { name: "Χειροποίητο σαπούνι", sku: "HS-004", stock: 26, price: "9,00 €", tone: "#C0503C" },
  { name: "Ελαιόλαδο 500ml", sku: "EL-005", stock: 7, price: "12,50 €", tone: "#2E4A37" },
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
                        <span className="h-5 w-5 shrink-0 rounded" style={{ background: `${r.tone}26` }} />
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

/* ---------- Hero with live shop composition ---------- */

export function HeroDemo({ lang, intro }: { lang: Lang; intro: React.ReactNode }) {
  const tr = translator(lang)
  const [name, setName] = useState("")
  const [paletteKey, setPaletteKey] = useState(palettes[0].key)
  const p = palettes.find((x) => x.key === paletteKey) || palettes[0]
  const shopName = name.trim() || tr("Mano Χειροποίητα")
  const slug = slugify(name) || "mano"

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-6">
      <div>
        {intro}
        {/* Try it */}
        <div className="mt-7 max-w-md rounded-2xl border border-[#2E4A37]/10 bg-white/80 p-3 shadow-[0_12px_30px_-22px_rgba(31,54,40,0.5)] backdrop-blur">
          <label htmlFor="vk-demo-name" className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2E4A37]/60">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C0503C]" />
            {tr("Δοκίμασέ το")}
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              id="vk-demo-name"
              type="text"
              value={name}
              maxLength={32}
              autoComplete="off"
              placeholder={tr("Το όνομα της επιχείρησής σου")}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-[#2E4A37]/15 bg-white px-3.5 py-2.5 text-[15px] text-[#1F3628] outline-none transition placeholder:text-[#2E4A37]/40 focus:border-[#C0503C] focus:ring-2 focus:ring-[#C0503C]/20"
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
          <p className="mt-2 truncate px-1 text-[12px] text-[#2E4A37]/60">
            vitrinaki.gr/<span className="font-semibold text-[#265E8E]">{slug}</span>
          </p>
        </div>
      </div>

      {/* Composition */}
      <div className="relative" aria-label={tr("Προεπισκόπηση καταστήματος")}>
        {/* annotation */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-2 left-[2%] z-30 hidden w-[210px] lg:block">
          <p className="font-serif -rotate-[5deg] text-[17px] italic leading-snug text-[#C0503C]">{tr("Όμορφα templates που προσαρμόζονται στο δικό σου brand")}</p>
          <svg viewBox="0 0 120 70" className="ml-24 mt-0 h-14 w-24 text-[#C0503C]" fill="none">
            <path d="M8 6C30 10 60 30 70 62" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="m62 54 8 9 4-11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="relative mx-auto aspect-[10/8] w-full max-w-[680px] lg:aspect-[10/8.4]">
          {/* back template: dark local food */}
          <Browser dark url="vitrinaki.gr/taste-local" className="absolute left-0 top-[20%] w-[34%] -rotate-2">
            <div className="bg-[#1F3628] p-3 text-[#F7F2E8]">
              <p className="font-serif text-[15px] leading-none tracking-wide">TASTE<br />LOCAL</p>
              <p className="mt-1.5 text-[7px] text-[#F7F2E8]/60">{tr("Αυθεντικές γεύσεις από τον τόπο μας")}</p>
              <span className="mt-2 inline-block rounded bg-[#C0503C] px-1.5 py-0.5 text-[7px] font-bold">{tr("Αγόρασε τώρα")}</span>
              <div className="mt-2.5 grid grid-cols-3 gap-1">
                {["#C0503C", "#E8C27A", "#7E9A6E"].map((c) => (
                  <span key={c} className="aspect-square rounded-full" style={{ background: c, opacity: 0.8 }} />
                ))}
              </div>
            </div>
          </Browser>

          {/* back template: blue services */}
          <Browser url="vitrinaki.gr/balance" className="absolute bottom-[3%] left-[3%] w-[30%] rotate-1">
            <div className="bg-[#F4F8FB] p-2.5 text-[#173A57]">
              <p className="font-serif text-[13px]">Balance</p>
              <p className="text-[7px] opacity-60">{tr("Ισορροπία σώματος και μυαλού")}</p>
              <div className="mt-1.5 grid grid-cols-4 gap-1">
                {["10:00", "11:30", "13:00", "17:30"].map((t, i) => (
                  <span key={t} className={`rounded py-0.5 text-center text-[6.5px] font-semibold ${i === 1 ? "bg-[#265E8E] text-white" : "bg-[#DBE6F0]"}`}>{t}</span>
                ))}
              </div>
            </div>
          </Browser>

          {/* Studio dashboard */}
          <div className="absolute -right-2 top-[4%] hidden w-[70%] lg:block">
            <StudioTable lang={lang} />
          </div>

          {/* Front live shop */}
          <Browser url={`vitrinaki.gr/${slug}`} className="absolute left-[16%] top-[36%] z-10 w-[48%] lg:top-[40%] lg:w-[44%]">
            <div className="p-3 transition-colors duration-500" style={{ background: p.page, color: p.ink }} aria-live="polite">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-extrabold">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded text-[7px] text-white transition-colors duration-500" style={{ background: p.accent }}>{initialsOf(shopName)}</span>
                  <span className="truncate">{shopName}</span>
                </span>
                <span className="flex shrink-0 gap-2 text-[7px] font-semibold opacity-60">
                  <span>{tr("Αρχική")}</span><span>{tr("Συλλογή")}</span>
                </span>
              </div>
              <div className="mt-2 grid grid-cols-[1fr_0.8fr] gap-2 rounded-lg p-2.5 transition-colors duration-500" style={{ background: p.soft }}>
                <div className="flex flex-col justify-center">
                  <p className="font-serif text-[15px] leading-tight">{tr("Νέα")}</p>
                  <p className="text-[7.5px] opacity-70">{tr("Φυσική ομορφιά για καθημερινές στιγμές")}</p>
                  <span className="mt-1.5 w-fit rounded px-1.5 py-0.5 text-[7px] font-bold text-white transition-colors duration-500" style={{ background: p.accent }}>{tr("Ανακάλυψε")}</span>
                </div>
                <Vase color={p.accent} className="mx-auto h-16" />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {[0.55, 0.35, 0.75].map((o, i) => (
                  <div key={i} className="rounded-md bg-white p-1">
                    <div className="grid aspect-square place-items-center rounded" style={{ background: `${p.accent}${Math.round(o * 40).toString(16).padStart(2, "0")}` }}>
                      <Vase color={p.accent} className="h-7 opacity-80" />
                    </div>
                    <div className="mt-1 h-1 w-3/4 rounded-full opacity-25" style={{ background: p.ink }} />
                  </div>
                ))}
              </div>
            </div>
          </Browser>

          {/* Phone */}
          <div className="absolute bottom-[2%] right-[6%] z-20 w-[25%] rounded-[1.4rem] bg-[#1F3628] p-1.5 shadow-[0_30px_60px_-25px_rgba(31,54,40,0.6)] lg:bottom-[0%] lg:right-auto lg:left-[58%] lg:w-[20%]">
            <div className="overflow-hidden rounded-[1.1rem] transition-colors duration-500" style={{ background: p.page, color: p.ink }}>
              <div className="mx-auto mt-1 h-1.5 w-10 rounded-full bg-[#1F3628]" />
              <div className="p-2">
                <p className="truncate text-[8px] font-extrabold">{shopName}</p>
                <div className="mt-1 rounded bg-white px-1.5 py-0.5 text-[6px] opacity-60">{tr("Αναζήτηση προϊόντων…")}</div>
                <div className="mt-1.5 grid aspect-[4/3] place-items-center rounded-md transition-colors duration-500" style={{ background: p.soft }}>
                  <Vase color={p.accent} className="h-10" />
                </div>
                <p className="mt-1 text-[7px] font-semibold">{tr("Προτεινόμενα")}</p>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  {[0, 1].map((i) => (
                    <div key={i} className="rounded bg-white p-1">
                      <div className="aspect-square rounded-sm transition-colors duration-500" style={{ background: p.accent, opacity: i ? 0.25 : 0.45 }} />
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 rounded py-1 text-center text-[6.5px] font-bold text-white transition-colors duration-500" style={{ background: p.accent }}>{tr("Στο καλάθι")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Studio on small screens */}
        <div className="mt-12 lg:hidden">
          <p className="mb-2 text-[12px] font-semibold text-[#2E4A37]/70">{tr("Δοκίμασε τη διαχείριση αποθέματος:")}</p>
          <StudioTable lang={lang} />
        </div>
      </div>
    </div>
  )
}
