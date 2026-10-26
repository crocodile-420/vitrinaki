import type React from "react"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"

/* The hero's story after the product page: packaging, a happy customer, a good rating and
   orders from further away. Drawn on the same 960 × 640 canvas as SitePreview, so every scene
   scales with the frame. Sizes inside are canvas pixels: u(18) is 18px at full size. */
const u = (n: number) => `calc(${n} * var(--u))`

function Canvas({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden [container-type:inline-size]">
      <div className="absolute inset-0" style={{ ["--u" as string]: "calc(100cqw / 960)", background: bg }}>
        {children}
      </div>
    </div>
  )
}

function Pill({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <span className="absolute inline-flex items-center rounded-full bg-white/85 font-semibold text-[#1F3628] shadow-sm" style={{ left: u(32), top: u(28), gap: u(8), padding: `${u(7)} ${u(16)} ${u(7)} ${u(7)}`, fontSize: u(17) }}>
      <span className="grid place-items-center rounded-full font-bold text-white" style={{ width: u(28), height: u(28), background: tone, fontSize: u(14) }}>{n}</span>
      {label}
    </span>
  )
}

function Stars({ size, gap = 3 }: { size: number; gap?: number }) {
  return (
    <span className="inline-flex" style={{ gap: u(gap) }} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" style={{ width: u(size), height: u(size) }}><path d="m12 2.6 2.9 6 6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5L2.6 9.5l6.5-.9z" fill="#E0A63A" /></svg>
      ))}
    </span>
  )
}

const Check = ({ size, color = "#2E4A37" }: { size: number; color?: string }) => (
  <svg viewBox="0 0 24 24" style={{ width: u(size), height: u(size) }} aria-hidden="true"><circle cx="12" cy="12" r="11" fill={color} /><path d="m7 12.5 3.2 3.2L17 9" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

export function PackagingScene({ lang }: { lang: Lang }) {
  const tr = translator(lang)
  return (
    <Canvas bg="radial-gradient(ellipse 60% 70% at 30% 60%, #FBF3E6 0%, #F1E2CD 100%)">
      <Pill n={2} label={tr("Συσκευασία")} tone="#C0503C" />
      {/* the product going into its box */}
      <div className="absolute overflow-hidden bg-white shadow-[0_20px_40px_-20px_rgba(31,54,40,0.5)]" style={{ left: u(175), top: u(110), width: u(240), height: u(300), borderRadius: u(18), transform: "rotate(-4deg)", padding: u(10) }}>
        <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: u(10) }}>
          <img src="/home/p-oil.webp" alt="" loading="lazy" decoding="async" className="vk-zoom absolute inset-0 h-full w-full object-cover" />
        </div>
      </div>
      <svg viewBox="0 0 400 290" className="absolute" style={{ left: u(95), top: u(330), width: u(400), height: u(290) }} aria-hidden="true">
        <path d="M22 70 0 18l150 18 20 52z" fill="#D9B98F" />
        <path d="M378 70l22-52-150 18-20 52z" fill="#D2AF83" />
        <path d="M60 40c40-26 90-30 140-8 50-22 100-18 140 8l-16 34H76z" fill="#F3C9BC" />
        <path d="M22 70h356v200a20 20 0 0 1-20 20H42a20 20 0 0 1-20-20z" fill="#C79E6E" />
        <path d="M22 70h356v26H22z" fill="#B88D5E" />
        <path d="M185 70h30v220h-30z" fill="#E7CFA8" opacity=".85" />
        <circle cx="200" cy="180" r="44" fill="#C0503C" />
        <circle cx="200" cy="180" r="36" fill="none" stroke="#F7F2E8" strokeOpacity=".5" strokeDasharray="3 4" />
        <text x="200" y="176" textAnchor="middle" fontSize="15" fontWeight="700" fill="#F7F2E8" fontFamily="inherit">vitrinaki</text>
        <text x="200" y="196" textAnchor="middle" fontSize="12" fill="#F7F2E8" fillOpacity=".85" fontFamily="inherit">.gr</text>
      </svg>
      {/* the shipping label */}
      <div className="absolute bg-white text-[#1F3628] shadow-[0_24px_50px_-24px_rgba(31,54,40,0.55)]" style={{ left: u(545), top: u(140), width: u(340), borderRadius: u(18), padding: u(24) }}>
        <p className="flex items-center font-bold" style={{ gap: u(10), fontSize: u(20) }}><Check size={24} /> {tr("Έτοιμο για αποστολή")}</p>
        <div className="border-t border-dashed border-[#2E4A37]/20" style={{ marginTop: u(16), paddingTop: u(14), fontSize: u(16), lineHeight: 1.7 }}>
          <p><span className="text-[#2E4A37]/60">{tr("Παραγγελία")}</span> <b>#1042</b></p>
          <p><span className="text-[#2E4A37]/60">{tr("Προς")}:</span> {tr("Μαρία Κ., Θεσσαλονίκη")}</p>
          <p><span className="text-[#2E4A37]/60">{tr("Με")}:</span> Courier</p>
        </div>
        <div className="flex items-end" style={{ marginTop: u(14), gap: u(3), height: u(40) }} aria-hidden="true">
          {[3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2].map((w, i) => <span key={i} className="h-full bg-[#1F3628]" style={{ width: u(w * 2) }} />)}
        </div>
      </div>
      {/* a hand-written thank-you note */}
      <div className="absolute bg-[#FFFDF8] font-serif italic text-[#C0503C] shadow-[0_14px_30px_-16px_rgba(31,54,40,0.5)]" style={{ left: u(590), top: u(445), padding: `${u(14)} ${u(22)}`, borderRadius: u(6), fontSize: u(24), transform: "rotate(3deg)" }}>
        {tr("Σ' ευχαριστούμε!")} ♡
      </div>
    </Canvas>
  )
}

