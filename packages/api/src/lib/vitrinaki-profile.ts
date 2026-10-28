// Vitrinaki store profile: the structured answers a professional gives in the
// Studio wizard. The PUBLIC part lives in seller.metadata.vitrinaki_profile and
// drives the storefront layout. The PRIVATE part (legal/invoicing + owner)
// lives in the vitrinaki_seller_private table and is never served publicly.

export const BUSINESS_TYPES = [
  "retail", "crafts", "food", "beauty", "fitness", "lessons", "health", "professional", "events", "services", "portfolio", "other",
] as const
export type BusinessType = (typeof BUSINESS_TYPES)[number]

// Kinds of business that sell their time by appointment: their page leads with
// the price list and the booking, and their Studio wizard asks for services.
export const APPOINTMENT_TYPES: readonly BusinessType[] = ["beauty", "fitness", "lessons", "health", "professional", "events", "services"]
export const isAppointmentType = (type: string | null | undefined) => APPOINTMENT_TYPES.includes(type as BusinessType)

export const LEGAL_FORMS = ["individual", "oe", "ee", "ike", "ae", "other"] as const
export const LANGUAGE_CODES = ["el", "en", "de", "fr", "it", "es", "ru", "bg", "sq", "tr", "zh", "ar"] as const
export const CERTIFICATIONS = ["pop", "pge", "organic", "haccp", "iso22000", "vegan", "glutenfree", "other"] as const
export const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const

// Storefront template each business type maps to (the template only picks the
// hero style; section order comes from the business type).
export const TEMPLATE_FOR_TYPE: Record<BusinessType, "atelier" | "local" | "services"> = {
  retail: "atelier",
  crafts: "atelier",
  food: "local",
  beauty: "services",
  fitness: "services",
  lessons: "services",
  health: "services",
  professional: "services",
  events: "services",
  services: "services",
  portfolio: "services",
  other: "atelier",
}

export type DayHours = { closed: boolean; open: string; close: string; open2: string; close2: string }
export type ServiceItem = { name: string; duration: string; price: string; description: string }
export type ProjectItem = { title: string; description: string; imageUrl: string; link: string; year: string }

export type PublicProfile = {
  version: 1
  businessType: BusinessType | ""
  businessTypeOther: string
  story: string
  // Video introduction: a YouTube/Vimeo link or an uploaded video file.
  introVideo: string
  whatsapp: string
  viber: string
  address: { street: string; area: string; city: string; postalCode: string; showMap: boolean; hideStreet: boolean }
  hours: Record<(typeof WEEK_DAYS)[number], DayHours>
  hoursEnabled: boolean
  byAppointment: boolean
  hoursNote: string
  socials: { instagram: string; facebook: string; tiktok: string; website: string }
  languages: string[]
  delivery: {
    shipping: boolean
    shippingAreas: string
    pickup: boolean
    pickupNote: string
    localDelivery: boolean
    localDeliveryAreas: string
    note: string
  }
  returnPolicy: string
  retail: { categories: string; brands: string }
  food: { region: string; origin: string; certifications: string[]; certificationsOther: string; ingredientsNote: string; producerSince: string }
  crafts: { materials: string; techniques: string; madeToOrder: boolean; leadTime: string; customOrders: boolean }
  services: { items: ServiceItem[]; serviceArea: string; online: boolean; atClient: boolean }
  beauty: { specialties: string; brands: string }
  portfolio: { skills: string[]; projects: ProjectItem[]; clients: string; availability: string }
  credentials: string
  completedSteps: string[]
  updatedAt: string | null
}

export type PrivateProfile = {
  legal: {
    legalName: string
    afm: string
    doy: string
    gemi: string
    legalForm: (typeof LEGAL_FORMS)[number] | ""
    registeredAddress: { street: string; city: string; postalCode: string }
    invoiceEmail: string
  }
  owner: {
    fullName: string
    mobile: string
    email: string
    contactLanguage: "el" | "en"
    gdprConsent: boolean
    gdprConsentAt: string | null
  }
}

