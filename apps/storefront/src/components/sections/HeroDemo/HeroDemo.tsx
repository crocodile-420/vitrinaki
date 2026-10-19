"use client"

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"

type Template = "atelier" | "local" | "services"
type Palette = { key: string; label: string; page: string; ink: string; accent: string; soft: string }

const palettes: Palette[] = [
  { key: "cypress", label: "Κυπαρισσί", page: "#F7F2E8", ink: "#1F3628", accent: "#2E4A37", soft: "#E4E8DA" },
  { key: "tile", label: "Κεραμιδί", page: "#FBF3EE", ink: "#5A2A1F", accent: "#C0503C", soft: "#F3DDD3" },
  { key: "aegean", label: "Μπλε", page: "#F1F5F9", ink: "#173A57", accent: "#265E8E", soft: "#DBE6F0" },
  { key: "vitrinaki", label: "Vitrinaki", page: "#FFFFFF", ink: "#2E4A37", accent: "#265E8E", soft: "#F7F2E8" },
]

const templates: { key: Template; label: string }[] = [
  { key: "atelier", label: "Atelier" },
  { key: "local", label: "Γειτονιά" },
  { key: "services", label: "Υπηρεσίες" },
]

const examples: { name: string; tagline: string; palette: string; template: Template }[] = [
  { name: "Φούρνος Ελένη", tagline: "Ζεστό ψωμί κάθε πρωί από το 1987", palette: "tile", template: "local" },
  { name: "Atelier Μύρτω", tagline: "Χειροποίητα κοσμήματα από ασήμι", palette: "aegean", template: "atelier" },
  { name: "Studio Αλκυόνη", tagline: "Pilates και yoga στο κέντρο της πόλης", palette: "vitrinaki", template: "services" },
  { name: "Κτήμα Λιόφυτο", tagline: "Έξτρα παρθένο ελαιόλαδο από τη Μεσσηνία", palette: "cypress", template: "atelier" },
  { name: "Μελισσοκομία Θυμάρι", tagline: "Θυμαρίσιο μέλι από τις Κυκλάδες", palette: "tile", template: "local" },
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
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "V"

export function HeroDemo({ lang }: { lang: Lang }) {
  const tr = translator(lang)
  const [auto, setAuto] = useState(true)
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState(0)
  const [name, setName] = useState("")
  const [paletteKey, setPaletteKey] = useState(examples[0].palette)
  const [template, setTemplate] = useState<Template>(examples[0].template)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const reduced = useRef(false)

  const example = examples[index]
  const exampleName = tr(example.name)

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced.current) setTyped(99)
  }, [])

  // Auto-play: type the example name, hold, then move to the next shop.
  useEffect(() => {
    if (!auto) return
    if (typed < exampleName.length && !reduced.current) {
      const id = window.setTimeout(() => setTyped((n) => n + 1), 55)
      return () => window.clearTimeout(id)
    }
    const id = window.setTimeout(() => {
      const next = (index + 1) % examples.length
      setIndex(next)
      setPaletteKey(examples[next].palette)
      setTemplate(examples[next].template)
      setTyped(reduced.current ? 99 : 0)
    }, 3200)
    return () => window.clearTimeout(id)
  }, [auto, typed, index, exampleName.length])

  const takeOver = () => {
    if (auto) {
      setAuto(false)
    }
  }

  const shownName = auto ? exampleName.slice(0, typed) : name
  const displayName = shownName.trim() || (auto ? "" : tr("Η επιχείρησή σου"))
  const tagline = auto ? tr(example.tagline) : name.trim() ? tr("Καλώς ήρθατε στο κατάστημά μας") : tr("Η ιστορία σου, με τα δικά σου χρώματα")
  const palette = palettes.find((p) => p.key === paletteKey) || palettes[0]
  const slug = slugify(auto ? exampleName : name) || "to-magazi-sou"

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced.current || event.pointerType !== "mouse") return
    const rect = event.currentTarget.getBoundingClientRect()
    setTilt({
      x: ((event.clientY - rect.top) / rect.height - 0.5) * -6,
      y: ((event.clientX - rect.left) / rect.width - 0.5) * 8,
    })
  }

  const frameStyle: CSSProperties = {
    transform: `perspective(1600px) rotateX(${4 + tilt.x}deg) rotateY(${-7 + tilt.y}deg)`,
    transition: "transform 0.4s cubic-bezier(0.2,0.7,0.2,1)",
  }

  return (
    <div className="relative">
      <div className="vk-float" onPointerMove={onMove} onPointerLeave={() => setTilt({ x: 0, y: 0 })}>
        <div className="vk-tilt will-change-transform" style={frameStyle}>
          <div className="overflow-hidden rounded-xl bg-white shadow-[0_50px_100px_-30px_rgba(0,0,0,0.6),0_30px_60px_-40px_rgba(0,0,0,0.5)] ring-[6px] ring-[#265E8E]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 bg-[#265E8E] px-3 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C0503C]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#F7F2E8]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#A9C3B0]" />
              <div className="ml-2 flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] text-[#265E8E]/70 shadow-inner">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" /><path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" /></svg>
                <span className="truncate">
                  vitrinaki.gr/<span className="font-semibold text-[#265E8E]">{slug}</span>
                </span>
              </div>
            </div>

            {/* Shop */}
            <div
              className="min-h-[300px] p-4 transition-colors duration-500 sm:min-h-[340px] sm:p-5"
              style={{ background: palette.page, color: palette.ink }}
              aria-live="polite"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-[13px] font-extrabold tracking-tight">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] text-white transition-colors duration-500" style={{ background: palette.accent }}>
                    {initialsOf(displayName)}
                  </span>
                  <span className="truncate">
                    {displayName}
                    {auto ? <span className="vk-caret ml-px inline-block h-3 w-px translate-y-0.5 bg-current" /> : null}
                  </span>
                </span>
                <span className="hidden shrink-0 gap-3 text-[10px] font-semibold opacity-60 sm:flex">
                  <span>{tr("Αρχική")}</span>
                  <span>{tr(template === "services" ? "Υπηρεσίες" : "Συλλογή")}</span>
                  <span>{tr("Επικοινωνία")}</span>
                </span>
                <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ background: palette.soft }} aria-hidden="true">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 7h12l-1 13H7L6 7Z" stroke="currentColor" strokeWidth="2" /><path d="M9 7a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="2" /></svg>
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full" style={{ background: palette.accent }} />
                </span>
              </div>

              {template === "atelier" ? (
                <div key="a" className="mt-4 grid grid-cols-[1.15fr_0.85fr] gap-3">
                  <div className="flex flex-col justify-center">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">{tr("Νέα συλλογή")}</p>
                    <p className="font-serif mt-1.5 text-[19px] font-medium leading-[1.15] sm:text-[22px]">{tagline}</p>
                    <span className="mt-3 inline-flex w-fit rounded-full px-3 py-1.5 text-[10px] font-bold text-white transition-colors duration-500" style={{ background: palette.accent }}>{tr("Ανακάλυψε")} →</span>
                  </div>
                  <div className="relative h-32 overflow-hidden rounded-lg sm:h-36 transition-colors duration-500" style={{ background: palette.soft }}>
                    <div className="absolute inset-x-5 bottom-0 top-6 rounded-t-full opacity-80 transition-colors duration-500" style={{ background: palette.accent }} />
                    <div className="absolute left-1/2 top-[38%] h-8 w-8 -translate-x-1/2 rounded-full bg-white/80" />
                  </div>
                </div>
              ) : template === "local" ? (
                <div key="l" className="mt-4 rounded-lg p-4 text-center transition-colors duration-500" style={{ background: palette.soft }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">{tr("Στη γειτονιά σου")}</p>
                  <p className="font-serif mx-auto mt-1.5 max-w-[90%] text-[19px] font-medium leading-[1.15] sm:text-[22px]">{tagline}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold">
                    <span className="rounded-full px-3 py-1.5 text-white transition-colors duration-500" style={{ background: palette.accent }}>{tr("Βρες μας")}</span>
                    <span className="rounded-full bg-white/70 px-3 py-1.5">{tr("Ανοιχτά σήμερα 7:00–21:00")}</span>
                  </div>
                </div>
              ) : (
                <div key="s" className="mt-4 grid grid-cols-[1.1fr_0.9fr] gap-3">
                  <div className="flex flex-col justify-center">
                    <p className="font-serif text-[19px] font-medium leading-[1.15] sm:text-[22px]">{tagline}</p>
                    <span className="mt-3 inline-flex w-fit rounded-full px-3 py-1.5 text-[10px] font-bold text-white transition-colors duration-500" style={{ background: palette.accent }}>{tr("Κλείσε ραντεβού")}</span>
                  </div>
                  <div className="rounded-lg bg-white/70 p-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-60">{tr("Διαθέσιμες ώρες")}</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {["10:00", "11:30", "13:00", "17:30"].map((time, i) => (
                        <span key={time} className="rounded-md py-1 text-center text-[10px] font-semibold transition-colors duration-500" style={i === 1 ? { background: palette.accent, color: "#fff" } : { background: palette.soft }}>{time}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[0.95, 0.6, 0.8].map((opacity, i) => (
                  <div key={i} className="rounded-lg bg-white/60 p-1.5">
                    <div className="aspect-[5/4] rounded-md transition-colors duration-500" style={{ background: palette.accent, opacity: opacity * 0.32 }} />
                    <div className="mt-1.5 h-1.5 w-3/4 rounded-full opacity-30" style={{ background: palette.ink }} />
                    <div className="mt-1 h-1.5 w-1/3 rounded-full opacity-60 transition-colors duration-500" style={{ background: palette.accent }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="relative mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="vk-demo-name" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F7F2E8]/60">
            {tr("Δοκίμασέ το με το όνομά σου")}
          </label>
          {auto ? (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F7F2E8]/50">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#A9C3B0]" /> {tr("Ζωντανό παράδειγμα")}
            </span>
          ) : null}
        </div>
        <input
          id="vk-demo-name"
          type="text"
          value={auto ? "" : name}
          placeholder={tr("Γράψε το όνομα της επιχείρησής σου")}
          maxLength={40}
          autoComplete="off"
          onFocus={takeOver}
          onChange={(event) => {
            setAuto(false)
            setName(event.target.value)
          }}
          className="mt-2.5 w-full rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-[15px] text-[#F7F2E8] placeholder:text-[#F7F2E8]/40 outline-none transition focus:border-[#C0503C] focus:ring-2 focus:ring-[#C0503C]/40"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div role="radiogroup" aria-label={tr("Χρώματα")} className="flex items-center gap-2">
            {palettes.map((p) => (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={p.key === paletteKey}
                aria-label={tr(p.label)}
                title={tr(p.label)}
                onClick={() => {
                  takeOver()
                  setPaletteKey(p.key)
                }}
                className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-[#1F3628] transition hover:scale-110 ${p.key === paletteKey ? "ring-2 ring-[#F7F2E8]" : ""}`}
                style={{ background: `linear-gradient(135deg, ${p.accent} 55%, ${p.soft} 55%)` }}
              />
            ))}
          </div>
          <div role="radiogroup" aria-label={tr("Ύφος")} className="flex rounded-full border border-white/15 bg-black/20 p-1">
            {templates.map((t) => (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={t.key === template}
                onClick={() => {
                  takeOver()
                  setTemplate(t.key)
                }}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${t.key === template ? "bg-[#F7F2E8] text-[#1F3628]" : "text-[#F7F2E8]/70 hover:text-[#F7F2E8]"}`}
              >
                {tr(t.label)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