export function CustomerScene({ lang }: { lang: Lang }) {
  const tr = translator(lang)
  const bubble = "absolute shadow-sm"
  return (
    <Canvas bg="radial-gradient(ellipse 60% 70% at 60% 40%, #EEF3EA 0%, #D3DFCD 100%)">
      <Pill n={3} label={tr("Χαρούμενος πελάτης")} tone="#2E4A37" />
      {/* the customer */}
      <div className="absolute grid place-items-center rounded-full bg-[#F3C9BC] shadow-[0_20px_40px_-20px_rgba(31,54,40,0.5)]" style={{ left: u(90), top: u(190), width: u(220), height: u(220) }}>
        <svg viewBox="0 0 100 100" style={{ width: u(150), height: u(150) }} aria-hidden="true">
          <path d="M18 52c0-24 14-38 32-38s32 14 32 38c0 6-2 12-4 16H22c-2-4-4-10-4-16z" fill="#5A3A2B" />
          <circle cx="50" cy="54" r="26" fill="#F6D8C2" />
          <path d="M24 46c6-14 18-20 30-18 10 2 18 8 22 18-12-4-28-6-52 0z" fill="#5A3A2B" />
          <path d="M38 52q4-4 8 0M54 52q4-4 8 0" stroke="#3B2A22" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M40 62q10 10 20 0" stroke="#C0503C" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="36" cy="61" r="3.5" fill="#F0A994" opacity=".7" />
          <circle cx="64" cy="61" r="3.5" fill="#F0A994" opacity=".7" />
        </svg>
      </div>
      <span className="absolute text-[#C0503C]" style={{ left: u(285), top: u(165), fontSize: u(40) }} aria-hidden="true">♥</span>
      <span className="absolute text-[#C0503C]/60" style={{ left: u(80), top: u(400), fontSize: u(26) }} aria-hidden="true">♥</span>
      <p className="absolute rounded-full bg-white/85 font-semibold text-[#1F3628]" style={{ left: u(95), top: u(440), padding: `${u(8)} ${u(18)}`, fontSize: u(16) }}>{tr("Μαρία Κ., Θεσσαλονίκη")}</p>

      {/* her phone */}
      <div className="absolute bg-[#1F3628] shadow-[0_40px_70px_-30px_rgba(31,54,40,0.7)]" style={{ left: u(400), top: u(70), width: u(330), height: u(620), borderRadius: u(44), padding: u(12) }}>
        <div className="relative h-full w-full overflow-hidden bg-[#F7F2E8]" style={{ borderRadius: u(34) }}>
          <div className="flex items-center justify-center bg-white font-semibold text-[#1F3628]" style={{ height: u(64), gap: u(10), fontSize: u(17) }}>
            <span className="grid place-items-center rounded-full bg-[#2E4A37] font-bold text-white" style={{ width: u(32), height: u(32), fontSize: u(12) }}>ΛΚ</span>
            {tr("Λιοστάσι Κρήτης")}
          </div>
          <div className={`${bubble} flex items-center bg-white text-[#1F3628]`} style={{ left: u(16), right: u(16), top: u(84), borderRadius: u(16), padding: u(14), gap: u(10), fontSize: u(15) }}>
            <Check size={26} />
            <span><b>{tr("Η παραγγελία σου παραδόθηκε")}</b><br /><span className="text-[#2E4A37]/60">#1042 · {tr("σήμερα")}</span></span>
          </div>
          <div className={`${bubble} bg-[#2E4A37] text-[#F7F2E8]`} style={{ right: u(16), top: u(190), maxWidth: u(240), borderRadius: `${u(20)} ${u(20)} ${u(6)} ${u(20)}`, padding: `${u(12)} ${u(16)}`, fontSize: u(16), lineHeight: 1.45 }}>
            {tr("Μόλις ήρθε! Υπέροχη συσκευασία και μυρίζει τέλεια.")}
          </div>
          <div className={`${bubble} bg-white text-[#1F3628]`} style={{ left: u(16), top: u(300), maxWidth: u(240), borderRadius: `${u(20)} ${u(20)} ${u(20)} ${u(6)}`, padding: `${u(12)} ${u(16)}`, fontSize: u(16), lineHeight: 1.45 }}>
            {tr("Χαιρόμαστε πολύ, Μαρία! Καλή απόλαυση.")} ♡
          </div>
          <div className={`${bubble} bg-[#2E4A37] text-[#F7F2E8]`} style={{ right: u(16), top: u(392), maxWidth: u(240), borderRadius: `${u(20)} ${u(20)} ${u(6)} ${u(20)}`, padding: `${u(12)} ${u(16)}`, fontSize: u(16), lineHeight: 1.45 }}>
            {tr("Θα ξαναπαραγγείλω σίγουρα!")}
          </div>
        </div>
      </div>
      <div className="absolute flex items-center bg-white font-semibold text-[#1F3628] shadow-[0_20px_40px_-20px_rgba(31,54,40,0.5)]" style={{ left: u(60), top: u(520), borderRadius: u(16), padding: `${u(12)} ${u(18)}`, gap: u(10), fontSize: u(16) }}>
        <span className="grid place-items-center rounded-full bg-[#C0503C] text-white" style={{ width: u(30), height: u(30), fontSize: u(16) }}>↻</span>
        {tr("Ξαναγυρίζει για δεύτερη αγορά")}
      </div>
    </Canvas>
  )
}

