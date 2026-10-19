import type React from "react"
import { useId } from "react"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"

/*
 * The hero "story": Greek tradition (left) → the world, via vitrinaki.gr (globe, middle)
 * → the seller's own complete e-shop (right). The desktop route is an SVG overlay on a
 * fixed-aspect 1440×650 stage, so its coordinates line up with the stage's percentage
 * layout at every width. Pure SVG + CSS: it plays once, then loops gently; under
 * prefers-reduced-motion the default (static, fully drawn) state is shown.
 */

export const STAGE = { w: 1440, h: 650 }
const ORIGIN = { x: 540, y: 472 }
const END = { x: 1040, y: 196 }
const ROUTE = `M${ORIGIN.x} ${ORIGIN.y - 4} C 580 300, 640 156, 762 120 C 900 88, 1000 116, ${END.x} ${END.y - 6}`
// pins already painted on the globe artwork: give them a soft pulse
const globePins = [
  { x: 812, y: 170 },
  { x: 652, y: 210 },
  { x: 936, y: 213 },
  { x: 671, y: 345 },
]

function Pin({ x, y, className = "" }: { x: number; y: number; className?: string }) {
  return (
    <g className={className} style={{ transformOrigin: `${x}px ${y}px` }}>
      <ellipse cx={x} cy={y} rx="7" ry="2.4" fill="#1F3628" fillOpacity=".25" />
      <path d={`M${x} ${y}c-1.8-5.6-11-13-11-21a11 11 0 0 1 22 0c0 8-9.2 15.4-11 21z`} fill="#C0503C" stroke="#F7F2E8" strokeWidth="1.6" />
      <circle cx={x} cy={y - 21} r="4" fill="#F7F2E8" />
    </g>
  )
}

function Parcel() {
  return (
    <g>
      <rect x="-11" y="-11" width="22" height="22" rx="3" fill="#C0503C" stroke="#F7F2E8" strokeWidth="1.5" />
      <path d="M-11-3.5h22M0-11v22" stroke="#F7F2E8" strokeOpacity=".75" strokeWidth="1.4" />
      <path d="M-5-11 0-6.5 5-11" fill="none" stroke="#F7F2E8" strokeOpacity=".75" strokeWidth="1.2" />
    </g>
  )
}

/** Desktop overlay: Greek pin → route across the globe → landing on the shop. */
export function StoryRoute({ lang }: { lang: Lang }) {
  const tr = translator(lang)
  const uid = useId().replace(/:/g, "")
  return (
    <svg viewBox={`0 0 ${STAGE.w} ${STAGE.h}`} className="vk-story pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible" aria-hidden="true">
      <style>{css}</style>
      <defs>
        <mask id={`${uid}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width={STAGE.w} height={STAGE.h}>
          <path d={ROUTE} pathLength={1} className="vk-s-reveal" fill="none" stroke="#fff" strokeWidth="14" />
        </mask>
        <filter id={`${uid}-sh`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#1F3628" floodOpacity=".3" />
        </filter>
      </defs>

      {globePins.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="9" fill="none" stroke="#C0503C" strokeWidth="1.4" className={`vk-s-ring vk-s-ring-${i}`} style={{ transformOrigin: `${p.x}px ${p.y}px` }} />
      ))}

      {/* the route: a soft halo under a marching dashed line */}
      <g mask={`url(#${uid}-m)`}>
        <path d={ROUTE} fill="none" stroke="#F7F2E8" strokeOpacity=".85" strokeWidth="6" strokeLinecap="round" />
        <path d={ROUTE} fill="none" stroke="#C0503C" strokeWidth="2.2" strokeDasharray="7 7" strokeLinecap="round" className="vk-s-dash" />
      </g>

      {/* origin: Greece */}
      <g className="vk-s-origin" style={{ transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px` }}>
        <circle cx={ORIGIN.x} cy={ORIGIN.y} r="12" fill="none" stroke="#F7F2E8" strokeWidth="1.6" className="vk-s-pulse" style={{ transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px` }} />
        <g filter={`url(#${uid}-sh)`}><Pin x={ORIGIN.x} y={ORIGIN.y} /></g>
      </g>

      {/* travelling parcel */}
      <g className="vk-s-parcel" style={{ offsetPath: `path("${ROUTE}")` }} filter={`url(#${uid}-sh)`}>
        <Parcel />
      </g>

      {/* landing on the shop */}
      <g className="vk-s-done" style={{ transformOrigin: `${END.x}px ${END.y}px` }} filter={`url(#${uid}-sh)`}>
        <circle cx={END.x} cy={END.y - 14} r="15" fill="#2E4A37" stroke="#F7F2E8" strokeWidth="2" />
        <path d={`m${END.x - 6.5} ${END.y - 13.6} 4.4 4.4 8.4-8.6`} fill="none" stroke="#F7F2E8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <title>{tr("Από την Ελλάδα, μέσω vitrinaki.gr, στο δικό σου e-shop")}</title>
    </svg>
  )
}

/** Mobile connector between the stacked parts: a short dashed drop with a parcel. */
export function StoryDrop({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 64" className={`vk-story mx-auto block h-14 w-10 ${className}`} aria-hidden="true">
      <style>{css}</style>
      <path d="M20 2v60" stroke="#C0503C" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" className="vk-s-dash" />
      <g className="vk-s-drop" transform="translate(20 32) scale(.8)"><Parcel /></g>
    </svg>
  )
}

/** "From Greece → via vitrinaki.gr → to your own e-shop" + motto. */
export function StoryCaption({ lang, className = "", tone = "light" }: { lang: Lang; className?: string; tone?: "light" | "dark" }) {
  const tr = translator(lang)
  const steps = ["Από την Ελλάδα", "μέσω vitrinaki.gr", "στο δικό σου e-shop"]
  const ink = tone === "light" ? "text-[#F7F2E8]" : "text-[#1F3628]"
  return (
    <div className={className}>
      <ol className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] font-semibold ${ink}`}>
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            {i > 0 ? <span aria-hidden="true" className={tone === "light" ? "text-[#E8A493]" : "text-[#C0503C]"}>→</span> : null}
            <span>{tr(s)}</span>
          </li>
        ))}
      </ol>
      <p className={`mt-1 text-center font-serif text-[14px] italic tracking-wide ${tone === "light" ? "text-[#F7F2E8]/75" : "text-[#2E4A37]/75"}`}>«{tr("Το επιχειρείν εστί φιλοσοφείν")}»</p>
    </div>
  )
}

/** Small numbered label for each part of the story. */
export function StoryChip({ n, children, className = "" }: { n: number; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full bg-[#F7F2E8]/95 py-1 pl-1 pr-3 text-[12px] font-semibold text-[#1F3628] shadow-[0_6px_18px_-8px_rgba(31,54,40,0.45)] ring-1 ring-[#2E4A37]/10 ${className}`}>
      <span className="grid h-5 w-5 place-items-center rounded-full bg-[#2E4A37] text-[10.5px] font-bold text-[#F7F2E8]">{n}</span>
      {children}
    </span>
  )
}

