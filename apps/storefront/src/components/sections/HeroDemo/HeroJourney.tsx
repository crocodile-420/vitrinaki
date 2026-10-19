import { useId } from "react"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"

/*
 * Animated "journey" of a product: it starts from a point in Greece and, through
 * vitrinaki.gr, reaches customers along many routes. Pure SVG + CSS; with
 * prefers-reduced-motion the default (static, fully drawn) state is shown.
 */

const ORIGIN = { x: 40, y: 104 }
const MAIN = "M40 100 C 120 8, 300 -6, 418 62"
const routes = [
  { d: "M40 100 Q 170 22 288 46", to: { x: 288, y: 46 } },
  { d: "M40 100 Q 180 70 306 84", to: { x: 306, y: 84 } },
  { d: "M40 100 Q 200 146 342 104", to: { x: 342, y: 104 } },
  { d: "M40 100 Q 200 0 346 38", to: { x: 346, y: 38 } },
]
const GLOBE = { x: 318, y: 74, r: 54 }

export function HeroJourney({ lang, className = "" }: { lang: Lang; className?: string }) {
  const tr = translator(lang)
  const uid = useId().replace(/:/g, "")
  const steps = ["Από την Ελλάδα", "μέσω vitrinaki.gr", "σε όλο τον κόσμο"]

  return (
    <figure className={`vk-journey ${className}`} aria-label={tr("Από την Ελλάδα, μέσω vitrinaki.gr, σε πελάτες σε όλο τον κόσμο")}>
      <style>{css}</style>
      <svg viewBox="0 6 460 126" className="block h-auto w-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id={`${uid}-sea`} cx="38%" cy="34%" r="70%">
            <stop offset="0" stopColor="#265E8E" stopOpacity=".55" />
            <stop offset="1" stopColor="#265E8E" stopOpacity=".12" />
          </radialGradient>
          <clipPath id={`${uid}-globe`}>
            <circle cx={GLOBE.x} cy={GLOBE.y} r={GLOBE.r} />
          </clipPath>
          {[MAIN, ...routes.map((r) => r.d)].map((d, i) => (
            <mask key={d} id={`${uid}-m${i}`} maskUnits="userSpaceOnUse" x="-20" y="-30" width="500" height="210">
              <path d={d} pathLength={1} className={`vk-j-reveal vk-j-reveal-${i}`} fill="none" stroke="#fff" strokeWidth="8" />
            </mask>
          ))}
        </defs>

        {/* stylised globe */}
        <g className="vk-j-globe">
          <circle cx={GLOBE.x} cy={GLOBE.y} r={GLOBE.r} fill={`url(#${uid}-sea)`} />
          <g clipPath={`url(#${uid}-globe)`} fill="#2E4A37" fillOpacity=".9" stroke="#F7F2E8" strokeOpacity=".18" strokeWidth=".6">
            {/* loose continent shapes, deliberately abstract */}
            <path d="M270 40c8-8 22-10 30-4 6 5 2 12-6 14-6 2-6 9-12 12-7 3-14-3-15-10-1-5-1-9 3-12z" />
            <path d="M300 74c6-3 14 0 16 7 2 8-3 18-9 24-4 4-9 1-9-5 0-7-5-10-4-17 1-4 3-7 6-9z" />
            <path d="M318 38c10-6 30-6 42 2 8 6 10 14 2 18-7 3-14-1-20 3-7 4-16 3-22-3-5-6-7-15-2-20z" />
            <path d="M344 92c6-2 14 1 15 7 1 5-5 9-11 8-6 0-9-5-8-9 1-3 2-5 4-6z" />
          </g>
          <g fill="none" stroke="#F7F2E8" strokeOpacity=".28" strokeWidth=".7">
            <circle cx={GLOBE.x} cy={GLOBE.y} r={GLOBE.r} strokeOpacity=".45" />
            <ellipse cx={GLOBE.x} cy={GLOBE.y} rx={GLOBE.r * 0.62} ry={GLOBE.r} />
            <ellipse cx={GLOBE.x} cy={GLOBE.y} rx={GLOBE.r * 0.24} ry={GLOBE.r} />
            <ellipse cx={GLOBE.x} cy={GLOBE.y} rx={GLOBE.r} ry={GLOBE.r * 0.36} />
            <path d={`M${GLOBE.x - GLOBE.r} ${GLOBE.y}h${GLOBE.r * 2}`} />
          </g>
        </g>

        {/* routes */}
        {routes.map((r, i) => (
          <g key={r.d} mask={`url(#${uid}-m${i + 1})`}>
            <path d={r.d} fill="none" stroke="#F7F2E8" strokeOpacity=".55" strokeWidth="1.1" strokeDasharray="2.5 4" strokeLinecap="round" className="vk-j-dash" />
          </g>
        ))}
        <g mask={`url(#${uid}-m0)`}>
          <path d={MAIN} fill="none" stroke="#E08A76" strokeWidth="1.6" strokeDasharray="4 5" strokeLinecap="round" className="vk-j-dash" />
        </g>

        {/* destination pins */}
        {routes.map((r, i) => (
          <g key={`p${i}`} className={`vk-j-dest vk-j-dest-${i}`} style={{ transformOrigin: `${r.to.x}px ${r.to.y}px` }}>
            <circle cx={r.to.x} cy={r.to.y} r="6" fill="#E08A76" fillOpacity=".25" />
            <circle cx={r.to.x} cy={r.to.y} r="2.6" fill="#F7F2E8" stroke="#C0503C" strokeWidth="1.4" />
          </g>
        ))}

        {/* origin pin: Greece */}
        <g className="vk-j-origin" style={{ transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px` }}>
          <circle cx={ORIGIN.x} cy={ORIGIN.y} r="9" fill="none" stroke="#E08A76" strokeWidth="1.2" className="vk-j-pulse" style={{ transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px` }} />
          <ellipse cx={ORIGIN.x} cy={ORIGIN.y} rx="5" ry="1.8" fill="#000" fillOpacity=".3" />
          <path
            d={`M${ORIGIN.x} ${ORIGIN.y}c-1.4-4.5-9-10.5-9-17a9 9 0 0 1 18 0c0 6.5-7.6 12.5-9 17z`}
            fill="#C0503C"
            stroke="#F7F2E8"
            strokeWidth="1.2"
          />
          <circle cx={ORIGIN.x} cy={ORIGIN.y - 17} r="3.2" fill="#F7F2E8" />
        </g>

        {/* travelling plane */}
        <g className="vk-j-plane" style={{ offsetPath: `path("${MAIN}")` }}>
          <g transform="scale(1.15)" fill="#F7F2E8">
            <path d="M-8 0 5-1.3 8.5 0 5 1.3z" />
            <path d="M-1.5-.6-4.5-7h2l5.2 6.4zM-1.5.6-4.5 7h2l5.2-6.4z" />
            <path d="m-6-.5-2.2-3.2h1.4L-3.6-.5zm0 1-2.2 3.2h1.4L-3.6.5z" />
          </g>
        </g>

        {/* delivered */}
        <g className="vk-j-done" style={{ transformOrigin: "418px 62px" }}>
          <circle cx="418" cy="62" r="13" fill="#F7F2E8" fillOpacity=".12" />
          <circle cx="418" cy="62" r="9" fill="#2E4A37" stroke="#F7F2E8" strokeWidth="1.3" />
          <path d="m413.8 62.2 2.9 2.9 5.4-5.6" fill="none" stroke="#F7F2E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <text x="418" y="92" textAnchor="middle" className="vk-j-done-label" fill="#F7F2E8" fontSize="10.5" fontWeight="600" letterSpacing=".02em">
          {tr("Παραδόθηκε")}
        </text>
      </svg>

      <figcaption className="mt-1">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11.5px] font-semibold text-[#F7F2E8]/85">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-1.5">
              {i > 0 ? <span aria-hidden="true" className="text-[#E08A76]">→</span> : null}
              <span>{tr(s)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-1.5 font-serif text-[13px] italic tracking-wide text-[#F7F2E8]/65">«{tr("Το επιχειρείν εστί φιλοσοφείν")}»</p>
      </figcaption>
    </figure>
  )
}

const css = `
.vk-journey .vk-j-reveal{stroke-dasharray:1 1;stroke-dashoffset:0}
.vk-journey .vk-j-plane{offset-rotate:auto;offset-distance:62%;opacity:1}
@media (prefers-reduced-motion:no-preference){
  .vk-journey .vk-j-origin{animation:vkjDrop .7s cubic-bezier(.2,1.4,.4,1) both}
  .vk-journey .vk-j-pulse{animation:vkjPulse 2.4s ease-out 1s infinite both}
  .vk-journey .vk-j-reveal{animation:vkjDraw 1.5s ease-out both}
  .vk-journey .vk-j-reveal-0{animation-duration:3s;animation-delay:1.1s;animation-timing-function:ease-in-out}
  .vk-journey .vk-j-reveal-1{animation-delay:.6s}
  .vk-journey .vk-j-reveal-2{animation-delay:.85s}
  .vk-journey .vk-j-reveal-3{animation-delay:1.1s}
  .vk-journey .vk-j-reveal-4{animation-delay:1.35s}
  .vk-journey .vk-j-dash{animation:vkjMarch 1.6s linear infinite}
  .vk-journey .vk-j-dest{animation:vkjPop .5s cubic-bezier(.2,1.5,.4,1) both}
  .vk-journey .vk-j-dest-0{animation-delay:1.9s}
  .vk-journey .vk-j-dest-1{animation-delay:2.15s}
  .vk-journey .vk-j-dest-2{animation-delay:2.4s}
  .vk-journey .vk-j-dest-3{animation-delay:2.65s}
  .vk-journey .vk-j-plane{animation:vkjFly 3s ease-in-out 1.1s both}
  .vk-journey .vk-j-done{animation:vkjPop .55s cubic-bezier(.2,1.6,.4,1) 4s both}
  .vk-journey .vk-j-done-label{animation:vkjFade .5s ease-out 4.25s both}
}
@keyframes vkjDrop{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:none}}
@keyframes vkjPulse{0%{opacity:.9;transform:scale(.6)}100%{opacity:0;transform:scale(2.2)}}
@keyframes vkjDraw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes vkjMarch{to{stroke-dashoffset:-13}}
@keyframes vkjPop{0%{opacity:0;transform:scale(0)}100%{opacity:1;transform:scale(1)}}
@keyframes vkjFade{from{opacity:0}to{opacity:1}}
@keyframes vkjFly{0%{offset-distance:0%;opacity:0}8%{opacity:1}88%{opacity:1}100%{offset-distance:100%;opacity:0}}
`
