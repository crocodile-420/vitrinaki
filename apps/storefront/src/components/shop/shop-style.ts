import { paletteColors } from "@/lib/data/vitrinaki-storefronts"

import type { ShopColors } from "./ShopProductCard"

// The look a seller picks in the Studio editor on top of template and palette
// (backend: packages/api/src/lib/vitrinaki-storefront-style.ts). The defaults
// are the look shops had before these options, so nothing changes for a shop
// that never chose a style. The CSS that applies them lives in globals.css
// under `.vk-shop`.
export type ShopStyle = {
  font: "classic" | "modern" | "minimal"
  corners: "round" | "soft" | "sharp"
  buttons: "solid" | "outline"
  theme: "light" | "dark"
}

export const DEFAULT_STYLE: ShopStyle = { font: "classic", corners: "round", buttons: "solid", theme: "light" }

export const shopStyle = (style: Partial<ShopStyle> | null | undefined): ShopStyle => ({ ...DEFAULT_STYLE, ...(style || {}) })

// Mix two #rrggbb colours; t = share of `b`.
function mix(a: string, b: string, t: number) {
  const pa = a.match(/\w\w/g)!.map((x) => parseInt(x, 16))
  const pb = b.match(/\w\w/g)!.map((x) => parseInt(x, 16))
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`
}

// A dark page swaps ink and paper; the accent becomes the palette's light tint
// so buttons stay readable, with dark text on them.
export function themedColors(palette: string, theme: ShopStyle["theme"]): ShopColors {
  const c = paletteColors[palette as keyof typeof paletteColors] || paletteColors.forest
  return theme === "dark"
    ? { page: c.ink, ink: c.page, accent: c.soft, soft: mix(c.ink, c.page, 0.1), onAccent: c.ink }
    : { ...c, onAccent: "#fff" }
}

// Attributes for the page wrapper; globals.css reads them.
export const styleAttrs = (style: ShopStyle) => ({
  "data-font": style.font,
  "data-corners": style.corners,
  "data-buttons": style.buttons,
  "data-theme": style.theme,
})

export const shopInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
