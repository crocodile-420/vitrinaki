// Store-profile wizard of /[locale]/shop-registration: business types, the
// question flow per type, suggested copy and client-side validators. Kept in
// step with the Studio copy (apps/vendor/src/lib/vitrinaki-profile.ts); the
// validators mirror packages/api/src/lib/vitrinaki-profile.ts, which
// re-validates everything on save.

export type BusinessType =
  | "retail" | "crafts" | "food" | "beauty" | "fitness" | "lessons" | "health" | "professional" | "events" | "services" | "portfolio" | "other"

// Kinds of business that sell their time by appointment: they get the
// services step and a page that leads with the price list.
export const APPOINTMENT_TYPES: BusinessType[] = ["beauty", "fitness", "lessons", "health", "professional", "events", "services"]
export const isAppointmentType = (type: string | null | undefined) => APPOINTMENT_TYPES.includes(type as BusinessType)

export const BUSINESS_TYPES: { value: BusinessType; label: string; hint: string }[] = [
  { value: "retail", label: "Κατάστημα / Λιανική", hint: "Μαγαζί με προϊόντα: ρούχα, δώρα, είδη σπιτιού…" },
  { value: "crafts", label: "Χειροποίητα / Δημιουργοί", hint: "Κόσμημα, κεραμική, ξύλο, ύφασμα — φτιαγμένα από σένα." },
  { value: "food", label: "Τρόφιμα & τοπικά προϊόντα", hint: "Λάδι, μέλι, κρασί, τυριά, γλυκά, παραγωγή σου." },
  { value: "beauty", label: "Ομορφιά & περιποίηση", hint: "Κομμωτήριο, αισθητική, νύχια, μασάζ." },
  { value: "fitness", label: "Γυμναστική & χορός", hint: "Personal trainer, γιόγκα, pilates, σχολή χορού." },
  { value: "lessons", label: "Μαθήματα", hint: "Καθηγητής, φροντιστήριο, μουσική, ξένες γλώσσες." },
  { value: "health", label: "Υγεία & θεραπεία", hint: "Ψυχολόγος, διατροφολόγος, φυσικοθεραπευτής, λογοθεραπευτής." },
  { value: "professional", label: "Ελεύθεροι επαγγελματίες", hint: "Λογιστής, δικηγόρος, σύμβουλος, μεσίτης." },
  { value: "events", label: "Εκδηλώσεις & χώροι", hint: "Αίθουσα εκδηλώσεων, catering, DJ, διοργάνωση γάμων." },
  { value: "services", label: "Τεχνικοί & υπηρεσίες", hint: "Ηλεκτρολόγος, υδραυλικός, συνεργείο, καθαρισμός…" },
  { value: "portfolio", label: "Portfolio", hint: "Φωτογράφος, designer, αρχιτέκτονας." },
  { value: "other", label: "Άλλο", hint: "Κάτι διαφορετικό; Πες μας με δυο λέξεις." },
]

export type StepId = "type" | "basics" | "look" | "contact" | "location" | "retail" | "food" | "crafts" | "services" | "portfolio" | "delivery" | "legal" | "owner" | "preview" | "publish"

