"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import type { ShopResponse } from "@/components/shop/shop-data"
import { useTranslator } from "@/lib/i18n/client"

// The built shop as its real page renders it: /studio-preview in an iframe,
// fed the draft by postMessage. A computer view is drawn at 1280px and scaled
// down to the box; a phone view at 390px.
const WIDTH = { desktop: 1280, mobile: 390 } as const

export function SitePreview({ url, shop, height = 560 }: { url: string; shop: ShopResponse | null; height?: number }) {
  const { tr } = useTranslator()
  const frame = useRef<HTMLIFrameElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [width, setWidth] = useState(0)
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const origin = useMemo(() => (typeof window === "undefined" ? "" : window.location.origin), [])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin === origin && event.source === frame.current?.contentWindow && event.data?.type === "vk-preview-ready") setReady(true)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [origin])

  useEffect(() => {
    if (ready && shop) frame.current?.contentWindow?.postMessage({ type: "vk-preview", shop }, origin)
  }, [ready, shop, origin])

  useEffect(() => {
    const element = box.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const renderWidth = WIDTH[device]
  const scale = width ? Math.min(1, width / renderWidth) : 1

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2E4A37]/12 bg-[#F7F2E8] shadow-[0_40px_90px_-50px_rgba(31,54,40,0.6)]">
      <div className="flex items-center justify-between gap-2 border-b border-[#2E4A37]/10 bg-white px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E08A76]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E9C46A]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#8FB38A]" />
        </span>
        <div role="group" aria-label={tr("Συσκευή")} className="flex rounded-lg bg-[#F7F2E8] p-0.5">
          {(["desktop", "mobile"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={device === d}
              onClick={() => setDevice(d)}
              className={`rounded-md px-3 py-1 text-[12.5px] font-semibold transition ${device === d ? "bg-white text-[#1F3628] shadow-sm" : "text-[#2E4A37]/65 hover:text-[#1F3628]"}`}
            >
              {tr(d === "desktop" ? "Υπολογιστής" : "Κινητό")}
            </button>
          ))}
        </div>
      </div>
      <div ref={box} className="relative" style={{ height }}>
        <div className="absolute left-1/2 top-0" style={{ width: renderWidth, height: height / scale, transform: `translateX(-50%) scale(${scale})`, transformOrigin: "top center" }}>
          <iframe ref={frame} src={url} title={tr("Η σελίδα σου")} className="h-full w-full bg-white" />
        </div>
        {!ready || !shop ? (
          <div className="absolute inset-0 grid place-items-center bg-[#F7F2E8]/80 text-[14px] font-medium text-[#2E4A37]/70">{tr("Στήνουμε τη σελίδα σου…")}</div>
        ) : null}
      </div>
    </div>
  )
}
