import type React from "react"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"

import type { Site, SiteIcon } from "./sites"

/* One example website, drawn on a 960 × 640 canvas that scales with its box (container query
   units), so the hero and the small gallery cards show exactly the same page. Sizes inside are
   canvas pixels: u(18) is 18px at full size. */
const u = (n: number) => `calc(${n} * var(--u))`

const initialsOf = (value: string) =>
  value.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "V"

const iconPaths: Record<SiteIcon | "check" | "clock" | "chart", React.ReactNode> = {
  leaf: <><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19 13 11" /></>,
  bag: <><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  bed: <><path d="M3 18V7M21 18v-5a3 3 0 0 0-3-3H10v8" /><path d="M3 14h18" /><circle cx="6.5" cy="10.5" r="1.5" /></>,
  map: <><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z" /><path d="M9 4v14M15 6v14" /></>,
  doc: <><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v4h4M9 12h6M9 16h4" /></>,
  code: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></>,
  home: <><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10M10 20v-6h4v6" /></>,
  brush: <><path d="M14 4 20 10l-8 8-4-1-1-4 7-9Z" /><path d="M7 13c-2 0-4 2-4 5h3c2 0 4-1 4-3" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  chart: <path d="M4 19h16M7 16v-4M12 16V8M17 16v-6" />,
}

export function SiteIconSvg({ name, size, className = "" }: { name: keyof typeof iconPaths; size: string | number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size }} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {iconPaths[name]}
    </svg>
  )
}

