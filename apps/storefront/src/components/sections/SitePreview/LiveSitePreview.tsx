"use client"

import { useEffect, useRef, useState } from "react"
import { SitePreview } from "./SitePreview"
import type { DirectoryStorefront } from "@/lib/data/vitrinaki-storefronts"
import type { Lang } from "@/lib/i18n/vitrinaki"

// The shop's real storefront, rendered at desktop width and scaled down to fit
// the card. The page loads without scripts (server-rendered HTML only) and only
// when the card nears the viewport; the drawn SitePreview stays underneath as
// the placeholder until it has loaded.
const VIEWPORT_WIDTH = 1280
const VIEWPORT_HEIGHT = 900

export function LiveSitePreview({
  site,
  src,
  address,
  className = "",
  lang = "el",
}: {
  site: Pick<DirectoryStorefront, "storeName" | "tagline" | "template" | "palette">
  src: string
  address: string
  className?: string
  lang?: Lang
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const resize = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / VIEWPORT_WIDTH))
    resize.observe(el)
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          seen.disconnect()
        }
      },
      { rootMargin: "400px" }
    )
    seen.observe(el)
    return () => {
      resize.disconnect()
      seen.disconnect()
    }
  }, [])

  return (
    <div className={`overflow-hidden rounded-md border border-black/10 bg-white ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-black/5 bg-white px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-black/10" />
        <span className="h-2 w-2 rounded-full bg-black/10" />
        <span className="h-2 w-2 rounded-full bg-black/10" />
        <span className="ml-2 truncate rounded-sm bg-[#f4f2ee] px-2.5 py-0.5 text-[9px] font-medium text-[#6b7a72]">{address}</span>
      </div>
      <div ref={frameRef} className="relative overflow-hidden" style={{ aspectRatio: `${VIEWPORT_WIDTH} / ${VIEWPORT_HEIGHT}` }}>
        <div className={`absolute inset-0 transition-opacity duration-500 ${loaded ? "opacity-0" : "opacity-100"}`}>
          <SitePreview lang={lang} site={site} address={address} className="h-full rounded-none border-0 [&>div:first-child]:hidden" />
        </div>
        {visible && scale > 0 && (
          <iframe
            src={src}
            title={site.storeName}
            loading="lazy"
            tabIndex={-1}
            sandbox="allow-same-origin"
            onLoad={() => setLoaded(true)}
            className={`pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
            style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT, transform: `scale(${scale})` }}
          />
        )}
      </div>
    </div>
  )
}
