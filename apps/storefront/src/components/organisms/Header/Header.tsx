import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher/LanguageSwitcher"
import { getTranslator } from "@/lib/i18n/server"
import { studioLoginUrl, studioRegisterUrl } from "@/lib/vitrinaki-links"

const navigation = [
  { label: "Για ποιον", href: "/#for-whom" },
  { label: "Καταστήματα", href: "/#vitrina" },
  { label: "Τι παίρνεις", href: "/#included" },
  { label: "Πώς ξεκινάς", href: "/#how-it-works" },
  { label: "Ερωτήσεις", href: "/#faq" },
]

function VitrinakiWordmark() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/vitrinaki-logo.png" alt="vitrinaki.gr" width={1510} height={390} className="h-7 w-auto sm:h-12" />
}

export const Header = async ({ locale }: { locale: string }) => {
  const { lang, tr } = await getTranslator()
  return (
    <header className="sticky top-0 z-40 border-b border-[#2E4A37]/10 bg-[#F7F2E8]/95 backdrop-blur" data-testid="header" data-locale={locale}>
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <LocalizedClientLink href="/" className="shrink-0" aria-label={tr("Vitrinaki αρχική σελίδα")} data-testid="header-logo-link">
          <VitrinakiWordmark />
        </LocalizedClientLink>

        <nav className="hidden items-center gap-6 lg:flex" aria-label={tr("Κεντρική πλοήγηση")}>
          {navigation.map((item) => (
            <LocalizedClientLink
              key={item.label}
              href={item.href}
              className="text-[13px] font-medium tracking-wide text-[#2E4A37]/80 transition-colors hover:text-[#2E4A37]"
            >
              {tr(item.label)}
            </LocalizedClientLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <LanguageSwitcher lang={lang} label={tr("Γλώσσα")} className="text-[#2E4A37]" />
          <a href={studioLoginUrl} className="hidden text-sm font-semibold text-[#2E4A37] transition-colors hover:text-[#C0503C] sm:inline-flex">
            {tr("Σύνδεση")}
          </a>
          <a
            href={studioRegisterUrl}
            className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-md bg-[#2E4A37] px-3 py-2 text-[13px] sm:text-sm font-semibold text-[#F7F2E8] transition hover:bg-[#1f3527] sm:px-5"
          >
            {tr("Άνοιξε τη βιτρίνα σου")}
          </a>
        </div>
      </div>
    </header>
  )
}