export function RatingScene({ lang }: { lang: Lang }) {
  const tr = translator(lang)
  const bars: [number, number][] = [[5, 92], [4, 6], [3, 2], [2, 0], [1, 0]]
  const reviews = [
    { who: "Μαρία Κ.", text: "Υπέροχη συσκευασία, το λάδι μυρίζει τέλεια!" },
    { who: "Νίκος Π.", text: "Γρήγορη αποστολή και φοβερή ποιότητα. Το προτείνω." },
  ]
  return (
    <Canvas bg="radial-gradient(ellipse 60% 70% at 40% 40%, #FBEAE3 0%, #F0D2C6 100%)">
      <Pill n={4} label={tr("Καλή αξιολόγηση")} tone="#E0A63A" />
      <div className="absolute bg-white text-[#1F3628] shadow-[0_40px_70px_-30px_rgba(31,54,40,0.55)]" style={{ left: u(110), top: u(96), width: u(740), height: u(470), borderRadius: u(24), padding: u(34) }}>
        <div className="flex items-center" style={{ gap: u(12), fontSize: u(18) }}>
          <span className="grid place-items-center rounded-full bg-[#2E4A37] font-bold text-white" style={{ width: u(40), height: u(40), fontSize: u(14) }}>ΛΚ</span>
          <b>{tr("Λιοστάσι Κρήτης")}</b>
          <span className="text-[#2E4A37]/50">· {tr("Αξιολογήσεις πελατών")}</span>
        </div>
        <div className="grid" style={{ marginTop: u(26), gridTemplateColumns: `${u(230)} 1fr`, gap: u(36) }}>
          <div>
            <p className="font-serif font-medium leading-none" style={{ fontSize: u(84) }}>4,9</p>
            <div style={{ marginTop: u(10) }}><Stars size={26} /></div>
            <p className="text-[#2E4A37]/60" style={{ marginTop: u(8), fontSize: u(15) }}>128 {tr("αξιολογήσεις")}</p>
          </div>
          <div style={{ fontSize: u(14) }}>
            {bars.map(([n, pct]) => (
              <div key={n} className="flex items-center" style={{ gap: u(10), marginBottom: u(9) }}>
                <span className="text-right text-[#2E4A37]/70" style={{ width: u(28) }}>{n}★</span>
                <span className="relative flex-1 overflow-hidden rounded-full bg-[#2E4A37]/10" style={{ height: u(10) }}>
                  <span className="absolute inset-y-0 left-0 rounded-full bg-[#E0A63A]" style={{ width: `${pct}%` }} />
                </span>
                <span className="text-[#2E4A37]/60" style={{ width: u(40) }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid border-t border-[#2E4A37]/10" style={{ marginTop: u(22), paddingTop: u(20), gridTemplateColumns: "1fr 1fr", gap: u(24) }}>
          {reviews.map((r) => (
            <div key={r.who} style={{ fontSize: u(15), lineHeight: 1.5 }}>
              <Stars size={16} gap={2} />
              <p style={{ marginTop: u(6) }}>«{tr(r.text)}»</p>
              <p className="font-semibold text-[#2E4A37]/70" style={{ marginTop: u(6) }}>{tr(r.who)}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute flex items-center bg-[#C0503C] font-bold text-white shadow-[0_20px_40px_-20px_rgba(120,40,20,0.7)]" style={{ right: u(60), top: u(60), borderRadius: u(999), padding: `${u(12)} ${u(20)}`, gap: u(8), fontSize: u(16), transform: "rotate(4deg)" }}>
        ★ {tr("Κορυφαία αξιολόγηση")}
      </div>
    </Canvas>
  )
}

export function WorldScene({ lang }: { lang: Lang }) {
  const tr = translator(lang)
  const orders = [
    ["Αθήνα", "Ελλάδα"],
    ["Θεσσαλονίκη", "Ελλάδα"],
    ["Μόναχο", "Γερμανία"],
    ["Λονδίνο", "Ηνωμένο Βασίλειο"],
  ]
  return (
    <Canvas bg="radial-gradient(ellipse 60% 70% at 35% 50%, #EAF1F7 0%, #CFDDEA 100%)">
      <Pill n={5} label={tr("Μεγαλώνεις")} tone="#265E8E" />
      <img src="/home/story-globe.webp" alt="" loading="lazy" decoding="async" className="vk-zoom absolute object-contain drop-shadow-[0_30px_40px_rgba(23,58,87,0.25)]" style={{ left: u(40), top: u(70), width: u(640), height: u(530) }} />
      <div className="absolute bg-white text-[#1F3628] shadow-[0_30px_60px_-30px_rgba(23,58,87,0.6)]" style={{ right: u(40), top: u(110), width: u(300), borderRadius: u(20), padding: u(22) }}>
        <p className="font-bold" style={{ fontSize: u(18) }}>{tr("Νέες παραγγελίες")}</p>
        <ul style={{ marginTop: u(12) }}>
          {orders.map(([city, country], i) => (
            <li key={city} className="flex items-center border-t border-[#2E4A37]/10 first:border-t-0" style={{ gap: u(10), padding: `${u(10)} 0`, fontSize: u(15) }}>
              <span className="grid shrink-0 place-items-center rounded-full font-bold text-white" style={{ width: u(28), height: u(28), fontSize: u(12), background: i < 2 ? "#2E4A37" : "#265E8E" }}>✓</span>
              <span className="min-w-0"><b>{tr(city)}</b><span className="text-[#2E4A37]/55"> · {tr(country)}</span></span>
            </li>
          ))}
        </ul>
      </div>
      <div className="absolute flex items-center bg-[#173A57] font-semibold text-[#F7F2E8] shadow-[0_20px_40px_-20px_rgba(23,58,87,0.7)]" style={{ right: u(40), top: u(450), borderRadius: u(16), padding: `${u(14)} ${u(18)}`, gap: u(10), fontSize: u(16) }}>
        <svg viewBox="0 0 24 24" style={{ width: u(22), height: u(22) }} aria-hidden="true"><path d="M3 17l6-6 4 4 8-8M15 7h6v6" stroke="#8DB8DE" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {tr("Από τη γειτονιά, σε όλο τον κόσμο")}
      </div>
    </Canvas>
  )
}
