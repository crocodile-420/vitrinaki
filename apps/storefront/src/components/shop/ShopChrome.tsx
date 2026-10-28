import Link from "next/link"

import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher/LanguageSwitcher"
import { translator, type Lang } from "@/lib/i18n/vitrinaki"

import type { ShopColors } from "./ShopProductCard"
import { ShopImage } from "./ShopImage"
import type { ShopResponse } from "./shop-data"
import { isAppointmentType } from "./business-types"
import { shopInitials } from "./shop-style"

const platformUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100").replace(/\/+$/, "")

export function ShopHeader({
  shop,
  colors,
  home,
  locale,
  lang,
}: {
  shop: ShopResponse
  colors: ShopColors
  home: string
  locale: string
  lang: Lang
}) {
  const tr = translator(lang)
  const { storefront, seller } = shop
  const type = shop.profile?.businessType
  const isServices = type ? isAppointmentType(type) || type === "portfolio" : storefront.template === "services"
  const firstNav = type === "portfolio"
    ? { href: "#projects", label: "Έργα", show: Boolean(shop.profile?.portfolio.projects.length) }
    : isAppointmentType(type)
      ? { href: "#services", label: "Υπηρεσίες", show: Boolean(shop.profile?.services.items.length) }
      : { href: "#catalog", label: isServices ? "Υπηρεσίες" : "Συλλογή", show: true }
  return (
    <header style={{ background: colors.page, borderColor: `${colors.ink}1a` }} className="sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
        <Link href={home} className="flex min-w-0 items-center gap-3">
          {seller.logo ? (
            <ShopImage src={seller.logo} alt={storefront.storeName} accent="#fff" soft={colors.accent} className="h-9 w-9 shrink-0 rounded-lg" label={storefront.storeName} small />
          ) : (
            <span style={{ background: colors.accent, color: colors.onAccent || "#fff" }} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-extrabold">
              {shopInitials(storefront.storeName)}
            </span>
          )}
          <span className="truncate text-lg font-extrabold tracking-tight">{storefront.storeName}</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-semibold">
          {firstNav.show ? <a href={`${home}${firstNav.href}`} className="hidden opacity-75 hover:opacity-100 sm:inline">{tr(firstNav.label)}</a> : null}
          <a href={`${home}#about`} className="hidden opacity-75 hover:opacity-100 sm:inline">{tr("Σχετικά")}</a>
          <a href={`${home}#contact`} className="hidden opacity-75 hover:opacity-100 sm:inline">{tr("Επικοινωνία")}</a>
          <LanguageSwitcher lang={lang} label={tr("Γλώσσα")} />
          <Link href={`/${locale}/cart`} style={{ borderColor: colors.ink }} className="rounded-full border px-4 py-1.5 hover:opacity-80">
            {tr("Καλάθι")}
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function ShopFooter({ shop, colors, lang }: { shop: ShopResponse; colors: ShopColors; lang: Lang }) {
  const tr = translator(lang)
  const { storefront } = shop
  return (
    <footer style={{ background: colors.ink, color: colors.page }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-semibold">© {new Date().getFullYear()} {storefront.storeName}</p>
        <a href={platformUrl} className="opacity-70 transition hover:opacity-100">
          {tr("Η βιτρίνα μας φτιάχτηκε με το")} <span className="font-bold">vitrinaki.gr</span>
        </a>
      </div>
    </footer>
  )
}
