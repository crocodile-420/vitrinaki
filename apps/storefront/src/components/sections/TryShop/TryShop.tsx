"use client"

import type React from "react"
import { useId, useState } from "react"

import { Browser, slugify } from "@/components/sections/HeroDemo/HeroDemo"
import { paletteColors, templateLabels } from "@/lib/data/vitrinaki-storefronts"
import { useTranslator } from "@/lib/i18n/client"

/*
 * "Try it": the visitor changes a sample shop live (colours, template, name and a -10%
 * badge). Purely client-side; nothing is saved. The preview is decorative (aria-hidden);
 * a polite live region describes the current choice instead.
 */

type PaletteKey = "forest" | "terracotta" | "ocean"
type TemplateKey = keyof typeof templateLabels

const paletteOptions: { key: PaletteKey; label: string }[] = [
  { key: "forest", label: "Κυπαρισσί" },
  { key: "terracotta", label: "Κεραμιδί" },
  { key: "ocean", label: "Μπλε" },
]
const templateOptions: TemplateKey[] = ["atelier", "local", "services"]
// The services text avoids appointments: online bookings are not built yet.
const templateText: Record<TemplateKey, string> = {
  atelier: templateLabels.atelier.text,
  local: templateLabels.local.text,
  services: "Για επαγγελματίες και υπηρεσίες, με τιμοκατάλογο και επικοινωνία.",
}

type Item = { name: string; cents: number; img?: string; meta?: string }
const samples: Record<TemplateKey, { name: string; slug: string; eyebrow: string; title: string; text: string; cta: string; img: string; pos: string; items: Item[] }> = {
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
  },
}

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
  return <span className={`${swap} rounded px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm ${className}`} style={{ background: accent }}>-10%</span>
}

