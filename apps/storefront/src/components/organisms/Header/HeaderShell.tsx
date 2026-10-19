"use client"

import { useEffect, useState } from "react"

// Always a cream bar (the logo must show in its own colours); it gains a soft
// shadow once the visitor scrolls past the top of the page.
export function HeaderShell({ children, locale }: { children: React.JSX.Element[] | React.JSX.Element; locale: string }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      data-testid="header"
      data-locale={locale}
      className={`sticky top-0 z-40 border-b bg-[#F7F2E8]/95 backdrop-blur transition-shadow duration-300 ${
        scrolled ? "border-[#2E4A37]/10 shadow-[0_10px_30px_-20px_rgba(46,74,55,0.45)]" : "border-transparent"
      }`}
    >
      {children}
    </header>
  )
}
