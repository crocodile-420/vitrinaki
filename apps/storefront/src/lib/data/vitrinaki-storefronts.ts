export type DirectoryStorefront = {
  handle: string
  storeName: string
  tagline: string
  description: string
  template: "atelier" | "local" | "services"
  palette: "forest" | "terracotta" | "ocean" | "plum"
  businessType?: string | null
  logo: string | null
  banner: string | null
  customDomain: string
}

// Published Vitrinaki websites, newest first. Returns [] when the backend is
// unreachable so the homepage still renders.
export async function listPublishedStorefronts(): Promise<DirectoryStorefront[]> {
  const backend = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9100").replace(/\/+$/, "")
  try {
    const response = await fetch(`${backend}/store/vitrinaki/storefronts`, {
      cache: "no-store",
      headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
    })
    if (!response.ok) return []
    const body = (await response.json()) as { storefronts?: DirectoryStorefront[] }
    return body.storefronts || []
  } catch {
    return []
  }
}

export const paletteColors = {
  // The three Vitrinaki brand palettes: κυπαρισσί, κεραμιδί, μπλε on cream.
  forest: { page: "#F7F2E8", ink: "#2E4A37", accent: "#2E4A37", soft: "#E6ECE3" },
  terracotta: { page: "#FBF4EE", ink: "#5E2E24", accent: "#C0503C", soft: "#F4E1D9" },
  ocean: { page: "#F3F6F9", ink: "#1B3F5E", accent: "#265E8E", soft: "#DDE8F2" },
  plum: { page: "#f8f3f8", ink: "#593756", accent: "#7e4b78", soft: "#efe2ee" },
} as const

export const templateLabels = {
  atelier: { name: "Atelier", text: "Για brands και καταστήματα που θέλουν κομψή, καθαρή παρουσίαση." },
  local: { name: "Γειτονιά", text: "Για τοπικές επιχειρήσεις: ζεστό ύφος, ωράριο, επικοινωνία." },
  services: { name: "Υπηρεσίες", text: "Για επαγγελματίες και υπηρεσίες, με έμφαση στο ραντεβού." },
} as const
