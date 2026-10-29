"use client"

import { useEffect, useRef, useState } from "react"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"

// The home page hero: a full-bleed photo of one kind of business, with glass
// cards floating over it that show what its vitrinaki does (an order coming in,
// the day's bookings, the shop's address). Every few seconds it moves on to the
// next kind of business; the pills at the top switch by hand. The numbers on the
// cards are an example shop, not real figures.

const SCENE_MS = 7000

type Scene = {
  kind: string
  image: string
  position: string
  shop: string
  slug: string
  initials: string
  about: string
  color: string
  event: { label: string; title: string; meta: string }
  ring: { label: string; value: number; of: number; unit: string }
}

const scenes: Scene[] = [
  {
    kind: "Καταστήματα",
    image: "/home/kinds/demo-florist.webp",
    position: "60% 45%",
    shop: "Ανθοπωλείο Ίρις",
    slug: "anthopoleio-iris",
    about: "Ανθοπωλείο στην Αθήνα",
    initials: "Ί",
    color: "#C0503C",
    event: { label: "Νέα παραγγελία", title: "Μπουκέτο εποχής", meta: "28,00 € · Αθήνα" },
    ring: { label: "Παραγγελίες σήμερα", value: 12, of: 16, unit: "" },
  },
  {
    kind: "Δημιουργοί",
    image: "/home/kinds/crafts-wheel.webp",
    position: "35% 40%",
    shop: "Κεραμικά Νεφέλη",
    slug: "keramika-nefeli",
    about: "Εργαστήριο κεραμικής στη Θεσσαλονίκη",
    initials: "Ν",
    color: "#265E8E",
    event: { label: "Νέα παραγγελία", title: "Κούπα από πηλό, σετ 2", meta: "44,00 € · Θεσσαλονίκη" },
    ring: { label: "Επισκέψεις σήμερα", value: 48, of: 60, unit: "" },
  },
  {
    kind: "Παραγωγοί",
    image: "/home/kinds/food-field.webp",
    position: "50% 60%",
    shop: "Κτήμα Λιόφως",
    slug: "ktima-liofos",
    about: "Ελαιοπαραγωγός στη Μεσσηνία",
    initials: "Λ",
    color: "#2E4A37",
    event: { label: "Νέα παραγγελία", title: "Ελαιόλαδο 1L × 3", meta: "43,50 € · Πάτρα" },
    ring: { label: "Αποστολές εβδομάδας", value: 31, of: 40, unit: "" },
  },
  {
    kind: "Επαγγελματίες",
    image: "/home/kinds/demo-spa.webp",
    position: "40% 50%",
    shop: "Spa Γαλήνη",
    slug: "spa-galini",
    about: "Spa και μασάζ στο Ηράκλειο",
    initials: "Γ",
    color: "#8A6A3B",
    event: { label: "Νέο ραντεβού", title: "Μασάζ 60′", meta: "Πέμπτη · 18:30" },
    ring: { label: "Ραντεβού εβδομάδας", value: 26, of: 32, unit: "" },
  },
]

const css = `
.vkc-img{opacity:0;transform:scale(1.1);transition:opacity 1.2s ease,transform ${SCENE_MS + 1500}ms linear}
.vkc-img[data-on="true"]{opacity:1;transform:scale(1)}
.vkc-in{animation:vkcIn .8s cubic-bezier(.2,.7,.2,1) both}
@keyframes vkcIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.vkc-bar{transform-origin:left;animation:vkcBar ${SCENE_MS}ms linear both}
@keyframes vkcBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.vkc-ring{transition:stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1)}
.vkc-pulse{animation:vkcPulse 2s ease-out infinite}
@keyframes vkcPulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,.55)}100%{box-shadow:0 0 0 10px rgba(255,255,255,0)}}
@media (prefers-reduced-motion:reduce){.vkc-img{transition:opacity .3s ease;transform:none}.vkc-img[data-on="true"]{transform:none}.vkc-in,.vkc-pulse{animation:none}.vkc-bar{animation:none;transform:scaleX(0)}.vkc-ring{transition:none}}
`

const glass = "border border-white/20 bg-white/[0.12] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl"

function Ring({ value, of, color }: { value: number; of: number; color: string }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 80 80" className="h-[92px] w-[92px] -rotate-90" aria-hidden="true">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="5" strokeDasharray="2 3.2" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / of)} className="vkc-ring" />
    </svg>
  )
}

