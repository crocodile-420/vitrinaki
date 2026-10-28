import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher/LanguageSwitcher"
import { HeaderShell } from "./HeaderShell"
import { FeaturesMenu, MobileMenu } from "./MegaMenu"
import { readStartSession } from "@/lib/data/vitrinaki-start"
import { getTranslator } from "@/lib/i18n/server"
import { shopRegistrationHref, startHref } from "@/lib/vitrinaki-links"

// «Τι παίρνεις» lives inside the «Δυνατότητες» menu now.
const navigation = [
  { label: "Πώς ξεκινάς", href: "/#how-it-works" },
  { label: "Καταστήματα", href: "/#vitrina" },
  // Shown from xl up; below that they stay in the mobile menu so the bar never overflows.
  { label: "Για ποιον", href: "/#for-whom", wide: true },
  { label: "Συνδρομή", href: "/pricing", wide: true },
  { label: "Ερωτήσεις", href: "/#faq" },
]

function VitrinakiWordmark() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/vitrinaki-logo.png" alt="vitrinaki.gr" width={1510} height={390} className="h-7 w-auto sm:h-12" />
}

export const Header = async ({ locale }: { locale: string }) => {
  const { lang, tr } = await getTranslator()
  const signedIn = Boolean(await readStartSession())
  return (
    <HeaderShell locale={locale}>
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <LocalizedClientLink href="/" className="shrink-0" aria-label={tr("Vitrinaki αρχική σελίδα")} data-testid="header-logo-link">
          <VitrinakiWordmark />
        </LocalizedClientLink>

        <nav className="hidden items-center gap-5 lg:flex xl:gap-6" aria-label={tr("Κεντρική πλοήγηση")}>
          <FeaturesMenu locale={locale} />
          {navigation.map((item) => (
            <LocalizedClientLink
              key={item.label}
              href={item.href}
              className={`whitespace-nowrap text-[13px] font-medium tracking-wide text-[#2E4A37]/80 transition-colors hover:text-[#2E4A37] ${"wide" in item ? "hidden xl:inline" : ""}`}
            >
              {tr(item.label)}
            </LocalizedClientLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <LanguageSwitcher lang={lang} label={tr("Γλώσσα")} className="text-[#2E4A37]" />
          <a href={shopRegistrationHref(locale)} className="hidden text-sm font-semibold text-[#2E4A37] transition-colors hover:text-[#265E8E] sm:inline-flex">
            {signedIn ? tr("Η βιτρίνα μου") : tr("Σύνδεση")}
          </a>
          <a
            href={startHref(locale)}
            className="hidden min-h-10 items-center justify-center whitespace-nowrap rounded-full bg-[#2E4A37] px-3 py-2 text-[13px] sm:text-sm font-semibold text-[#F7F2E8] transition hover:bg-[#1f3527] sm:inline-flex sm:px-5"
          >
            {tr("Άνοιξε τη βιτρίνα σου")}
          </a>
          <MobileMenu
            locale={locale}
            links={navigation}
            sellerLink={{ label: signedIn ? "Η βιτρίνα μου" : "Σύνδεση", href: shopRegistrationHref(locale) }}
          />
        </div>
      </div>
    </HeaderShell>
  )
}