export const STEP_META: Record<StepId, { title: string; question: string; hint?: string; private?: boolean }> = {
  type: { title: "Είδος επιχείρησης", question: "Τι είδους επιχείρηση έχεις;", hint: "Από αυτό εξαρτάται πώς θα στηθεί η σελίδα σου. Μπορείς να το αλλάξεις όποτε θέλεις." },
  basics: { title: "Όνομα & ιστορία", question: "Πώς λέγεται η επιχείρησή σου και τι την κάνει ξεχωριστή;" },
  look: { title: "Εικόνα & χρώματα", question: "Πώς θέλεις να δείχνει η βιτρίνα σου;" },
  contact: { title: "Επικοινωνία", question: "Πώς μπορεί να σε βρει ένας πελάτης;", hint: "Ό,τι συμπληρώσεις εδώ εμφανίζεται δημόσια στη σελίδα σου." },
  location: { title: "Τοποθεσία & ωράριο", question: "Πού βρίσκεσαι και πότε είσαι ανοιχτά;" },
  retail: { title: "Τι πουλάς", question: "Τι θα βρει κάποιος στο κατάστημά σου;" },
  food: { title: "Προέλευση & πιστοποιήσεις", question: "Από πού έρχονται τα προϊόντα σου;" },
  crafts: { title: "Υλικά & κατασκευή", question: "Πώς φτιάχνεις αυτά που φτιάχνεις;" },
  services: { title: "Υπηρεσίες & τιμές", question: "Ποιες υπηρεσίες προσφέρεις;", hint: "Οι τιμές εμφανίζονται ενδεικτικά. Τις online κρατήσεις τις ανοίγεις από το Studio, στη σελίδα «Κρατήσεις»." },
  portfolio: { title: "Έργα & δεξιότητες", question: "Δείξε μας τη δουλειά σου." },
  delivery: { title: "Αποστολή & επιστροφές", question: "Πώς φτάνουν τα προϊόντα στον πελάτη;" },
  legal: { title: "Νομικά & τιμολόγηση", question: "Ποια είναι τα επίσημα στοιχεία της επιχείρησης;", hint: "Ιδιωτικά: δεν εμφανίζονται ποτέ στη δημόσια σελίδα. Χρειάζονται για τιμολόγηση και συμμόρφωση.", private: true },
  owner: { title: "Υπεύθυνος", question: "Ποιος είναι ο υπεύθυνος του λογαριασμού;", hint: "Ιδιωτικά: τα βλέπει μόνο η ομάδα του Vitrinaki για να επικοινωνήσει μαζί σου.", private: true },
  preview: { title: "Δες τη σελίδα σου", question: "Έτοιμο! Έτσι θα στηθεί η σελίδα σου." },
  publish: { title: "Ενεργοποίηση & δημοσίευση", question: "Άνοιξε τη βιτρίνα σου στους πελάτες", hint: "Ενεργοποίησε το πακέτο σου και δημοσίευσε τη σελίδα. Μπορείς να την αποσύρεις όποτε θέλεις." },
}

// The question flow branches on the business type: only relevant topics.
export function stepsFor(type: BusinessType | ""): StepId[] {
  if (!type) return ["type"]
  const specific: Partial<Record<BusinessType, StepId>> = {
    retail: "retail", food: "food", crafts: "crafts", portfolio: "portfolio",
  }
  const steps: StepId[] = ["type", "basics", "look", "contact"]
  if (type !== "portfolio") steps.push("location")
  if (specific[type]) steps.push(specific[type]!)
  if (isAppointmentType(type)) steps.push("services")
  if (["retail", "crafts", "food", "beauty", "other"].includes(type)) steps.push("delivery")
  steps.push("legal", "owner", "preview", "publish")
  return steps
}

