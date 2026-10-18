import Link from "next/link"

import type { ShopColors } from "./ShopProductCard"
import { ShopImage } from "./ShopImage"
import { shopInitials, type ShopResponse } from "./shop-data"

const platformUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100").replace(/\/+$/, "")

export function ShopHeader({
  shop,
  colors,
  home,
  locale,
}: {
  shop: ShopResponse
  colors: ShopColors
  home: string
  locale: string
}) {
  const { storefront, seller } = shop
  const isServices = storefront.template === "services"
  return (
    <header style={{ background: colors.page, borderColor: `${colors.ink}1a` }} className="sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
        <Link href={home} className="flex min-w-0 items-center gap-3">
          {seller.logo ? (
            <ShopImage src={seller.logo} alt={storefront.storeName} accent="#fff" soft={colors.accent} className="h-9 w-9 shrink-0 rounded-lg" label={storefront.storeName} small />
          ) : (
            <span style={{ background: colors.accent }} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-extrabold text-white">
              {shopInitials(storefront.storeName)}
            </span>
          )}
          <span className="truncate text-lg font-extrabold tracking-tight">{storefront.storeName}</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-semibold">
          <a href={`${home}#catalog`} className="hidden opacity-75 hover:opacity-100 sm:inline">{isServices ? "Υπηρεσίες" : "Συλλογή"}</a>
          <a href={`${home}#about`} className="hidden opacity-75 hover:opacity-100 sm:inline">Σχετικά</a>
          <a href={`${home}#contact`} className="hidden opacity-75 hover:opacity-100 sm:inline">Επικοινωνία</a>
          <Link href={`/${locale}/cart`} style={{ borderColor: colors.ink }} className="rounded-full border px-4 py-1.5 hover:opacity-80">
            Καλάθι
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function ShopFooter({ shop, colors }: { shop: ShopResponse; colors: ShopColors }) {
  const { storefront } = shop
  return (
    <footer style={{ background: colors.ink, color: colors.page }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-semibold">© {new Date().getFullYear()} {storefront.storeName}</p>
        <a href={platformUrl} className="opacity-70 transition hover:opacity-100">
          Η βιτρίνα μας φτιάχτηκε με το <span className="font-bold">vitrinaki.gr</span>
        </a>
      </div>
    </footer>
  )
}
