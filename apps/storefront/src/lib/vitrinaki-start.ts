// Shared (client + server) helpers of the public «Άνοιξε τη βιτρίνα σου»
// sign-up page (/[locale]/start). The validators mirror the backend ones in
// packages/api/src/lib/vitrinaki-profile.ts, which re-validates everything.

// ---------- Greek → Latin shop address ----------

const DIGRAPHS: [RegExp, string][] = [
  [/ου/g, "ou"], [/ού/g, "ou"],
  [/μπ/g, "mp"], [/ντ/g, "nt"], [/γγ/g, "ng"], [/γκ/g, "gk"], [/τσ/g, "ts"], [/τζ/g, "tz"],
  [/ει/g, "ei"], [/εί/g, "ei"], [/οι/g, "oi"], [/οί/g, "oi"], [/αι/g, "ai"], [/αί/g, "ai"],
]
// αυ/ευ/ηυ: "f" before a voiceless consonant or at the end, else "v" (ΕΛΟΤ 743).
const VOICELESS = "θκξπστφχψ"
const LETTERS: Record<string, string> = {
  α: "a", ά: "a", β: "v", γ: "g", δ: "d", ε: "e", έ: "e", ζ: "z", η: "i", ή: "i", θ: "th", ι: "i", ί: "i", ϊ: "i", ΐ: "i",
  κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", ό: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", ύ: "y",
  ϋ: "y", ΰ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o", ώ: "o",
}

export function greekToLatin(input: string): string {
  let s = input.toLowerCase()
  s = s.replace(/([αεη])([υύ])(.?)/g, (_m, vowel: string, _u: string, next: string) => {
    const base = vowel === "α" ? "a" : vowel === "ε" ? "e" : "i"
    return `${base}${!next || VOICELESS.includes(next) || !/[α-ωά-ώ]/.test(next) ? "f" : "v"}${next}`
  })
  for (const [pattern, latin] of DIGRAPHS) s = s.replace(pattern, latin)
  return s.replace(/[α-ωάέήίόύώϊϋΐΰς]/g, (c) => LETTERS[c] ?? "")
}

export const HANDLE_MIN = 3
export const HANDLE_MAX = 48

export function slugify(input: string): string {
  return greekToLatin(input.normalize("NFC"))
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, HANDLE_MAX)
    .replace(/-+$/g, "")
}

// What the seller may type into the address field itself.
export const cleanHandleInput = (value: string) =>
  greekToLatin(value).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+/, "").slice(0, HANDLE_MAX)

export const isValidHandle = (value: string) =>
  value.length >= HANDLE_MIN && value.length <= HANDLE_MAX && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/.test(value) && !value.includes("--")

// ---------- validators ----------

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
const phoneDigits = (v: string) => {
  let d = v.replace(/[\s\-().]/g, "")
  if (d.startsWith("0030")) d = `+30${d.slice(4)}`
  return d
}
export const isGreekPhone = (v: string) => /^(2\d{9}|69\d{8})$/.test(phoneDigits(v).replace(/^\+30/, ""))
export const isMessengerPhone = (v: string) => /^69\d{8}$/.test(phoneDigits(v).replace(/^\+30/, "")) || /^\+\d{8,15}$/.test(phoneDigits(v))
export const isPostalCode = (v: string) => /^\d{3}\s?\d{2}$/.test(v.trim())

export const PASSWORD_MIN = 8

// 0 = too short, 1 = weak, 2 = ok, 3 = strong. Only length is required;
// the rest is a gentle hint.
export function passwordStrength(password: string, email = ""): 0 | 1 | 2 | 3 {
  if (password.length < PASSWORD_MIN) return 0
  const lower = password.toLowerCase()
  const local = email.split("@")[0]?.toLowerCase() || ""
  if (/^(.)\1+$/.test(password) || /^(12345678|password|qwerty|11111111|00000000)/.test(lower) || (local.length > 3 && lower.includes(local))) return 1
  let variety = 0
  if (/[a-zα-ω]/.test(password)) variety++
  if (/[A-ZΑ-Ω]/.test(password)) variety++
  if (/\d/.test(password)) variety++
  if (/[^A-Za-z0-9Α-Ωα-ωά-ώ]/.test(password)) variety++
  if (password.length >= 14 || (password.length >= 10 && variety >= 3)) return 3
  return variety >= 2 ? 2 : 1
}

