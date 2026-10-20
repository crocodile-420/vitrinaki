"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

import { Browser } from "@/components/sections/HeroDemo/HeroDemo"
import { paletteColors } from "@/lib/data/vitrinaki-storefronts"
import { useTranslator } from "@/lib/i18n/client"

/*
 * "How it works", Shopify style: on desktop the steps scroll on the left while a pinned
 * shop mockup on the right follows the step in the middle of the screen. On smaller screens
 * each step carries its own copy of the mockup, frozen at that step, so nothing is pinned.
 * The mockup is decorative (aria-hidden): the steps' text says everything it shows.
 * Under prefers-reduced-motion the mockup switches without fades or slides.
 */

const steps = [
  {
    key: "template",
    label: "Template",
    title: "Διαλέγεις template και χρώματα",
    text: "Atelier, Γειτονιά ή Υπηρεσίες. Βάζεις το όνομα, το λογότυπο και τα χρώματά σου και η βιτρίνα παίρνει το ύφος της επιχείρησής σου.",
  },
  {
    key: "products",
    label: "Προϊόντα",
    title: "Προσθέτεις τα προϊόντα σου",
    text: "Φωτογραφία, τιμή και απόθεμα, από το Studio. Ό,τι προσθέτεις εμφανίζεται στη βιτρίνα σου, χωρίς τεχνικές γνώσεις.",
  },
  {
    key: "publish",
    label: "Δημοσίευση",
    title: "Τη δημοσιεύεις",
    text: "Όταν είσαι έτοιμος, ανοίγεις στους πελάτες στο vitrinaki.gr/το-όνομά-σου ή στο δικό σου domain, και μοιράζεσαι το link.",
  },
  {
    key: "order",
    label: "Παραγγελία",
    title: "Έρχεται η πρώτη παραγγελία",
    text: "Ο πελάτης βάζει στο καλάθι και παραγγέλνει. Εσύ βλέπεις την παραγγελία στο Studio, με ειδοποίηση για κάθε νέα.",
  },
] as const

const c = paletteColors.terracotta
const products = [
  { name: "Κεραμικό βάζο", price: "32,00 €", img: "/home/p-vase.webp" },
  { name: "Αρωματικό κερί", price: "18,00 €", img: "/home/p-candle.webp" },
  { name: "Παιώνιες σε βάζο", price: "24,00 €", img: "/home/p-peony.webp" },
]
const templates = [
  { name: "Atelier", layout: "split" },
  { name: "Γειτονιά", layout: "center" },
  { name: "Υπηρεσίες", layout: "list" },
] as const
const swatches = [paletteColors.forest.accent, paletteColors.terracotta.accent, paletteColors.ocean.accent]