// Suggested copy per type: shown as placeholders and offered as one-click fills.
export const SUGGESTIONS: Record<BusinessType, { tagline: string; description: string; story: string }> = {
  retail: {
    tagline: "Το αγαπημένο μαγαζί της γειτονιάς, τώρα και online",
    description: "Διαλεγμένα προϊόντα με φροντίδα, με παραλαβή από το κατάστημα ή αποστολή σε όλη την Ελλάδα.",
    story: "Ανοίξαμε το κατάστημά μας το … με μια απλή ιδέα: … Σήμερα συνεχίζουμε με την ίδια αγάπη για …",
  },
  crafts: {
    tagline: "Χειροποίητα κομμάτια, φτιαγμένα ένα-ένα",
    description: "Κάθε κομμάτι φτιάχνεται στο εργαστήρι μας με φυσικά υλικά και πολλή υπομονή.",
    story: "Όλα ξεκίνησαν όταν … Δουλεύω με … και κάθε κομμάτι παίρνει … ημέρες για να ολοκληρωθεί.",
  },
  food: {
    tagline: "Από τον τόπο μας, κατευθείαν στο τραπέζι σου",
    description: "Αγνά τοπικά προϊόντα από μικρή οικογενειακή παραγωγή, με σεβασμό στην παράδοση.",
    story: "Η οικογένειά μας καλλιεργεί/παράγει … από το … στην περιοχή … Κάθε σοδειά …",
  },
  beauty: {
    tagline: "Χρόνος για σένα, με επαγγελματική φροντίδα",
    description: "Υπηρεσίες ομορφιάς και ευεξίας σε έναν ζεστό χώρο, με προϊόντα που εμπιστευόμαστε.",
    story: "Ο χώρος μας άνοιξε το … Η ομάδα μας έχει εκπαιδευτεί σε … και πιστεύουμε ότι …",
  },
  fitness: {
    tagline: "Προπόνηση στα μέτρα σου, με σωστή καθοδήγηση",
    description: "Ατομικά και ομαδικά προγράμματα για κάθε επίπεδο. Κλείσε την πρώτη σου προπόνηση και ξεκίνα σήμερα.",
    story: "Ασχολούμαι με την άθληση εδώ και … χρόνια. Έχω πιστοποίηση σε … και δουλεύω με …",
  },
  lessons: {
    tagline: "Μαθήματα με υπομονή, μέθοδο και αποτέλεσμα",
    description: "Ιδιαίτερα και ομαδικά μαθήματα, δια ζώσης ή online, προσαρμοσμένα στο επίπεδο και στους στόχους κάθε μαθητή.",
    story: "Διδάσκω … εδώ και … χρόνια. Σπούδασα … και πιστεύω ότι κάθε μαθητής …",
  },
  health: {
    tagline: "Φροντίδα με γνώση και ανθρώπινη ματιά",
    description: "Ατομικές συνεδρίες κατόπιν ραντεβού, στον χώρο μας ή online, με σεβασμό και εχεμύθεια.",
    story: "Είμαι … με σπουδές στο … και εμπειρία … χρόνων. Δουλεύω με …",
  },
  professional: {
    tagline: "Σωστή συμβουλή, την ώρα που τη χρειάζεσαι",
    description: "Υπηρεσίες για ιδιώτες και επιχειρήσεις, με συνέπεια, διαφάνεια και προσωπική εξυπηρέτηση.",
    story: "Εργάζομαι ως … εδώ και … χρόνια. Συνεργάζομαι με ιδιώτες και επιχειρήσεις σε …",
  },
  events: {
    tagline: "Η μέρα σας, όπως την ονειρεύεστε",
    description: "Χώρος και υπηρεσίες για γάμους, βαπτίσεις, γενέθλια και εταιρικές εκδηλώσεις. Ζητήστε προσφορά ή κλείστε μια επίσκεψη.",
    story: "Οργανώνουμε εκδηλώσεις από το … Ο χώρος μας χωράει έως … άτομα και …",
  },
  services: {
    tagline: "Αξιόπιστη δουλειά, καθαρές τιμές",
    description: "Επαγγελματικές υπηρεσίες με συνέπεια και άμεση εξυπηρέτηση. Ζήτησε προσφορά χωρίς δέσμευση.",
    story: "Εργάζομαι στον χώρο εδώ και … χρόνια. Έχω αναλάβει … και το πιο σημαντικό για μένα είναι …",
  },
  portfolio: {
    tagline: "Ιδέες που γίνονται έργα",
    description: "Δες επιλεγμένες δουλειές μου και επικοινώνησε για τη δική σου ιδέα.",
    story: "Είμαι … με εμπειρία … χρόνων. Δουλεύω με επιχειρήσεις και ιδιώτες σε … ",
  },
  other: {
    tagline: "Καλώς ήρθες στη βιτρίνα μας",
    description: "Γνώρισε τι κάνουμε και επικοινώνησε μαζί μας για ό,τι χρειαστείς.",
    story: "Λίγα λόγια για εμάς: …",
  },
}