// ---------- optional steps ----------

export type BusinessType = "retail" | "crafts" | "food" | "beauty" | "services" | "portfolio" | "other"
export type Palette = "forest" | "terracotta" | "ocean"
export type Template = "atelier" | "local" | "services"

// Same types (and order) as the Studio store-profile wizard.
export const BUSINESS_TYPES: { value: BusinessType; label: string; hint: string; icon: string }[] = [
  { value: "retail", label: "Κατάστημα / Λιανική", hint: "Ρούχα, δώρα, είδη σπιτιού", icon: "store" },
  { value: "crafts", label: "Χειροποίητα", hint: "Κόσμημα, κεραμική, ξύλο", icon: "hand" },
  { value: "food", label: "Τρόφιμα & τοπικά", hint: "Λάδι, μέλι, κρασί, γλυκά", icon: "leaf" },
  { value: "beauty", label: "Ομορφιά & ευεξία", hint: "Κομμωτήριο, αισθητική, γυμναστική", icon: "drop" },
  { value: "services", label: "Υπηρεσίες", hint: "Τεχνικός, δάσκαλος, σύμβουλος", icon: "tool" },
  { value: "portfolio", label: "Portfolio", hint: "Φωτογράφος, designer, freelancer", icon: "brief" },
  { value: "other", label: "Κάτι άλλο", hint: "Πες μας με δυο λέξεις", icon: "dots" },
]

export const TEMPLATE_FOR_TYPE: Record<BusinessType, Template> = {
  retail: "atelier", crafts: "atelier", food: "local", beauty: "services", services: "services", portfolio: "services", other: "atelier",
}

export const PALETTES: { value: Palette; label: string; color: string; soft: string; page: string; ink: string }[] = [
  { value: "forest", label: "Κυπαρισσί", color: "#2E4A37", soft: "#E6ECE3", page: "#F7F2E8", ink: "#2E4A37" },
  { value: "terracotta", label: "Κεραμιδί", color: "#C0503C", soft: "#F4E1D9", page: "#FBF4EE", ink: "#5E2E24" },
  { value: "ocean", label: "Μπλε", color: "#265E8E", soft: "#DDE8F2", page: "#F3F6F9", ink: "#1B3F5E" },
]

// One-click tagline ideas per type (same copy as the Studio wizard).
export const TAGLINE_IDEAS: Record<BusinessType, string> = {
  retail: "Το αγαπημένο μαγαζί της γειτονιάς, τώρα και online",
  crafts: "Χειροποίητα κομμάτια, φτιαγμένα ένα-ένα",
  food: "Από τον τόπο μας, κατευθείαν στο τραπέζι σου",
  beauty: "Χρόνος για σένα, με επαγγελματική φροντίδα",
  services: "Αξιόπιστη δουλειά, καθαρές τιμές",
  portfolio: "Ιδέες που γίνονται έργα",
  other: "Καλώς ήρθες στη βιτρίνα μας",
}

export const OPTIONAL_STEPS = ["type", "story", "photos", "location", "contact"] as const
export const MAX_PHOTOS = 8
export type OptionalStep = (typeof OPTIONAL_STEPS)[number]

// ---------- API shapes (storefront route handlers) ----------

export type StartErrorCode =
  | "invalid"
  | "email_exists"
  | "account_exists"
  | "name_taken"
  | "handle_taken"
  | "server"

export type StartResponse =
  | { ok: true; seller: { name: string; handle: string }; email: string; referral?: { applied: boolean; message?: string; referrerName?: string } }
  | { ok: false; code: StartErrorCode; message: string; fields?: Record<string, string>; suggestion?: string }

// Greek capitals carry no accents; CSS `uppercase` keeps them in Chromium, so
// small-caps labels are uppercased here instead.
export const caps = (text: string) => text.normalize("NFD").replace(/́/g, "").normalize("NFC").toUpperCase()