export type FieldErrors = Record<string, string>

const emptyDay = (closed = false): DayHours => ({ closed, open: closed ? "" : "09:00", close: closed ? "" : "17:00", open2: "", close2: "" })

export const emptyPublicProfile = (): PublicProfile => ({
  version: 1,
  businessType: "",
  businessTypeOther: "",
  story: "",
  introVideo: "",
  whatsapp: "",
  viber: "",
  address: { street: "", area: "", city: "", postalCode: "", showMap: false, hideStreet: false },
  hours: {
    mon: emptyDay(), tue: emptyDay(), wed: emptyDay(), thu: emptyDay(), fri: emptyDay(),
    sat: emptyDay(true), sun: emptyDay(true),
  },
  hoursEnabled: false,
  byAppointment: false,
  hoursNote: "",
  socials: { instagram: "", facebook: "", tiktok: "", website: "" },
  languages: ["el"],
  delivery: { shipping: false, shippingAreas: "", pickup: false, pickupNote: "", localDelivery: false, localDeliveryAreas: "", note: "" },
  returnPolicy: "",
  retail: { categories: "", brands: "" },
  food: { region: "", origin: "", certifications: [], certificationsOther: "", ingredientsNote: "", producerSince: "" },
  crafts: { materials: "", techniques: "", madeToOrder: false, leadTime: "", customOrders: false },
  services: { items: [], serviceArea: "", online: false, atClient: false },
  beauty: { specialties: "", brands: "" },
  portfolio: { skills: [], projects: [], clients: "", availability: "" },
  credentials: "",
  completedSteps: [],
  updatedAt: null,
})

export const emptyPrivateProfile = (): PrivateProfile => ({
  legal: {
    legalName: "", afm: "", doy: "", gemi: "", legalForm: "",
    registeredAddress: { street: "", city: "", postalCode: "" },
    invoiceEmail: "",
  },
  owner: { fullName: "", mobile: "", email: "", contactLanguage: "el", gdprConsent: false, gdprConsentAt: null },
})

// ---------- validators (shared with the Studio form, which mirrors them) ----------

export function isValidAfm(value: string): boolean {
  if (!/^\d{9}$/.test(value) || value === "000000000") return false
  let sum = 0
  for (let i = 0; i < 8; i++) sum += Number(value[i]) * 2 ** (8 - i)
  return (sum % 11) % 10 === Number(value[8])
}

export const normalizePhone = (value: string) => {
  let digits = value.replace(/[\s\-().]/g, "")
  if (digits.startsWith("0030")) digits = `+30${digits.slice(4)}`
  return digits
}

// Greek landline (2xxxxxxxxx) or mobile (69xxxxxxxx), optional +30 prefix.
export function isGreekPhone(value: string): boolean {
  const digits = normalizePhone(value).replace(/^\+30/, "")
  return /^(2\d{9}|69\d{8})$/.test(digits)
}
export function isGreekMobile(value: string): boolean {
  return /^69\d{8}$/.test(normalizePhone(value).replace(/^\+30/, ""))
}
// WhatsApp/Viber: Greek mobile or any international number.
export function isMessengerPhone(value: string): boolean {
  const normalized = normalizePhone(value)
  return isGreekMobile(normalized) || /^\+\d{8,15}$/.test(normalized)
}
export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === "https:" || url.protocol === "http:") && (url.hostname.includes(".") || url.hostname === "localhost")
  } catch {
    return false
  }
}
const isTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value)

// ---------- normalisation ----------

const str = (value: unknown, limit: number) => (typeof value === "string" ? value.trim().slice(0, limit) : "")
const bool = (value: unknown) => value === true
const obj = (value: unknown) => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {})
const list = (value: unknown, max: number) => (Array.isArray(value) ? value.slice(0, max) : [])
const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T | ""): T | "" =>
  allowed.includes(value as T) ? (value as T) : fallback