export function TryShop({ cta }: { cta: React.ReactNode }) {
  const { tr } = useTranslator()
  const uid = useId()
  const [name, setName] = useState("")
  const [palette, setPalette] = useState<PaletteKey>("terracotta")
  const [template, setTemplate] = useState<TemplateKey>("atelier")
  const [sale, setSale] = useState(false)

  const c = paletteColors[palette]
  const s = samples[template]
  const shopName = name.trim() || tr(s.name)
  const slug = slugify(name) || s.slug
  const paletteLabel = paletteOptions.find((p) => p.key === palette)?.label || ""
  const summary = [shopName, tr(paletteLabel), tr(templateLabels[template].name), sale ? "-10%" : ""].filter(Boolean).join(" · ")

  const fieldset = "rounded-xl border border-[#2E4A37]/10 bg-white p-3 sm:p-3.5"
  const legend = "px-1 text-[13.5px] font-bold text-[#1F3628]"

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-12">
      {/* Controls */}
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()} aria-label={tr("Δοκίμασε ένα κατάστημα")}>
        <div className={fieldset}>
          <label htmlFor={`${uid}-name`} className={legend}>{tr("Όνομα καταστήματος")}</label>
          <input
            id={`${uid}-name`}
            type="text"
            value={name}
            maxLength={32}
            autoComplete="off"
            placeholder={tr(s.name)}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-[#2E4A37]/20 bg-[#F7F2E8]/60 px-3 py-2.5 text-[15px] text-[#1F3628] outline-none transition placeholder:text-[#2E4A37]/50 focus:border-[#2E4A37] focus:bg-white focus:ring-2 focus:ring-[#2E4A37]/20"
          />
          <p className="mt-1.5 truncate text-[12.5px] text-[#2E4A37]/65">vitrinaki.gr/<span className="font-semibold text-[#1F3628]">{slug}</span></p>
        </div>

        <fieldset className={fieldset}>
          <legend className={`${legend} float-left w-full`}>{tr("Χρώματα")}</legend>
          <div className="clear-both grid grid-cols-3 gap-2 pt-2">
            {paletteOptions.map((p) => {
              const pc = paletteColors[p.key]
              return (
                <label key={p.key} className="cursor-pointer">
                  <input type="radio" name={`${uid}-palette`} value={p.key} checked={palette === p.key} onChange={() => setPalette(p.key)} className="peer sr-only" />
                  <span className="flex min-h-11 flex-col items-center gap-1.5 rounded-lg border border-[#2E4A37]/15 px-1.5 py-2 text-center text-[13px] font-semibold text-[#1F3628] transition peer-checked:border-[#1F3628] peer-checked:bg-[#F7F2E8] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2E4A37] hover:border-[#2E4A37]/40">
                    <span className="flex shrink-0 -space-x-1" aria-hidden="true">
                      <span className="h-4 w-4 rounded-full ring-2 ring-white" style={{ background: pc.accent }} />
                      <span className="h-4 w-4 rounded-full ring-2 ring-white" style={{ background: pc.soft }} />
                    </span>
                    <span className="truncate">{tr(p.label)}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <fieldset className={fieldset}>
          <legend className={`${legend} float-left w-full`}>{tr("Template")}</legend>
          <div className="clear-both grid grid-cols-3 gap-2 pt-2 lg:block lg:space-y-2">
            {templateOptions.map((t) => (
              <label key={t} className="block cursor-pointer">
                <input type="radio" name={`${uid}-template`} value={t} checked={template === t} onChange={() => setTemplate(t)} className="peer sr-only" />
                <span className="flex min-h-11 items-center justify-center gap-2.5 rounded-lg border border-[#2E4A37]/15 px-2 py-2 text-center transition lg:items-start lg:justify-start lg:px-3 lg:text-left peer-checked:border-[#1F3628] peer-checked:bg-[#F7F2E8] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2E4A37] hover:border-[#2E4A37]/40">
                  <span className={`mt-0.5 hidden h-4 w-4 shrink-0 lg:grid place-items-center rounded-full border-2 ${template === t ? "border-[#C0503C]" : "border-[#2E4A37]/30"}`} aria-hidden="true">
                    {template === t ? <span className="h-2 w-2 rounded-full bg-[#C0503C]" /> : null}
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

        <div className={fieldset}>
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span>
              <span className="block text-[14px] font-bold text-[#1F3628]">{tr("Σήμα «-10%» στα προϊόντα")}</span>
              <span className="block text-[12.5px] leading-snug text-[#2E4A37]/70">{tr("Δες πώς φαίνεται μια προσφορά στη βιτρίνα.")}</span>
            </span>
            <input type="checkbox" role="switch" checked={sale} onChange={(e) => setSale(e.target.checked)} className="peer sr-only" />
            <span aria-hidden="true" className="flex h-6 w-11 shrink-0 items-center rounded-full bg-[#2E4A37]/20 p-0.5 transition peer-checked:bg-[#C0503C] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2E4A37] [&>span]:transition-transform peer-checked:[&>span]:translate-x-5 motion-reduce:[&>span]:transition-none">
              <span className="h-5 w-5 rounded-full bg-white shadow" />
            </span>
          </label>
        </div>

        <p className="sr-only" aria-live="polite">{`${tr("Προεπισκόπηση")}: ${summary}`}</p>
      </form>

      {/* Live preview */}
      <div className="min-w-0">
        <div aria-hidden="true">
          <Browser url={<span className="block truncate">vitrinaki.gr/{slug}</span>} className="shadow-[0_40px_80px_-40px_rgba(31,54,40,0.55),0_2px_8px_rgba(31,54,40,0.06)]">
            {sale ? (
              <p className={`${swap} ${ease} px-3 py-1 text-center text-[10px] font-bold text-white`} style={{ background: c.accent }}>{tr("-10% σε όλα τα προϊόντα")}</p>
            ) : null}
            <div className={`${ease} p-3 sm:p-5`} style={{ background: c.page, color: c.ink }}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-[13px] font-extrabold sm:text-[15px]">
                  <span className={`${ease} grid h-7 w-7 shrink-0 place-items-center rounded-md text-[10px] text-white`} style={{ background: c.accent }}>{initialsOf(shopName)}</span>
                  <span className="truncate">{shopName}</span>
                </span>
                <span className="flex shrink-0 gap-3 text-[10px] font-semibold opacity-60 sm:text-[11px]">
                  <span>{tr("Αρχική")}</span>
                  <span className="hidden min-[400px]:inline">{tr(template === "services" ? "Υπηρεσίες" : "Συλλογή")}</span>
                  <span>{tr("Επικοινωνία")}</span>
                </span>
              </div>

              <div key={template} className={swap}>
                {template === "atelier" ? (
                  <>
                    <div className={`${ease} mt-3 grid grid-cols-2 overflow-hidden rounded-xl`} style={{ background: c.soft }}>
                      <div className="flex flex-col justify-center p-3 sm:p-5">
                        <p className="text-[9px] font-bold tracking-wide opacity-60 sm:text-[11px]">{tr(s.eyebrow)}</p>
                        <p className="mt-1 font-serif text-[20px] leading-tight sm:text-[30px]">{tr(s.title)}</p>
                        <p className="mt-1 text-[10px] opacity-70 sm:text-[12px]">{tr(s.text)}</p>
                        <span className={`${ease} mt-2.5 w-fit rounded-md px-2.5 py-1 text-[10px] font-bold text-white sm:text-[11px]`} style={{ background: c.accent }}>{tr(s.cta)}</span>
                      </div>
                      <img src={s.img} alt="" loading="lazy" decoding="async" className="aspect-[4/3.4] h-full w-full object-cover" style={{ objectPosition: s.pos }} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                      {s.items.map((item) => (
                        <div key={item.name} className="rounded-lg bg-white p-1.5">
                          <div className="relative aspect-square overflow-hidden rounded-md">
                            <img src={item.img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                            <SaleBadge show={sale} accent={c.accent} className="absolute left-1 top-1" />
                          </div>
                          <p className="mt-1.5 truncate text-[10px] font-semibold sm:text-[12px]">{tr(item.name)}</p>
                          <div className="text-[10px] sm:text-[12px]"><Price cents={item.cents} sale={sale} accent={c.accent} /></div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : template === "local" ? (
                  <>
                    <div className="relative mt-3 overflow-hidden rounded-xl">
                      <img src={s.img} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: s.pos }} />
                      <div className={`${ease} relative mx-auto my-6 w-[78%] rounded-lg p-3 text-center sm:my-10 sm:p-5`} style={{ background: `${c.page}EE` }}>
                        <p className="text-[9px] font-bold tracking-wide opacity-60 sm:text-[11px]">{tr(s.eyebrow)}</p>
                        <p className="mt-1 text-[18px] font-extrabold leading-tight sm:text-[26px]">{tr(s.title)}</p>
                        <span className={`${ease} mt-2 inline-block rounded-md px-2.5 py-1 text-[10px] font-bold text-white sm:text-[11px]`} style={{ background: c.accent }}>{tr(s.cta)}</span>
                      </div>
                    </div>
                    <div className={`${ease} mt-2 flex flex-wrap justify-center gap-x-4 gap-y-0.5 rounded-lg px-3 py-1.5 text-[9.5px] font-semibold sm:text-[11px]`} style={{ background: c.soft }}>
                      <span>{tr("Δευ–Παρ 9:00–18:00")}</span>
                      <span>{tr("Σάβ 10:00–14:00")}</span>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {s.items.map((item) => (
                        <li key={item.name} className="flex items-center gap-2.5 rounded-lg bg-white p-1.5 pr-3">
                          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md sm:h-12 sm:w-12">
                            <img src={item.img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold sm:text-[13px]">{tr(item.name)}</span>
                          <SaleBadge show={sale} accent={c.accent} />
                          <span className="shrink-0 text-[11px] sm:text-[13px]"><Price cents={item.cents} sale={sale} accent={c.accent} /></span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <div className="overflow-hidden rounded-xl">
                        <img src={s.img} alt="" loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover" style={{ objectPosition: s.pos }} />
                      </div>
                      <p className="mt-2.5 font-serif text-[22px] leading-tight sm:text-[28px]">{tr(s.title)}</p>
                      <p className="mt-0.5 text-[11px] opacity-70 sm:text-[12px]">{tr(s.text)}</p>
                      <span className={`${ease} mt-2.5 inline-block rounded-md px-2.5 py-1 text-[10px] font-bold text-white sm:text-[11px]`} style={{ background: c.accent }}>{tr(s.cta)}</span>
                    </div>
                    <ul className={`${ease} space-y-1.5 self-start rounded-xl p-2`} style={{ background: c.soft }}>
                      {s.items.map((item) => (
                        <li key={item.name} className="flex items-center gap-2 rounded-lg bg-white p-2">
                          <span className={`${ease} grid h-9 w-9 shrink-0 place-items-center rounded-md font-serif text-[14px]`} style={{ background: c.soft, color: c.accent }}>{item.meta}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-semibold sm:text-[12px]">{tr(item.name)}</span>
                            <span className="block text-[11px] sm:text-[12px]"><Price cents={item.cents} sale={sale} accent={c.accent} /></span>
                          </span>
                          <SaleBadge show={sale} accent={c.accent} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Browser>
        </div>
        <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-[14px] leading-6 text-[#2E4A37]/75">{tr("Αυτό ήταν ένα παράδειγμα. Τη δική σου βιτρίνα τη στήνεις με τα δικά σου προϊόντα και φωτογραφίες.")}</p>
          {cta}
        </div>
      </div>
    </div>
  )
}
