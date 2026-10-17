import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

const footerGroups = [
  {
    title: "Η πλατφόρμα",
    links: [
      { label: "Οι λύσεις μας", href: "/#solutions" },
      { label: "Πώς λειτουργεί", href: "/#how-it-works" },
      { label: "Παραδείγματα", href: "/#examples" },
    ],
  },
  {
    title: "Ανακάλυψη",
    links: [
      { label: "Προϊόντα", href: "/categories" },
      { label: "Κατηγορίες", href: "/categories" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-[#103d32] text-[#f8f2e8]" data-testid="footer">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr] lg:px-10">
        <div>
          <LocalizedClientLink href="/" className="inline-flex items-center text-2xl font-extrabold tracking-tight text-white">
            Vitrinaki<span className="ml-1 text-[#ff6a37]">.</span>
          </LocalizedClientLink>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#d3e0d8]">
            Η ψηφιακή βάση για τις μικρές ελληνικές επιχειρήσεις. Δημιούργησε τη δική σου παρουσία online και μεγάλωσε με τον δικό σου ρυθμό.
          </p>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-white">{group.title}</h2>
            <nav className="mt-4 flex flex-col items-start gap-3" aria-label={group.title}>
              {group.links.map((item) => (
                <LocalizedClientLink key={item.label} href={item.href} className="text-sm text-[#d3e0d8] transition-colors hover:text-white">
                  {item.label}
                </LocalizedClientLink>
              ))}
            </nav>
          </div>
        ))}
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-5 py-5 text-xs text-[#d3e0d8] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <span>© {new Date().getFullYear()} Vitrinaki. Όλα τα δικαιώματα διατηρούνται.</span>
          <span>Φτιαγμένο για τις μικρές επιχειρήσεις της Ελλάδας.</span>
        </div>
      </div>
    </footer>
  )
}