/* Hero pictures for businesses without a product photo: a booking card, an app dashboard, a timetable. */
function HeroArt({ kind, site, lang }: { kind: NonNullable<Site["hero"]["art"]>; site: Site; lang: Lang }) {
  const tr = translator(lang)
  const p = site.palette
  const card = "rounded-[1em] bg-white shadow-[0_18px_40px_-24px_rgba(15,28,20,0.45)]"
  if (kind === "booking") {
    const slots = ["09:30", "11:00", "12:30", "16:00", "17:30", "19:00"]
    return (
      <div className="flex h-full items-center justify-center" style={{ fontSize: u(16) }}>
        <div className={`${card} w-[78%] p-[1.2em]`}>
          <p className="font-bold" style={{ fontSize: u(17) }}>{tr("Κλείσε ραντεβού")}</p>
          <p className="mt-[0.2em] opacity-60" style={{ fontSize: u(13) }}>{tr("Τρίτη 14 Οκτωβρίου")}</p>
          <div className="mt-[0.9em] grid grid-cols-3 gap-[0.5em]">
            {slots.map((s, i) => (
              <span key={s} className="rounded-[0.5em] py-[0.45em] text-center font-semibold tabular-nums" style={{ fontSize: u(14), background: i === 1 ? p.accent : p.soft, color: i === 1 ? "#fff" : p.ink }}>{s}</span>
            ))}
          </div>
          <span className="mt-[0.9em] block rounded-[0.5em] py-[0.55em] text-center font-bold text-white" style={{ fontSize: u(14), background: p.ink }}>{tr("Επιβεβαίωση")}</span>
        </div>
      </div>
    )
  }
  if (kind === "tech") {
    const bars = [42, 58, 50, 72, 64, 86, 78]
    return (
      <div className="flex h-full flex-col justify-center gap-[0.7em] px-[1.4em]" style={{ fontSize: u(16) }}>
        <div className={`${card} p-[1em]`}>
          <div className="flex items-center justify-between">
            <p className="font-bold" style={{ fontSize: u(15) }}>{tr("Απόδοση εφαρμογής")}</p>
            <span className="rounded-full px-[0.6em] py-[0.15em] font-semibold" style={{ fontSize: u(12), background: p.soft, color: p.accent }}>+18%</span>
          </div>
          <div className="mt-[0.8em] flex h-[6em] items-end gap-[0.45em]">
            {bars.map((h, i) => <span key={i} className="flex-1 rounded-t-[0.3em]" style={{ height: `${h}%`, background: i === bars.length - 2 ? p.accent : `${p.accent}33` }} />)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[0.7em]">
          {[["99,9%", "Διαθεσιμότητα"], ["120 ms", "Χρόνος απόκρισης"]].map(([v, l]) => (
            <div key={l} className={`${card} p-[0.8em]`}>
              <p className="font-bold tabular-nums" style={{ fontSize: u(20), color: p.accent }}>{v}</p>
              <p className="opacity-60" style={{ fontSize: u(12) }}>{tr(l)}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }
  const rows = [["Δευ", "Μαθηματικά", "17:00"], ["Τρι", "Φυσική", "18:30"], ["Πεμ", "Αγγλικά", "17:00"]]
  return (
    <div className="flex h-full items-center justify-center" style={{ fontSize: u(16) }}>
      <div className={`${card} w-[80%] p-[1.1em]`}>
        <div className="flex items-center justify-between">
          <p className="font-bold" style={{ fontSize: u(16) }}>{tr("Το πρόγραμμά μου")}</p>
          <SiteIconSvg name="clock" size={u(18)} className="opacity-50" />
        </div>
        <ul className="mt-[0.7em] space-y-[0.45em]">
          {rows.map(([d, c, t], i) => (
            <li key={c} className="flex items-center gap-[0.7em] rounded-[0.6em] px-[0.7em] py-[0.5em]" style={{ background: i === 0 ? p.soft : "#F6F5F1" }}>
              <span className="w-[2.4em] font-bold" style={{ fontSize: u(13), color: p.accent }}>{tr(d)}</span>
              <span className="flex-1 font-semibold" style={{ fontSize: u(14) }}>{tr(c)}</span>
              <span className="tabular-nums opacity-60" style={{ fontSize: u(13) }}>{t}</span>
            </li>
          ))}
        </ul>
        <div className="mt-[0.8em] h-[0.45em] overflow-hidden rounded-full" style={{ background: p.soft }}>
          <span className="block h-full w-[64%] rounded-full" style={{ background: p.accent }} />
        </div>
        <p className="mt-[0.35em] opacity-60" style={{ fontSize: u(12) }}>{tr("Πρόοδος ύλης")} 64%</p>
      </div>
    </div>
  )
}

export function SitePreview({ site, lang, eager = false, className = "" }: { site: Site; lang: Lang; eager?: boolean; className?: string }) {
  const tr = translator(lang)
  const p = site.palette
  const img = (src: string, pos?: string, zoom = false) => (
    <img
      src={src}
      alt=""
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      className={`absolute inset-0 h-full w-full object-cover ${zoom ? "vk-zoom" : ""}`}
      style={pos ? { objectPosition: pos } : undefined}
    />
  )

  return (
    <div className={`relative aspect-[3/2] w-full overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-[#2E4A37]/10 [container-type:inline-size] ${className}`}>
      <div className="absolute inset-0 flex flex-col" style={{ ["--u" as string]: "calc(100cqw / 960)", background: p.page, color: p.ink }}>
        {/* browser bar */}
        <div className="flex shrink-0 items-center bg-[#F1EEE7]" style={{ height: u(34), gap: u(7), padding: `0 ${u(14)}` }}>
          {["#C0503C", "#2E4A3740", "#2E4A3740"].map((c, i) => <span key={i} className="rounded-full" style={{ width: u(9), height: u(9), background: c }} />)}
          <span className="truncate rounded-full bg-white text-[#2E4A37]/70" style={{ marginLeft: u(10), fontSize: u(12.5), padding: `${u(3)} ${u(14)}`, width: u(340) }}>vitrinaki.gr/{site.slug}</span>
        </div>

        {/* site header */}
        <div className="flex shrink-0 items-center justify-between" style={{ height: u(62), padding: `0 ${u(36)}` }}>
          <span className="flex min-w-0 items-center font-extrabold" style={{ gap: u(10), fontSize: u(18) }}>
            <span className="grid shrink-0 place-items-center text-white" style={{ width: u(34), height: u(34), borderRadius: u(9), fontSize: u(13), background: p.accent }}>{initialsOf(tr(site.name))}</span>
            <span className="truncate">{tr(site.name)}</span>
          </span>
          <span className="flex shrink-0 items-center" style={{ gap: u(26), fontSize: u(14) }}>
            {site.nav.map((item) => <span key={item} className="font-medium opacity-70">{tr(item)}</span>)}
            <span className="font-bold text-white" style={{ background: p.accent, borderRadius: u(9), padding: `${u(8)} ${u(16)}` }}>{tr(site.cta)}</span>
          </span>
        </div>

        {/* hero */}
        <div className="grid shrink-0 grid-cols-[44fr_56fr] overflow-hidden" style={{ margin: `0 ${u(36)}`, height: u(326), borderRadius: u(18), background: p.soft }}>
          <div className="flex flex-col justify-center" style={{ padding: `0 ${u(34)}` }}>
            <p className="font-bold" style={{ fontSize: u(13), color: p.accent }}>{tr(site.hero.eyebrow)}</p>
            <p className="font-serif" style={{ marginTop: u(10), fontSize: u(40), lineHeight: 1.08 }}>{tr(site.hero.title)}</p>
            <p className="opacity-75" style={{ marginTop: u(12), fontSize: u(15), lineHeight: 1.5 }}>{tr(site.hero.text)}</p>
            <span className="w-fit font-bold text-white" style={{ marginTop: u(18), fontSize: u(14), background: p.accent, borderRadius: u(9), padding: `${u(10)} ${u(18)}` }}>{tr(site.hero.button)}</span>
          </div>
          <div className="relative overflow-hidden">
            {site.hero.img ? img(site.hero.img, site.hero.pos, true) : <HeroArt kind={site.hero.art ?? "booking"} site={site} lang={lang} />}
          </div>
        </div>

        {/* first section */}
        <div style={{ margin: `${u(24)} ${u(36)} 0` }}>
          <div className="flex items-baseline justify-between">
            <p className="font-bold" style={{ fontSize: u(19) }}>{tr(site.section)}</p>
            <span className="font-semibold" style={{ fontSize: u(13.5), color: p.accent }}>{tr("Δες όλα")} →</span>
          </div>
          <div className="grid grid-cols-3" style={{ marginTop: u(12), gap: u(18) }}>
            {site.cards.map((card) => (
              <div key={card.title} className="flex items-center bg-white shadow-[0_10px_24px_-18px_rgba(15,28,20,0.5)]" style={{ gap: u(12), padding: u(10), borderRadius: u(14) }}>
                <div className="relative shrink-0 overflow-hidden" style={{ width: u(92), height: u(92), borderRadius: u(10), background: p.soft, color: p.accent }}>
                  {card.img ? img(card.img, card.pos) : <span className="grid h-full w-full place-items-center"><SiteIconSvg name={site.icon} size={u(30)} /></span>}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold" style={{ fontSize: u(14.5) }}>{tr(card.title)}</p>
                  <p className="truncate opacity-60" style={{ marginTop: u(3), fontSize: u(12.5) }}>{tr(card.meta)}</p>
                  {card.price ? <p className="font-bold tabular-nums" style={{ marginTop: u(5), fontSize: u(14), color: p.accent }}>{tr(card.price)}</p> : <p className="font-semibold" style={{ marginTop: u(5), fontSize: u(13), color: p.accent }}>{tr("Περισσότερα")} →</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
