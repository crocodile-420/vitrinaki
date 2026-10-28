// How a shop page looks beyond template and palette: heading font, corners,
// buttons and a light or dark page. Chosen in the Studio editor and applied by
// the storefront. The defaults reproduce the look shops had before these
// options existed, so a shop without a saved style does not change.

export const STYLE_OPTIONS = {
  font: ["classic", "modern", "minimal"],
  corners: ["round", "soft", "sharp"],
  buttons: ["solid", "outline"],
  theme: ["light", "dark"],
} as const

export type StorefrontStyle = { [K in keyof typeof STYLE_OPTIONS]: (typeof STYLE_OPTIONS)[K][number] }

export const DEFAULT_STYLE: StorefrontStyle = { font: "classic", corners: "round", buttons: "solid", theme: "light" }

export function normalizeStyle(value: unknown): StorefrontStyle {
  const input = (value && typeof value === "object" ? value : {}) as Record<string, unknown>
  const pick = <K extends keyof StorefrontStyle>(key: K): StorefrontStyle[K] =>
    (STYLE_OPTIONS[key] as readonly string[]).includes(String(input[key])) ? (input[key] as StorefrontStyle[K]) : DEFAULT_STYLE[key]
  return { font: pick("font"), corners: pick("corners"), buttons: pick("buttons"), theme: pick("theme") }
}
