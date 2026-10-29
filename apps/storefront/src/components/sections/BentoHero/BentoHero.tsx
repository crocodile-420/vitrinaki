import { translator, type Lang } from "@/lib/i18n/vitrinaki"

// The home page hero: one grid with the message in the big tile, a photo for
// each kind of business we serve and two tiles for what a shop gets (bookings,
// payments). Server-rendered; the only motion is a staggered fade-in and a slow
// zoom on the photos on hover.

const K = "/home/kinds/"

const css = `
.vkb-tile{animation:vkbIn .7s cubic-bezier(.2,.7,.2,1) both}
@keyframes vkbIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.vkb-photo img{transition:transform 1.2s cubic-bezier(.2,.7,.2,1)}
.vkb-photo:hover img{transform:scale(1.05)}
@media (prefers-reduced-motion:reduce){.vkb-tile{animation:none}.vkb-photo img{transition:none}.vkb-photo:hover img{transform:none}}
`

const tile = "vkb-tile relative overflow-hidden rounded-[22px]"

export function BentoHero({ lang, businessUrl, tryHref = "#try" }: { lang: Lang; businessUrl: string; tryHref?: string }) {
  const tr = translator(lang)
  let order = 0
  const delay = () => ({ animationDelay: `${(order++) * 70}ms` })

  const photo = (img: string, label: string, cls: string, position = "50% 50%") => (
    <div className={`${tile} vkb-photo min-h-[150px] sm:min-h-[190px] ${cls}`} style={delay()}>
      <img src={K + img} alt="" loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
      <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-[#1F3628] backdrop-blur">{tr(label)}</span>
    </div>
  )

  return (
    <div className="bg-[#F7F2E8]">
      <style>{css}</style>
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-3 px-4 pb-6 pt-3 sm:px-8 lg:h-[calc(100svh-90px)] lg:max-h-[820px] lg:min-h-[600px] lg:grid-cols-4 lg:grid-rows-3 lg:px-12">
        <div className={`${tile} col-span-2 flex flex-col justify-between bg-[#1F3628] p-7 text-[#F7F2E8] lg:row-span-2 lg:p-10`} style={delay()}>
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,#2F5A40_0%,transparent_70%)]" />
          <p className="relative inline-flex items-center gap-2 text-[13px] font-semibold text-[#F7F2E8]/70">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8A493]" />
            {tr("Για κάθε επιχείρηση, σε όλη την Ελλάδα")}
          </p>
          <div className="relative">
            <h1 className="mt-10 text-[2.5rem] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[3.4rem] xl:text-[3.7rem]">
              {tr("Το όνειρό σου αξίζει μια βιτρίνα.")}
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-[#F7F2E8]/75 sm:text-[16px]">
              {tr("Για μαγαζιά, παραγωγούς, δημιουργούς και επαγγελματίες. Ιστοσελίδα, e-shop και κρατήσεις, σε ένα μέρος.")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={businessUrl} className="group inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#C0503C] px-7 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(192,80,60,0.8)] transition hover:-translate-y-0.5 hover:bg-[#ad4633]">
                {tr("Άνοιξε τη βιτρίνα σου")} <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a href={tryHref} className="inline-flex min-h-12 items-center rounded-xl border border-white/25 px-6 text-[15px] font-semibold text-[#F7F2E8] transition hover:bg-white/10">
                {tr("Δοκίμασέ το")}
              </a>
            </div>
          </div>
        </div>
        {photo("demo-florist.webp", "Καταστήματα", "", "60% 45%")}
        {photo("crafts-wheel.webp", "Δημιουργοί", "", "35% 40%")}
        <div className={`${tile} flex min-h-[150px] flex-col justify-between bg-[#F3DCD2] p-5 text-[#1F3628] sm:min-h-[190px] sm:p-6`} style={delay()}>
          <p className="text-[13px] font-semibold text-[#C0503C]">{tr("Κρατήσεις")}</p>
          <div>
            <p className="text-[34px] font-extrabold leading-none tabular-nums sm:text-[40px]">10:30</p>
            <p className="mt-1 text-[13px] leading-snug text-[#1F3628]/70 sm:text-[14px]">{tr("Νέο ραντεβού, χωρίς τηλέφωνα")}</p>
          </div>
        </div>
        <div className={`${tile} flex min-h-[150px] flex-col justify-between bg-[#DDE6D8] p-5 text-[#1F3628] sm:min-h-[190px] sm:p-6`} style={delay()}>
          <p className="text-[13px] font-semibold text-[#2E4A37]">{tr("Πληρωμές & παραγγελίες")}</p>
          <div>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#2E4A37" /><path d="m7 12.5 3.2 3.2L17 9" stroke="#F7F2E8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p className="mt-2 text-[13px] leading-snug text-[#1F3628]/70 sm:text-[14px]">{tr("Πληρωμή με κάρτα, όλες οι παραγγελίες σε ένα μέρος")}</p>
          </div>
        </div>
        {photo("food-field.webp", "Παραγωγοί", "lg:col-span-2", "50% 60%")}
        {photo("try-pilates.webp", "Επαγγελματίες", "lg:col-span-2", "50% 35%")}
      </div>
    </div>
  )
}
