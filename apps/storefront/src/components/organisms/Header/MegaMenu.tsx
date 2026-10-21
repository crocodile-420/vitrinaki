"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useId, useRef, useState } from "react"

import { useTranslator } from "@/lib/i18n/client"
import { featureGroups, type FeatureIcon, type FeatureItem } from "./features"

// «Δυνατότητες»: a dark panel under the header listing what Vitrinaki does,
// grouped like a product menu. Opens on hover (with a short intent delay) or
// click; Esc, a click outside or following a link closes it. On phones the
// same groups live in an accordion inside the menu sheet (MobileMenu).

const iconPaths = {
  template: <><rect x="3.5" y="4" width="17" height="16" rx="2" /><path d="M3.5 9h17M9 9v11" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5s1.1-6.1 3.4-8.5Z" /></>,
  questions: <><path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-7l-4 3v-3H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5Z" /><path d="M10 9.3a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6.9v.4M12 14.2h.01" /></>,
  lang: <><path d="M4 5.5h9M8.5 3.5v2M6 5.5c.8 3.4 3 5.9 6 7.4M11 5.5c-.8 3.4-3 5.9-6 7.4" /><path d="m13 20.5 4-9 4 9M14.5 17.5h5" /></>,
  store: <><path d="M4 9.5 5.5 4.5h13L20 9.5" /><path d="M4 9.5c0 1.4 1.1 2.5 2.7 2.5s2.6-1.1 2.6-2.5c0 1.4 1.2 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1 2.5 2.6 2.5S20 10.9 20 9.5" /><path d="M5.5 12v7.5h13V12M10 19.5v-4.5h4v4.5" /></>,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2.2" /><path d="M10.5 18h3" /></>,
  megaphone: <><path d="M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1Z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M18.8 6.2a8.2 8.2 0 0 1 0 11.6" /></>,
  box: <><path d="m12 3.5 8 4.3v8.4L12 20.5l-8-4.3V7.8l8-4.3Z" /><path d="m4 7.8 8 4.4 8-4.4M12 12.2v8.3" /></>,
  orders: <><path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v15.5l-3-2-3.5 2-3.5-2-3 2V5A1.5 1.5 0 0 1 7 3.5Z" /><path d="M9 8.5h6M9 12h6M9 15.5h3" /></>,
  profile: <><circle cx="12" cy="9" r="3.5" /><path d="M5 19.5c1.3-3.2 3.8-4.8 7-4.8s5.7 1.6 7 4.8" /></>,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  doc: <><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v4h4M9 12h6M9 16h4" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M12 14h2M8 17h2" /></>,
} satisfies Record<FeatureIcon, unknown>

