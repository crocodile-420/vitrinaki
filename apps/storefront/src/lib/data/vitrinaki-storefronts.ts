export type DirectoryStorefront = {
  handle: string
  storeName: string
  tagline: string
  description: string
  template: "atelier" | "local" | "services"
  palette: "forest" | "terracotta" | "ocean" | "plum"
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
  forest: { page: "#f7f6ef", ink: "#173f34", accent: "#173f34", soft: "#e7ede4" },
  terracotta: { page: "#fbf4ef", ink: "#633729", accent: "#b95232", soft: "#f4e1d7" },
  ocean: { page: "#f0f6f7", ink: "#174757", accent: "#1e7184", soft: "#dcecef" },
  plum: { page: "#f8f3f8", ink: "#593756", accent: "#7e4b78", soft: "#efe2ee" },
} as const

export const templateLabels = {
  atelier: { name: "Atelier", text: "Για brands και καταστήματα που θέλουν κομψή, καθαρή παρουσίαση." },
  local: { name: "Γειτονιά", text: "Για τοπικές επιχειρήσεις: ζεστό ύφος, ωράριο, επικοινωνία." },
  services: { name: "Υπηρεσίες", text: "Για επαγγελματίες και υπηρεσίες, με έμφαση στο ραντεβού." },
} as const