export function CinematicHero({ lang, businessUrl, tryHref = "#try" }: { lang: Lang; businessUrl: string; tryHref?: string }) {
  const tr = translator(lang)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [visible, setVisible] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const scene = scenes[index]

  // No auto-play for people who ask for reduced motion; they can still press play.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false)
  }, [])

  // Hold still while the hero is scrolled away or the tab is in the background.
  useEffect(() => {
    let onScreen = true
    const update = () => setVisible(onScreen && document.visibilityState === "visible")
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      update()
    })
    if (observer && ref.current) observer.observe(ref.current)
    document.addEventListener("visibilitychange", update)
    return () => {
      observer?.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])

  const running = playing && visible
  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % scenes.length), SCENE_MS)
    return () => window.clearTimeout(timer)
  }, [running, index])

  return (
    <div ref={ref} className="px-3 pb-3 pt-2 sm:px-5 sm:pb-5">
      <style>{css}</style>
      <div className="relative isolate flex min-h-[640px] flex-col overflow-hidden rounded-[28px] bg-[#14231A] text-white sm:min-h-[680px] lg:h-[calc(100svh-104px)] lg:max-h-[860px] lg:min-h-[640px]">
        {/* the photos, cross-fading with a slow zoom */}
        {scenes.map((s, i) => (
          <img
            key={s.image}
            src={s.image}
            alt=""
            aria-hidden="true"
            data-on={i === index}
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "low"}
            decoding="async"
            className="vkc-img absolute inset-0 -z-20 h-full w-full object-cover"
            style={{ objectPosition: s.position }}
          />
        ))}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,20,14,.5)_0%,rgba(10,20,14,.15)_30%,rgba(10,20,14,.3)_55%,rgba(10,20,14,.88)_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_75%_70%_at_0%_100%,rgba(10,20,14,.75)_0%,transparent_70%)]" />

        {/* top: kinds of business */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-6">
          <div role="tablist" aria-label={tr("Είδος επιχείρησης")} className={`flex max-w-full gap-1 overflow-x-auto rounded-full p-1 ${glass}`}>
            {scenes.map((s, i) => (
              <button
                key={s.kind}
                type="button"
                role="tab"
                aria-selected={i === index}
                onClick={() => setIndex(i)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition sm:px-4 sm:text-[13px] ${i === index ? "bg-white text-[#1F3628]" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
              >
                {tr(s.kind)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? tr("Παύση") : tr("Αναπαραγωγή")}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/25 ${glass}`}
          >
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="3" y="2" width="2.6" height="10" rx="1" fill="currentColor" /><rect x="8.4" y="2" width="2.6" height="10" rx="1" fill="currentColor" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2.5v9l7.5-4.5z" fill="currentColor" /></svg>
            )}
          </button>
        </div>

        {/* left: the example shop's live cards (desktop) */}
        <div key={`cards-${index}`} className="absolute right-10 top-24 hidden w-[290px] flex-col gap-3 lg:flex" aria-hidden="true">
          <div className={`vkc-in rounded-2xl p-4 ${glass}`}>
            <p className="flex items-center gap-2 text-[12px] font-semibold text-white/75">
              <span className="vkc-pulse h-2 w-2 rounded-full bg-white" />
              {tr(scene.event.label)}
            </p>
            <p className="mt-2 text-[17px] font-semibold leading-snug">{tr(scene.event.title)}</p>
            <p className="mt-0.5 text-[13px] text-white/70">{tr(scene.event.meta)}</p>
          </div>
          <div className={`vkc-in flex items-center gap-3 rounded-2xl p-4 [animation-delay:.12s] ${glass}`}>
            <div className="relative">
              <Ring value={scene.ring.value} of={scene.ring.of} color="#F3B7A8" />
              <span className="absolute inset-0 grid place-items-center text-[26px] font-semibold tabular-nums">{scene.ring.value}</span>
            </div>
            <p className="text-[13px] leading-snug text-white/80">{tr(scene.ring.label)}</p>
          </div>
          <div className={`vkc-in flex items-center gap-3 rounded-2xl p-4 [animation-delay:.24s] ${glass}`}>
            <p className="text-[30px] font-semibold leading-none tracking-tight">24/7</p>
            <p className="text-[12.5px] leading-snug text-white/75">{tr("Ανοιχτά online, ακόμα κι όταν κλείνει το μαγαζί.")}</p>
          </div>
        </div>

        {/* bottom: the message */}
        <div className="mt-auto grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end lg:p-10">
          <div className="max-w-[640px]">
            {/* the event card, on small screens */}
            <div key={`event-${index}`} className={`vkc-in mb-6 inline-flex items-center gap-3 rounded-2xl px-3.5 py-2.5 lg:hidden ${glass}`} aria-hidden="true">
              <span className="vkc-pulse h-2 w-2 shrink-0 rounded-full bg-white" />
              <span className="text-[13px] leading-tight">
                <span className="font-semibold">{tr(scene.event.label)}</span>
                <span className="text-white/75"> · {tr(scene.event.title)} · {tr(scene.event.meta)}</span>
              </span>
            </div>
            <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F3B7A8]" />
              {tr("Για κάθε επιχείρηση, σε όλη την Ελλάδα")}
            </p>
            <h1 className="mt-3 text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[3.4rem] lg:text-[3.9rem]">
              {tr("Το όνειρό σου αξίζει μια βιτρίνα.")}{" "}
              <span className="text-[#F3B7A8]">{tr("Άνοιξέ τη σήμερα.")}</span>
            </h1>
            <p className="mt-4 max-w-[520px] text-[15px] leading-7 text-white/80 sm:text-[16px]">
              {tr("Ιστοσελίδα, e-shop και κρατήσεις για τη δική σου επιχείρηση. Χωρίς τεχνικές γνώσεις, με ανθρώπους δίπλα σου.")}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={businessUrl}
                className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-[#C0503C] py-1.5 pl-6 pr-1.5 text-[15px] font-semibold text-white shadow-[0_12px_30px_-10px_rgba(192,80,60,0.9)] transition hover:bg-[#ad4633]"
              >
                {tr("Άνοιξε τη βιτρίνα σου")}
                <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">→</span>
              </a>
              <a href={tryHref} className={`inline-flex min-h-12 items-center rounded-full px-6 text-[15px] font-semibold text-white transition hover:bg-white/25 ${glass}`}>
                {tr("Δοκίμασέ το")}
              </a>
            </div>
          </div>

          {/* the example shop's address, with the scene's timer */}
          <div key={`shop-${index}`} className={`vkc-in hidden w-[290px] rounded-2xl p-4 sm:block ${glass}`} aria-live="polite">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[17px] font-bold text-white" style={{ background: scene.color }}>
                {scene.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{tr(scene.shop)}</p>
                <p className="truncate text-[12px] text-white/70">vitrinaki.gr/{scene.slug}</p>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-snug text-white/75">{tr(scene.about)} · {tr("παράδειγμα")}</p>
            <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-white/20">
              <div key={`${index}-${running}`} className={`h-full rounded-full bg-white ${running ? "vkc-bar" : "w-0"}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
