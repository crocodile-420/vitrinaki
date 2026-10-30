"use client"

import { useMemo, useState } from "react"

import { GlassEntrance, type GlassCopy } from "@/components/sections/Premium/GlassEntrance"

// The «Γυαλί» premium template on a shop's own page: the shop's name, message
// and description printed on smoked glass. The glass's links go to the page's
// sections; its button shatters it and behind it waits the same menu as big
// links, with «Πίσω στο γυαλί» to put it back together.

const FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"

type Link = { href: string; label: string }

// Words into at most `count` lines of about `width` characters, the last one
// cut with an ellipsis when the text runs longer.
function wrap(text: string, width: number, count: number) {
  const lines: string[] = []
  let line = ""
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && (line + " " + word).length > width) {
      lines.push(line)
      line = word
      if (lines.length === count) break
    } else line = line ? `${line} ${word}` : word
  }
  if (lines.length < count && line) lines.push(line)
  const used = lines.join(" ").length
  if (used < text.trim().length && lines.length) lines[lines.length - 1] = lines[lines.length - 1].replace(/[\s,.;:]*$/, "") + "…"
  return lines
}

// Two balanced lines for the headline.
function split(title: string): [string, string] {
  const words = title.trim().slice(0, 60).split(/\s+/)
  if (words.length < 2) return [title, ""]
  let best = 1, diff = Infinity
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length)
    if (d < diff) { diff = d; best = i }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")]
}

const go = (href: string) => {
  const target = href.startsWith("#") ? document.querySelector(href) : null
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" })
  else window.location.href = href
}

export function GlassShopHero({ storeName, eyebrow, tagline, description, primary, links, footRight, backLabel }: {
  storeName: string
  eyebrow: string
  tagline: string
  description: string
  primary: Link
  links: Link[]
  footRight: string
  backLabel: string
}) {
  const [open, setOpen] = useState(false)
  const nav = links.slice(0, 3)
  const contact = links.find((l) => l.href === "#contact")

  const copy = useMemo<GlassCopy>(() => ({
    brand: storeName.slice(0, 40),
    nav: nav.map((l) => l.label),
    start: contact?.label || primary.label,
    eyebrow: eyebrow.toLocaleUpperCase("el").normalize("NFD").replace(/[̀-ͯ]/g, "").slice(0, 60),
    title: split(tagline || storeName),
    sub: wrap(description, 80, 2),
    subPhone: wrap(description, 38, 2),
    open: primary.label,
    startLink: `${contact?.label || storeName} →`,
    footLeft: `© ${storeName}`,
    footRight,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [storeName, eyebrow, tagline, description, primary.label, footRight, nav.map((l) => l.label).join("|"), contact?.label])

  return (
    <section className="relative h-[calc(100svh-4.5rem)] min-h-[560px] overflow-hidden bg-[#050507] text-white">
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <div className={`absolute inset-0 flex flex-col justify-center gap-3 px-6 transition-opacity sm:px-[12%] ${open ? "opacity-100 delay-300 duration-700" : "pointer-events-none opacity-0 duration-200"}`} inert={!open}>
        <button type="button" onClick={() => setOpen(false)} className="mb-6 self-start rounded-md bg-gradient-to-br from-[#2a2a33] via-[#121216] to-[#1f1d2a] px-5 py-3 text-sm font-medium shadow-[inset_0_0_0_1px_rgba(255,255,255,.18),0_10px_18px_rgba(0,0,0,.8)] transition-colors hover:text-[#b9abff] [transform:perspective(900px)_rotateY(-9deg)_rotateX(4deg)]">
          ← {backLabel}
        </button>
        {[primary, ...links.filter((l) => l.href !== primary.href)].map((l) => (
          <a key={l.href} href={l.href} className="group flex items-baseline justify-between border-b border-white/10 py-3 text-[clamp(28px,4.4vw,56px)] font-medium tracking-[-0.03em] text-[#dcdce0] transition-colors hover:text-white">
            {l.label}
            <span className="text-base text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-[#b9abff]">→</span>
          </a>
        ))}
      </div>
      <GlassEntrance
        copy={copy}
        open={open}
        onOpen={() => setOpen(true)}
        onStart={() => go(contact?.href || primary.href)}
        onNav={(i) => nav[i] && go(nav[i].href)}
        onSettled={() => undefined}
      />
    </section>
  )
}
