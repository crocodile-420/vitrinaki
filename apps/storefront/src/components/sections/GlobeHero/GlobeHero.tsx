"use client"

import { useEffect, useRef, useState } from "react"
import { translator, type Lang } from "@/lib/i18n/vitrinaki"

// The home page hero. It opens on a curved strip of shop cards, one per kind
// of business, turning like a carousel. On scroll the page turns dark, a globe appears and every card flies
// to a Greek town, where it becomes a light; then the globe turns out to the
// world with arcs to customers abroad, while what a shop gets scrolls past.
// The globe is cobe (WebGL), loaded on the client only.

const K = "/home/kinds/"

const cards = [
  ["demo-florist.webp", "Ανθοπωλείο"], ["crafts-cups.webp", "Κεραμικά"], ["food-honey.webp", "Μέλι"], ["try-yoga.webp", "Yoga"],
  ["retail-sunglasses.webp", "Οπτικά"], ["food-wine.webp", "Οινοποιείο"], ["beauty-facial.webp", "Αισθητική"], ["crafts-necklace.webp", "Κοσμήματα"],
  ["stay-suite.webp", "Διαμονή"], ["food-cheese.webp", "Τυροκομείο"], ["fitness-class.webp", "Γυμναστήριο"], ["demo-tulips.webp", "Λουλούδια"],
] as const

const features = [
  ["Ιστοσελίδα με το όνομά σου", "Λογότυπο, χρώματα και κείμενα δικά σου. Στο vitrinaki.gr ή στο δικό σου domain."],
  ["E-shop που πουλάει", "Προϊόντα, απόθεμα και παραγγελίες σε ένα Studio, απλό όσο ένα κινητό."],
  ["Κρατήσεις online", "Οι πελάτες κλείνουν ραντεβού μόνοι τους, εσύ βλέπεις το ημερολόγιο."],
  ["Πληρωμές με κάρτα", "Τα χρήματα πάνε κατευθείαν στον λογαριασμό σου."],
  ["Μέσα στο ψηφιακό εμπόριο", "Η βιτρίνα σου μπαίνει στην αγορά του vitrinaki, δίπλα σε καταστήματα από όλη την Ελλάδα, με πελάτες απ' όλο τον κόσμο."],
] as const

// Greek towns (the first twelve take the cards) and cities abroad the arcs go to
const towns: [number, number][] = [
  [37.98, 23.73], [40.64, 22.94], [35.34, 25.13], [38.25, 21.73], [39.66, 20.85], [39.64, 22.42], [39.36, 22.94], [35.51, 24.02], [36.43, 28.22],
  [37.04, 22.11], [37.1, 25.38], [39.62, 19.92], [40.94, 24.41], [37.07, 22.43], [37.57, 22.8], [38.9, 22.43], [41.12, 25.4], [36.89, 27.29], [38.37, 26.14], [39.1, 26.55],
]
const buyers: [number, number][] = [[52.52, 13.4], [48.86, 2.35], [51.5, -0.12], [40.71, -74.0], [-33.86, 151.2], [43.65, -79.38], [45.46, 9.19], [59.33, 18.07], [25.2, 55.27], [50.85, 4.35]]

