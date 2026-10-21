"use client"

import { useEffect, useRef, useState } from "react"

// Product and brand images come from external hosts. When one can't load,
// show a calm tile in the shop's own colours instead of a broken image.
export function ShopImage({
  src,
  alt,
  accent,
  soft,
  className = "",
  label,
  small = false,
}: {
  src?: string | null
  alt: string
  accent: string
  soft: string
  className?: string
  label?: string
  small?: boolean
}) {
  const [failed, setFailed] = useState(!src)
  const ref = useRef<HTMLImageElement>(null)

  // An image can fail before hydration, when onError isn't attached yet.
  useEffect(() => {
    const img = ref.current
    if (img && img.complete && img.naturalWidth === 0) setFailed(true)
  }, [])

  if (failed) {
    const initials = (label || alt)
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    return (
      <div style={{ background: soft, color: accent }} className={`grid place-items-center ${className}`} role="img" aria-label={alt}>
        <span className={small ? "text-xs font-extrabold" : "text-2xl font-extrabold tracking-tight opacity-60"}>{initials}</span>
      </div>
    )
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src!} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
}
