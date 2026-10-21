"use client"

import type React from "react"
import { useEffect, useId, useRef, useState } from "react"

import { Browser, slugify } from "@/components/sections/HeroDemo/HeroDemo"
import { paletteColors, templateLabels } from "@/lib/data/vitrinaki-storefronts"
import { useTranslator } from "@/lib/i18n/client"

/*
 * "Custom": the visitor builds a sample shop live. Every option here is one the real
 * website editor has (name, headline, template, palette, logo, cover, sections, contact,
 * own domain) plus a -10% offer badge. Purely client-side: nothing is saved or uploaded,
 * picked photos stay in the browser. The preview is decorative (aria-hidden); a polite
 * live region describes the current choice instead.
 */

type PaletteKey = keyof typeof paletteColors
type TemplateKey = keyof typeof templateLabels
type SectionKey = "text" | "feature" | "image"
type TabKey = "basics" | "style" | "images" | "sections"
type FontKey = "classic" | "modern" | "minimal"
type CornerKey = "soft" | "round" | "sharp"
type ButtonKey = "solid" | "outline"
type ThemeKey = "light" | "dark"

const paletteOptions: { key: PaletteKey; label: string }[] = [
  { key: "forest", label: "Κυπαρισσί" },
  { key: "terracotta", label: "Κεραμιδί" },
  { key: "ocean", label: "Μπλε" },
  { key: "plum", label: "Δαμασκηνί" },
]
const templateOptions: TemplateKey[] = ["atelier", "local", "services"]
// The services text avoids appointments: online bookings are not built yet.
const templateText: Record<TemplateKey, string> = {
  atelier: templateLabels.atelier.text,
  local: templateLabels.local.text,
  services: "Για επαγγελματίες και υπηρεσίες, με τιμοκατάλογο και επικοινωνία.",
}
const tabs: { key: TabKey; label: string }[] = [
  { key: "basics", label: "Βασικά" },
  { key: "style", label: "Στυλ" },
  { key: "images", label: "Εικόνες" },
  { key: "sections", label: "Ενότητες" },
]
// Style: how headings, corners, buttons and the page background look in the preview.
const fonts: Record<FontKey, { label: string; head: string; body: string }> = {
  classic: { label: "Κλασική", head: "font-serif font-normal", body: "" },
  modern: { label: "Μοντέρνα", head: "font-sans font-extrabold tracking-[-0.02em]", body: "" },
  minimal: { label: "Λιτή", head: "font-sans font-light tracking-[0.01em]", body: "font-light" },
}
const corners: Record<CornerKey, { label: string; vars: Record<string, string>; sample: string }> = {
  soft: { label: "Απαλές", vars: { "--r1": "12px", "--r2": "8px", "--r3": "6px", "--rb": "6px" }, sample: "6px" },
  round: { label: "Στρογγυλές", vars: { "--r1": "22px", "--r2": "14px", "--r3": "10px", "--rb": "999px" }, sample: "14px" },
  sharp: { label: "Ίσιες", vars: { "--r1": "0px", "--r2": "0px", "--r3": "0px", "--rb": "0px" }, sample: "0px" },
}
const buttonOptions: { key: ButtonKey; label: string }[] = [
  { key: "solid", label: "Γεμάτα" },
  { key: "outline", label: "Περίγραμμα" },
]
const themeOptions: { key: ThemeKey; label: string }[] = [
  { key: "light", label: "Ανοιχτό" },
  { key: "dark", label: "Σκούρο" },
]
const sectionOptions: { key: SectionKey; label: string; text: string }[] = [
  { key: "text", label: "Κείμενο", text: "Λίγα λόγια για σένα." },
  { key: "feature", label: "Κάρτες", text: "Τρία σημεία που σε ξεχωρίζουν." },
  { key: "image", label: "Εικόνα και κείμενο", text: "Μια φωτογραφία με την ιστορία της." },
]
// "template" keeps the sample's own photo.
const coverOptions = [
  { key: "template", img: "", label: "Βασική" },
  { key: "coast", img: "/home/site-coast.webp", label: "Θάλασσα" },
  { key: "village", img: "/home/site-village.webp", label: "Χωριό" },
  { key: "olives", img: "/home/site-olives.webp", label: "Ελιές" },
] as const
type CoverKey = (typeof coverOptions)[number]["key"] | "own"

