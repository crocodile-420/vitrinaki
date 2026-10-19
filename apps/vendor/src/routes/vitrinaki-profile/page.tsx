import { useEffect, useMemo, useState, type ReactNode } from "react"
import type { RouteConfig } from "@mercurjs/dashboard-sdk"
import { getAuthHeaders } from "@mercurjs/vendor"

import {
  BUSINESS_TYPES,
  CERTIFICATIONS,
  DAYS,
  LANGUAGES,
  LEGAL_FORMS,
  PALETTES,
  SECTION_LABELS,
  SECTION_ORDER,
  STEP_META,
  SUGGESTIONS,
  isEmail,
  isGreekMobile,
  isGreekPhone,
  isMessengerPhone,
  isUrl,
  isValidAfm,
  stepsFor,
  type BusinessType,
  type StepId,
} from "../../lib/vitrinaki-profile"

declare const __BACKEND_URL__: string

export const config: RouteConfig = {
  label: "Προφίλ καταστήματος",
  rank: 44,
}

// The vendor panel ships a prebuilt Tailwind stylesheet, so utilities it does
// not already contain are defined here, scoped to this page.
const PAGE_CSS = `
.vk-profile .-mt-3{margin-top:-.75rem}.vk-profile .mt-1\\.5{margin-top:.375rem}.vk-profile .mt-5{margin-top:1.25rem}
.vk-profile .pb-5{padding-bottom:1.25rem}.vk-profile .pt-5{padding-top:1.25rem}
.vk-profile .bg-white\\/70{background:rgba(255,255,255,.7)}.vk-profile .text-white{color:#fff}
.vk-profile .disabled\\:opacity-40:disabled{opacity:.4}.vk-profile .opacity-75{opacity:.75}
.vk-profile .font-semibold{font-weight:600}.vk-profile .text-base{font-size:1rem;line-height:1.5rem}
.vk-profile .text-xl{font-size:1.25rem;line-height:1.75rem}.vk-profile .text-2xl{font-size:1.5rem;line-height:2rem}
.vk-profile .text-transparent{color:transparent}.vk-profile .text-\\[11px\\]{font-size:11px}.vk-profile .tracking-\\[0\\.18em\\]{letter-spacing:.18em}
.vk-profile .h-2\\.5{height:.625rem}.vk-profile .h-24{height:6rem}.vk-profile .h-96{height:24rem}
.vk-profile .w-1\\/3{width:33.333%}.vk-profile .w-64{width:16rem}
.vk-profile .max-w-6xl{max-width:72rem}.vk-profile .max-w-7xl{max-width:80rem}
.vk-profile .place-items-center{place-items:center}.vk-profile .rounded-2xl{border-radius:1rem}
.vk-profile .line-clamp-2{overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}
.vk-profile .space-y-1\\.5>*+*{margin-top:.375rem}.vk-profile .space-y-4>*+*{margin-top:1rem}
.vk-profile .space-y-5>*+*{margin-top:1.25rem}.vk-profile .space-y-6>*+*{margin-top:1.5rem}
.vk-profile .stroke-ui-bg-subtle{stroke:var(--bg-subtle,#f4f4f5)}
@media (min-width:640px){
.vk-profile .sm\\:col-span-2{grid-column:span 2/span 2}.vk-profile .sm\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.vk-profile .sm\\:grid-cols-\\[2fr_1fr_1fr\\]{grid-template-columns:2fr 1fr 1fr}.vk-profile .sm\\:grid-cols-\\[3fr_1fr\\]{grid-template-columns:3fr 1fr}
.vk-profile .sm\\:p-8{padding:2rem}.vk-profile .sm\\:text-2xl{font-size:1.5rem;line-height:2rem}.vk-profile .sm\\:text-3xl{font-size:1.875rem;line-height:2.25rem}}
@media (min-width:1024px){
.vk-profile .lg\\:grid-cols-\\[minmax\\(0\\,1fr\\)_380px\\]{grid-template-columns:minmax(0,1fr) 380px}
.vk-profile .lg\\:sticky{position:sticky}.vk-profile .lg\\:top-6{top:1.5rem}.vk-profile .lg\\:self-start{align-self:start}}
`

// ---------- types (shape of /vendor/vitrinaki/profile) ----------
type Day = { closed: boolean; open: string; close: string; open2: string; close2: string }
type Service = { name: string; duration: string; price: string; description: string }
type Project = { title: string; description: string; imageUrl: string; link: string; year: string }
type Profile = {
  businessType: BusinessType | ""
  businessTypeOther: string
  story: string
  whatsapp: string
  viber: string
  address: { street: string; area: string; city: string; postalCode: string; showMap: boolean; hideStreet: boolean }
  hours: Record<string, Day>
  hoursEnabled: boolean
  byAppointment: boolean
  hoursNote: string
  socials: { instagram: string; facebook: string; tiktok: string; website: string }
  languages: string[]
  delivery: { shipping: boolean; shippingAreas: string; pickup: boolean; pickupNote: string; localDelivery: boolean; localDeliveryAreas: string; note: string }
  returnPolicy: string
  retail: { categories: string; brands: string }
  food: { region: string; origin: string; certifications: string[]; certificationsOther: string; ingredientsNote: string; producerSince: string }
  crafts: { materials: string; techniques: string; madeToOrder: boolean; leadTime: string; customOrders: boolean }
  services: { items: Service[]; serviceArea: string; online: boolean; atClient: boolean }
  beauty: { specialties: string; brands: string }
  portfolio: { skills: string[]; projects: Project[]; clients: string; availability: string }
  credentials: string
  completedSteps: string[]
  updatedAt?: string | null
}
type Basics = { storeName: string; tagline: string; description: string; palette: string; logoUrl: string; bannerUrl: string; contactEmail: string; contactPhone: string }
type Private = {
  legal: { legalName: string; afm: string; doy: string; gemi: string; legalForm: string; registeredAddress: { street: string; city: string; postalCode: string }; invoiceEmail: string }
  owner: { fullName: string; mobile: string; email: string; contactLanguage: "el" | "en"; gdprConsent: boolean; gdprConsentAt: string | null }
}
type ChecklistItem = { id: string; label: string; done: boolean; step: StepId; private?: boolean }
type Payload = { profile: Profile; basics: Basics; private: Private; checklist: ChecklistItem[]; completion: number; isPublished: boolean; storefrontUrl: string }

const workday: Day = { closed: false, open: "09:00", close: "17:00", open2: "", close2: "" }
const dayOff: Day = { closed: true, open: "", close: "", open2: "", close2: "" }
const DEFAULT_HOURS: Record<string, Day> = { mon: workday, tue: workday, wed: workday, thu: workday, fri: workday, sat: dayOff, sun: dayOff }

