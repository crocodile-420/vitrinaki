import { paletteColors, type DirectoryStorefront } from "@/lib/data/vitrinaki-storefronts"
import { translator, type Lang } from "@/lib/i18n/vitrinaki"

// A miniature, purely visual rendering of a Vitrinaki website in its own
// palette and template, so the homepage shows websites rather than products.
export function SitePreview({
  site,
  address,
  className = "",
  lang = "el",
}: {
  site: Pick<DirectoryStorefront, "storeName" | "tagline" | "template" | "palette">
  address: string
  className?: string
  lang?: Lang
}) {
  const tr = translator(lang)
  const c = paletteColors[site.palette] || paletteColors.forest
  const initials = site.storeName
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl shadow-black/10 ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-black/5 bg-white px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-[#C0503C]" />
        <span className="h-2 w-2 rounded-full bg-[#e7c16f]" />
        <span className="h-2 w-2 rounded-full bg-[#9dbba5]" />
        <span className="ml-2 truncate rounded-full bg-[#f1eee8] px-2.5 py-0.5 text-[9px] font-medium text-[#6b7a72]">{address}</span>
      </div>
      <div style={{ background: c.page, color: c.ink }} className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-tight">
            <span style={{ background: c.accent }} className="grid h-5 w-5 place-items-center rounded-md text-[8px] text-white">{initials}</span>
            {tr(site.storeName)}
          </span>
          <span className="flex gap-2 text-[8px] font-semibold opacity-60">
            <span>{tr("Αρχική")}</span>
            <span>{tr(site.template === "services" ? "Υπηρεσίες" : "Συλλογή")}</span>
            <span>{tr("Επικοινωνία")}</span>
          </span>
        </div>

        {site.template === "local" ? (
          <div style={{ background: c.soft }} className="mt-3 rounded-xl p-3 text-center">
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] opacity-60">{tr("Στη γειτονιά σου")}</p>
            <p className="mt-1 text-sm font-extrabold leading-tight">{tr(site.tagline)}</p>
            <span style={{ background: c.accent }} className="mt-2 inline-block rounded-full px-2.5 py-1 text-[8px] font-bold text-white">{tr("Βρες μας")}</span>
          </div>
        ) : site.template === "services" ? (
          <div className="mt-3 grid grid-cols-[1.2fr_0.8fr] gap-2">
            <div>
              <p className="text-sm font-extrabold leading-tight">{tr(site.tagline)}</p>
              <span style={{ background: c.accent }} className="mt-2 inline-block rounded-full px-2.5 py-1 text-[8px] font-bold text-white">{tr("Κλείσε ραντεβού")}</span>
            </div>
            <div style={{ background: c.soft }} className="space-y-1 rounded-xl p-2">
              {["Δευ–Παρ 9:00–18:00", "Σάβ 10:00–14:00"].map(tr).map((line) => (
                <p key={line} className="text-[7px] font-semibold opacity-70">{line}</p>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background: c.soft }} className="mt-3 rounded-xl p-3">
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] opacity-60">{tr("Νέα συλλογή")}</p>
            <p className="mt-1 max-w-[80%] text-sm font-extrabold leading-tight">{tr(site.tagline)}</p>
            <span style={{ background: c.accent }} className="mt-2 inline-block rounded-full px-2.5 py-1 text-[8px] font-bold text-white">{tr("Ανακάλυψε")}</span>
          </div>
        )}

        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {[0.9, 0.55, 0.75].map((opacity, index) => (
            <div key={index}>
              <div style={{ background: c.accent, opacity: opacity * 0.35 }} className="aspect-[4/5] rounded-md" />
              <div style={{ background: c.ink }} className="mt-1 h-1 w-3/4 rounded-full opacity-25" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
