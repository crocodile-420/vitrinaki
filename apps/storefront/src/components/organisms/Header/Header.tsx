import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

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
  return <img src="/brand/vitrinaki-logo.png" alt="vitrinaki.gr" width={1510} height={390} className="h-10 w-auto sm:h-12" />
}

export const Header = ({ locale }: { locale: string }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e8e1d7] bg-[#F7F2E8]/95 backdrop-blur" data-testid="header" data-locale={locale}>
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-10">
        <LocalizedClientLink href="/" className="shrink-0" aria-label="Vitrinaki αρχική σελίδα" data-testid="header-logo-link">
          <VitrinakiWordmark />
        </LocalizedClientLink>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Κεντρική πλοήγηση">
          {navigation.map((item) => (
            <LocalizedClientLink
              key={item.label}
              href={item.href}
              className="text-sm font-semibold text-[#2E4A37] transition-colors hover:text-[#C0503C]"
            >
              {item.label}
            </LocalizedClientLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a href={studioLoginUrl} className="hidden text-sm font-semibold text-[#2E4A37] transition-colors hover:text-[#C0503C] sm:inline-flex">
            Σύνδεση
          </a>
          <a
            href={studioRegisterUrl}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#C0503C] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#a5412f] sm:px-5"
          >
            Άνοιξε τη βιτρίνα σου
          </a>
        </div>
      </div>
    </header>
  )
}
