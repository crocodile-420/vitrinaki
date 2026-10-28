import Link from "next/link"
import { notFound } from "next/navigation"

import { listOffers } from "@/lib/data/offers"
import { rankOffers, type StoreOffer } from "@/lib/helpers/buybox"
import { ShopFooter, ShopHeader } from "@/components/shop/ShopChrome"
import { ShopImage } from "@/components/shop/ShopImage"
import { ShopProductCard } from "@/components/shop/ShopProductCard"
import { loadShop, shopColors, shopPaths } from "@/components/shop/shop-data"
import { shopStyle, styleAttrs } from "@/components/shop/shop-style"
import { getTranslator } from "@/lib/i18n/server"

export async function generateMetadata({ params }: { params: Promise<{ handle: string; productHandle: string }> }) {
  const { handle, productHandle } = await params
  const shop = await loadShop(handle)
  return { title: { absolute: shop ? `${productHandle.replace(/-/g, " ")} | ${shop.storefront.storeName}` : (await getTranslator()).tr("Προϊόν") } }
}

export default async function ShopProductPage({ params }: { params: Promise<{ locale: string; handle: string; productHandle: string }> }) {
  const { locale, handle, productHandle } = await params
  const shop = await loadShop(handle)
  if (!shop) notFound()
  const { lang, tr } = await getTranslator()

  const result = await listOffers({ sellerId: shop.seller.id, countryCode: locale, limit: 500, offset: 0 }).catch(() => ({ offers: [], count: 0 }))
  const ranked = rankOffers(result.offers as StoreOffer[])
  const offer = ranked.find((item) => item.product?.handle === productHandle)
  if (!offer) notFound()

  const colors = shopColors(shop)
  const paths = await shopPaths(shop, locale, handle)
  const product = offer.product
  const seen = new Set([offer.product_id])
  const more = ranked
    .filter((item) => {
      if (seen.has(item.product_id)) return false
      seen.add(item.product_id)
      return true
    })
    .slice(0, 4)

  return (
    <main {...styleAttrs(shopStyle(shop.storefront.style))} style={{ background: colors.page, color: colors.ink }} className="vk-shop min-h-screen">
      <ShopHeader shop={shop} colors={colors} home={paths.home} locale={locale} lang={lang} />

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <Link href={paths.home} className="text-sm font-semibold opacity-70 hover:opacity-100">← {shop.storefront.storeName}</Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <ShopImage
            src={product?.thumbnail ? decodeURIComponent(product.thumbnail) : null}
            alt={product?.title || tr("Προϊόν")}
            accent={colors.accent}
            soft={colors.soft}
            className="aspect-square w-full rounded-[2rem] bg-white"
          />
          <div className="flex flex-col justify-center">
            <p style={{ color: colors.accent }} className="text-xs font-bold uppercase tracking-[0.22em]">{shop.storefront.storeName}</p>
            <h1 className="font-serif mt-3 text-4xl font-bold leading-tight sm:text-5xl">{product?.title}</h1>
            {product?.description ? <p className="mt-5 leading-7 opacity-75">{product.description}</p> : null}
            <div className="mt-8 max-w-sm">
              <ShopProductCard offer={offer} href={paths.product(productHandle)} colors={colors} locale={locale} lang={lang} />
            </div>
            <p className="mt-6 text-sm opacity-60">
              {tr("Ερωτήσεις για το προϊόν;")} <a href={`${paths.home}#contact`} className="font-semibold underline underline-offset-4">{tr("Επικοινώνησε με την επιχείρηση")}</a>.
            </p>
          </div>
        </div>

        {more.length ? (
          <section className="mt-20">
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">{tr("Μπορεί να σου αρέσουν")}</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-4">
              {more.map((item) => (
                <ShopProductCard key={item.id} offer={item} href={paths.product(String(item.product?.handle || ""))} colors={colors} locale={locale} lang={lang} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <ShopFooter shop={shop} colors={colors} lang={lang} />
    </main>
  )
}