export const storyCss = `
.vk-toast{opacity:1}
@media (prefers-reduced-motion:no-preference){
  .vk-toast{animation:vksToast .6s cubic-bezier(.2,1.4,.4,1) 4.6s both}
  .vk-toast-loop{animation:vksToast .6s cubic-bezier(.2,1.4,.4,1) 4.6s both,vksNudge 9s ease-in-out 9.6s infinite}
}
@keyframes vksToast{from{opacity:0;transform:translateY(-10px) scale(.92)}to{opacity:1;transform:none}}
@keyframes vksNudge{0%,52%,100%{transform:none}56%{transform:translateY(-3px) scale(1.03)}60%{transform:none}}
`

const css = `
.vk-story .vk-s-reveal{stroke-dasharray:1 1;stroke-dashoffset:0}
.vk-story .vk-s-parcel{offset-rotate:0deg;offset-distance:58%;opacity:1}
.vk-story .vk-s-ring{opacity:0}
@media (prefers-reduced-motion:no-preference){
  .vk-story .vk-s-origin{animation:vksDrop .7s cubic-bezier(.2,1.4,.4,1) .3s both}
  .vk-story .vk-s-pulse{animation:vksPulse 2.6s ease-out 1s infinite both}
  .vk-story .vk-s-reveal{animation:vksDraw 3.2s ease-in-out 1s both}
  .vk-story .vk-s-dash{animation:vksMarch 1.4s linear infinite}
  .vk-story .vk-s-parcel{animation:vksFly 3.2s ease-in-out 1s both,vksFlyLoop 9s ease-in-out 9s infinite}
  .vk-story .vk-s-done{animation:vksPop .55s cubic-bezier(.2,1.6,.4,1) 4.2s both}
  .vk-story .vk-s-ring{animation:vksPulse 3.2s ease-out infinite both}
  .vk-story .vk-s-ring-0{animation-delay:2.2s}
  .vk-story .vk-s-ring-1{animation-delay:3s}
  .vk-story .vk-s-ring-2{animation-delay:3.8s}
  .vk-story .vk-s-ring-3{animation-delay:4.6s}
  .vk-story .vk-s-drop{animation:vksDropY 2.4s ease-in-out infinite}
}
@keyframes vksDrop{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:none}}
@keyframes vksPulse{0%{opacity:.9;transform:scale(.6)}100%{opacity:0;transform:scale(2.4)}}
@keyframes vksDraw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes vksMarch{to{stroke-dashoffset:-14}}
@keyframes vksPop{0%{opacity:0;transform:scale(0)}100%{opacity:1;transform:scale(1)}}
@keyframes vksFly{0%{offset-distance:0%;opacity:0}6%{opacity:1}92%{opacity:1}100%{offset-distance:100%;opacity:0}}
@keyframes vksFlyLoop{0%{offset-distance:0%;opacity:0}4%{opacity:1}34%{opacity:1}37%{offset-distance:100%;opacity:0}100%{offset-distance:100%;opacity:0}}
@keyframes vksDropY{0%{transform:translate(20px,6px) scale(.8);opacity:0}20%{opacity:1}80%{opacity:1}100%{transform:translate(20px,58px) scale(.8);opacity:0}}
`