export function FeatureGlyph({ name, size = 20 }: { name: FeatureIcon; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
      <path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SoonBadge({ dark = true }: { dark?: boolean }) {
  const { tr } = useTranslator()
  return (
    <span className={`ml-2 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold tracking-wide ${dark ? "bg-[#F7F2E8]/12 text-[#F2C9BE]" : "bg-[#265E8E]/10 text-[#265E8E]"}`}>
      {tr("Σύντομα")}
    </span>
  )
}

function FeatureLink({ item, locale, onNavigate }: { item: FeatureItem; locale: string; onNavigate: () => void }) {
  const { tr } = useTranslator()
  return (
    <Link
      href={`/${locale}${item.href}`}
      onClick={onNavigate}
      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors hover:bg-[#F7F2E8]/[0.07] focus-visible:bg-[#F7F2E8]/[0.09] focus-visible:ring-2 focus-visible:ring-[#E3836F]/70"
    >
      <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors ${item.soon ? "border-[#F7F2E8]/10 text-[#F7F2E8]/55" : "border-[#F7F2E8]/15 text-[#F7F2E8] group-hover:border-[#E3836F]/60 group-hover:text-[#F2C9BE]"}`}>
        <FeatureGlyph name={item.icon} />
      </span>
      <span className="min-w-0">
        <span className={`flex items-center text-[14px] font-semibold leading-snug ${item.soon ? "text-[#F7F2E8]/75" : "text-[#F7F2E8]"}`}>
          {tr(item.label)}
          {item.soon ? <SoonBadge /> : null}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-5 text-[#F7F2E8]/60">{tr(item.text)}</span>
      </span>
    </Link>
  )
}

const OPEN_DELAY = 120
const CLOSE_DELAY = 220

export function FeaturesMenu({ locale }: { locale: string }) {
  const { tr } = useTranslator()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  const clear = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  const later = (next: boolean, delay: number) => {
    clear()
    timer.current = setTimeout(() => setOpen(next), delay)
  }
  const close = useCallback((refocus = false) => {
    clear()
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }, [])

  // Any navigation closes it.
  useEffect(() => close(), [pathname, close])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true)
    }
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) close()
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
    }
  }, [open, close])

  useEffect(() => clear, [])

  const focusFirst = () => requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("a")?.focus())

  return (
    <div onMouseEnter={() => later(true, OPEN_DELAY)} onMouseLeave={() => later(false, CLOSE_DELAY)}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          clear()
          setOpen((value) => !value)
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault()
            setOpen(true)
            focusFirst()
          }
        }}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold tracking-wide outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2E4A37]/40 ${open ? "bg-[#2E4A37] text-[#F7F2E8]" : "text-[#2E4A37] hover:bg-[#2E4A37]/[0.07]"}`}
      >
        {tr("Δυνατότητες")}
        <Chevron open={open} />
      </button>

      {/* Anchored to the sticky <header>, so it spans the full width under it. */}
      <div
        ref={panelRef}
        id={panelId}
        role="region"
        aria-label={tr("Δυνατότητες")}
        onMouseEnter={clear}
        onKeyDown={(event) => {
          if (event.key === "Tab" && !event.shiftKey) {
            const links = panelRef.current?.querySelectorAll<HTMLElement>("a")
            if (links && document.activeElement === links[links.length - 1]) close()
          }
        }}
        className={`absolute inset-x-0 top-full z-30 origin-top px-4 pt-2 transition-[opacity,transform,visibility] duration-200 ease-out sm:px-6 lg:px-10 ${
          open ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-2 opacity-0"
        }`}
      >
        <div className="mx-auto grid max-w-[1400px] gap-8 overflow-hidden rounded-[1.4rem] bg-[#1F3628] p-7 text-[#F7F2E8] shadow-[0_40px_80px_-30px_rgba(18,32,24,0.7)] ring-1 ring-black/10 xl:grid-cols-[minmax(0,1fr)_280px] xl:p-8">
          <div className="grid gap-x-6 gap-y-7 md:grid-cols-2 xl:grid-cols-4">
            {featureGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#E3836F]">{tr(group.title)}</p>
                <ul className="mt-2.5 space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <FeatureLink item={item} locale={locale} onNavigate={() => close()} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="relative isolate flex flex-col justify-between overflow-hidden rounded-2xl bg-[#2E4A37] p-6 ring-1 ring-[#F7F2E8]/10">
            <div aria-hidden="true" className="absolute -right-16 -top-16 -z-10 h-48 w-48 rounded-full bg-[#265E8E]/35 blur-3xl" />
            <div aria-hidden="true" className="absolute -bottom-20 -left-10 -z-10 h-48 w-48 rounded-full bg-[#265E8E]/40 blur-3xl" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F2C9BE]">{tr("Ξεκίνα σήμερα")}</p>
              <p className="mt-3 text-[1.35rem] font-extrabold leading-tight tracking-[-0.01em]">{tr("Η βιτρίνα σου ξεκινά με ένα όνομα.")}</p>
              <p className="mt-2 text-[13.5px] leading-6 text-[#F7F2E8]/70">{tr("Λίγες ερωτήσεις, και η σελίδα σου παίρνει μορφή. Χωρίς κάρτα, χωρίς τεχνικές γνώσεις.")}</p>
            </div>
            <Link
              href={`/${locale}/start`}
              onClick={() => close()}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#265E8E] px-5 text-[14px] font-semibold text-white outline-none transition hover:bg-[#1D4C74] focus-visible:ring-2 focus-visible:ring-[#F2C9BE]"
            >
              {tr("Άνοιξε τη βιτρίνα σου")} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Phones and tablets: a menu button opening a sheet with the main links, the
// «Δυνατότητες» groups as an accordion, and the seller link.
export function MobileMenu({
  locale,
  links,
  sellerLink,
}: {
  locale: string
  links: { label: string; href: string }[]
  sellerLink: { label: string; href: string }
}) {
  const { tr } = useTranslator()
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<string | null>(null)
  const sheetId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={sheetId}
        aria-label={open ? tr("Κλείσιμο μενού") : tr("Μενού")}
        onClick={() => setOpen((value) => !value)}
        className="grid h-10 w-10 place-items-center rounded-full text-[#2E4A37] outline-none transition-colors hover:bg-[#2E4A37]/[0.07] focus-visible:ring-2 focus-visible:ring-[#2E4A37]/40"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      <div
        id={sheetId}
        className={`absolute inset-x-0 top-full z-30 h-[calc(100dvh-100%)] overflow-y-auto overscroll-contain bg-[#F7F2E8] transition-[opacity,transform,visibility] duration-200 ease-out ${
          open ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-2 opacity-0"
        }`}
      >
        <nav aria-label={tr("Κεντρική πλοήγηση")} className="px-4 pb-10 pt-3 sm:px-6">
          <div className="overflow-hidden rounded-2xl bg-[#1F3628] text-[#F7F2E8]">
            <p className="px-5 pt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#E3836F]">{tr("Δυνατότητες")}</p>
            <ul className="mt-1 divide-y divide-[#F7F2E8]/10">
              {featureGroups.map((group) => {
                const expanded = section === group.title
                const panel = `${sheetId}-${group.title.length}`
                return (
                  <li key={group.title}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={panel}
                      onClick={() => setSection(expanded ? null : group.title)}
                      className="flex w-full items-center justify-between px-5 py-3.5 text-left text-[15px] font-semibold outline-none focus-visible:bg-[#F7F2E8]/[0.07]"
                    >
                      {tr(group.title)}
                      <Chevron open={expanded} />
                    </button>
                    <div
                      id={panel}
                      className={`grid transition-[grid-template-rows] duration-200 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                    >
                      <ul className="min-h-0 overflow-hidden px-2" inert={!expanded}>
                        {group.items.map((item) => (
                          <li key={item.label} className="last:pb-3">
                            <FeatureLink item={item} locale={locale} onNavigate={close} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <ul className="mt-4 space-y-1">
            {links.map((link) => (
              <li key={link.label}>
                <Link
                  href={`/${locale}${link.href}`}
                  onClick={close}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-semibold text-[#1F3628] outline-none transition-colors hover:bg-[#2E4A37]/[0.06] focus-visible:bg-[#2E4A37]/[0.08]"
                >
                  {tr(link.label)}
                  <span aria-hidden="true" className="text-[#2E4A37]/40">→</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-5 grid gap-2.5 border-t border-[#2E4A37]/10 pt-5">
            <a href={sellerLink.href} onClick={close} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#2E4A37]/20 bg-white px-5 text-[15px] font-semibold text-[#2E4A37]">
              {tr(sellerLink.label)}
            </a>
            <a href={`/${locale}/start`} onClick={close} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#265E8E] px-5 text-[15px] font-semibold text-white">
              {tr("Άνοιξε τη βιτρίνα σου")} <span aria-hidden="true">→</span>
            </a>
          </div>
        </nav>
      </div>
    </div>
  )
}
