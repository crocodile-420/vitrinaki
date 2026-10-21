"use client"

import Link from "next/link"

import { useCartContext } from "@/components/providers"
import { toast } from "@/lib/helpers/toast"
import { getOfferAmount, getOfferStock, type StoreOffer } from "@/lib/helpers/buybox"
import { convertToLocale } from "@/lib/helpers/money"
import { translator, type Lang } from "@/lib/i18n/vitrinaki"

import { ShopImage } from "./ShopImage"

export type ShopColors = { page: string; ink: string; accent: string; soft: string }

// A product card that wears the shop's palette rather than Vitrinaki's, so
// every shop keeps its own identity.
export function ShopProductCard({
  offer,
  href,
  colors,
  locale,
  large = false,
  lang = "el",
}: {
  offer: StoreOffer
  href: string
  colors: ShopColors
  locale: string
  large?: boolean
  lang?: Lang
}) {
  const tr = translator(lang)
  const { addToCart, onAddToCart, cart, isAddingItem } = useCartContext()
  const product = offer.product
  const title = String(product?.title || tr("Προϊόν"))
  const amount = getOfferAmount(offer)
  const currency = offer.calculated_price?.currency_code || cart?.currency_code || "eur"
  const stock = getOfferStock(offer)
  const inCart = cart?.items?.find((item) => item.metadata?.offer_id === offer.id)?.quantity ?? 0
  const disabled = amount === null || !stock || inCart >= stock
  const price = amount !== null ? convertToLocale({ amount, currency_code: currency, locale: lang === "en" ? "en-GB" : "el-GR" }) : null

  const add = async () => {
    if (disabled) return
    const total = amount as number
    const subtotal = offer.calculated_price?.calculated_amount_without_tax ?? total
    onAddToCart(
      {
        thumbnail: product?.thumbnail || "",
        product_title: product?.title,
        quantity: 1,
        subtotal,
        total,
        tax_total: total - subtotal,
        variant_id: offer.variant_id,
        product_id: offer.product_id,
        metadata: { offer_id: offer.id },
      },
      currency
    )
    try {
      await addToCart({ offerId: offer.id, quantity: 1, countryCode: locale })
      toast.success({ title: tr("Προστέθηκε στο καλάθι") })
    } catch {
      toast.error({ title: tr("Δεν προστέθηκε"), description: tr("Το προϊόν δεν είναι διαθέσιμο αυτή τη στιγμή.") })
    }
  }

  return (
    <article className="group flex flex-col">
      <Link href={href} className="block overflow-hidden rounded-2xl bg-white">
        <ShopImage
          src={product?.thumbnail ? decodeURIComponent(product.thumbnail) : null}
          alt={title}
          accent={colors.accent}
          soft={colors.soft}
          className={`w-full transition duration-500 group-hover:scale-[1.03] ${large ? "aspect-[4/5]" : "aspect-square"}`}
        />
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <Link href={href} className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold">{title}</h3>
          <p className="mt-0.5 text-sm opacity-70">{price ?? tr("Ρώτησε για τιμή")}</p>
        </Link>
        <button
          type="button"
          onClick={add}
          disabled={disabled || isAddingItem}
          style={{ background: disabled ? "transparent" : colors.accent, color: disabled ? colors.ink : "#fff", borderColor: colors.accent }}
          className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {tr(amount === null ? "Μη διαθέσιμο" : stock ? "Στο καλάθι" : "Εξαντλήθηκε")}
        </button>
      </div>
    </article>
  )
}
