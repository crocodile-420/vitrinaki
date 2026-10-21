"use client"

import type React from "react"
import { useState } from "react"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"

export type Scene = { key: string; label: string; text: string; content: React.ReactNode }

export const SCENE_MS = 4500

/* Crossfade + a slow zoom on the active scene's photos (.vk-zoom). The zoom only runs while
   a scene is showing and snaps back after it has faded out, so the restart is never seen. */
export const showcaseCss = `
.vk-scene{transition:opacity .9s ease}
.vk-zoom{transform:scale(1);transition:transform 0s 1s}
.vk-scene[data-on] .vk-zoom{transform:scale(1.06);transition:transform 6.5s ease-out}
.vk-progress{transform-origin:left;animation:vkProgress linear forwards}
@keyframes vkProgress{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@media (prefers-reduced-motion:reduce){.vk-scene{transition:none}.vk-zoom,.vk-scene[data-on] .vk-zoom{transform:none;transition:none}.vk-progress{animation:none}}
`

/* The hero's media: four scenes in one frame. Only scenes that have been shown (plus the next
   one, preloaded) are mounted, so the page does not download every photo up front. */
export function HeroShowcase({ lang, scenes, active, onPick, playing, rotating, onToggle, showToggle, className = "", ...hold }: {
  lang: Lang
  scenes: Scene[]
  active: number
  onPick: (i: number) => void
  playing: boolean
  rotating: boolean
  onToggle: () => void
  showToggle: boolean
  className?: string
} & React.HTMLAttributes<HTMLElement>) {
  const tr = translator(lang)
  const [seen, setSeen] = useState<number[]>([0])
  const next = (active + 1) % scenes.length
  if (!seen.includes(active) || !seen.includes(next)) setSeen((list) => Array.from(new Set([...list, active, next])))

  const step = (delta: number) => onPick((active + delta + scenes.length) % scenes.length)
  const current = scenes[active]

  return (
    <section aria-roledescription="carousel" aria-label={tr("Τι μπορείς να φτιάξεις με το Vitrinaki")} className={className} {...hold}>
      <div className="relative isolate aspect-[3/2] overflow-hidden rounded-[1.25rem] bg-white shadow-[0_40px_80px_-40px_rgba(31,54,40,0.6),0_2px_8px_rgba(31,54,40,0.06)]">
        <div aria-live={rotating ? "off" : "polite"} className="absolute inset-0">
          {scenes.map((scene, i) => (
            <div
              key={scene.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${scenes.length}: ${tr(scene.label)}`}
              aria-hidden={i === active ? undefined : true}
              inert={i === active ? undefined : true}
              data-on={i === active ? "" : undefined}
              className={`vk-scene absolute inset-0 ${i === active ? "z-10 opacity-100" : "opacity-0"}`}
            >
              {seen.includes(i) ? scene.content : null}
            </div>
          ))}
        </div>
      </div>

      {/* caption + controls sit under the frame, so they never cover the pictures */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <p className="min-w-0 text-[13.5px] leading-snug text-[#1F3628]">
          <span className="font-bold text-[#265E8E] tabular-nums">{String(active + 1).padStart(2, "0")}</span>
          <span className="mx-2 text-[#2E4A37]/30" aria-hidden="true">/</span>
          <span key={current.key} className="vk-fade inline">
            <span className="text-[#2E4A37]/60">{tr("Παράδειγμα")}: </span>
            <span className="font-bold">{tr(current.label)}</span>
            <span className="text-[#2E4A37]/70"> · {tr(current.text)}</span>
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="mr-1 hidden items-center gap-1 sm:flex">
            {scenes.map((scene, i) => (
              <button
                key={scene.key}
                type="button"
                aria-label={`${tr("Σκηνή")} ${i + 1}: ${tr(scene.label)}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => onPick(i)}
                className="grid h-6 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2E4A37]"
              >
                <span className={`block h-1 overflow-hidden rounded-full transition-all duration-300 motion-reduce:transition-none ${i === active ? "w-7 bg-[#2E4A37]/15" : "w-2.5 bg-[#2E4A37]/20 hover:bg-[#2E4A37]/45"}`}>
                  {i === active ? (
                    <span
                      key={`${active}-${rotating}`}
                      className={`block h-full w-full rounded-full bg-[#265E8E] ${rotating ? "vk-progress" : ""}`}
                      style={rotating ? { animationDuration: `${SCENE_MS}ms` } : undefined}
                    />
                  ) : null}
                </span>
              </button>
            ))}
          </span>
          <button type="button" onClick={() => step(-1)} aria-label={tr("Προηγούμενη σκηνή")} className={ctrl}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
          </button>
          {showToggle ? (
            <button type="button" onClick={onToggle} aria-label={tr(playing ? "Παύση εναλλαγής" : "Συνέχιση εναλλαγής")} className={ctrl}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                {playing ? <><rect x="1.5" y="1" width="2.5" height="8" rx=".6" /><rect x="6" y="1" width="2.5" height="8" rx=".6" /></> : <path d="M2.5 1.2v7.6L9 5z" />}
              </svg>
            </button>
          ) : null}
          <button type="button" onClick={() => step(1)} aria-label={tr("Επόμενη σκηνή")} className={ctrl}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
          </button>
        </div>
      </div>
    </section>
  )
}

const ctrl =
  "grid h-8 w-8 place-items-center rounded-full border border-[#2E4A37]/20 bg-white/70 text-[#1F3628] transition hover:border-[#2E4A37] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E4A37]"
