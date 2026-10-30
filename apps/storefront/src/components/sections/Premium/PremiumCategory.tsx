"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { useTranslator } from "@/lib/i18n/client"

import { GlassEntrance, type GlassCopy } from "./GlassEntrance"
import { PREMIUM_TEMPLATES, type PremiumTemplate } from "./premium-templates"

// The Premium category page: the glass entrance sits over the gallery. Opening
// shatters the glass and the 16 templates show through; «Πίσω στο γυαλί»
// scrolls up and flies the pieces back. Each card opens its live demo.

const DEMO = "/premium/demo.html?embed"
const HEIGHT = "h-[calc(100svh-4.5rem)] min-h-[560px]"

export function PremiumCategory({ startHref }: { startHref: string }) {
  const { lang, tr } = useTranslator()
  const [open, setOpen] = useState(false)
  const [settled, setSettled] = useState<"open" | "closed">("closed")
  const [demo, setDemo] = useState<PremiumTemplate | null>(null)
  const top = useRef<HTMLDivElement>(null)

  const copy = useMemo<GlassCopy>(() => ({
    brand: "vitrinaki premium",
    nav: [tr("Πρότυπα"), tr("Live demo"), tr("Πώς χρεώνεται")],
    start: tr("Ξεκίνα"),
    eyebrow: tr("VITRINAKI PREMIUM · 16 ΠΡΟΤΥΠΑ ΜΕ ΚΙΝΗΣΗ"),
    title: [tr("Το site σου,"), tr("σε κίνηση.")],
    sub: [
      tr("Πρότυπα με κίνηση, 3D και αλληλεπίδραση, για κάθε είδος επιχείρησης."),
      tr("Βάζεις τα δικά σου στοιχεία και η βιτρίνα σου ξεχωρίζει."),
    ],
    subPhone: [tr("Πρότυπα με κίνηση και 3D,"), tr("για κάθε είδος επιχείρησης.")],
    open: tr("Άνοιξε τα πρότυπα"),
    startLink: tr("Ξεκίνα τη βιτρίνα σου →"),
    footLeft: "© vitrinaki.gr",
    footRight: tr("Πάτα το γυαλί για να μπεις"),
  }), [tr])

  const goStart = useCallback(() => {
    window.location.href = startHref
  }, [startHref])
  const close = useCallback(() => {
    const y = top.current ? top.current.getBoundingClientRect().top + window.scrollY - 80 : 0
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" })
    setTimeout(() => setOpen(false), window.scrollY > y + 40 ? 450 : 0)
  }, [])

  const clipped = !open && settled === "closed"

  return (
    <div ref={top} lang={lang} className="relative bg-[#050507] text-white">
      <div className={clipped ? `${HEIGHT} overflow-hidden` : ""}>
        <div
          inert={!open}
          className={`transition-opacity ${open ? "opacity-100 delay-200 duration-700" : "opacity-0 duration-300"}`}
        >
          <Gallery lang={lang} tr={tr} open={open} startHref={startHref} onBack={close} onDemo={setDemo} />
        </div>
      </div>
      <div className={`absolute inset-x-0 top-0 z-10 ${HEIGHT} ${settled === "open" && open ? "pointer-events-none" : ""}`}>
        <GlassEntrance copy={copy} open={open} onOpen={() => setOpen(true)} onStart={goStart} onSettled={setSettled} />
      </div>
      {demo && <DemoDialog template={demo} lang={lang} tr={tr} startHref={startHref} onClose={() => setDemo(null)} />}
    </div>
  )
}

type Tr = (greek: string) => string

