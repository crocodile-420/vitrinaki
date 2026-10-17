import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

const businessUrl =
  process.env.NEXT_PUBLIC_VENDOR_URL || "http://localhost:7001"

const navigation = [
  { label: "Λύσεις", href: "/#solutions" },
  { label: "Πώς λειτουργεί", href: "/#how-it-works" },
  { label: "Παραδείγματα", href: "/#examples" },
  { label: "Ανακάλυψε προϊόντα", href: "/categories" },
]

function VitrinakiWordmark() {
  return (
    <span className="inline-flex items-center gap-2" aria-label="Vitrinaki">
      <svg viewBox="0 0 38 38" className="h-9 w-9 shrink-0" fill="none" aria-hidden="true">
        <path d="M4 13 8 4h22l4 9v4c0 4-5 5-8 2-3 3-8 3-11 0-3 3-11 2-11-2v-4Z" fill="#F15B2A"/>
        <path d="M8 4 12 13H4l4-9Z" fill="#F15B2A"/>
        <path d="M13 4h7v9h-7l-1-9Z" fill="#FF8057"/>
        <path d="M21 4h8l5 9H21V4Z" fill="#F15B2A"/>
        <path d="M5 21h28M9 18v12m10-12v12m10-12v12" stroke="#123F34" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
      <span className="text-[26px] font-extrabold leading-none tracking-[-0.07em] text-[#123f34] sm:text-[29px]">
        Vitri<span className="text-[#f15b2a]">naki</span>
      </span>
    </span>
  )
}

export const Header = ({ locale }: { locale: string }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e8e1d7] bg-[#fffaf3]/95 backdrop-blur" data-testid="header" data-locale={locale}>
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-10">
        <LocalizedClientLink href="/" className="shrink-0" aria-label="Vitrinaki αρχική σελίδα" data-testid="header-logo-link">
          <VitrinakiWordmark />
        </LocalizedClientLink>

        <nav className="hidden items-center gap-6 xl:flex" aria-label="Κεντρική πλοήγηση">
          {navigation.map((item) => (
            <LocalizedClientLink
              key={item.label}
              href={item.href}
              className="text-sm font-semibold text-[#24443a] transition-colors hover:text-[#f05a2a]"
            >
              {item.label}
            </LocalizedClientLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a href={businessUrl} className="hidden text-sm font-semibold text-[#173f34] transition-colors hover:text-[#f05a2a] sm:inline-flex">
            Σύνδεση
          </a>
          <a
            href={businessUrl}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#f15b2a] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#d94a1f] sm:px-5"
          >
            Ξεκίνα σήμερα <span className="ml-2" aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </header>
  )
}