const backend = () => __BACKEND_URL__.replace(/\/+$/, "")
async function callAPI(url: string, init?: RequestInit) {
  const response = await fetch(`${backend()}${url}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    credentials: "omit",
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(json.message || `Το αίτημα απέτυχε (${response.status}).`) as Error & { fields?: Record<string, string> }
    error.fields = json.errors
    throw error
  }
  return json
}

// ---------- small form primitives ----------
const inputCls = "mt-1.5 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5 text-sm outline-none focus:border-ui-border-interactive"
function Field({ label, error, hint, children, optional }: { label: string; error?: string; hint?: string; children: ReactNode; optional?: boolean }) {
  return (
    <label className="block text-sm font-medium text-ui-fg-base">
      <span>{label}{optional ? <span className="ml-1 font-normal text-ui-fg-muted">(προαιρετικό)</span> : null}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-normal text-ui-fg-error">{error}</span> : hint ? <span className="mt-1 block text-xs font-normal text-ui-fg-subtle">{hint}</span> : null}
    </label>
  )
}
function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm ${checked ? "border-ui-border-interactive bg-ui-bg-highlight" : "border-ui-border-base"}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4" />
      <span><span className="font-medium">{label}</span>{hint ? <span className="mt-0.5 block text-xs text-ui-fg-subtle">{hint}</span> : null}</span>
    </label>
  )
}
function Chips({ options, value, onChange }: { options: readonly (readonly [string, string])[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map(([code, label]) => {
        const on = value.includes(code)
        return (
          <button key={code} type="button" onClick={() => onChange(on ? value.filter((v) => v !== code) : [...value, code])}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? "border-ui-border-interactive bg-ui-bg-highlight text-ui-fg-interactive" : "border-ui-border-base text-ui-fg-subtle"}`}>
            {on ? "✓ " : ""}{label}
          </button>
        )
      })}
    </div>
  )
}