const fade = "transition duration-500 ease-out motion-reduce:transition-none"
const shown = (on: boolean) => (on ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3 motion-reduce:translate-y-0")

function Check({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* A tiny wireframe of each template, for the "pick a template" card. */
function TemplateThumb({ layout, accent }: { layout: (typeof templates)[number]["layout"]; accent: string }) {
  return (
    <span className="block aspect-[4/3] rounded bg-white p-1">
      {layout === "split" ? (
        <span className="grid h-full grid-cols-2 gap-0.5">
          <span className="flex flex-col justify-center gap-0.5"><span className="h-1 w-4/5 rounded-full" style={{ background: accent }} /><span className="h-0.5 w-3/5 rounded-full bg-black/15" /></span>
          <span className="rounded-sm" style={{ background: accent, opacity: 0.3 }} />
        </span>
      ) : layout === "center" ? (
        <span className="flex h-full flex-col items-center justify-center gap-0.5 rounded-sm" style={{ background: `${accent}22` }}>
          <span className="h-1 w-3/5 rounded-full" style={{ background: accent }} /><span className="h-0.5 w-2/5 rounded-full bg-black/15" />
        </span>
      ) : (
        <span className="flex h-full flex-col justify-center gap-0.5">
          {[0, 1, 2].map((i) => <span key={i} className="flex items-center gap-0.5"><span className="h-1 w-1 rounded-full" style={{ background: accent }} /><span className="h-0.5 flex-1 rounded-full bg-black/15" /></span>)}
        </span>
      )}
    </span>
  )
}

/* The shop as it looks at a given step, with the step's floating card on top. */
export function StoryMockup({ step, className = "" }: { step: number; className?: string }) {
  const { tr } = useTranslator()
  const published = step >= 2
  const ordered = step >= 3

  return (
    <div className={`relative px-3 pb-14 pt-3 sm:px-6 ${className}`}>
      <Browser
        url={
          <span className="flex items-center gap-1.5">
            <span className="truncate">vitrinaki.gr/mano</span>
            <span className={`shrink-0 rounded-full px-1.5 text-[7px] font-bold ${fade} ${published ? "bg-[#2E4A37] text-white" : "bg-[#2E4A37]/10 text-[#2E4A37]/70"}`}>
              {published ? tr("Online") : tr("Πρόχειρο")}
            </span>
          </span>
        }
      >
        <div className="p-3 sm:p-4" style={{ background: c.page, color: c.ink }}>
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-extrabold">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded text-[7px] text-white" style={{ background: c.accent }}>MX</span>
              <span className="truncate">{tr("Mano Χειροποίητα")}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2 text-[8px] font-semibold">
              <span className="opacity-60">{tr("Αρχική")}</span>
              <span className="opacity-60">{tr("Συλλογή")}</span>
              <span className="relative grid h-5 w-5 place-items-center rounded-full bg-white" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 11h10.2L20 8H6.2" /><circle cx="9" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></svg>
                <span className={`absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full text-[7px] font-bold text-white ${fade} ${ordered ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} style={{ background: c.accent }}>1</span>
              </span>
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 overflow-hidden rounded-lg" style={{ background: c.soft }}>
            <div className="flex flex-col justify-center p-3">
              <p className="text-[8px] font-bold tracking-wide opacity-60">{tr("Νέα συλλογή")}</p>
              <p className="mt-1 font-serif text-[17px] leading-tight sm:text-[20px]">{tr("Φτιαγμένα στο χέρι")}</p>
              <span className="mt-2 w-fit rounded px-2 py-0.5 text-[7.5px] font-bold text-white" style={{ background: c.accent }}>{tr("Ανακάλυψε")}</span>
            </div>
            <div className="aspect-[4/3]">
              <img src="/home/p-desk-plant.webp" alt="" loading="lazy" decoding="async" className="block h-full w-full object-cover" />
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {products.map((p, i) => {
              const filled = step >= 1
              const isNew = step === 1 && i === 2
              return (
                <div key={p.name} className={`relative rounded-md bg-white p-1 ${fade} ${isNew ? "ring-2" : "ring-0"}`} style={isNew ? ({ "--tw-ring-color": c.accent } as React.CSSProperties) : undefined}>
                  <div className="relative aspect-square overflow-hidden rounded">
                    <span className={`absolute inset-0 grid place-items-center rounded border border-dashed text-[14px] font-light ${fade} ${filled ? "opacity-0" : "opacity-100"}`} style={{ borderColor: `${c.ink}40`, color: `${c.ink}80` }}>+</span>
                    <img src={p.img} alt="" loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full object-cover ${fade} ${filled ? "scale-100 opacity-100" : "scale-95 opacity-0"}`} style={{ transitionDelay: filled ? `${i * 90}ms` : "0ms" }} />
                    {isNew ? <span className="absolute left-1 top-1 rounded px-1 text-[6.5px] font-bold text-white" style={{ background: c.accent }}>{tr("Νέο")}</span> : null}
                  </div>
                  <div className={`${fade} ${filled ? "opacity-100" : "opacity-40"}`}>
                    {filled ? (
                      <>
                        <p className="mt-1 truncate text-[7px] font-semibold">{tr(p.name)}</p>
                        <p className="text-[7px] font-bold" style={{ color: c.accent }}>{p.price}</p>
                      </>
                    ) : (
                      <>
                        <span className="mt-1.5 block h-1 w-3/4 rounded-full" style={{ background: c.ink, opacity: 0.2 }} />
                        <span className="mt-1 block h-1 w-1/3 rounded-full" style={{ background: c.ink, opacity: 0.2 }} />
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Browser>

      {/* 1 · template & colours */}
      <div className={`absolute bottom-0 left-0 w-[64%] max-w-[260px] rounded-xl bg-white p-2.5 shadow-[0_24px_50px_-20px_rgba(31,54,40,0.55)] ring-1 ring-[#2E4A37]/10 ${fade} ${shown(step === 0)}`}>
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#2E4A37]/60">{tr("Template")}</p>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {templates.map((t, i) => (
            <span key={t.name} className={`rounded-md p-1 text-center ${i === 0 ? "bg-[#F4E1D9] ring-2 ring-[#C0503C]" : "bg-[#F4F1EA]"}`}>
              <TemplateThumb layout={t.layout} accent={i === 0 ? c.accent : "#2E4A37"} />
              <span className="mt-1 block truncate text-[8px] font-semibold text-[#1F3628]">{tr(t.name)}</span>
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[8.5px] font-semibold text-[#2E4A37]/70">{tr("Χρώματα")}</span>
          {swatches.map((s) => (
            <span key={s} className={`grid h-4 w-4 place-items-center rounded-full text-white ${s === c.accent ? "ring-2 ring-[#C0503C] ring-offset-1" : ""}`} style={{ background: s }}>
              {s === c.accent ? <Check size={8} /> : null}
            </span>
          ))}
        </div>
      </div>

      {/* 2 · a new product in the Studio */}
      <div className={`absolute bottom-0 right-0 w-[62%] max-w-[250px] overflow-hidden rounded-xl bg-white shadow-[0_24px_50px_-20px_rgba(31,54,40,0.55)] ring-1 ring-[#2E4A37]/10 ${fade} ${shown(step === 1)}`}>
        <div className="flex items-center justify-between bg-[#2E4A37] px-2.5 py-1.5 text-[#F7F2E8]">
          <span className="text-[10px] font-extrabold tracking-tight">vitrinaki<span className="text-[#E8A493]">.</span> <span className="font-semibold uppercase tracking-[0.18em] text-[#F7F2E8]/60">Studio</span></span>
          <span className="text-[8.5px] font-semibold text-[#F7F2E8]/75">{tr("Νέο προϊόν")}</span>
        </div>
        <div className="space-y-1.5 p-2.5 text-[9px] text-[#1F3628]">
          <div className="flex items-center gap-2">
            <img src="/home/p-peony.webp" alt="" loading="lazy" decoding="async" className="h-9 w-9 shrink-0 rounded object-cover" />
            <div className="min-w-0 flex-1 rounded border border-[#2E4A37]/15 px-1.5 py-1 font-semibold">{tr("Παιώνιες σε βάζο")}</div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border border-[#2E4A37]/15 px-1.5 py-1"><span className="block text-[7px] text-[#2E4A37]/55">{tr("Τιμή")}</span>24,00 €</div>
            <div className="rounded border border-[#2E4A37]/15 px-1.5 py-1"><span className="block text-[7px] text-[#2E4A37]/55">{tr("Απόθεμα")}</span>8</div>
          </div>
          <div className="flex justify-end"><span className="rounded-md bg-[#2E4A37] px-2 py-1 text-[8.5px] font-semibold text-white">{tr("Αποθήκευση")}</span></div>
        </div>
      </div>

      {/* 3 · published */}
      <div className={`absolute bottom-0 left-0 w-[66%] max-w-[260px] rounded-xl bg-white p-2.5 shadow-[0_24px_50px_-20px_rgba(31,54,40,0.55)] ring-1 ring-[#2E4A37]/10 ${fade} ${shown(step === 2)}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-[#1F3628]">{tr("Η βιτρίνα σου είναι online")}</span>
          <span className="flex h-4 w-7 shrink-0 items-center justify-end rounded-full bg-[#2E4A37] p-0.5"><span className="h-3 w-3 rounded-full bg-white" /></span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 rounded-md bg-[#F4F1EA] px-2 py-1.5">
          <span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-[#1F3628]">vitrinaki.gr/mano</span>
          <span className="shrink-0 rounded bg-[#C0503C] px-1.5 py-0.5 text-[8px] font-bold text-white">{tr("Αντιγραφή link")}</span>
        </div>
        <p className="mt-1.5 text-[8.5px] text-[#2E4A37]/65">{tr("ή στο δικό σου domain, π.χ. mano.gr")}</p>
      </div>

      {/* 4 · the first order */}
      <div className={`absolute bottom-0 right-0 w-[64%] max-w-[250px] ${fade} ${shown(step === 3)}`}>
        <div className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-[0_24px_50px_-20px_rgba(31,54,40,0.55)] ring-1 ring-[#2E4A37]/10">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#2E4A37] text-[#F7F2E8]"><Check size={12} /></span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[11px] font-bold text-[#1F3628]">{tr("Νέα παραγγελία")} #1024</span>
            <span className="block truncate text-[10px] font-semibold text-[#2E4A37]/70">{tr("Αρωματικό κερί")} · 18,00 €</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export function HowItWorksScroll({ intro }: { intro: React.ReactNode }) {
  const { tr } = useTranslator()
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLLIElement | null)[]>([])

  // The active step is the one crossing the middle of the viewport.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step))
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    )
    refs.current.forEach((node) => node && observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
      <div>
        {intro}
        <ol className="mt-10 lg:mt-0 lg:pb-[18vh]">
          {steps.map((step, i) => (
            <li
              key={step.key}
              ref={(node) => {
                refs.current[i] = node
              }}
              data-step={i}
              className="border-t border-[#2E4A37]/10 py-8 first:border-t-0 lg:flex lg:min-h-[72vh] lg:items-center lg:border-t-0 lg:py-0"
            >
              <div className={`transition-opacity duration-500 motion-reduce:transition-none ${active === i ? "lg:opacity-100" : "lg:opacity-35"}`}>
                <span className="flex items-center gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-full border font-serif text-xl italic transition-colors duration-500 motion-reduce:transition-none ${active === i ? "border-[#C0503C] bg-[#C0503C] text-white" : "border-[#2E4A37]/15 bg-[#F7F2E8] text-[#C0503C]"}`}>{i + 1}</span>
                  <span className="text-[13px] font-semibold tracking-wide text-[#2E4A37]/60">{tr(step.label)}</span>
                </span>
                <h3 className="mt-4 font-serif text-[1.7rem] font-medium leading-tight text-[#1F3628] sm:text-3xl">{tr(step.title)}</h3>
                <p className="mt-3 max-w-md text-[15px] leading-7 text-[#2E4A37]/75">{tr(step.text)}</p>
                {step.key === "order" ? (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#2E4A37]/15 bg-white/70 px-3 py-1 text-[12.5px] font-semibold text-[#1F3628]">
                    {tr("Πληρωμές με κάρτα")}
                    <span className="rounded-full bg-[#265E8E]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[#265E8E]">{tr("Σύντομα")}</span>
                  </p>
                ) : null}
              </div>
              <div className="mt-6 lg:hidden" aria-hidden="true">
                <StoryMockup step={i} className="mx-auto max-w-[520px]" />
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Pinned mockup (desktop) */}
      <div className="hidden lg:block" aria-hidden="true">
        <div className="sticky top-24 flex h-[calc(100vh-7rem)] flex-col justify-center">
          <div className="mx-auto w-full max-w-[600px]">
            <div className="mb-3 grid grid-cols-4 gap-2 px-6">
              {steps.map((step, i) => (
                <span key={step.key} className="min-w-0">
                  <span className="block h-1 overflow-hidden rounded-full bg-[#2E4A37]/10">
                    <span className={`block h-full rounded-full bg-[#C0503C] transition-[width] duration-500 motion-reduce:transition-none ${i <= active ? "w-full" : "w-0"}`} />
                  </span>
                  <span className={`mt-1.5 block truncate text-[11px] font-semibold transition-colors duration-500 motion-reduce:transition-none ${i === active ? "text-[#1F3628]" : "text-[#2E4A37]/45"}`}>{tr(step.label)}</span>
                </span>
              ))}
            </div>
            <StoryMockup step={active} />
          </div>
        </div>
      </div>
    </div>
  )
}
