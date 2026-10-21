"use client"

import { translator, type Lang } from "@/lib/i18n/vitrinaki"

import { SHOW_SITE_EVENT, sites } from "./sites"
import { SiteIconSvg, SitePreview } from "./SitePreview"

/* «Τι μπορείς να φτιάξεις»: every example website as a card. "Δες το" shows it large in the hero. */
export function SiteGallery({ lang, startHref }: { lang: Lang; startHref: string }) {
  const tr = translator(lang)
  const show = (key: string) => {
    window.dispatchEvent(new CustomEvent(SHOW_SITE_EVENT, { detail: key }))
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    document.getElementById("top")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
  }

  return (
    <ul className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
      {sites.map((site) => (
        <li key={site.key} className="w-[82%] shrink-0 snap-start sm:w-auto">
          <figure className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white p-2.5 shadow-[0_18px_40px_-28px_rgba(31,54,40,0.5)] ring-1 ring-[#2E4A37]/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(31,54,40,0.55)] motion-reduce:hover:translate-y-0">
            <div className="overflow-hidden rounded-[1.1rem]">
              <SitePreview site={site} lang={lang} className="transition duration-500 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
            </div>
            <figcaption className="flex flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1.5 pb-1 pt-3">
              <span className="flex min-w-0 flex-1 basis-[170px] items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: site.palette.soft, color: site.palette.accent }}>
                  <SiteIconSvg name={site.icon} size={18} />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[14.5px] font-bold text-[#1F3628]">{tr(site.industry)}</span>
                  <span className="block truncate text-[12.5px] text-[#2E4A37]/65">{tr(site.place)} · {tr(site.name)}</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => show(site.key)} aria-label={`${tr("Δες το")}: ${tr(site.industry)}`} className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#1F3628] underline-offset-4 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2E4A37]">{tr("Δες το")}</button>
                <a href={startHref} className="rounded-lg bg-[#2E4A37] px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#1F3628]">{tr("Ξεκίνα")}</a>
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  )
}
