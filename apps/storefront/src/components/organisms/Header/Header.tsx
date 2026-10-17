import Image from "next/image"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

const businessUrl =
  process.env.NEXT_PUBLIC_VENDOR_URL || "http://localhost:7001"

const navigation = [
  { label: "Λύσεις", href: "/#solutions" },
  { label: "Πώς λειτουργεί", href: "/#how-it-works" },
  { label: "Παραδείγματα", href: "/#examples" },
  { label: "Ανακάλυψε προϊόντα", href: "/categories" },
]

export const Header = ({ locale }: { locale: string }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e8e1d7] bg-[#fffaf3]/95 backdrop-blur" data-testid="header" data-locale={locale}>
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-10">
        <LocalizedClientLink href="/" className="shrink-0" aria-label="Vitrinaki αρχική σελίδα" data-testid="header-logo-link">
          <Image
            src="/Logo.svg"
            width={190}
            height={42}
            alt="Vitrinaki"
            className="h-auto w-[145px] sm:w-[175px]"
            priority
          />
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