type Item = { name: string; cents: number; img?: string; meta?: string }
type Sample = {
  name: string
  slug: string
  eyebrow: string
  title: string
  text: string
  cta: string
  img: string
  pos: string
  items: Item[]
  story: string
  features: string[]
  imageText: string
  sectionImg: string
}
const samples: Record<TemplateKey, Sample> = {
  atelier: {
    name: "Mano Χειροποίητα",
    slug: "mano",
    eyebrow: "Νέα συλλογή",
    title: "Φτιαγμένα στο χέρι",
    text: "Φυσική ομορφιά για καθημερινές στιγμές",
    cta: "Ανακάλυψε",
    img: "/home/p-desk-plant.webp",
    pos: "45% center",
    items: [
      { name: "Κεραμικό βάζο", cents: 3200, img: "/home/p-vase.webp" },
      { name: "Αρωματικό κερί", cents: 1800, img: "/home/p-candle.webp" },
      { name: "Παιώνιες σε βάζο", cents: 2400, img: "/home/p-peony.webp" },
    ],
    story: "Ξεκινήσαμε σε ένα μικρό εργαστήριο. Κάθε κομμάτι φτιάχνεται ένα-ένα, με φυσικά υλικά.",
    features: ["Χειροποίητα", "Συσκευασία δώρου", "Αποστολή σε όλη την Ελλάδα"],
    imageText: "Από τον τροχό ως το ράφι σου.",
    sectionImg: "/home/p-bottles.webp",
  },
  local: {
    name: "Πράσινη Γωνιά",
    slug: "prasini-gonia",
    eyebrow: "Στη γειτονιά σου",
    title: "Φυτά για κάθε γωνιά",
    text: "Φροντισμένα φυτά, έτοιμα για το σπίτι σου",
    cta: "Βρες μας",
    img: "/home/t-home.webp",
    pos: "center 70%",
    items: [
      { name: "Κάκτος σε πήλινη γλάστρα", cents: 1400, img: "/home/p-cactus.webp" },
      { name: "Παχύφυτα σε γλάστρα", cents: 2200, img: "/home/p-succulents.webp" },
      { name: "Τουλίπες εποχής", cents: 1600, img: "/home/p-tulips.webp" },
    ],
    story: "Ένα μικρό φυτώριο στη γειτονιά, με φυτά που φροντίζουμε μόνοι μας.",
    features: ["Φρέσκα κάθε εβδομάδα", "Παραλαβή από το κατάστημα", "Συμβουλές φροντίδας"],
    imageText: "Έλα να μας γνωρίσεις από κοντά.",
    sectionImg: "/home/p-aloe.webp",
  },
  services: {
    name: "Studio Κίνηση",
    slug: "studio-kinisi",
    eyebrow: "Υπηρεσίες",
    title: "Yoga & pilates",
    text: "Μικρά τμήματα, στον ρυθμό σου",
    cta: "Επικοινωνία",
    img: "/home/t-services.webp",
    pos: "center 35%",
    items: [
      { name: "Yoga αρχαρίων", cents: 1200, meta: "60′" },
      { name: "Pilates mat", cents: 1400, meta: "50′" },
      { name: "Πακέτο 8 μαθημάτων", cents: 8000, meta: "×8" },
    ],
    story: "Ένας φωτεινός χώρος για να κινηθείς χωρίς πίεση, όποια κι αν είναι η αφετηρία σου.",
    features: ["Μικρά τμήματα", "Πρωινά και απογευματινά", "Πρώτο μάθημα γνωριμίας"],
    imageText: "Ο χώρος μας, στο κέντρο της πόλης.",
    sectionImg: "/home/site-coast.webp",
  },
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024

// Fixed format (not Intl) so server and client render the same characters.
const euro = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} €`
const discounted = (cents: number) => Math.round(cents * 0.9)
const initialsOf = (value: string) =>
  value.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "V"

const swap = "vk-swap"
const ease = "transition-colors duration-500 motion-reduce:transition-none"

function Price({ cents, sale, accent }: { cents: number; sale: boolean; accent: string }) {
  return sale ? (
    <span className="flex flex-wrap items-baseline gap-x-1">
      <span className="font-bold" style={{ color: accent }}>{euro(discounted(cents))}</span>
      <span className="text-[0.85em] line-through opacity-50">{euro(cents)}</span>
    </span>
  ) : (
    <span className="font-bold" style={{ color: accent }}>{euro(cents)}</span>
  )
}

function SaleBadge({ show, accent, className = "" }: { show: boolean; accent: string; className?: string }) {
  if (!show) return null
  return <span className={`${swap} rounded px-1.5 py-0.5 text-[9px] font-bold shadow-sm ${className}`} style={{ background: accent, color: "var(--on, #fff)" }}>-10%</span>
}

// A photo the visitor picks stays in the browser as an object URL, revoked when replaced.
function usePhoto() {
  const [url, setUrl] = useState("")
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  return [url, setUrl] as const
}

const initial = {
  name: "",
  tagline: "",
  palette: "terracotta" as PaletteKey,
  template: "atelier" as TemplateKey,
  font: "classic" as FontKey,
  corners: "soft" as CornerKey,
  buttons: "solid" as ButtonKey,
  theme: "light" as ThemeKey,
  cover: "template" as CoverKey,
  sections: [] as SectionKey[],
  phone: "",
  email: "",
  ownDomain: false,
  domain: "",
  sale: false,
}

export function TryShop({ cta }: { cta: React.ReactNode }) {
  const { tr } = useTranslator()
  const uid = useId()
  const [tab, setTab] = useState<TabKey>("basics")
  const [cfg, setCfg] = useState(initial)
  const [logo, setLogo] = usePhoto()
  const [ownCover, setOwnCover] = usePhoto()
  const [photoError, setPhotoError] = useState("")
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const set = <K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) => setCfg((c) => ({ ...c, [key]: value }))

  const c = paletteColors[cfg.palette]
  const s = samples[cfg.template]
  // A dark page swaps ink and paper; the accent becomes the light tint so it stays readable.
  const t = cfg.theme === "dark"
    ? { page: c.ink, ink: c.page, accent: c.soft, onAccent: c.ink, soft: "rgba(255,255,255,0.09)", card: "rgba(255,255,255,0.07)" }
    : { page: c.page, ink: c.ink, accent: c.accent, onAccent: "#fff", soft: c.soft, card: "#fff" }
  const head = fonts[cfg.font].head
  const btn: React.CSSProperties = cfg.buttons === "outline"
    ? { background: "transparent", color: t.accent, boxShadow: `inset 0 0 0 1.5px ${t.accent}` }
    : { background: t.accent, color: t.onAccent }
  const shopName = cfg.name.trim() || tr(s.name)
  const slug = slugify(cfg.name) || s.slug
  const domain = cfg.domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || `${slug}.gr`
  const address = cfg.ownDomain ? domain : `vitrinaki.gr/${slug}`
  const title = cfg.tagline.trim() || tr(s.title)
  const coverImg = cfg.cover === "own" ? ownCover : coverOptions.find((o) => o.key === cfg.cover)?.img || s.img
  const coverPos = cfg.cover === "template" ? s.pos : "center"
  const paletteLabel = paletteOptions.find((p) => p.key === cfg.palette)?.label || ""
  const summary = [
    shopName,
    tr(paletteLabel),
    tr(templateLabels[cfg.template].name),
    tr(fonts[cfg.font].label),
    tr(corners[cfg.corners].label),
    cfg.theme === "dark" ? tr("Σκούρο") : "",
    ...cfg.sections.map((key) => tr(sectionOptions.find((o) => o.key === key)?.label || "")),
    cfg.ownDomain ? domain : "",
    cfg.sale ? "-10%" : "",
  ].filter(Boolean).join(" · ")

  const pickPhoto = (event: React.ChangeEvent<HTMLInputElement>, apply: (url: string) => void) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) return setPhotoError(tr("Διάλεξε μια εικόνα (JPG, PNG ή WebP)."))
    if (file.size > MAX_PHOTO_BYTES) return setPhotoError(tr("Η εικόνα είναι πολύ μεγάλη. Διάλεξε μία έως 8 MB."))
    setPhotoError("")
    apply(URL.createObjectURL(file))
  }
  const toggleSection = (key: SectionKey) =>
    set("sections", cfg.sections.includes(key) ? cfg.sections.filter((k) => k !== key) : sectionOptions.map((o) => o.key).filter((k) => k === key || cfg.sections.includes(k)))
  const reset = () => {
    setCfg(initial)
    setLogo("")
    setOwnCover("")
    setPhotoError("")
  }
  const onTabKey = (event: React.KeyboardEvent, i: number) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    const to = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (i + delta + tabs.length) % tabs.length
    if (!delta && event.key !== "Home" && event.key !== "End") return
    event.preventDefault()
    setTab(tabs[to].key)
    tabRefs.current[to]?.focus()
  }

  const fieldset = "rounded-xl border border-[#2E4A37]/10 bg-white p-3 sm:p-3.5"
  const legend = "px-1 text-[13.5px] font-bold text-[#1F3628]"
  const input = "mt-2 block w-full rounded-lg border border-[#2E4A37]/20 bg-[#F7F2E8]/60 px-3 py-2.5 text-[15px] text-[#1F3628] outline-none transition placeholder:text-[#2E4A37]/50 focus:border-[#2E4A37] focus:bg-white focus:ring-2 focus:ring-[#2E4A37]/20"
  const choice = "peer-checked:border-[#1F3628] peer-checked:bg-[#F7F2E8] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2E4A37] hover:border-[#2E4A37]/40"
  const fileBtn = "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#2E4A37]/20 bg-white px-3 text-[13px] font-semibold text-[#1F3628] transition hover:border-[#2E4A37] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#2E4A37]"
  const hint = "block text-[12.5px] leading-snug text-[#2E4A37]/70"

  // Called as a function, not rendered as <Switch />, so the input keeps focus between renders.
  const switchRow = ({ checked, onChange, label, text }: { checked: boolean; onChange: (v: boolean) => void; label: string; text?: string }) => (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span>
        <span className="block text-[14px] font-bold text-[#1F3628]">{label}</span>
        {text ? <span className={hint}>{text}</span> : null}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden="true" className="flex h-6 w-11 shrink-0 items-center rounded-full bg-[#2E4A37]/20 p-0.5 transition peer-checked:bg-[#C0503C] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2E4A37] [&>span]:transition-transform peer-checked:[&>span]:translate-x-5 motion-reduce:[&>span]:transition-none">
        <span className="h-5 w-5 rounded-full bg-white shadow" />
      </span>
    </label>
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-12">
      {/* Controls */}
      <form className="min-w-0" onSubmit={(e) => e.preventDefault()} aria-label={tr("Φτιάξε τη δική σου βιτρίνα")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="tablist" aria-label={tr("Επιλογές")} className="grid min-w-[280px] flex-1 grid-cols-4 rounded-xl bg-white p-1 ring-1 ring-[#2E4A37]/10">
            {tabs.map((t, i) => (
              <button
                key={t.key}
                ref={(el) => { tabRefs.current[i] = el }}
                type="button"
                role="tab"
                id={`${uid}-tab-${t.key}`}
                aria-selected={tab === t.key}
                aria-controls={`${uid}-panel-${t.key}`}
                tabIndex={tab === t.key ? 0 : -1}
                onClick={() => setTab(t.key)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={`min-h-10 rounded-lg px-1.5 text-[13px] font-semibold transition sm:px-3 sm:text-[13.5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E4A37] ${tab === t.key ? "bg-[#2E4A37] text-white" : "text-[#1F3628] hover:bg-[#F7F2E8]"}`}
              >
                {tr(t.label)}
              </button>
            ))}
          </div>
          <button type="button" onClick={reset} className="ml-auto min-h-10 shrink-0 rounded-lg px-2 text-[13px] font-semibold text-[#2E4A37]/75 underline-offset-4 transition hover:text-[#1F3628] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2E4A37]">
            {tr("Επαναφορά")}
          </button>
        </div>

        {/* Basics */}
        <div role="tabpanel" id={`${uid}-panel-basics`} aria-labelledby={`${uid}-tab-basics`} hidden={tab !== "basics"} className="mt-3 space-y-3">
          <div className={fieldset}>
            <label htmlFor={`${uid}-name`} className={legend}>{tr("Όνομα καταστήματος")}</label>
            <input id={`${uid}-name`} type="text" value={cfg.name} maxLength={32} autoComplete="off" placeholder={tr(s.name)} onChange={(e) => set("name", e.target.value)} className={input} />
            <label htmlFor={`${uid}-tagline`} className={`${legend} mt-3 block`}>{tr("Κεντρικό μήνυμα")}</label>
            <input id={`${uid}-tagline`} type="text" value={cfg.tagline} maxLength={48} autoComplete="off" placeholder={tr(s.title)} onChange={(e) => set("tagline", e.target.value)} className={input} />
          </div>

          <fieldset className={fieldset}>
            <legend className={`${legend} float-left w-full`}>{tr("Template")}</legend>
            <div className="clear-both grid grid-cols-3 gap-2 pt-2 lg:block lg:space-y-2">
              {templateOptions.map((t) => (
                <label key={t} className="block cursor-pointer">
                  <input type="radio" name={`${uid}-template`} value={t} checked={cfg.template === t} onChange={() => set("template", t)} className="peer sr-only" />
                  <span className={`flex min-h-11 items-center justify-center gap-2.5 rounded-lg border border-[#2E4A37]/15 px-2 py-2 text-center transition lg:items-start lg:justify-start lg:px-3 lg:text-left ${choice}`}>
                    <span className={`mt-0.5 hidden h-4 w-4 shrink-0 lg:grid place-items-center rounded-full border-2 ${cfg.template === t ? "border-[#C0503C]" : "border-[#2E4A37]/30"}`} aria-hidden="true">
                      {cfg.template === t ? <span className="h-2 w-2 rounded-full bg-[#C0503C]" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-bold text-[#1F3628] lg:text-[14px]">{tr(templateLabels[t].name)}</span>
                      <span className="hidden text-[12.5px] leading-snug text-[#2E4A37]/70 lg:block">{tr(templateText[t])}</span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={fieldset}>
            <legend className={`${legend} float-left w-full`}>{tr("Χρώματα")}</legend>
            <div className="clear-both grid grid-cols-4 gap-2 pt-2">
              {paletteOptions.map((p) => {
                const pc = paletteColors[p.key]
                return (
                  <label key={p.key} className="cursor-pointer">
                    <input type="radio" name={`${uid}-palette`} value={p.key} checked={cfg.palette === p.key} onChange={() => set("palette", p.key)} className="peer sr-only" />
                    <span className={`flex min-h-11 flex-col items-center gap-1.5 rounded-lg border border-[#2E4A37]/15 px-1 py-2 text-center text-[12.5px] font-semibold text-[#1F3628] transition ${choice}`}>
                      <span className="flex shrink-0 -space-x-1" aria-hidden="true">
                        <span className="h-4 w-4 rounded-full ring-2 ring-white" style={{ background: pc.accent }} />
                        <span className="h-4 w-4 rounded-full ring-2 ring-white" style={{ background: pc.soft }} />
                      </span>
                      <span className="w-full truncate">{tr(p.label)}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </div>

        {/* Style */}
        <div role="tabpanel" id={`${uid}-panel-style`} aria-labelledby={`${uid}-tab-style`} hidden={tab !== "style"} className="mt-3 space-y-3">
          <fieldset className={fieldset}>
            <legend className={`${legend} float-left w-full`}>{tr("Γραμματοσειρά")}</legend>
            <div className="clear-both grid grid-cols-3 gap-2 pt-2">
              {(Object.keys(fonts) as FontKey[]).map((key) => (
                <label key={key} className="cursor-pointer">
                  <input type="radio" name={`${uid}-font`} value={key} checked={cfg.font === key} onChange={() => set("font", key)} className="peer sr-only" />
                  <span className={`flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-[#2E4A37]/15 px-1 py-2 text-[#1F3628] transition ${choice}`}>
                    <span className={`text-[22px] leading-none ${fonts[key].head}`} aria-hidden="true">Αα</span>
                    <span className="text-[12.5px] font-semibold">{tr(fonts[key].label)}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={fieldset}>
            <legend className={`${legend} float-left w-full`}>{tr("Γωνίες")}</legend>
            <div className="clear-both grid grid-cols-3 gap-2 pt-2">
              {(Object.keys(corners) as CornerKey[]).map((key) => (
                <label key={key} className="cursor-pointer">
                  <input type="radio" name={`${uid}-corners`} value={key} checked={cfg.corners === key} onChange={() => set("corners", key)} className="peer sr-only" />
                  <span className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-lg border border-[#2E4A37]/15 px-1 py-2 text-[#1F3628] transition ${choice}`}>
                    <span className="h-6 w-9 border-2 border-[#2E4A37]/60 bg-[#F7F2E8]" style={{ borderRadius: corners[key].sample }} aria-hidden="true" />
                    <span className="text-[12.5px] font-semibold">{tr(corners[key].label)}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <fieldset className={fieldset}>
              <legend className={`${legend} float-left w-full`}>{tr("Κουμπιά")}</legend>
              <div className="clear-both space-y-2 pt-2">
                {buttonOptions.map((o) => (
                  <label key={o.key} className="block cursor-pointer">
                    <input type="radio" name={`${uid}-buttons`} value={o.key} checked={cfg.buttons === o.key} onChange={() => set("buttons", o.key)} className="peer sr-only" />
                    <span className={`flex min-h-11 items-center gap-2 rounded-lg border border-[#2E4A37]/15 px-2.5 py-2 text-[12.5px] font-semibold text-[#1F3628] transition ${choice}`}>
                      <span className="h-3.5 w-6 shrink-0 rounded-[4px]" style={o.key === "solid" ? { background: c.accent } : { boxShadow: `inset 0 0 0 1.5px ${c.accent}` }} aria-hidden="true" />
                      {tr(o.label)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className={fieldset}>
              <legend className={`${legend} float-left w-full`}>{tr("Φόντο")}</legend>
              <div className="clear-both space-y-2 pt-2">
                {themeOptions.map((o) => (
                  <label key={o.key} className="block cursor-pointer">
                    <input type="radio" name={`${uid}-theme`} value={o.key} checked={cfg.theme === o.key} onChange={() => set("theme", o.key)} className="peer sr-only" />
                    <span className={`flex min-h-11 items-center gap-2 rounded-lg border border-[#2E4A37]/15 px-2.5 py-2 text-[12.5px] font-semibold text-[#1F3628] transition ${choice}`}>
                      <span className="h-3.5 w-6 shrink-0 rounded-[4px] ring-1 ring-[#2E4A37]/20" style={{ background: o.key === "dark" ? c.ink : c.page }} aria-hidden="true" />
                      {tr(o.label)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <p className={hint}>{tr("Το στυλ εδώ είναι για έμπνευση. Στη δική σου βιτρίνα ξεκινάς από template και χρώματα.")}</p>
        </div>

        {/* Images */}
        <div role="tabpanel" id={`${uid}-panel-images`} aria-labelledby={`${uid}-tab-images`} hidden={tab !== "images"} className="mt-3 space-y-3">
          <div className={fieldset}>
            <p className={legend}>{tr("Λογότυπο")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg text-[13px] font-extrabold text-white" style={{ background: c.accent }} aria-hidden="true">
                {logo ? <img src={logo} alt="" className="h-full w-full bg-white object-contain" /> : initialsOf(shopName)}
              </span>
              <label className={fileBtn}>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(e, setLogo)} />
                {tr(logo ? "Άλλαξε λογότυπο" : "Ανέβασε λογότυπο")}
              </label>
              {logo ? (
                <button type="button" onClick={() => setLogo("")} className="text-[13px] font-semibold text-[#2E4A37]/75 underline-offset-4 hover:underline">{tr("Αφαίρεση")}</button>
              ) : null}
            </div>
            <p className={`${hint} mt-2`}>{tr("Χωρίς λογότυπο, μπαίνουν τα αρχικά του ονόματος.")}</p>
          </div>

          <fieldset className={fieldset}>
            <legend className={`${legend} float-left w-full`}>{tr("Εικόνα εξωφύλλου")}</legend>
            <div className="clear-both grid grid-cols-4 gap-2 pt-2">
              {coverOptions.map((o) => (
                <label key={o.key} className="cursor-pointer">
                  <input type="radio" name={`${uid}-cover`} value={o.key} checked={cfg.cover === o.key} onChange={() => set("cover", o.key)} className="peer sr-only" />
                  <span className={`block overflow-hidden rounded-lg border-2 border-transparent transition peer-checked:border-[#1F3628] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2E4A37]`}>
                    <img src={o.img || s.img} alt="" loading="lazy" decoding="async" className="aspect-square w-full object-cover" style={{ objectPosition: o.img ? "center" : s.pos }} />
                  </span>
                  <span className="mt-1 block truncate text-center text-[12px] font-semibold text-[#1F3628]">{tr(o.label)}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className={fileBtn}>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(e, (url) => { setOwnCover(url); set("cover", "own") })} />
                {tr("Ανέβασε δική σου φωτογραφία")}
              </label>
              {ownCover ? (
                <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#1F3628]">
                  <input type="radio" name={`${uid}-cover`} value="own" checked={cfg.cover === "own"} onChange={() => set("cover", "own")} className="h-4 w-4 accent-[#2E4A37]" />
                  {tr("Η δική μου")}
                </label>
              ) : null}
            </div>
          </fieldset>
          {photoError ? <p role="alert" className="text-[13px] font-semibold text-[#A33F2D]">{photoError}</p> : null}
          <p className={hint}>{tr("Οι φωτογραφίες μένουν στον browser σου. Δεν ανεβαίνουν πουθενά.")}</p>
        </div>

        {/* Sections, contact, domain, offer */}
        <div role="tabpanel" id={`${uid}-panel-sections`} aria-labelledby={`${uid}-tab-sections`} hidden={tab !== "sections"} className="mt-3 space-y-3">
          <fieldset className={fieldset}>
            <legend className={`${legend} float-left w-full`}>{tr("Ενότητες σελίδας")}</legend>
            <div className="clear-both space-y-2 pt-2">
              {sectionOptions.map((o) => (
                <label key={o.key} className="block cursor-pointer">
                  <input type="checkbox" checked={cfg.sections.includes(o.key)} onChange={() => toggleSection(o.key)} className="peer sr-only" />
                  <span className={`flex min-h-11 items-center gap-3 rounded-lg border border-[#2E4A37]/15 px-3 py-2 transition ${choice}`}>
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border-2 ${cfg.sections.includes(o.key) ? "border-[#C0503C] bg-[#C0503C]" : "border-[#2E4A37]/30"}`} aria-hidden="true">
                      {cfg.sections.includes(o.key) ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-bold text-[#1F3628]">{tr(o.label)}</span>
                      <span className={hint}>{tr(o.text)}</span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={fieldset}>
            <p className={legend}>{tr("Επικοινωνία")}</p>
            <div className="grid gap-x-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="mt-2 block text-[12.5px] font-semibold text-[#2E4A37]/80">
                {tr("Τηλέφωνο")}
                <input type="tel" value={cfg.phone} maxLength={20} autoComplete="off" placeholder="210 000 0000" onChange={(e) => set("phone", e.target.value)} className={`${input} !mt-1`} />
              </label>
              <label className="mt-2 block text-[12.5px] font-semibold text-[#2E4A37]/80">
                {tr("Email")}
                <input type="email" value={cfg.email} maxLength={48} autoComplete="off" placeholder={`hello@${slug}.gr`} onChange={(e) => set("email", e.target.value)} className={`${input} !mt-1`} />
              </label>
            </div>
          </div>

          <div className={fieldset}>
            {switchRow({ checked: cfg.ownDomain, onChange: (v) => set("ownDomain", v), label: tr("Δικό σου domain"), text: tr("Το κατάστημα στη δική σου διεύθυνση, αντί για vitrinaki.gr/…") })}
            {cfg.ownDomain ? (
              <input type="text" value={cfg.domain} maxLength={40} autoComplete="off" aria-label={tr("Το domain σου")} placeholder={`${slug}.gr`} onChange={(e) => set("domain", e.target.value)} className={input} />
            ) : null}
          </div>

          <div className={fieldset}>
            {switchRow({ checked: cfg.sale, onChange: (v) => set("sale", v), label: tr("Σήμα «-10%» στα προϊόντα"), text: tr("Δες πώς φαίνεται μια προσφορά στη βιτρίνα.") })}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">{`${tr("Προεπισκόπηση")}: ${summary}`}</p>
      </form>

      {/* Live preview: first on small screens, so every change is visible right above the options */}
      <div className="order-first min-w-0 lg:order-none lg:sticky lg:top-24 lg:self-start">
        <div aria-hidden="true" style={{ ...corners[cfg.corners].vars, "--on": t.onAccent, "--card": t.card } as React.CSSProperties}>
          <Browser url={<span className="block truncate">{address}</span>} className="shadow-[0_40px_80px_-40px_rgba(31,54,40,0.55),0_2px_8px_rgba(31,54,40,0.06)]">
            {cfg.sale ? (
              <p className={`${swap} ${ease} px-3 py-1 text-center text-[10px] font-bold text-[var(--on)]`} style={{ background: t.accent }}>{tr("-10% σε όλα τα προϊόντα")}</p>
            ) : null}
            <div className={`${ease} p-3 sm:p-5 ${fonts[cfg.font].body}`} style={{ background: t.page, color: t.ink }}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-[13px] font-extrabold sm:text-[15px]">
                  <span className={`${ease} grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-[var(--r3)] text-[10px] text-[var(--on)]`} style={{ background: t.accent }}>
                    {logo ? <img src={logo} alt="" className="h-full w-full bg-[var(--card)] object-contain" /> : initialsOf(shopName)}
                  </span>
                  <span className="truncate">{shopName}</span>
                </span>
                <span className="flex shrink-0 gap-3 text-[10px] font-semibold opacity-60 sm:text-[11px]">
                  <span>{tr("Αρχική")}</span>
                  <span className="hidden min-[400px]:inline">{tr(cfg.template === "services" ? "Υπηρεσίες" : "Συλλογή")}</span>
                  <span>{tr("Επικοινωνία")}</span>
                </span>
              </div>

              <div key={cfg.template} className={swap}>
                {cfg.template === "atelier" ? (
                  <>
                    <div className={`${ease} mt-3 grid grid-cols-2 overflow-hidden rounded-[var(--r1)]`} style={{ background: t.soft }}>
                      <div className="flex min-w-0 flex-col justify-center p-3 sm:p-5">
                        <p className="text-[9px] font-bold tracking-wide opacity-60 sm:text-[11px]">{tr(s.eyebrow)}</p>
                        <p className={`mt-1 break-words ${head} text-[20px] leading-tight sm:text-[30px]`}>{title}</p>
                        <p className="mt-1 text-[10px] opacity-70 sm:text-[12px]">{tr(s.text)}</p>
                        <span className={`${ease} mt-2.5 w-fit rounded-[var(--rb)] px-2.5 py-1 text-[10px] font-bold text-[var(--on)] sm:text-[11px]`} style={btn}>{tr(s.cta)}</span>
                      </div>
                      <img key={coverImg} src={coverImg} alt="" loading="lazy" decoding="async" className={`${swap} aspect-[4/3.4] h-full w-full object-cover`} style={{ objectPosition: coverPos }} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                      {s.items.map((item) => (
                        <div key={item.name} className="rounded-[var(--r2)] bg-[var(--card)] p-1.5">
                          <div className="relative aspect-square overflow-hidden rounded-[var(--r3)]">
                            <img src={item.img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                            <SaleBadge show={cfg.sale} accent={t.accent} className="absolute left-1 top-1" />
                          </div>
                          <p className="mt-1.5 truncate text-[10px] font-semibold sm:text-[12px]">{tr(item.name)}</p>
                          <div className="text-[10px] sm:text-[12px]"><Price cents={item.cents} sale={cfg.sale} accent={t.accent} /></div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : cfg.template === "local" ? (
                  <>
                    <div className="relative mt-3 overflow-hidden rounded-[var(--r1)]">
                      <img key={coverImg} src={coverImg} alt="" loading="lazy" decoding="async" className={`${swap} absolute inset-0 h-full w-full object-cover`} style={{ objectPosition: coverPos }} />
                      <div className={`${ease} relative mx-auto my-6 w-[78%] rounded-[var(--r2)] p-3 text-center sm:my-10 sm:p-5`} style={{ background: `${t.page}EE` }}>
                        <p className="text-[9px] font-bold tracking-wide opacity-60 sm:text-[11px]">{tr(s.eyebrow)}</p>
                        <p className={`mt-1 break-words ${head} text-[18px] leading-tight sm:text-[26px]`}>{title}</p>
                        <span className={`${ease} mt-2 inline-block rounded-[var(--rb)] px-2.5 py-1 text-[10px] font-bold text-[var(--on)] sm:text-[11px]`} style={btn}>{tr(s.cta)}</span>
                      </div>
                    </div>
                    <div className={`${ease} mt-2 flex flex-wrap justify-center gap-x-4 gap-y-0.5 rounded-[var(--r2)] px-3 py-1.5 text-[9.5px] font-semibold sm:text-[11px]`} style={{ background: t.soft }}>
                      <span>{tr("Δευ–Παρ 9:00–18:00")}</span>
                      <span>{tr("Σάβ 10:00–14:00")}</span>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {s.items.map((item) => (
                        <li key={item.name} className="flex items-center gap-2.5 rounded-[var(--r2)] bg-[var(--card)] p-1.5 pr-3">
                          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[var(--r3)] sm:h-12 sm:w-12">
                            <img src={item.img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold sm:text-[13px]">{tr(item.name)}</span>
                          <SaleBadge show={cfg.sale} accent={t.accent} />
                          <span className="shrink-0 text-[11px] sm:text-[13px]"><Price cents={item.cents} sale={cfg.sale} accent={t.accent} /></span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                    <div className="min-w-0">
                      <div className="overflow-hidden rounded-[var(--r1)]">
                        <img key={coverImg} src={coverImg} alt="" loading="lazy" decoding="async" className={`${swap} aspect-[16/9] w-full object-cover`} style={{ objectPosition: coverPos }} />
                      </div>
                      <p className={`mt-2.5 break-words ${head} text-[22px] leading-tight sm:text-[28px]`}>{title}</p>
                      <p className="mt-0.5 text-[11px] opacity-70 sm:text-[12px]">{tr(s.text)}</p>
                      <span className={`${ease} mt-2.5 inline-block rounded-[var(--rb)] px-2.5 py-1 text-[10px] font-bold text-[var(--on)] sm:text-[11px]`} style={btn}>{tr(s.cta)}</span>
                    </div>
                    <ul className={`${ease} space-y-1.5 self-start rounded-[var(--r1)] p-2`} style={{ background: t.soft }}>
                      {s.items.map((item) => (
                        <li key={item.name} className="flex items-center gap-2 rounded-[var(--r2)] bg-[var(--card)] p-2">
                          <span className={`${ease} grid h-9 w-9 shrink-0 place-items-center rounded-[var(--r3)] ${head} text-[14px]`} style={{ background: t.soft, color: t.accent }}>{item.meta}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-semibold sm:text-[12px]">{tr(item.name)}</span>
                            <span className="block text-[11px] sm:text-[12px]"><Price cents={item.cents} sale={cfg.sale} accent={t.accent} /></span>
                          </span>
                          <SaleBadge show={cfg.sale} accent={t.accent} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {cfg.sections.map((key) =>
                key === "text" ? (
                  <div key={key} className={`${swap} mt-3 rounded-[var(--r1)] bg-[var(--card)] px-3 py-3 sm:px-4`}>
                    <p className={`${head} text-[15px] leading-tight sm:text-[18px]`}>{tr("Η ιστορία μας")}</p>
                    <p className="mt-1 text-[10.5px] leading-relaxed opacity-75 sm:text-[12px]">{tr(s.story)}</p>
                  </div>
                ) : key === "feature" ? (
                  <div key={key} className={`${swap} mt-3 grid grid-cols-3 gap-2`}>
                    {s.features.map((f, i) => (
                      <div key={f} className={`${ease} rounded-[var(--r2)] px-2 py-2.5 text-center`} style={{ background: t.soft }}>
                        <span className="mx-auto grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold text-[var(--on)]" style={{ background: t.accent }}>{i + 1}</span>
                        <p className="mt-1.5 text-[9.5px] font-semibold leading-tight sm:text-[11px]">{tr(f)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div key={key} className={`${swap} mt-3 grid grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-[var(--r1)] bg-[var(--card)]`}>
                    <img src={s.sectionImg} alt="" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                    <p className={`pr-3 ${head} text-[13px] leading-snug sm:text-[16px]`}>{tr(s.imageText)}</p>
                  </div>
                )
              )}

              {cfg.phone.trim() || cfg.email.trim() ? (
                <div className={`${swap} ${ease} mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-[var(--r2)] px-3 py-2 text-[10px] font-semibold sm:text-[11.5px]`} style={{ background: t.ink, color: t.page }}>
                  <span className="opacity-70">{tr("Επικοινωνία")}</span>
                  {cfg.phone.trim() ? <span>{cfg.phone.trim()}</span> : null}
                  {cfg.email.trim() ? <span className="max-w-full truncate">{cfg.email.trim()}</span> : null}
                </div>
              ) : null}
            </div>
          </Browser>
        </div>
        <div className="mt-6 hidden flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex">
          <p className="max-w-md text-[14px] leading-6 text-[#2E4A37]/75">{tr("Αυτό ήταν ένα παράδειγμα. Τη δική σου βιτρίνα τη στήνεις με τα δικά σου προϊόντα και φωτογραφίες.")}</p>
          {cta}
        </div>
      </div>

      {/* On small screens the note and button come after the options */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between lg:hidden">
        <p className="max-w-md text-[14px] leading-6 text-[#2E4A37]/75">{tr("Αυτό ήταν ένα παράδειγμα. Τη δική σου βιτρίνα τη στήνεις με τα δικά σου προϊόντα και φωτογραφίες.")}</p>
        {cta}
      </div>
    </div>
  )
}