// ---------- page ----------
export default function VitrinakiProfilePage() {
  const [data, setData] = useState<Payload | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [basics, setBasics] = useState<Basics | null>(null)
  const [priv, setPriv] = useState<Private | null>(null)
  const [step, setStep] = useState<StepId>("type")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  const [failure, setFailure] = useState("")

  const apply = (payload: Payload) => {
    setData(payload)
    setProfile(payload.profile)
    setBasics(payload.basics)
    setPriv(payload.private)
  }

  useEffect(() => {
    callAPI("/vendor/vitrinaki/profile")
      .then((payload: Payload) => {
        apply(payload)
        // Returning sellers land on the review step; new ones start at the first question.
        const params = new URLSearchParams(window.location.search)
        const wanted = params.get("step") as StepId | null
        const flow = stepsFor(payload.profile.businessType)
        if (wanted && flow.includes(wanted)) setStep(wanted)
        else if (payload.profile.businessType && payload.profile.completedSteps.length > 3) setStep("preview")
      })
      .catch((cause) => setFailure(cause instanceof Error ? cause.message : "Δεν ήταν δυνατή η φόρτωση."))
      .finally(() => setLoading(false))
  }, [])

  const steps = useMemo(() => stepsFor(profile?.businessType || ""), [profile?.businessType])
  const index = Math.max(0, steps.indexOf(step))

  if (loading) return <div className="mx-auto max-w-6xl p-8"><div className="h-8 w-64 animate-pulse rounded bg-ui-bg-subtle" /><div className="mt-6 h-96 animate-pulse rounded-xl bg-ui-bg-subtle" /></div>
  if (!profile || !basics || !priv || !data) return <div className="mx-auto max-w-3xl p-8"><div role="alert" className="rounded-xl border border-ui-tag-red-border bg-ui-tag-red-bg p-4 text-sm text-ui-tag-red-text">{failure || "Κάτι πήγε στραβά."}</div></div>

  const type = profile.businessType
  const suggestion = type ? SUGGESTIONS[type] : null
  const setP = (patch: Partial<Profile>) => setProfile({ ...profile, ...patch })
  const setB = (patch: Partial<Basics>) => setBasics({ ...basics, ...patch })
  const setLegal = (patch: Partial<Private["legal"]>) => setPriv({ ...priv, legal: { ...priv.legal, ...patch } })
  const setOwner = (patch: Partial<Private["owner"]>) => setPriv({ ...priv, owner: { ...priv.owner, ...patch } })

  // Client-side checks per step (the server repeats them).
  const validate = (id: StepId): Record<string, string> => {
    const e: Record<string, string> = {}
    if (id === "type" && !profile.businessType) e["profile.businessType"] = "Διάλεξε ένα είδος για να συνεχίσουμε."
    if (id === "basics" && !basics.storeName.trim()) e["basics.storeName"] = "Το όνομα είναι απαραίτητο."
    if (id === "look") {
      if (basics.logoUrl && !isUrl(basics.logoUrl)) e["basics.logoUrl"] = "Μη έγκυρη διεύθυνση εικόνας."
      if (basics.bannerUrl && !isUrl(basics.bannerUrl)) e["basics.bannerUrl"] = "Μη έγκυρη διεύθυνση εικόνας."
    }
    if (id === "contact") {
      if (basics.contactEmail && !isEmail(basics.contactEmail)) e["basics.contactEmail"] = "Μη έγκυρο email."
      if (basics.contactPhone && !isGreekPhone(basics.contactPhone)) e["basics.contactPhone"] = "Π.χ. 2101234567 ή 69XXXXXXXX."
      if (profile.whatsapp && !isMessengerPhone(profile.whatsapp)) e["profile.whatsapp"] = "Π.χ. 69XXXXXXXX ή +30…"
      if (profile.viber && !isMessengerPhone(profile.viber)) e["profile.viber"] = "Π.χ. 69XXXXXXXX ή +30…"
      for (const key of ["instagram", "facebook", "tiktok", "website"] as const) {
        const v = profile.socials[key]
        if (v && !v.startsWith("@") && !isUrl(v) && !/^[\w.]+$/.test(v)) e[`profile.socials.${key}`] = "Μη έγκυρος σύνδεσμος."
      }
    }
    if (id === "location" && profile.address.postalCode && !/^\d{3}\s?\d{2}$/.test(profile.address.postalCode)) e["profile.address.postalCode"] = "Ο Τ.Κ. έχει 5 ψηφία."
    if (id === "legal") {
      if (priv.legal.afm && !isValidAfm(priv.legal.afm.replace(/\s/g, ""))) e["private.legal.afm"] = "Ο ΑΦΜ δεν είναι έγκυρος (9 ψηφία, έλεγχος ορθότητας)."
      if (priv.legal.invoiceEmail && !isEmail(priv.legal.invoiceEmail)) e["private.legal.invoiceEmail"] = "Μη έγκυρο email."
      if (priv.legal.gemi && !/^\d{6,12}$/.test(priv.legal.gemi.replace(/\s/g, ""))) e["private.legal.gemi"] = "Μόνο ψηφία (συνήθως 12)."
    }
    if (id === "owner") {
      if (priv.owner.mobile && !isGreekMobile(priv.owner.mobile)) e["private.owner.mobile"] = "Βάλε ελληνικό κινητό, π.χ. 69XXXXXXXX."
      if (priv.owner.email && !isEmail(priv.owner.email)) e["private.owner.email"] = "Μη έγκυρο email."
    }
    return e
  }

  const save = async (next: StepId | null, markDone: boolean) => {
    const e = markDone ? validate(step) : {}
    setErrors(e)
    setMessage("")
    setFailure("")
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      const completedSteps = markDone ? Array.from(new Set([...profile.completedSteps, step])) : profile.completedSteps
      const payload: Payload = await callAPI("/vendor/vitrinaki/profile", {
        method: "POST",
        body: JSON.stringify({ profile: { ...profile, completedSteps }, basics, private: priv }),
      })
      apply(payload)
      setMessage("Αποθηκεύτηκε.")
      if (next) {
        setStep(next)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } catch (cause) {
      const err = cause as Error & { fields?: Record<string, string> }
      setErrors(err.fields || {})
      setFailure(err.message)
      // Jump to the first step that has a server-side error.
      const first = Object.keys(err.fields || {})[0]
      if (first) {
        const owner = data.checklist.find((item) => first.includes(item.id))
        if (owner && steps.includes(owner.step)) setStep(owner.step)
      }
    } finally {
      setSaving(false)
    }
  }

  const nextStep = steps[index + 1] || null
  const prevStep = steps[index - 1] || null
  const meta = STEP_META[step]
  const err = (key: string) => errors[key]

  // ---------- step bodies ----------
  const body = (() => {
    switch (step) {
      case "type":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {BUSINESS_TYPES.map((option) => {
              const on = profile.businessType === option.value
              return (
                <button key={option.value} type="button" onClick={() => setP({ businessType: option.value })}
                  className={`rounded-2xl border p-4 text-left transition ${on ? "border-ui-border-interactive bg-ui-bg-highlight ring-2 ring-ui-border-interactive" : "border-ui-border-base hover:bg-ui-bg-subtle"}`}>
                  <span className="block text-base font-semibold">{option.label}</span>
                  <span className="mt-1 block text-sm text-ui-fg-subtle">{option.hint}</span>
                </button>
              )
            })}
            {profile.businessType === "other" ? (
              <div className="sm:col-span-2"><Field label="Τι κάνεις;" optional><input className={inputCls} maxLength={80} value={profile.businessTypeOther} onChange={(e) => setP({ businessTypeOther: e.target.value })} placeholder="π.χ. Σχολή χορού" /></Field></div>
            ) : null}
            {err("profile.businessType") ? <p className="text-sm text-ui-fg-error sm:col-span-2">{err("profile.businessType")}</p> : null}
          </div>
        )
      case "basics":
        return (
          <div className="space-y-5">
            <Field label="Όνομα καταστήματος" error={err("basics.storeName")}><input className={inputCls} maxLength={100} value={basics.storeName} onChange={(e) => setB({ storeName: e.target.value })} /></Field>
            <Field label="Κεντρικό μήνυμα (tagline)" hint="Μία πρόταση που λέει τι κάνεις. Εμφανίζεται μεγάλη στην κορυφή.">
              <input className={inputCls} maxLength={160} value={basics.tagline} placeholder={suggestion?.tagline} onChange={(e) => setB({ tagline: e.target.value })} />
            </Field>
            {suggestion && basics.tagline !== suggestion.tagline ? <button type="button" onClick={() => setB({ tagline: suggestion.tagline })} className="-mt-3 text-xs font-semibold text-ui-fg-interactive">Χρησιμοποίησε την πρόταση: «{suggestion.tagline}»</button> : null}
            <Field label="Σύντομη περιγραφή" hint="2-3 γραμμές κάτω από το κεντρικό μήνυμα.">
              <textarea rows={3} className={inputCls} maxLength={1800} value={basics.description} placeholder={suggestion?.description} onChange={(e) => setB({ description: e.target.value })} />
            </Field>
            {suggestion && !basics.description ? <button type="button" onClick={() => setB({ description: suggestion.description })} className="-mt-3 text-xs font-semibold text-ui-fg-interactive">Βάλε την προτεινόμενη περιγραφή</button> : null}
            <Field label="Η ιστορία σου" optional hint="Ποιος είσαι, πώς ξεκίνησες, τι σε κάνει διαφορετικό. Οι πελάτες το διαβάζουν!">
              <textarea rows={6} className={inputCls} maxLength={4000} value={profile.story} placeholder={suggestion?.story} onChange={(e) => setP({ story: e.target.value })} />
            </Field>
            <Field label={type === "portfolio" || type === "services" ? "Σπουδές, πιστοποιήσεις, εμπειρία" : "Βραβεία, διακρίσεις, πιστοποιήσεις"} optional>
              <input className={inputCls} maxLength={600} value={profile.credentials} onChange={(e) => setP({ credentials: e.target.value })} placeholder="π.χ. Πτυχίο ΤΕΙ Γραφιστικής, 12 χρόνια εμπειρία" />
            </Field>
          </div>
        )
      case "look":
        return (
          <div className="space-y-5">
            <Field label="Λογότυπο (URL εικόνας)" error={err("basics.logoUrl")} optional hint="Τετράγωνη εικόνα, ιδανικά PNG ή SVG.">
              <input className={inputCls} type="url" value={basics.logoUrl} onChange={(e) => setB({ logoUrl: e.target.value })} placeholder="https://…/logo.png" />
            </Field>
            <Field label="Εικόνα εξωφύλλου (URL)" error={err("basics.bannerUrl")} optional hint="Οριζόντια φωτογραφία της δουλειάς ή του χώρου σου.">
              <input className={inputCls} type="url" value={basics.bannerUrl} onChange={(e) => setB({ bannerUrl: e.target.value })} placeholder="https://…/cover.jpg" />
            </Field>
            <p className="text-xs text-ui-fg-subtle">Σε αυτή την έκδοση οι εικόνες μπαίνουν με σύνδεσμο (URL). Η απευθείας μεταφόρτωση έρχεται σε επόμενο βήμα.</p>
            <fieldset>
              <legend className="text-sm font-medium">Χρώμα βιτρίνας</legend>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {PALETTES.map((p) => (
                  <button key={p.value} type="button" onClick={() => setB({ palette: p.value })}
                    className={`rounded-xl border p-3 text-left ${basics.palette === p.value ? "border-ui-border-interactive ring-2 ring-ui-border-interactive" : "border-ui-border-base"}`}>
                    <span className="mb-2 flex h-10 overflow-hidden rounded-lg"><span className="flex-1" style={{ background: p.color }} /><span className="w-1/3" style={{ background: p.soft }} /></span>
                    <span className="text-xs font-semibold">{p.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )
      case "contact":
        return (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Δημόσιο email" error={err("basics.contactEmail")} optional><input className={inputCls} type="email" value={basics.contactEmail} onChange={(e) => setB({ contactEmail: e.target.value })} /></Field>
              <Field label="Τηλέφωνο" error={err("basics.contactPhone")} optional><input className={inputCls} inputMode="tel" value={basics.contactPhone} onChange={(e) => setB({ contactPhone: e.target.value })} placeholder="2101234567" /></Field>
              <Field label="WhatsApp" error={err("profile.whatsapp")} optional><input className={inputCls} inputMode="tel" value={profile.whatsapp} onChange={(e) => setP({ whatsapp: e.target.value })} placeholder="69XXXXXXXX" /></Field>
              <Field label="Viber" error={err("profile.viber")} optional><input className={inputCls} inputMode="tel" value={profile.viber} onChange={(e) => setP({ viber: e.target.value })} placeholder="69XXXXXXXX" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {([["instagram", "Instagram", "@to_onoma_sou"], ["facebook", "Facebook", "facebook.com/…"], ["tiktok", "TikTok", "@to_onoma_sou"], ["website", "Website", "www.example.gr"]] as const).map(([key, label, ph]) => (
                <Field key={key} label={label} error={err(`profile.socials.${key}`)} optional>
                  <input className={inputCls} value={profile.socials[key]} placeholder={ph} onChange={(e) => setP({ socials: { ...profile.socials, [key]: e.target.value } })} />
                </Field>
              ))}
            </div>
            <div><p className="text-sm font-medium">Σε ποιες γλώσσες εξυπηρετείς;</p><Chips options={LANGUAGES} value={profile.languages} onChange={(v) => setP({ languages: v })} /></div>
          </div>
        )
      case "location":
        return (
          <div className="space-y-5">
            {type === "services" || type === "beauty" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle checked={profile.services.atClient} onChange={(v) => setP({ services: { ...profile.services, atClient: v } })} label="Έρχομαι στον πελάτη" hint="Κατ' οίκον ή στον χώρο του." />
                <Toggle checked={profile.services.online} onChange={(v) => setP({ services: { ...profile.services, online: v } })} label="Εξυπηρετώ και online" />
              </div>
            ) : null}
            {type === "services" || type === "beauty" ? (
              <Field label="Περιοχή εξυπηρέτησης" optional><input className={inputCls} value={profile.services.serviceArea} onChange={(e) => setP({ services: { ...profile.services, serviceArea: e.target.value } })} placeholder="π.χ. Βόρεια προάστια Αθήνας" /></Field>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Διεύθυνση" optional><input className={inputCls} value={profile.address.street} onChange={(e) => setP({ address: { ...profile.address, street: e.target.value } })} placeholder="Οδός και αριθμός" /></Field>
              <Field label="Περιοχή" optional><input className={inputCls} value={profile.address.area} onChange={(e) => setP({ address: { ...profile.address, area: e.target.value } })} placeholder="π.χ. Κουκάκι" /></Field>
              <Field label="Πόλη" optional><input className={inputCls} value={profile.address.city} onChange={(e) => setP({ address: { ...profile.address, city: e.target.value } })} /></Field>
              <Field label="Τ.Κ." error={err("profile.address.postalCode")} optional><input className={inputCls} inputMode="numeric" value={profile.address.postalCode} onChange={(e) => setP({ address: { ...profile.address, postalCode: e.target.value } })} /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle checked={profile.address.showMap} onChange={(v) => setP({ address: { ...profile.address, showMap: v } })} label="Κουμπί «Δες στον χάρτη»" hint="Ανοίγει τη διεύθυνση στους χάρτες." />
              <Toggle checked={profile.address.hideStreet} onChange={(v) => setP({ address: { ...profile.address, hideStreet: v } })} label="Δείξε μόνο περιοχή/πόλη" hint="Για όσους δουλεύουν από το σπίτι." />
            </div>
            <div className="space-y-3 rounded-2xl border border-ui-border-base p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle checked={profile.hoursEnabled} onChange={(v) => setP({ hoursEnabled: v, hours: v && !Object.values(profile.hours).some((d) => d.open) ? DEFAULT_HOURS : profile.hours })} label="Έχω σταθερό ωράριο" />
                <Toggle checked={profile.byAppointment} onChange={(v) => setP({ byAppointment: v })} label="Μόνο κατόπιν ραντεβού" />
              </div>
              {profile.hoursEnabled ? (
                <div className="space-y-2">
                  {DAYS.map(([day, label]) => {
                    const d = profile.hours[day]
                    const setD = (patch: Partial<Day>) => setP({ hours: { ...profile.hours, [day]: { ...d, ...patch } } })
                    return (
                      <div key={day} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="w-24 font-medium">{label}</span>
                        <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={d.closed} onChange={(e) => setD({ closed: e.target.checked })} />Κλειστά</label>
                        {!d.closed ? (
                          <>
                            <input type="time" value={d.open} onChange={(e) => setD({ open: e.target.value })} className="rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-1" />
                            <span>–</span>
                            <input type="time" value={d.close} onChange={(e) => setD({ close: e.target.value })} className="rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-1" />
                            <span className="text-xs text-ui-fg-muted">&amp;</span>
                            <input type="time" value={d.open2} onChange={(e) => setD({ open2: e.target.value })} className="rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-1" aria-label="Απογευματινό άνοιγμα" />
                            <span>–</span>
                            <input type="time" value={d.close2} onChange={(e) => setD({ close2: e.target.value })} className="rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-1" aria-label="Απογευματινό κλείσιμο" />
                          </>
                        ) : null}
                      </div>
                    )
                  })}
                  {err(Object.keys(errors).find((k) => k.startsWith("profile.hours")) || "-") ? <p className="text-xs text-ui-fg-error">Η ώρα γράφεται ΩΩ:ΛΛ.</p> : null}
                </div>
              ) : null}
              <Field label="Σημείωση ωραρίου" optional><input className={inputCls} maxLength={300} value={profile.hoursNote} onChange={(e) => setP({ hoursNote: e.target.value })} placeholder="π.χ. Αύγουστο κλειστά" /></Field>
            </div>
          </div>
        )
      case "retail":
        return (
          <div className="space-y-5">
            <Field label="Κατηγορίες προϊόντων" hint="Χώρισε με κόμμα."><input className={inputCls} value={profile.retail.categories} onChange={(e) => setP({ retail: { ...profile.retail, categories: e.target.value } })} placeholder="Ρούχα, αξεσουάρ, δώρα" /></Field>
            <Field label="Brands που διαθέτεις" optional><input className={inputCls} value={profile.retail.brands} onChange={(e) => setP({ retail: { ...profile.retail, brands: e.target.value } })} /></Field>
          </div>
        )
      case "food":
        return (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Περιοχή παραγωγής" optional><input className={inputCls} value={profile.food.region} onChange={(e) => setP({ food: { ...profile.food, region: e.target.value } })} placeholder="π.χ. Μεσσηνία" /></Field>
              <Field label="Παράγουμε από (έτος)" error={err("profile.food.producerSince")} optional><input className={inputCls} inputMode="numeric" maxLength={4} value={profile.food.producerSince} onChange={(e) => setP({ food: { ...profile.food, producerSince: e.target.value } })} placeholder="1987" /></Field>
            </div>
            <Field label="Προέλευση & τρόπος παραγωγής" optional><textarea rows={3} className={inputCls} value={profile.food.origin} onChange={(e) => setP({ food: { ...profile.food, origin: e.target.value } })} placeholder="π.χ. Ελαιώνας 300 δέντρων κορωνέικης, συλλογή με το χέρι, ψυχρή έκθλιψη" /></Field>
            <div><p className="text-sm font-medium">Πιστοποιήσεις</p><Chips options={CERTIFICATIONS} value={profile.food.certifications} onChange={(v) => setP({ food: { ...profile.food, certifications: v } })} /></div>
            {profile.food.certifications.includes("other") ? <Field label="Άλλη πιστοποίηση"><input className={inputCls} value={profile.food.certificationsOther} onChange={(e) => setP({ food: { ...profile.food, certificationsOther: e.target.value } })} /></Field> : null}
            <Field label="Συστατικά / αλλεργιογόνα / συντήρηση" optional hint="Γενική σημείωση. Τα ακριβή συστατικά μπαίνουν σε κάθε προϊόν."><textarea rows={3} className={inputCls} value={profile.food.ingredientsNote} onChange={(e) => setP({ food: { ...profile.food, ingredientsNote: e.target.value } })} /></Field>
          </div>
        )
      case "crafts":
        return (
          <div className="space-y-5">
            <Field label="Υλικά που χρησιμοποιείς"><input className={inputCls} value={profile.crafts.materials} onChange={(e) => setP({ crafts: { ...profile.crafts, materials: e.target.value } })} placeholder="π.χ. Ασήμι 925, φυσικές πέτρες" /></Field>
            <Field label="Τεχνικές" optional><input className={inputCls} value={profile.crafts.techniques} onChange={(e) => setP({ crafts: { ...profile.crafts, techniques: e.target.value } })} placeholder="π.χ. Τροχός, χύτευση, ζωγραφική με το χέρι" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle checked={profile.crafts.madeToOrder} onChange={(v) => setP({ crafts: { ...profile.crafts, madeToOrder: v } })} label="Φτιάχνω κατά παραγγελία" />
              <Toggle checked={profile.crafts.customOrders} onChange={(v) => setP({ crafts: { ...profile.crafts, customOrders: v } })} label="Δέχομαι εξατομικευμένες παραγγελίες" hint="Χάραξη, χρώμα, διαστάσεις…" />
            </div>
            {profile.crafts.madeToOrder ? <Field label="Χρόνος κατασκευής"><input className={inputCls} value={profile.crafts.leadTime} onChange={(e) => setP({ crafts: { ...profile.crafts, leadTime: e.target.value } })} placeholder="π.χ. 5-7 εργάσιμες" /></Field> : null}
          </div>
        )
      case "services": {
        const items = profile.services.items
        const setItems = (next: Service[]) => setP({ services: { ...profile.services, items: next } })
        return (
          <div className="space-y-4">
            {type === "beauty" ? (
              <Field label="Ειδικότητες" optional><input className={inputCls} value={profile.beauty.specialties} onChange={(e) => setP({ beauty: { ...profile.beauty, specialties: e.target.value } })} placeholder="π.χ. Βαφές, balayage, νυφικά χτενίσματα" /></Field>
            ) : null}
            {items.map((item, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-ui-border-base p-4">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold">Υπηρεσία {i + 1}</p><button type="button" className="text-xs font-semibold text-ui-fg-subtle" onClick={() => setItems(items.filter((_, j) => j !== i))}>Αφαίρεση</button></div>
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                  <Field label="Όνομα"><input className={inputCls} value={item.name} onChange={(e) => setItems(items.map((it, j) => (j === i ? { ...it, name: e.target.value } : it)))} /></Field>
                  <Field label="Διάρκεια" optional><input className={inputCls} value={item.duration} onChange={(e) => setItems(items.map((it, j) => (j === i ? { ...it, duration: e.target.value } : it)))} placeholder="45′" /></Field>
                  <Field label="Τιμή" optional><input className={inputCls} value={item.price} onChange={(e) => setItems(items.map((it, j) => (j === i ? { ...it, price: e.target.value } : it)))} placeholder="από 25€" /></Field>
                </div>
                <Field label="Περιγραφή" optional><input className={inputCls} value={item.description} onChange={(e) => setItems(items.map((it, j) => (j === i ? { ...it, description: e.target.value } : it)))} /></Field>
              </div>
            ))}
            <button type="button" disabled={items.length >= 20} onClick={() => setItems([...items, { name: "", duration: "", price: "", description: "" }])} className="rounded-lg border border-dashed border-ui-border-strong px-4 py-2.5 text-sm font-semibold">+ Πρόσθεσε υπηρεσία</button>
            <div className="rounded-xl bg-ui-bg-subtle p-3 text-xs text-ui-fg-subtle"><span className="mr-2 rounded-full bg-ui-tag-orange-bg px-2 py-0.5 font-semibold text-ui-tag-orange-text">Σύντομα</span>Online κρατήσεις ραντεβού. Μέχρι τότε οι πελάτες επικοινωνούν μαζί σου με τηλέφωνο, email ή WhatsApp.</div>
          </div>
        )
      }
      case "portfolio": {
        const projects = profile.portfolio.projects
        const setProjects = (next: Project[]) => setP({ portfolio: { ...profile.portfolio, projects: next } })
        return (
          <div className="space-y-4">
            <Field label="Δεξιότητες" hint="Χώρισε με κόμμα."><input className={inputCls} value={profile.portfolio.skills.join(", ")} onChange={(e) => setP({ portfolio: { ...profile.portfolio, skills: e.target.value.split(",").map((s) => s.trimStart()) } })} placeholder="Branding, Φωτογραφία προϊόντων, Web design" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Πελάτες / συνεργασίες" optional><input className={inputCls} value={profile.portfolio.clients} onChange={(e) => setP({ portfolio: { ...profile.portfolio, clients: e.target.value } })} /></Field>
              <Field label="Διαθεσιμότητα" optional><input className={inputCls} value={profile.portfolio.availability} onChange={(e) => setP({ portfolio: { ...profile.portfolio, availability: e.target.value } })} placeholder="Διαθέσιμη για νέα έργα από Νοέμβριο" /></Field>
            </div>
            {projects.map((project, i) => {
              const setPr = (patch: Partial<Project>) => setProjects(projects.map((p, j) => (j === i ? { ...p, ...patch } : p)))
              return (
                <div key={i} className="space-y-3 rounded-xl border border-ui-border-base p-4">
                  <div className="flex items-center justify-between"><p className="text-sm font-semibold">Έργο {i + 1}</p><button type="button" className="text-xs font-semibold text-ui-fg-subtle" onClick={() => setProjects(projects.filter((_, j) => j !== i))}>Αφαίρεση</button></div>
                  <div className="grid gap-3 sm:grid-cols-[3fr_1fr]">
                    <Field label="Τίτλος"><input className={inputCls} value={project.title} onChange={(e) => setPr({ title: e.target.value })} /></Field>
                    <Field label="Έτος" optional><input className={inputCls} maxLength={4} value={project.year} onChange={(e) => setPr({ year: e.target.value })} /></Field>
                  </div>
                  <Field label="Περιγραφή" optional><input className={inputCls} value={project.description} onChange={(e) => setPr({ description: e.target.value })} /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Εικόνα (URL)" error={err(`profile.portfolio.projects.${i}.imageUrl`)} optional><input className={inputCls} value={project.imageUrl} onChange={(e) => setPr({ imageUrl: e.target.value })} /></Field>
                    <Field label="Σύνδεσμος" error={err(`profile.portfolio.projects.${i}.link`)} optional><input className={inputCls} value={project.link} onChange={(e) => setPr({ link: e.target.value })} /></Field>
                  </div>
                </div>
              )
            })}
            <button type="button" disabled={projects.length >= 12} onClick={() => setProjects([...projects, { title: "", description: "", imageUrl: "", link: "", year: "" }])} className="rounded-lg border border-dashed border-ui-border-strong px-4 py-2.5 text-sm font-semibold">+ Πρόσθεσε έργο</button>
          </div>
        )
      }
      case "delivery": {
        const d = profile.delivery
        const setD = (patch: Partial<Profile["delivery"]>) => setP({ delivery: { ...d, ...patch } })
        return (
          <div className="space-y-4">
            <Toggle checked={d.shipping} onChange={(v) => setD({ shipping: v })} label="Αποστολή με courier" />
            {d.shipping ? <Field label="Πού στέλνεις;" optional><input className={inputCls} value={d.shippingAreas} onChange={(e) => setD({ shippingAreas: e.target.value })} placeholder="Σε όλη την Ελλάδα και Κύπρο" /></Field> : null}
            <Toggle checked={d.pickup} onChange={(v) => setD({ pickup: v })} label="Παραλαβή από το κατάστημα / εργαστήριο" />
            {d.pickup ? <Field label="Οδηγίες παραλαβής" optional><input className={inputCls} value={d.pickupNote} onChange={(e) => setD({ pickupNote: e.target.value })} /></Field> : null}
            <Toggle checked={d.localDelivery} onChange={(v) => setD({ localDelivery: v })} label="Τοπική διανομή" hint="Παραδίδεις εσύ στην περιοχή σου." />
            {d.localDelivery ? <Field label="Περιοχές διανομής" optional><input className={inputCls} value={d.localDeliveryAreas} onChange={(e) => setD({ localDeliveryAreas: e.target.value })} /></Field> : null}
            <Field label="Σημείωση αποστολών" optional><input className={inputCls} value={d.note} onChange={(e) => setD({ note: e.target.value })} placeholder="π.χ. Δωρεάν αποστολή άνω των 50€" /></Field>
            <Field label="Πολιτική επιστροφών" optional hint="Σύντομα και καθαρά. Για αγορές από απόσταση ο καταναλωτής έχει κατά κανόνα δικαίωμα υπαναχώρησης 14 ημερών.">
              <textarea rows={4} className={inputCls} value={profile.returnPolicy} onChange={(e) => setP({ returnPolicy: e.target.value })} placeholder="Δεκτές επιστροφές εντός 14 ημερών από την παραλαβή, σε άριστη κατάσταση…" />
            </Field>
          </div>
        )
      }
      case "legal":
        return (
          <div className="space-y-5">
            <PrivateBadge />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Επωνυμία" optional><input className={inputCls} value={priv.legal.legalName} onChange={(e) => setLegal({ legalName: e.target.value })} /></Field>
              <Field label="Νομική μορφή" optional>
                <select className={inputCls} value={priv.legal.legalForm} onChange={(e) => setLegal({ legalForm: e.target.value })}>
                  <option value="">Επίλεξε…</option>
                  {LEGAL_FORMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="ΑΦΜ" error={err("private.legal.afm")} optional><input className={inputCls} inputMode="numeric" maxLength={9} value={priv.legal.afm} onChange={(e) => setLegal({ afm: e.target.value.replace(/\D/g, "") })} /></Field>
              <Field label="ΔΟΥ" optional><input className={inputCls} value={priv.legal.doy} onChange={(e) => setLegal({ doy: e.target.value })} placeholder="π.χ. Α' Αθηνών" /></Field>
              <Field label="Αριθμός ΓΕΜΗ" error={err("private.legal.gemi")} optional><input className={inputCls} inputMode="numeric" value={priv.legal.gemi} onChange={(e) => setLegal({ gemi: e.target.value })} /></Field>
              <Field label="Email τιμολόγησης" error={err("private.legal.invoiceEmail")} optional><input className={inputCls} type="email" value={priv.legal.invoiceEmail} onChange={(e) => setLegal({ invoiceEmail: e.target.value })} /></Field>
            </div>
            <p className="text-sm font-medium">Έδρα</p>
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
              <Field label="Διεύθυνση" optional><input className={inputCls} value={priv.legal.registeredAddress.street} onChange={(e) => setLegal({ registeredAddress: { ...priv.legal.registeredAddress, street: e.target.value } })} /></Field>
              <Field label="Πόλη" optional><input className={inputCls} value={priv.legal.registeredAddress.city} onChange={(e) => setLegal({ registeredAddress: { ...priv.legal.registeredAddress, city: e.target.value } })} /></Field>
              <Field label="Τ.Κ." error={err("private.legal.registeredAddress.postalCode")} optional><input className={inputCls} value={priv.legal.registeredAddress.postalCode} onChange={(e) => setLegal({ registeredAddress: { ...priv.legal.registeredAddress, postalCode: e.target.value } })} /></Field>
            </div>
          </div>
        )
      case "owner":
        return (
          <div className="space-y-5">
            <PrivateBadge />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ονοματεπώνυμο" optional><input className={inputCls} value={priv.owner.fullName} onChange={(e) => setOwner({ fullName: e.target.value })} /></Field>
              <Field label="Κινητό" error={err("private.owner.mobile")} optional><input className={inputCls} inputMode="tel" value={priv.owner.mobile} onChange={(e) => setOwner({ mobile: e.target.value })} placeholder="69XXXXXXXX" /></Field>
              <Field label="Email" error={err("private.owner.email")} optional><input className={inputCls} type="email" value={priv.owner.email} onChange={(e) => setOwner({ email: e.target.value })} /></Field>
              <Field label="Γλώσσα επικοινωνίας">
                <select className={inputCls} value={priv.owner.contactLanguage} onChange={(e) => setOwner({ contactLanguage: e.target.value === "en" ? "en" : "el" })}>
                  <option value="el">Ελληνικά</option><option value="en">English</option>
                </select>
              </Field>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-ui-border-base p-4 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4" checked={priv.owner.gdprConsent} onChange={(e) => setOwner({ gdprConsent: e.target.checked })} />
              <span>Συμφωνώ να επεξεργάζεται το Vitrinaki τα παραπάνω προσωπικά στοιχεία για τη λειτουργία του λογαριασμού, την τιμολόγηση και την επικοινωνία μαζί μου, σύμφωνα με τον GDPR. Μπορώ να ανακαλέσω τη συγκατάθεση οποτεδήποτε.
                {priv.owner.gdprConsentAt ? <span className="mt-1 block text-xs text-ui-fg-subtle">Δόθηκε στις {new Date(priv.owner.gdprConsentAt).toLocaleString("el-GR")}</span> : null}
              </span>
            </label>
          </div>
        )
      case "preview":
        return <PreviewStep data={data} profile={profile} goTo={setStep} />
    }
  })()

  return (
    <div className="vk-profile mx-auto max-w-7xl px-4 py-8">
      <style>{PAGE_CSS}</style>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-fg-subtle">Vitrinaki Studio</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Προφίλ καταστήματος</h1>
          <p className="mt-1 max-w-2xl text-sm text-ui-fg-subtle">Απάντησε σε λίγες ερωτήσεις και η σελίδα σου στήνεται αυτόματα. Μπορείς να γυρίσεις και να αλλάξεις οτιδήποτε, όποτε θέλεις.</p>
        </div>
        <Completion value={data.completion} />
      </header>

      {/* progress */}
      <ol className="mb-6 flex flex-wrap gap-1.5" aria-label="Βήματα">
        {steps.map((id, i) => {
          const done = profile.completedSteps.includes(id)
          return (
            <li key={id}>
              <button type="button" onClick={() => setStep(id)} disabled={!profile.businessType && id !== "type"}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${id === step ? "bg-ui-button-inverted text-ui-fg-on-inverted" : done ? "bg-ui-tag-green-bg text-ui-tag-green-text" : "bg-ui-bg-subtle text-ui-fg-subtle"}`}>
                {i + 1}. {STEP_META[id].title}{STEP_META[id].private ? " 🔒" : ""}
              </button>
            </li>
          )
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-6 sm:p-8">
          <p className="text-xs font-semibold text-ui-fg-subtle">Ερώτηση {index + 1} από {steps.length}{meta.private ? " · Ιδιωτικά στοιχεία" : ""}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ui-bg-subtle"><div className="h-full rounded-full bg-ui-fg-interactive transition-all" style={{ width: `${((index + 1) / steps.length) * 100}%` }} /></div>
          <h2 className="mt-5 text-xl font-semibold sm:text-2xl">{meta.question}</h2>
          {meta.hint ? <p className="mt-1.5 text-sm text-ui-fg-subtle">{meta.hint}</p> : null}

          {failure ? <div role="alert" className="mt-5 rounded-xl border border-ui-tag-red-border bg-ui-tag-red-bg p-3 text-sm text-ui-tag-red-text">{failure}</div> : null}
          {message ? <div role="status" className="mt-5 rounded-xl border border-ui-tag-green-border bg-ui-tag-green-bg p-3 text-sm text-ui-tag-green-text">{message}</div> : null}

          <div className="mt-6">{body}</div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ui-border-base pt-5">
            <button type="button" disabled={!prevStep || saving} onClick={() => prevStep && setStep(prevStep)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ui-fg-subtle disabled:opacity-40">← Πίσω</button>
            <div className="flex flex-wrap gap-2">
              {step !== "type" && step !== "preview" ? (
                <button type="button" disabled={saving} onClick={() => nextStep && setStep(nextStep)} className="rounded-lg border border-ui-border-base px-4 py-2.5 text-sm font-semibold text-ui-fg-subtle">Παράλειψη, αργότερα</button>
              ) : null}
              {step === "preview" ? (
                <button type="button" disabled={saving} onClick={() => void save(null, true)} className="rounded-lg bg-ui-button-inverted px-5 py-2.5 text-sm font-semibold text-ui-fg-on-inverted">{saving ? "Αποθήκευση…" : "Αποθήκευση"}</button>
              ) : (
                <button type="button" disabled={saving} onClick={() => void save(nextStep, true)} className="rounded-lg bg-ui-button-inverted px-5 py-2.5 text-sm font-semibold text-ui-fg-on-inverted disabled:opacity-60">{saving ? "Αποθήκευση…" : "Αποθήκευση & συνέχεια →"}</button>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <LivePreview profile={profile} basics={basics} />
          <section className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-5">
            <h3 className="text-sm font-semibold">Τι λείπει ακόμα</h3>
            <ul className="mt-3 space-y-1.5">
              {data.checklist.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => steps.includes(item.step) && setStep(item.step)} className="flex w-full items-center gap-2 text-left text-sm">
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${item.done ? "bg-ui-tag-green-bg text-ui-tag-green-text" : "border border-ui-border-strong text-transparent"}`}>✓</span>
                    <span className={item.done ? "text-ui-fg-subtle line-through" : ""}>{item.label}</span>
                    {item.private ? <span className="ml-auto text-[10px] font-semibold uppercase text-ui-fg-muted">ιδιωτικό</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

function PrivateBadge() {
  return <div className="rounded-xl border border-ui-border-base bg-ui-bg-subtle p-3 text-xs text-ui-fg-subtle">🔒 Αυτά τα στοιχεία αποθηκεύονται χωριστά και <strong>δεν εμφανίζονται ποτέ</strong> στη δημόσια σελίδα σου.</div>
}

function Completion({ value }: { value: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ui-border-base bg-ui-bg-base px-4 py-3">
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="6" className="stroke-ui-bg-subtle" />
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="6" stroke="#2E4A37" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 28 28)" />
      </svg>
      <div><p className="text-2xl font-semibold">{value}%</p><p className="text-xs text-ui-fg-subtle">ολοκληρωμένο προφίλ</p></div>
    </div>
  )
}

// Which public sections will appear, in the order the storefront renders them.
function visibleSections(profile: Profile): string[] {
  const type = profile.businessType || "other"
  const has: Record<string, boolean> = {
    catalog: !["services", "portfolio", "beauty"].includes(type),
    origin: Boolean(profile.food.region || profile.food.origin || profile.food.certifications.length),
    craft: Boolean(profile.crafts.materials || profile.crafts.techniques || profile.crafts.madeToOrder),
    story: Boolean(profile.story),
    delivery: profile.delivery.shipping || profile.delivery.pickup || profile.delivery.localDelivery || Boolean(profile.returnPolicy),
    visit: profile.hoursEnabled || profile.byAppointment || Boolean(profile.address.city || profile.address.area),
    area: Boolean(profile.services.serviceArea || profile.address.city || profile.services.online || profile.services.atClient),
    services: profile.services.items.length > 0,
    projects: profile.portfolio.projects.length > 0,
    skills: profile.portfolio.skills.filter(Boolean).length > 0,
    contact: true,
  }
  return SECTION_ORDER[type].filter((id) => has[id])
}

function LivePreview({ profile, basics }: { profile: Profile; basics: Basics }) {
  const palette = PALETTES.find((p) => p.value === basics.palette) || PALETTES[0]
  const sections = visibleSections(profile)
  const typeLabel = BUSINESS_TYPES.find((t) => t.value === profile.businessType)?.label
  const suggestion = profile.businessType ? SUGGESTIONS[profile.businessType] : null
  return (
    <section className="overflow-hidden rounded-2xl border border-ui-border-base bg-ui-bg-base">
      <div className="flex items-center gap-1.5 border-b border-ui-border-base px-3 py-2"><span className="h-2.5 w-2.5 rounded-full bg-ui-tag-red-icon" /><span className="h-2.5 w-2.5 rounded-full bg-ui-tag-orange-icon" /><span className="h-2.5 w-2.5 rounded-full bg-ui-tag-green-icon" /><span className="ml-2 text-[11px] text-ui-fg-muted">Ζωντανή προεπισκόπηση</span></div>
      <div style={{ background: "#F7F2E8", color: palette.color }}>
        <div className="flex items-center gap-2 px-4 py-3">
          {basics.logoUrl ? <img src={basics.logoUrl} alt="" className="h-7 w-7 rounded-md object-cover" /> : <span className="grid h-7 w-7 place-items-center rounded-md text-[10px] font-bold text-white" style={{ background: palette.color }}>{(basics.storeName || "V").slice(0, 2).toUpperCase()}</span>}
          <span className="truncate text-sm font-bold">{basics.storeName || "Το κατάστημά σου"}</span>
        </div>
        <div className="relative px-4 pb-5 pt-2">
          {basics.bannerUrl ? <img src={basics.bannerUrl} alt="" className="mb-3 h-24 w-full rounded-xl object-cover" /> : <div className="mb-3 h-24 w-full rounded-xl" style={{ background: palette.soft }} />}
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: palette.color, opacity: 0.7 }}>{typeLabel || "Είδος επιχείρησης;"}</p>
          <p className="mt-1 font-serif text-lg font-bold leading-tight">{basics.tagline || suggestion?.tagline || "Το κεντρικό σου μήνυμα"}</p>
          <p className="mt-1 line-clamp-2 text-xs opacity-75">{basics.description || suggestion?.description || ""}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full px-3 py-1 text-[10px] font-bold text-white" style={{ background: palette.color }}>{["services", "beauty"].includes(profile.businessType) ? "Ζήτησε ραντεβού" : profile.businessType === "portfolio" ? "Δες τα έργα" : "Δες τα προϊόντα"}</span>
            {profile.whatsapp ? <span className="rounded-full border px-3 py-1 text-[10px] font-bold" style={{ borderColor: palette.color }}>WhatsApp</span> : null}
          </div>
        </div>
        <div className="space-y-1.5 px-4 pb-4">
          {sections.map((id, i) => (
            <div key={id} className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs font-semibold"><span className="opacity-50">{i + 1}</span>{SECTION_LABELS[id]}</div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PreviewStep({ data, profile, goTo }: { data: Payload; profile: Profile; goTo: (s: StepId) => void }) {
  const missing = data.checklist.filter((item) => !item.done)
  const sections = visibleSections(profile)
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-ui-bg-subtle p-5">
        <p className="text-sm font-semibold">Η σελίδα σου θα έχει {sections.length} ενότητες, με αυτή τη σειρά:</p>
        <p className="mt-2 text-sm text-ui-fg-subtle">{sections.map((id) => SECTION_LABELS[id]).join(" → ")}</p>
        <p className="mt-3 text-xs text-ui-fg-subtle">Ενότητες χωρίς στοιχεία δεν εμφανίζονται. Συμπλήρωσε περισσότερα για πιο πλούσια σελίδα.</p>
      </div>
      {missing.length ? (
        <div>
          <p className="text-sm font-semibold">Για 100%, συμπλήρωσε ακόμα:</p>
          <div className="mt-2 flex flex-wrap gap-2">{missing.map((item) => <button key={item.id} type="button" onClick={() => goTo(item.step)} className="rounded-full border border-ui-border-base px-3 py-1.5 text-xs font-semibold">{item.label} →</button>)}</div>
        </div>
      ) : <p className="text-sm font-semibold text-ui-tag-green-text">Το προφίλ σου είναι πλήρες!</p>}
      <div className="flex flex-wrap gap-3">
        <a href={data.storefrontUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-ui-button-inverted px-4 py-2.5 text-sm font-semibold text-ui-fg-on-inverted">Δες τη σελίδα σου ↗</a>
        <a href="/seller/vitrinaki-storefront" className="rounded-lg border border-ui-border-base px-4 py-2.5 text-sm font-semibold">Δημοσίευση & domain</a>
      </div>
      {!data.isPublished ? <p className="text-xs text-ui-fg-subtle">Η σελίδα δεν έχει δημοσιευτεί ακόμα: θα είναι ορατή αφού τη δημοσιεύσεις από τη «Website & domain».</p> : null}
    </div>
  )
}