// Section order on the public page per type (mirrors the storefront).
export const SECTION_ORDER: Record<BusinessType, string[]> = {
  food: ["catalog", "origin", "story", "delivery", "visit", "contact"],
  crafts: ["catalog", "craft", "story", "delivery", "contact"],
  retail: ["catalog", "visit", "delivery", "story", "contact"],
  beauty: ["services", "visit", "story", "catalog", "contact"],
  fitness: ["services", "visit", "story", "catalog", "contact"],
  lessons: ["services", "story", "visit", "catalog", "contact"],
  health: ["services", "story", "visit", "catalog", "contact"],
  professional: ["services", "story", "area", "catalog", "contact"],
  events: ["services", "story", "visit", "catalog", "contact"],
  services: ["services", "area", "story", "catalog", "contact"],
  portfolio: ["projects", "skills", "story", "services", "contact"],
  other: ["catalog", "story", "visit", "delivery", "contact"],
}
export const SECTION_LABELS: Record<string, string> = {
  catalog: "Προϊόντα",
  origin: "Προέλευση & πιστοποιήσεις",
  craft: "Υλικά & κατασκευή",
  story: "Η ιστορία μας",
  delivery: "Αποστολή & επιστροφές",
  visit: "Ωράριο & τοποθεσία",
  area: "Περιοχή εξυπηρέτησης",
  services: "Υπηρεσίες & τιμές",
  projects: "Έργα",
  skills: "Δεξιότητες",
  contact: "Επικοινωνία",
}

export const PALETTES = [
  { value: "forest", label: "Κυπαρισσί", color: "#2E4A37", soft: "#E6ECE3" },
  { value: "terracotta", label: "Κεραμιδί", color: "#C0503C", soft: "#F4E1D9" },
  { value: "ocean", label: "Μπλε", color: "#265E8E", soft: "#DDE8F2" },
  { value: "indigo", label: "Λουλακί", color: "#4B44C4", soft: "#E3E2F6" },
  { value: "sage", label: "Φασκόμηλο", color: "#3B786A", soft: "#DCEAE4" },
  { value: "graphite", label: "Γραφίτης", color: "#3A4352", soft: "#E5E5E1" },
] as const

export const LANGUAGES = [
  ["el", "Ελληνικά"], ["en", "English"], ["de", "Deutsch"], ["fr", "Français"], ["it", "Italiano"], ["es", "Español"],
  ["ru", "Русский"], ["bg", "Български"], ["sq", "Shqip"], ["tr", "Türkçe"], ["zh", "中文"], ["ar", "العربية"],
] as const

export const CERTIFICATIONS = [
  ["pop", "ΠΟΠ"], ["pge", "ΠΓΕ"], ["organic", "Βιολογικό"], ["haccp", "HACCP"], ["iso22000", "ISO 22000"],
  ["vegan", "Vegan"], ["glutenfree", "Χωρίς γλουτένη"], ["other", "Άλλη"],
] as const

export const LEGAL_FORMS = [
  ["individual", "Ατομική επιχείρηση"], ["oe", "Ο.Ε."], ["ee", "Ε.Ε."], ["ike", "Ι.Κ.Ε."], ["ae", "Α.Ε."], ["other", "Άλλη"],
] as const

export const DAYS = [
  ["mon", "Δευτέρα"], ["tue", "Τρίτη"], ["wed", "Τετάρτη"], ["thu", "Πέμπτη"], ["fri", "Παρασκευή"], ["sat", "Σάββατο"], ["sun", "Κυριακή"],
] as const

// ---- validators (mirror of the server) ----
export function isValidAfm(value: string) {
  if (!/^\d{9}$/.test(value) || value === "000000000") return false
  let sum = 0
  for (let i = 0; i < 8; i++) sum += Number(value[i]) * 2 ** (8 - i)
  return (sum % 11) % 10 === Number(value[8])
}
const digits = (value: string) => {
  let d = value.replace(/[\s\-().]/g, "")
  if (d.startsWith("0030")) d = `+30${d.slice(4)}`
  return d
}
export const isGreekPhone = (v: string) => /^(2\d{9}|69\d{8})$/.test(digits(v).replace(/^\+30/, ""))
export const isGreekMobile = (v: string) => /^69\d{8}$/.test(digits(v).replace(/^\+30/, ""))
export const isMessengerPhone = (v: string) => isGreekMobile(v) || /^\+\d{8,15}$/.test(digits(v))
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
export const isUrl = (v: string) => {
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`)
    return url.hostname.includes(".") || url.hostname === "localhost"
  } catch {
    return false
  }
}