// Social handles may be typed as "@name" or full URLs; store full URLs.
function socialUrl(value: unknown, base: string): string {
  const raw = str(value, 300)
  if (!raw) return ""
  if (/^https?:\/\//i.test(raw)) return raw
  const handle = raw.replace(/^@/, "").replace(/^\/+/, "")
  return handle ? `${base}${handle}` : ""
}

export function normalizePublicProfile(input: unknown, errors: FieldErrors = {}): PublicProfile {
  const raw = obj(input)
  const p = emptyPublicProfile()
  p.businessType = pick(raw.businessType, BUSINESS_TYPES, "")
  p.businessTypeOther = str(raw.businessTypeOther, 80)
  p.story = str(raw.story, 4000)
  p.introVideo = str(raw.introVideo, 500)
  if (p.introVideo && !isHttpUrl(p.introVideo)) errors["profile.introVideo"] = "Βάλε σύνδεσμο από YouTube ή Vimeo, ή ανέβασε ένα βίντεο."

  p.whatsapp = str(raw.whatsapp, 30)
  if (p.whatsapp && !isMessengerPhone(p.whatsapp)) errors["profile.whatsapp"] = "Μη έγκυρος αριθμός WhatsApp (π.χ. 69XXXXXXXX ή +30…)."
  p.viber = str(raw.viber, 30)
  if (p.viber && !isMessengerPhone(p.viber)) errors["profile.viber"] = "Μη έγκυρος αριθμός Viber (π.χ. 69XXXXXXXX ή +30…)."

  const address = obj(raw.address)
  p.address = {
    street: str(address.street, 160),
    area: str(address.area, 120),
    city: str(address.city, 120),
    postalCode: str(address.postalCode, 10),
    showMap: bool(address.showMap),
    hideStreet: bool(address.hideStreet),
  }
  if (p.address.postalCode && !/^\d{3}\s?\d{2}$/.test(p.address.postalCode)) errors["profile.address.postalCode"] = "Ο Τ.Κ. έχει 5 ψηφία."

  const hours = obj(raw.hours)
  for (const day of WEEK_DAYS) {
    // A day the seller never edited keeps the default (Mon–Fri 09–17, weekend closed).
    if (!hours[day] || typeof hours[day] !== "object") continue
    const d = obj(hours[day])
    const value: DayHours = {
      closed: bool(d.closed),
      open: str(d.open, 5),
      close: str(d.close, 5),
      open2: str(d.open2, 5),
      close2: str(d.close2, 5),
    }
    for (const key of ["open", "close", "open2", "close2"] as const) {
      if (value[key] && !isTime(value[key])) errors[`profile.hours.${day}`] = "Η ώρα γράφεται ΩΩ:ΛΛ, π.χ. 09:00."
    }
    p.hours[day] = value
  }
  p.hoursEnabled = bool(raw.hoursEnabled)
  p.byAppointment = bool(raw.byAppointment)
  p.hoursNote = str(raw.hoursNote, 300)

  const socials = obj(raw.socials)
  p.socials = {
    instagram: socialUrl(socials.instagram, "https://instagram.com/"),
    facebook: socialUrl(socials.facebook, "https://facebook.com/"),
    tiktok: socialUrl(socials.tiktok, "https://tiktok.com/@"),
    website: str(socials.website, 300),
  }
  if (p.socials.website && !/^https?:\/\//i.test(p.socials.website)) p.socials.website = `https://${p.socials.website}`
  for (const key of ["instagram", "facebook", "tiktok", "website"] as const) {
    if (p.socials[key] && !isHttpUrl(p.socials[key])) errors[`profile.socials.${key}`] = "Μη έγκυρη διεύθυνση (URL)."
  }

  p.languages = list(raw.languages, 12).filter((code): code is string => LANGUAGE_CODES.includes(code as any))
  if (!p.languages.length) p.languages = ["el"]

  const delivery = obj(raw.delivery)
  p.delivery = {
    shipping: bool(delivery.shipping),
    shippingAreas: str(delivery.shippingAreas, 300),
    pickup: bool(delivery.pickup),
    pickupNote: str(delivery.pickupNote, 300),
    localDelivery: bool(delivery.localDelivery),
    localDeliveryAreas: str(delivery.localDeliveryAreas, 300),
    note: str(delivery.note, 500),
  }
  p.returnPolicy = str(raw.returnPolicy, 2000)

  const retail = obj(raw.retail)
  p.retail = { categories: str(retail.categories, 300), brands: str(retail.brands, 300) }

  const food = obj(raw.food)
  p.food = {
    region: str(food.region, 120),
    origin: str(food.origin, 600),
    certifications: list(food.certifications, 8).filter((c): c is string => CERTIFICATIONS.includes(c as any)),
    certificationsOther: str(food.certificationsOther, 200),
    ingredientsNote: str(food.ingredientsNote, 1000),
    producerSince: str(food.producerSince, 4),
  }
  if (p.food.producerSince && !/^(1[89]|20)\d{2}$/.test(p.food.producerSince)) errors["profile.food.producerSince"] = "Γράψε έτος, π.χ. 1987."

  const crafts = obj(raw.crafts)
  p.crafts = {
    materials: str(crafts.materials, 400),
    techniques: str(crafts.techniques, 400),
    madeToOrder: bool(crafts.madeToOrder),
    leadTime: str(crafts.leadTime, 80),
    customOrders: bool(crafts.customOrders),
  }

  const services = obj(raw.services)
  p.services = {
    items: list(services.items, 20)
      .map((entry) => {
        const item = obj(entry)
        return {
          name: str(item.name, 120),
          duration: str(item.duration, 40),
          price: str(item.price, 40),
          description: str(item.description, 400),
        }
      })
      .filter((item) => item.name),
    serviceArea: str(services.serviceArea, 300),
    online: bool(services.online),
    atClient: bool(services.atClient),
  }

  const beauty = obj(raw.beauty)
  p.beauty = { specialties: str(beauty.specialties, 400), brands: str(beauty.brands, 300) }

  const portfolio = obj(raw.portfolio)
  p.portfolio = {
    skills: list(portfolio.skills, 20).map((s) => str(s, 60)).filter(Boolean),
    projects: list(portfolio.projects, 12)
      .map((entry, index) => {
        const item = obj(entry)
        const project = {
          title: str(item.title, 120),
          description: str(item.description, 600),
          imageUrl: str(item.imageUrl, 2048),
          link: str(item.link, 2048),
          year: str(item.year, 4),
        }
        if (project.imageUrl && !isHttpUrl(project.imageUrl) && !project.imageUrl.startsWith("/")) errors[`profile.portfolio.projects.${index}.imageUrl`] = "Μη έγκυρη διεύθυνση εικόνας."
        if (project.link && !isHttpUrl(project.link)) errors[`profile.portfolio.projects.${index}.link`] = "Μη έγκυρος σύνδεσμος."
        return project
      })
      .filter((project) => project.title),
    clients: str(portfolio.clients, 400),
    availability: str(portfolio.availability, 160),
  }
  p.credentials = str(raw.credentials, 600)
  p.completedSteps = list(raw.completedSteps, 20).map((s) => str(s, 30)).filter(Boolean)
  return p
}

export function normalizePrivateProfile(input: unknown, previous: PrivateProfile | null, errors: FieldErrors = {}): PrivateProfile {
  const raw = obj(input)
  const legal = obj(raw.legal)
  const owner = obj(raw.owner)
  const address = obj(legal.registeredAddress)
  const p = emptyPrivateProfile()
  p.legal = {
    legalName: str(legal.legalName, 200),
    afm: str(legal.afm, 12).replace(/\s/g, ""),
    doy: str(legal.doy, 120),
    gemi: str(legal.gemi, 20).replace(/\s/g, ""),
    legalForm: pick(legal.legalForm, LEGAL_FORMS, ""),
    registeredAddress: { street: str(address.street, 160), city: str(address.city, 120), postalCode: str(address.postalCode, 10) },
    invoiceEmail: str(legal.invoiceEmail, 254).toLowerCase(),
  }
  if (p.legal.afm && !isValidAfm(p.legal.afm)) errors["private.legal.afm"] = "Ο ΑΦΜ δεν είναι έγκυρος (9 ψηφία, έλεγχος ορθότητας)."
  if (p.legal.gemi && !/^\d{6,12}$/.test(p.legal.gemi)) errors["private.legal.gemi"] = "Ο αριθμός ΓΕΜΗ έχει μόνο ψηφία (συνήθως 12)."
  if (p.legal.invoiceEmail && !isEmail(p.legal.invoiceEmail)) errors["private.legal.invoiceEmail"] = "Μη έγκυρο email τιμολόγησης."
  if (p.legal.registeredAddress.postalCode && !/^\d{3}\s?\d{2}$/.test(p.legal.registeredAddress.postalCode)) errors["private.legal.registeredAddress.postalCode"] = "Ο Τ.Κ. έχει 5 ψηφία."

  p.owner = {
    fullName: str(owner.fullName, 160),
    mobile: str(owner.mobile, 30),
    email: str(owner.email, 254).toLowerCase(),
    contactLanguage: owner.contactLanguage === "en" ? "en" : "el",
    gdprConsent: bool(owner.gdprConsent),
    gdprConsentAt: null,
  }
  if (p.owner.mobile && !isGreekMobile(p.owner.mobile)) errors["private.owner.mobile"] = "Βάλε ελληνικό κινητό, π.χ. 69XXXXXXXX."
  if (p.owner.email && !isEmail(p.owner.email)) errors["private.owner.email"] = "Μη έγκυρο email."
  // The consent timestamp is set by the server the first time consent is given.
  p.owner.gdprConsentAt = p.owner.gdprConsent ? previous?.owner?.gdprConsentAt || new Date().toISOString() : null
  return p
}

// ---------- completion checklist ----------

export type ChecklistItem = { id: string; label: string; done: boolean; step: string; private?: boolean }

type Basics = { storeName?: string; tagline?: string; description?: string; logoUrl?: string | null; bannerUrl?: string | null; contactEmail?: string; contactPhone?: string }

export function profileChecklist(profile: PublicProfile, basics: Basics, priv: PrivateProfile | null): ChecklistItem[] {
  const t = profile.businessType
  const hasContact = Boolean(basics.contactEmail || basics.contactPhone || profile.whatsapp || profile.viber)
  const items: ChecklistItem[] = [
    { id: "type", label: "Είδος επιχείρησης", done: Boolean(t), step: "type" },
    { id: "name", label: "Όνομα και κεντρικό μήνυμα", done: Boolean(basics.storeName && basics.tagline), step: "basics" },
    { id: "story", label: "Η ιστορία σου", done: Boolean(profile.story || basics.description), step: "basics" },
    { id: "logo", label: "Λογότυπο", done: Boolean(basics.logoUrl), step: "look" },
    { id: "cover", label: "Εικόνα εξωφύλλου", done: Boolean(basics.bannerUrl), step: "look" },
    { id: "contact", label: "Δημόσια επικοινωνία", done: hasContact, step: "contact" },
    { id: "socials", label: "Social media", done: Object.values(profile.socials).some(Boolean), step: "contact" },
  ]
  if (t !== "portfolio") {
    items.push({ id: "location", label: t === "services" || t === "professional" ? "Περιοχή εξυπηρέτησης" : "Διεύθυνση / περιοχή", done: Boolean(profile.address.city || profile.address.area || profile.services.serviceArea), step: "location" })
    items.push({ id: "hours", label: "Ωράριο", done: profile.hoursEnabled || profile.byAppointment || Boolean(profile.hoursNote), step: "location" })
  }
  if (t === "food") items.push({ id: "food", label: "Προέλευση & πιστοποιήσεις", done: Boolean(profile.food.region || profile.food.origin || profile.food.certifications.length), step: "food" })
  if (t === "crafts") items.push({ id: "crafts", label: "Υλικά & κατασκευή", done: Boolean(profile.crafts.materials), step: "crafts" })
  if (t === "retail") items.push({ id: "retail", label: "Τι πουλάς", done: Boolean(profile.retail.categories), step: "retail" })
  if (isAppointmentType(t)) items.push({ id: "services", label: "Υπηρεσίες & τιμές", done: profile.services.items.length > 0, step: "services" })
  if (t === "portfolio") {
    items.push({ id: "projects", label: "Έργα (portfolio)", done: profile.portfolio.projects.length > 0, step: "portfolio" })
    items.push({ id: "skills", label: "Δεξιότητες", done: profile.portfolio.skills.length > 0, step: "portfolio" })
  }
  if (["retail", "crafts", "food", "beauty", "other"].includes(t)) {
    items.push({ id: "delivery", label: "Αποστολή / παραλαβή", done: profile.delivery.shipping || profile.delivery.pickup || profile.delivery.localDelivery, step: "delivery" })
    items.push({ id: "returns", label: "Πολιτική επιστροφών", done: Boolean(profile.returnPolicy), step: "delivery" })
  }
  items.push({
    id: "legal",
    label: "Νομικά στοιχεία & τιμολόγηση",
    done: Boolean(priv?.legal.legalName && priv.legal.afm && priv.legal.doy && priv.legal.legalForm),
    step: "legal",
    private: true,
  })
  items.push({
    id: "owner",
    label: "Υπεύθυνος & συγκατάθεση GDPR",
    done: Boolean(priv?.owner.fullName && priv.owner.mobile && priv.owner.email && priv.owner.gdprConsent),
    step: "owner",
    private: true,
  })
  return items
}

export const completionPercent = (items: ChecklistItem[]) =>
  items.length ? Math.round((items.filter((item) => item.done).length / items.length) * 100) : 0

// ---------- public projection ----------

// What the public storefront route may show. Built from a whitelist so a field
// added to the profile later is private until it is added here on purpose.
export function publicProfileView(input: unknown) {
  const p = normalizePublicProfile(input)
  const hasHours = p.hoursEnabled && WEEK_DAYS.some((day) => !p.hours[day].closed && p.hours[day].open && p.hours[day].close)
  return {
    businessType: p.businessType || null,
    businessTypeOther: p.businessType === "other" ? p.businessTypeOther : "",
    story: p.story,
    introVideo: isHttpUrl(p.introVideo) ? p.introVideo : "",
    whatsapp: p.whatsapp ? normalizePhone(p.whatsapp) : "",
    viber: p.viber ? normalizePhone(p.viber) : "",
    address: {
      street: p.address.hideStreet ? "" : p.address.street,
      area: p.address.area,
      city: p.address.city,
      postalCode: p.address.hideStreet ? "" : p.address.postalCode,
      showMap: p.address.showMap,
    },
    hours: hasHours ? p.hours : null,
    byAppointment: p.byAppointment,
    hoursNote: p.hoursNote,
    socials: p.socials,
    languages: p.languages,
    delivery: p.delivery,
    returnPolicy: p.returnPolicy,
    retail: p.retail,
    food: p.food,
    crafts: p.crafts,
    services: p.services,
    beauty: p.beauty,
    portfolio: p.portfolio,
    credentials: p.credentials,
  }
}
