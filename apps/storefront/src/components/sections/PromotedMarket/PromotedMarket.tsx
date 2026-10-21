import Link from "next/link"

import type { PromotedProduct } from "@/lib/data/vitrinaki-promoted"
import { paletteColors } from "@/lib/data/vitrinaki-storefronts"
import { convertToLocale } from "@/lib/helpers/money"
import { translator, type Lang } from "@/lib/i18n/vitrinaki"

const initialsOf = (value: string) =>
  value.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "V"

/* The homepage marketplace: products promoted from Vitrinaki shops. The product opens on
   the shop's own page and every card has a button to the shop, so a promotion is
   advertising for that shop. Cards are marked «Προωθημένο». */
export function PromotedMarket({ products, lang, locale }: { products: PromotedProduct[]; lang: Lang; locale: string }) {
  const tr = translator(lang)
  const money = lang === "en" ? "en-GB" : "el-GR"

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {products.map((product) => {
        const c = paletteColors[product.shop.palette] || paletteColors.forest
        const shopHref = `/${locale}/store/${encodeURIComponent(product.shop.handle)}`
        const productHref = `${shopHref}/products/${encodeURIComponent(product.handle)}`
        return (
          <li key={product.offerId} className="min-w-0">
            <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white p-2 shadow-[0_18px_40px_-28px_rgba(31,54,40,0.5)] ring-1 ring-[#2E4A37]/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(31,54,40,0.55)] motion-reduce:hover:translate-y-0 sm:p-2.5">
              <Link href={productHref} className="relative block overflow-hidden rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E4A37]" style={{ background: c.soft }}>
                {product.thumbnail ? (
                  <img src={product.thumbnail} alt="" loading="lazy" decoding="async" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                ) : (
                  <span className="grid aspect-square w-full place-items-center text-3xl font-extrabold" style={{ color: c.accent }} aria-hidden="true">{initialsOf(product.title)}</span>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-semibold text-[#1F3628] shadow-sm">{tr("Προωθημένο")}</span>
                <span className="sr-only">{product.title}</span>
              </Link>
              <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                <p className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold" style={{ color: c.accent }}>
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded text-[8.5px] font-bold text-white" style={{ background: c.accent }} aria-hidden="true">{initialsOf(product.shop.storeName)}</span>
                  <span className="truncate">{product.shop.storeName}</span>
                </p>
                <h3 className="mt-1.5 line-clamp-2 text-[14.5px] font-bold leading-snug text-[#1F3628] sm:text-[15.5px]">
                  <Link href={productHref} className="hover:underline">{product.title}</Link>
                </h3>
                <p className="mt-1 text-[14px] font-bold text-[#1F3628]">
                  {product.amount !== null ? convertToLocale({ amount: product.amount, currency_code: product.currency, locale: money }) : null}
                  {!product.inStock ? <span className="ml-2 text-[12px] font-medium text-[#2E4A37]/60">{tr("Εξαντλήθηκε")}</span> : null}
                </p>
                <div className="mt-auto pt-3">
                  <Link
                    href={shopHref}
                    aria-label={`${tr("Δες το κατάστημα")}: ${product.shop.storeName}`}
                    className="flex min-h-10 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-[#2E4A37]/20 px-2 text-[12.5px] sm:gap-1.5 sm:px-3 sm:text-[13px] font-semibold text-[#1F3628] transition hover:border-[#2E4A37] hover:bg-[#F7F2E8] sm:min-h-11"
                  >
                    {tr("Δες το κατάστημα")} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