const LAT0 = 38.5
const LON0 = 23.5
const angles = ([lat, lon]: [number, number]) => [Math.PI - ((lon * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180] as const
// where a town sits on the globe canvas (orthographic, centred on Greece), as a fraction of the globe radius
function project([lat, lon]: [number, number]) {
  const r = Math.PI / 180
  const x = Math.cos(lat * r) * Math.sin((lon - LON0) * r)
  const y = -(Math.cos(LAT0 * r) * Math.sin(lat * r) - Math.sin(LAT0 * r) * Math.cos(lat * r) * Math.cos((lon - LON0) * r))
  return [x, y]
}
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
// rounded so the server and the browser print the same style values
const r2 = (x: number) => Math.round(x * 100) / 100
const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)

// the globe's starting zoom, and how far a card lands from the centre per unit of radius
const SCALE = 1.5
const RADIUS = 0.55

const ctaGlow =
  "inline-flex min-h-12 items-center gap-2 rounded-full bg-[#E0634B] px-7 text-[15px] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,.15)_inset,0_10px_40px_-6px_rgba(224,99,75,.75)] transition hover:bg-[#ea7058]"

export function GlobeHero({ lang, businessUrl, tryHref = "#try" }: { lang: Lang; businessUrl: string; tryHref?: string }) {
  const tr = translator(lang)
  const track = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const paused = useRef(false)
  const [p, setP] = useState(0)
  const [offset, setOffset] = useState(0)
  const [cw, setCw] = useState(1200)
  const [vw, setVw] = useState(1280)
  const [hh, setHh] = useState(0)

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let cur = 0
    let last = performance.now()
    let globe: { update: (s: Record<string, unknown>) => void; destroy: () => void } | null = null
    let gone = false
    const [phi0, theta0] = angles([LAT0, LON0])
    setVw(window.innerWidth)
    // the site header is sticky too: the scene starts under it
    setHh(document.querySelector("header")?.offsetHeight || 0)
    import("cobe").then(({ default: createGlobe }) => {
      const c = canvas.current
      if (!c || gone) return
      const size = c.offsetWidth
      setCw(size)
      globe = createGlobe(c, {
        devicePixelRatio: 2, width: size * 2, height: size * 2, phi: phi0, theta: theta0,
        dark: 1, diffuse: 1.4, mapSamples: 60000, mapBrightness: 5, mapBaseBrightness: 0.04,
        baseColor: [0.16, 0.24, 0.2], markerColor: [0.95, 0.5, 0.38], glowColor: [0.18, 0.32, 0.26],
        markers: [], arcs: [], arcColor: [0.95, 0.72, 0.62], arcWidth: 0.5, arcHeight: 0.25, scale: SCALE, opacity: 0.95,
      }) as never
    })
    const loop = (now: number) => {
      const el = track.current
      if (el) {
        const r = el.getBoundingClientRect()
        const target = clamp01(-r.top / (r.height - window.innerHeight))
        cur += (target - cur) * (still ? 1 : 0.18)
        setP(cur)
        // the strip turns only while the visitor is at the top, a card every 2.6s
        if (!still && !paused.current && cur < 0.01) setOffset((o) => (o + (now - last) / 2600) % cards.length)
        if (globe) {
          const lit = clamp01((cur - 0.3) / 0.12)
          const zoom = easeInOut(clamp01((cur - 0.42) / 0.3))
          const nb = Math.ceil(clamp01((cur - 0.55) / 0.2) * buyers.length)
          const shown = towns.slice(0, cards.length + Math.ceil(lit * (towns.length - cards.length)))
          globe.update({
            scale: SCALE - zoom * 0.7,
            phi: phi0 + zoom * 0.5,
            theta: theta0 - zoom * 0.3,
            markers:
              cur < 0.28
                ? []
                : [
                    ...shown.map((t) => ({ location: t, size: 0.016 + zoom * 0.01 })),
                    ...buyers.slice(0, nb).map((b) => ({ location: b, size: 0.025, color: [0.95, 0.85, 0.8] as [number, number, number] })),
                  ],
            arcs: buyers.slice(0, nb).map((b, k) => ({ from: towns[k % cards.length], to: b })),
          })
        }
      }
      last = now
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      gone = true
      cancelAnimationFrame(raf)
      globe?.destroy()
    }
  }, [])

  const dark = clamp01((p - 0.06) / 0.1)
  const heroO = 1 - clamp01(p / 0.1)
  const fly = easeInOut(clamp01((p - 0.04) / 0.26))
  const cardsO = 1 - clamp01((p - 0.31) / 0.05)
  const globeO = clamp01((p - 0.12) / 0.1)
  const mist = clamp01((p - 0.86) / 0.14)
  const R = (cw / 2) * RADIUS * SCALE
  const n = cards.length
  const small = vw < 640
  const cardW = small ? 135 : 190
  const cardH = small ? 200 : 280
  // the strip's centre, below the centre of the frame (which the sticky header pushes down)
  const stripY = (small ? 110 : 170) - hh / 2

  return (
    <div ref={track} className="relative" style={{ height: "600vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-[#F7F2E8]">
        <div className="absolute overflow-hidden bg-[#E6EDE3]" style={{ inset: `${(1 - dark) * 10}px`, top: hh + (1 - dark) * 10, borderRadius: `${(1 - dark) * 28}px` }}>
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,#123024_0%,#070B09_70%)]" style={{ opacity: dark }} />
          <canvas ref={canvas} aria-hidden="true" className="absolute left-1/2 top-1/2 aspect-square w-[max(120vh,105vw)] -translate-x-1/2 -translate-y-1/2" style={{ opacity: globeO }} />

          <div className="absolute inset-x-0 top-0 pt-12 text-center text-[#14301F] sm:pt-14" style={{ opacity: heroO, transform: `translateY(${-p * 600}px)`, visibility: heroO > 0 ? "visible" : "hidden" }}>
            <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#14301F]/[0.07] px-3.5 py-1.5 text-[12.5px] font-semibold">
              <span className="rounded-full bg-[#14301F] px-2 py-0.5 text-[11px] text-white">{tr("Νέο")}</span> {tr("Κρατήσεις online για κάθε επιχείρηση")}
            </p>
            <h1 className="mx-auto mt-5 max-w-[860px] px-4 text-[2.5rem] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[4.2rem]">{tr("Το όνειρό σου αξίζει")}<br />{tr("μια βιτρίνα.")}</h1>
            <p className="mx-auto mt-4 max-w-[520px] px-5 text-[15px] leading-7 text-[#14301F]/70 sm:text-[17px]">
              {tr("Ιστοσελίδα, e-shop και κρατήσεις για το μαγαζί, το εργαστήρι ή το studio σου.")}
            </p>
            <svg className="absolute right-[7%] top-[60%] hidden h-24 w-28 text-[#14301F] lg:block" viewBox="0 0 120 100" fill="none" aria-hidden="true">
              <text x="10" y="22" fontFamily="cursive" fontSize="16" fill="currentColor" transform="rotate(12 60 20)">{tr("όλοι χωράνε!")}</text>
              <path d="M70 40c-6 20-22 34-44 40m0 0 10-10m-10 10 13 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>

          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ perspective: 1100, opacity: cardsO, visibility: cardsO > 0 ? "visible" : "hidden" }}
            onMouseEnter={() => (paused.current = true)}
            onMouseLeave={() => (paused.current = false)}
          >
            {cards.map(([img, label], i) => {
              // on the strip: k cards from the middle; then a light on its town
              let k = i - offset
              if (k > n / 2) k -= n
              if (k < -n / 2) k += n
              const abs = Math.abs(k)
              const [tx, ty] = project(towns[i])
              const x = k * (small ? 150 : 205) * (1 - fly) + tx * R * fly
              const y = stripY * (1 - fly) + ty * R * fly
              const z = abs * abs * 14 * (1 - fly)
              const edge = fly < 0.05 && abs > 4.8
              return (
                <figure
                  key={img}
                  className="absolute left-1/2 top-1/2 overflow-hidden bg-white"
                  style={{
                    width: r2(cardW + (12 - cardW) * fly),
                    height: r2(cardH + (12 - cardH) * fly),
                    borderRadius: 18 + fly * 8,
                    transform: `translate(-50%,-50%) translate3d(${r2(x)}px,${r2(y)}px,${r2(z)}px) rotateY(${r2(-k * 11 * (1 - fly))}deg)`,
                    zIndex: 10 - Math.round(abs),
                    opacity: edge ? r2(Math.max(0, 5.5 - abs)) : 1,
                    boxShadow: `0 20px 40px -20px rgba(20,48,31,.5), 0 0 ${fly * 24}px ${fly * 6}px rgba(242,128,97,${r2(fly * 0.9)})`,
                  }}
                >
                  <img src={K + img} alt="" loading={abs < 3 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-[#F2805F]" style={{ opacity: clamp01((fly - 0.6) / 0.35) }} />
                  <figcaption className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl bg-white/85 px-2.5 py-1.5 text-left text-[11.5px] font-semibold text-[#14301F] backdrop-blur" style={{ opacity: 1 - clamp01(fly / 0.3) }}>
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#14301F] text-[9px] text-white">▶</span>
                    {tr(label)}
                  </figcaption>
                </figure>
              )
            })}
          </div>

          <div className="absolute inset-x-0 bottom-8 flex flex-wrap justify-center gap-3 px-4" style={{ opacity: heroO, visibility: heroO > 0 ? "visible" : "hidden" }}>
            <a href={businessUrl} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#14301F] px-7 text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(20,48,31,.8)] transition hover:bg-[#1F3628]">
              {tr("Άνοιξε τη βιτρίνα σου")} <span aria-hidden="true">→</span>
            </a>
            <a href={tryHref} className="inline-flex min-h-12 items-center rounded-full border border-[#14301F]/20 bg-white/50 px-6 text-[15px] font-semibold text-[#14301F] transition hover:bg-white">
              {tr("Δοκίμασέ το")}
            </a>
          </div>

          <p aria-hidden="true" className="absolute inset-x-0 top-[16%] px-5 text-center text-[15px] font-semibold text-white/85" style={{ opacity: clamp01((fly - 0.7) / 0.2) * (1 - clamp01((p - 0.38) / 0.04)) }}>
            {tr("Κάθε βιτρίνα ανάβει ένα φως στον χάρτη.")}
          </p>
        </div>
        <div aria-hidden="true" className="absolute inset-0" style={{ opacity: mist, background: "radial-gradient(ellipse 60% 60% at 30% 40%,#fff 0%,transparent 70%),radial-gradient(ellipse 70% 60% at 75% 65%,#F7F2E8 0%,transparent 70%),rgba(247,242,232,.97)" }} />
      </div>

      {/* scrolls over the globe; Greek capitals lose their accents through lang="el" */}
      <div lang={lang} className="pointer-events-none absolute inset-0 text-center text-[#F7F5EF] [text-shadow:0_10px_30px_rgba(0,0,0,.6)]">
        <div className="absolute inset-x-0 top-[250vh] px-5">
          <p className="text-[13px] font-bold tracking-[0.3em]">VITRINAKI.GR</p>
          <h2 className="mx-auto mt-4 max-w-[900px] text-[2.6rem] font-extrabold uppercase leading-[0.98] tracking-[-0.02em] sm:text-[5.4rem]">{tr("Το μαγαζί σου στο ψηφιακό εμπόριο.")}</h2>
          <a href={businessUrl} className={`${ctaGlow} pointer-events-auto mt-8 [text-shadow:none]`}>
            {tr("Άνοιξε τη βιτρίνα σου")} <span aria-hidden="true">→</span>
          </a>
        </div>
        {features.map(([title, text], i) => {
          const left = i % 2 === 0
          const center = i === features.length - 1
          return (
            <div
              key={title}
              className={`absolute w-[min(320px,80vw)] px-2 ${center ? "left-1/2 -translate-x-1/2 text-center" : left ? "right-[calc(50%+200px)] text-right max-sm:left-1/2 max-sm:right-auto max-sm:-translate-x-1/2 max-sm:text-center" : "left-[calc(50%+200px)] text-left max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:text-center"}`}
              style={{ top: `${center ? 440 : 320 + Math.floor(i / 2) * 50 + (left ? 0 : 20)}vh` }}
            >
              <h3 className="text-[22px] font-bold uppercase leading-tight sm:text-[26px]">{tr(title)}</h3>
              <p className="mt-2 text-[15px] leading-6 text-white/90">{tr(text)}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