function Gallery({ lang, tr, open, startHref, onBack, onDemo }: {
  lang: "el" | "en"
  tr: Tr
  open: boolean
  startHref: string
  onBack: () => void
  onDemo: (t: PremiumTemplate) => void
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-5 pb-24 pt-8 sm:px-8 lg:px-12">
      <button
        type="button"
        onClick={onBack}
        className={`group relative mb-10 inline-flex h-12 items-center pl-5 pr-7 text-sm font-medium text-white transition-transform duration-500 [transform:perspective(900px)_rotateY(-9deg)_rotateX(4deg)] ${open ? "scale-100" : "scale-0"}`}
      >
        <span aria-hidden="true" className="absolute inset-0 rounded-md bg-gradient-to-br from-[#2a2a33] via-[#121216] to-[#1f1d2a] shadow-[inset_0_0_0_1px_rgba(255,255,255,.18),0_10px_18px_rgba(0,0,0,.8)] [clip-path:polygon(0_12%,96%_0,100%_100%,3%_88%)]" />
        <span className="relative transition-colors group-hover:text-[#b9abff]">← {tr("Πίσω στο γυαλί")}</span>
      </button>

      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">Vitrinaki Premium</p>
      <h2 className="mt-3 max-w-[18ch] text-[clamp(36px,5.4vw,72px)] font-medium leading-[1.02] tracking-[-0.035em] text-[#e4e4e9]">
        {tr("16 πρότυπα που κινούνται.")}
      </h2>
      <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-white/60">
        {tr("Κίνηση, 3D και αλληλεπίδραση, σχεδιασμένα για αυτό που χρειάζεται κάθε μικρή επιχείρηση. Διαλέγεις πρότυπο, βάζεις τις φωτογραφίες, τα προϊόντα και τα στοιχεία σου, και η βιτρίνα σου είναι έτοιμη.")}
      </p>

      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PREMIUM_TEMPLATES.map((t, i) => (
          <li
            key={t.id}
            style={{ transitionDelay: open ? `${200 + Math.min(i, 8) * 60}ms` : "0ms" }}
            className={`transition-[opacity,transform] duration-700 ease-out ${open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
          >
            <TemplateCard t={t} n={i + 1} lang={lang} tr={tr} startHref={startHref} onDemo={() => onDemo(t)} />
          </li>
        ))}
      </ul>

      <section className="mt-20 grid gap-8 rounded-[24px] bg-gradient-to-br from-[#16161b] to-[#0d0d11] p-7 shadow-[inset_0_0_0_1px_rgba(255,255,255,.1)] sm:p-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h3 className="text-2xl font-medium tracking-[-0.02em] text-[#e4e4e9]">{tr("Πώς χρεώνεται")}</h3>
          <p className="mt-3 max-w-[56ch] leading-relaxed text-white/60">
            {tr("Το premium πρότυπο είναι μηνιαία προσθήκη στη συνδρομή σου, με ένα εφάπαξ κόστος ενεργοποίησης στην πρώτη πληρωμή. Το ενεργοποιείς από το Studio και το σταματάς όποτε θέλεις: η βιτρίνα σου γυρίζει σε απλό πρότυπο, χωρίς να χαθεί τίποτα.")}
          </p>
          <p className="mt-3 max-w-[56ch] leading-relaxed text-white/60">
            {tr("Στο πακέτο Business όλα τα premium πρότυπα περιλαμβάνονται, χωρίς μηνιαία ή εφάπαξ χρέωση.")}
          </p>
        </div>
        <div className="flex flex-col items-start justify-end gap-3 lg:items-end">
          <a href={startHref} className="rounded-md bg-[#ececf0] px-5 py-3 text-sm font-semibold text-[#111] transition-colors hover:bg-[#b9abff]">
            {tr("Ξεκίνα τη βιτρίνα σου")}
          </a>
          <LocalizedClientLink href="/pricing" className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline">
            {tr("Δες τα πακέτα")} →
          </LocalizedClientLink>
        </div>
      </section>

      <p className="mt-6 text-xs text-white/40">
        {tr("Τα γραφικά στα demo είναι δείγματα. Στη δική σου βιτρίνα μπαίνουν οι φωτογραφίες, τα προϊόντα και τα στοιχεία σου.")}
      </p>
    </div>
  )
}

function TemplateCard({ t, n, lang, tr, startHref, onDemo }: {
  t: PremiumTemplate
  n: number
  lang: "el" | "en"
  tr: Tr
  startHref: string
  onDemo: () => void
}) {
  const [bg, ink, acc] = t.colors
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-[#111115] shadow-[inset_0_0_0_1px_rgba(255,255,255,.1)] transition-shadow hover:shadow-[inset_0_0_0_1px_rgba(185,171,255,.45)]">
      <button type="button" onClick={onDemo} className="relative block aspect-[16/10] overflow-hidden text-left" style={{ background: bg, color: ink }} aria-label={`${tr("Live demo")}: ${t.name[lang]}`}>
        <span aria-hidden="true" className="absolute -right-10 -top-12 h-44 w-44 rounded-full opacity-90 transition-transform duration-700 ease-out group-hover:-translate-x-6 group-hover:translate-y-4 group-hover:scale-110" style={{ background: acc }} />
        <span aria-hidden="true" className="absolute -bottom-16 left-1/3 h-36 w-36 rounded-full opacity-25 transition-transform duration-700 ease-out group-hover:-translate-y-5" style={{ background: ink }} />
        {t.scifi && (
          <span aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(180deg,transparent,#000)]" />
        )}
        <span className="absolute left-5 top-4 text-[11px] font-semibold tracking-[0.14em] opacity-60">{String(n).padStart(2, "0")}</span>
        <span className="absolute bottom-5 left-5 right-5 text-[clamp(26px,2.6vw,34px)] leading-[1.02] tracking-[-0.01em] transition-transform duration-500 group-hover:-translate-y-1" style={{ fontFamily: t.font, fontWeight: 700 }}>
          {t.name[lang]}
        </span>
        <span className="absolute right-4 top-4 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          ▶ {tr("Live demo")}
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
          {t.kind[lang]}
          {t.scifi && <span className="rounded-full border border-[#b9abff]/40 px-2 py-0.5 text-[10px] text-[#b9abff]">Sci-fi</span>}
        </div>
        <p className="text-[15px] leading-relaxed text-white/75">{t.about[lang]}</p>
        <div className="flex flex-wrap gap-1.5">
          {t.needs[lang].map((x) => (
            <span key={x} className="rounded-full bg-white/[0.07] px-2.5 py-1 text-xs text-white/70">{x}</span>
          ))}
          {t.motion[lang].map((x) => (
            <span key={x} className="rounded-full border border-[#b9abff]/30 px-2.5 py-1 text-xs text-[#cfc6ff]">{x}</span>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-4 pt-2">
          <button type="button" onClick={onDemo} className="rounded-md bg-[#ececf0] px-3.5 py-2 text-sm font-semibold text-[#111] transition-colors hover:bg-[#b9abff]">
            {tr("Live demo")}
          </button>
          <a href={startHref} className="text-sm text-white/70 hover:text-white">{tr("Το θέλω")} →</a>
        </div>
      </div>
    </article>
  )
}

function DemoDialog({ template, lang, tr, startHref, onClose }: {
  template: PremiumTemplate
  lang: "el" | "en"
  tr: Tr
  startHref: string
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    d.showModal()
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={template.name[lang]}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-[#050507] p-0 text-white backdrop:bg-black/80"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{template.name[lang]}</p>
            <p className="truncate text-xs text-white/50">{template.kind[lang]} · demo</p>
          </div>
          <a href={startHref} className="rounded-md bg-[#ececf0] px-3.5 py-2 text-sm font-semibold text-[#111] hover:bg-[#b9abff]">{tr("Το θέλω")}</a>
          <button type="button" onClick={() => ref.current?.close()} className="grid h-9 w-9 place-items-center rounded-md text-xl text-white/70 hover:bg-white/10 hover:text-white" aria-label={tr("Κλείσιμο")}>
            ×
          </button>
        </div>
        <iframe src={`${DEMO}#${template.id}`} title={template.name[lang]} className="min-h-0 w-full flex-1 border-0 bg-white" />
      </div>
    </dialog>
  )
}
