"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"

import { useTranslator } from "@/lib/i18n/client"
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
} from "@/lib/vitrinaki-profile"
import { caps, type Palette } from "@/lib/vitrinaki-start"

import { ShopPreview } from "../StartFlow/ShopPreview"
import { PublishStep } from "./PublishStep"
import { ShopLogin } from "./ShopLogin"
import { Chips, Field, Icon, Notice, Spinner, Toggle, ghostBtn, inputCls, primaryBtn, secondaryBtn, smallInput } from "./ui"


// /[locale]/shop-registration: the whole store profile on vitrinaki.gr. The
// same question flow as the Studio's «Προφίλ καταστήματος» (it branches on the
// kind of business), saved through /api/vitrinaki/shop/profile, plus a last
// step to activate the plan and publish. The Studio is only for products.

// ---------- shapes of /vendor/vitrinaki/profile ----------
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
type Session = { name: string; handle: string; email: string } | null

const workday: Day = { closed: false, open: "09:00", close: "17:00", open2: "", close2: "" }
const dayOff: Day = { closed: true, open: "", close: "", open2: "", close2: "" }
const DEFAULT_HOURS: Record<string, Day> = { mon: workday, tue: workday, wed: workday, thu: workday, fri: workday, sat: dayOff, sun: dayOff }

class ApiError extends Error {
  constructor(message: string, public status: number, public fields?: Record<string, string>) {
    super(message)
  }
}

async function api(path: string, body?: unknown) {
  const response = await fetch(`/api/vitrinaki/shop/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(json.message || "", response.status, json.errors)
  return json
}

export function ShopRegistration({ locale, session, startHref }: { locale: string; session: Session; startHref: string }) {
  const { lang, tr } = useTranslator()
  const uid = useId()
  const [loggedIn, setLoggedIn] = useState(Boolean(session))
  const [expiredNotice, setExpiredNotice] = useState("")
  const [data, setData] = useState<Payload | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [basics, setBasics] = useState<Basics | null>(null)
  const [priv, setPriv] = useState<Private | null>(null)
  const [step, setStep] = useState<StepId>("type")
  const [loading, setLoading] = useState(Boolean(session))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<"" | "logoUrl" | "bannerUrl">("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  const [failure, setFailure] = useState("")
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  const apply = (payload: Payload) => {
    setData(payload)
    setProfile(payload.profile)
    setBasics(payload.basics)
    setPriv(payload.private)
  }

  const expire = useCallback(() => {
    setLoggedIn(false)
    setData(null)
    setExpiredNotice(tr("Η σύνδεση έληξε. Συνδέσου ξανά για να συνεχίσεις."))
  }, [tr])

  const load = useCallback(async () => {
    setLoading(true)
    setFailure("")
    try {
      const payload = (await api("profile")) as Payload
      apply(payload)
      const wanted = new URLSearchParams(window.location.search).get("step") as StepId | null
      const flow = stepsFor(payload.profile.businessType)
      if (wanted && flow.includes(wanted)) setStep(wanted)
      else if (payload.profile.businessType && payload.profile.completedSteps.length > 3) setStep("preview")
      else setStep(payload.profile.businessType ? "basics" : "type")
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) return expire()
      setFailure(cause instanceof Error && cause.message ? cause.message : tr("Δεν ήταν δυνατή η φόρτωση. Δοκίμασε ξανά."))
    } finally {
      setLoading(false)
    }
  }, [expire, tr])

  useEffect(() => {
    if (loggedIn) void load()
  }, [loggedIn, load])

  // Move focus to the question when the step changes (not on first paint).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus({ preventScroll: true })
  }, [step])

  const steps = useMemo(() => stepsFor(profile?.businessType || ""), [profile?.businessType])

  async function logout() {
    await fetch("/api/vitrinaki/shop/logout", { method: "POST" }).catch(() => null)
    setLoggedIn(false)
    setData(null)
    setExpiredNotice("")
  }

  if (!loggedIn) {
    return <ShopLogin startHref={startHref} notice={expiredNotice} onLoggedIn={() => { setExpiredNotice(""); setLoggedIn(true) }} />
  }
  if (loading || (!data && !failure)) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="h-[34rem] animate-pulse rounded-[1.6rem] bg-white/70" />
        <div className="hidden h-[28rem] animate-pulse rounded-[1.6rem] bg-white/70 lg:block" />
      </div>
    )
  }
  if (!profile || !basics || !priv || !data) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Notice tone="error">{failure || tr("Κάτι πήγε στραβά.")}</Notice>
        <button type="button" onClick={() => void load()} className={secondaryBtn}>{tr("Δοκίμασε ξανά")}</button>
      </div>
    )
  }

  const index = Math.max(0, steps.indexOf(step))
  const type = profile.businessType
  const suggestion = type ? SUGGESTIONS[type] : null
  const setP = (patch: Partial<Profile>) => setProfile({ ...profile, ...patch })
  const setB = (patch: Partial<Basics>) => setBasics({ ...basics, ...patch })
  const setLegal = (patch: Partial<Private["legal"]>) => setPriv({ ...priv, legal: { ...priv.legal, ...patch } })
  const setOwner = (patch: Partial<Private["owner"]>) => setPriv({ ...priv, owner: { ...priv.owner, ...patch } })
  const err = (key: string) => errors[key]
  const opt = tr("(προαιρετικό)")
  const id = (name: string) => `${uid}-${name}`

  // Client-side checks per step (the server repeats them).
  const validate = (s: StepId): Record<string, string> => {
    const e: Record<string, string> = {}
    if (s === "type" && !profile.businessType) e["profile.businessType"] = tr("Διάλεξε ένα είδος για να συνεχίσουμε.")
    if (s === "basics" && !basics.storeName.trim()) e["basics.storeName"] = tr("Το όνομα είναι απαραίτητο.")
    if (s === "look") {
      if (basics.logoUrl && !isUrl(basics.logoUrl)) e["basics.logoUrl"] = tr("Μη έγκυρη διεύθυνση εικόνας.")
      if (basics.bannerUrl && !isUrl(basics.bannerUrl)) e["basics.bannerUrl"] = tr("Μη έγκυρη διεύθυνση εικόνας.")
    }
    if (s === "contact") {
      if (basics.contactEmail && !isEmail(basics.contactEmail)) e["basics.contactEmail"] = tr("Μη έγκυρο email.")
      if (basics.contactPhone && !isGreekPhone(basics.contactPhone)) e["basics.contactPhone"] = tr("Π.χ. 2101234567 ή 69XXXXXXXX.")
      if (profile.whatsapp && !isMessengerPhone(profile.whatsapp)) e["profile.whatsapp"] = tr("Π.χ. 69XXXXXXXX ή +30…")
      if (profile.viber && !isMessengerPhone(profile.viber)) e["profile.viber"] = tr("Π.χ. 69XXXXXXXX ή +30…")
      for (const key of ["instagram", "facebook", "tiktok", "website"] as const) {
        const v = profile.socials[key]
        if (v && !v.startsWith("@") && !isUrl(v) && !/^[\w.]+$/.test(v)) e[`profile.socials.${key}`] = tr("Μη έγκυρος σύνδεσμος.")
      }
    }
    if (s === "location" && profile.address.postalCode && !/^\d{3}\s?\d{2}$/.test(profile.address.postalCode)) e["profile.address.postalCode"] = tr("Ο Τ.Κ. έχει 5 ψηφία.")
    if (s === "legal") {
      if (priv.legal.afm && !isValidAfm(priv.legal.afm.replace(/\s/g, ""))) e["private.legal.afm"] = tr("Ο ΑΦΜ δεν είναι έγκυρος (9 ψηφία, έλεγχος ορθότητας).")
      if (priv.legal.invoiceEmail && !isEmail(priv.legal.invoiceEmail)) e["private.legal.invoiceEmail"] = tr("Μη έγκυρο email.")
      if (priv.legal.gemi && !/^\d{6,12}$/.test(priv.legal.gemi.replace(/\s/g, ""))) e["private.legal.gemi"] = tr("Μόνο ψηφία (συνήθως 12).")
      if (priv.legal.registeredAddress.postalCode && !/^\d{3}\s?\d{2}$/.test(priv.legal.registeredAddress.postalCode)) e["private.legal.registeredAddress.postalCode"] = tr("Ο Τ.Κ. έχει 5 ψηφία.")
    }
    if (s === "owner") {
      if (priv.owner.mobile && !isGreekMobile(priv.owner.mobile)) e["private.owner.mobile"] = tr("Βάλε ελληνικό κινητό, π.χ. 69XXXXXXXX.")
      if (priv.owner.email && !isEmail(priv.owner.email)) e["private.owner.email"] = tr("Μη έγκυρο email.")
    }
    return e
  }

  const goTo = (next: StepId) => {
    setStep(next)
    setErrors({})
    setFailure("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const save = async (next: StepId | null) => {
    const e = validate(step)
    setErrors(e)
    setMessage("")
    setFailure("")
    if (Object.keys(e).length) {
      setFailure(tr("Έλεγξε τα πεδία με κόκκινο."))
      // Bring the first field with an error into view, below the sticky header.
      window.setTimeout(() => document.querySelector('[id$="-error"]')?.scrollIntoView({ behavior: "smooth", block: "center" }), 0)
      return
    }
    setSaving(true)
    try {
      const completedSteps = Array.from(new Set([...profile.completedSteps, step]))
      const payload = (await api("profile", { profile: { ...profile, completedSteps }, basics, private: priv })) as Payload
      apply(payload)
      if (next) goTo(next)
      else setMessage(tr("Αποθηκεύτηκε."))
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) return expire()
      const apiError = cause as ApiError
      setErrors(apiError.fields || {})
      setFailure(apiError.message || tr("Δεν αποθηκεύτηκε. Δοκίμασε ξανά."))
      // Jump to the step that owns the first server-side error.
      const first = Object.keys(apiError.fields || {})[0]
      if (first) {
        const owner = data.checklist.find((item) => first.includes(item.id))
        if (owner && steps.includes(owner.step)) setStep(owner.step)
      }
    } finally {
      setSaving(false)
    }
  }

  async function upload(field: "logoUrl" | "bannerUrl", file: File | undefined) {
    if (!file) return
    if (file.size > 3 * 1024 * 1024) return setErrors({ [`basics.${field}`]: tr("Η εικόνα είναι μεγαλύτερη από 3 MB.") })
    setUploading(field)
    setErrors({})
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("lang", lang)
      const response = await fetch("/api/vitrinaki/start/logo", { method: "POST", body: form })
      const body = (await response.json().catch(() => ({}))) as { url?: string; message?: string }
      if (response.status === 401) return expire()
      if (!response.ok || !body.url) return setErrors({ [`basics.${field}`]: body.message || tr("Δεν ανέβηκε η εικόνα. Δοκίμασε ξανά.") })
      setB({ [field]: body.url } as Partial<Basics>)
    } catch {
      setErrors({ [`basics.${field}`]: tr("Δεν ανέβηκε η εικόνα. Δοκίμασε ξανά.") })
    } finally {
      setUploading("")
    }
  }

  const nextStep = steps[index + 1] || null
  const prevStep = steps[index - 1] || null
  const meta = STEP_META[step]

  // ---------- step bodies ----------
  const imagePicker = (field: "logoUrl" | "bannerUrl", label: string, hint: string, wide: boolean) => (
    <Field id={id(field)} label={label} optional={opt} error={err(`basics.${field}`)} hint={hint}>
      <div className="flex items-center gap-4">
        <span className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-[#2E4A37]/15 bg-[#F7F2E8] ${wide ? "h-20 w-36" : "h-20 w-20"}`}>
          {basics[field] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={basics[field]} alt="" className={`h-full w-full ${wide ? "object-cover" : "object-contain"}`} />
          ) : (
            <Icon name="upload" size={22} className="text-[#2E4A37]/40" />
          )}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <label className={`${secondaryBtn} min-h-10 cursor-pointer px-4 py-2 text-[14px]`}>
            {uploading === field ? <><Spinner />{tr("Ανεβαίνει…")}</> : basics[field] ? tr("Άλλαξε εικόνα") : tr("Διάλεξε εικόνα")}
            <input id={id(field)} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" disabled={uploading !== ""} onChange={(e) => void upload(field, e.target.files?.[0])} />
          </label>
          {basics[field] ? (
            <button type="button" onClick={() => setB({ [field]: "" } as Partial<Basics>)} className="text-[13px] font-semibold text-[#2E4A37]/70 hover:text-[#C0503C]">{tr("Αφαίρεση")}</button>
          ) : null}
        </div>
      </div>
    </Field>
  )

  const body = (() => {
    switch (step) {
      case "type":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {BUSINESS_TYPES.map((option) => {
              const on = profile.businessType === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setP({ businessType: option.value })}
                  className={`rounded-2xl border p-4 text-left transition ${on ? "border-[#2E4A37] bg-[#E6ECE3] ring-2 ring-[#2E4A37]/20" : "border-[#2E4A37]/15 bg-white hover:border-[#2E4A37]/45"}`}
                >
                  <span className="flex items-center justify-between gap-2 text-[15.5px] font-bold text-[#1F3628]">
                    {tr(option.label)}
                    {on ? <span className="grid h-5 w-5 place-items-center rounded-full bg-[#2E4A37] text-white"><Icon name="check" size={12} /></span> : null}
                  </span>
                  <span className="mt-1 block text-[13.5px] leading-5 text-[#2E4A37]/70">{tr(option.hint)}</span>
                </button>
              )
            })}
            {profile.businessType === "other" ? (
              <div className="sm:col-span-2">
                <Field id={id("other")} label={tr("Τι κάνεις;")} optional={opt}>
                  <input id={id("other")} className={inputCls()} maxLength={80} value={profile.businessTypeOther} onChange={(e) => setP({ businessTypeOther: e.target.value })} placeholder={tr("π.χ. Σχολή χορού")} />
                </Field>
              </div>
            ) : null}
            {err("profile.businessType") ? <p className="text-[13px] font-medium text-[#B2432F] sm:col-span-2">{err("profile.businessType")}</p> : null}
          </div>
        )
      case "basics":
        return (
          <div className="space-y-5">
            <Field id={id("name")} label={tr("Όνομα καταστήματος")} error={err("basics.storeName")}>
              <input id={id("name")} className={inputCls(Boolean(err("basics.storeName")))} maxLength={100} value={basics.storeName} onChange={(e) => setB({ storeName: e.target.value })} />
            </Field>
            <div>
              <Field id={id("tagline")} label={tr("Κεντρικό μήνυμα")} hint={tr("Μία πρόταση που λέει τι κάνεις. Εμφανίζεται μεγάλη στην κορυφή.")}>
                <input id={id("tagline")} className={inputCls()} maxLength={160} value={basics.tagline} placeholder={suggestion ? tr(suggestion.tagline) : ""} onChange={(e) => setB({ tagline: e.target.value })} />
              </Field>
              {suggestion && basics.tagline !== tr(suggestion.tagline) ? (
                <button type="button" onClick={() => setB({ tagline: tr(suggestion.tagline) })} className="mt-1.5 text-left text-[13px] font-semibold text-[#265E8E] hover:underline">
                  {tr("Χρησιμοποίησε την πρόταση:")} «{tr(suggestion.tagline)}»
                </button>
              ) : null}
            </div>
            <div>
              <Field id={id("description")} label={tr("Σύντομη περιγραφή")} hint={tr("2-3 γραμμές κάτω από το κεντρικό μήνυμα.")}>
                <textarea id={id("description")} rows={3} className={inputCls()} maxLength={1800} value={basics.description} placeholder={suggestion ? tr(suggestion.description) : ""} onChange={(e) => setB({ description: e.target.value })} />
              </Field>
              {suggestion && !basics.description ? (
                <button type="button" onClick={() => setB({ description: tr(suggestion.description) })} className="mt-1.5 text-[13px] font-semibold text-[#265E8E] hover:underline">{tr("Βάλε την προτεινόμενη περιγραφή")}</button>
              ) : null}
            </div>
            <Field id={id("story")} label={tr("Η ιστορία και το όραμά σου")} optional={opt} hint={tr("Ποιος είσαι, πώς ξεκίνησες, τι σε κάνει διαφορετικό. Οι πελάτες το διαβάζουν!")}>
              <textarea id={id("story")} rows={6} className={inputCls()} maxLength={4000} value={profile.story} placeholder={suggestion ? tr(suggestion.story) : ""} onChange={(e) => setP({ story: e.target.value })} />
            </Field>
            <Field id={id("credentials")} label={type === "portfolio" || type === "services" ? tr("Σπουδές, πιστοποιήσεις, εμπειρία") : tr("Βραβεία, διακρίσεις, πιστοποιήσεις")} optional={opt}>
              <input id={id("credentials")} className={inputCls()} maxLength={600} value={profile.credentials} onChange={(e) => setP({ credentials: e.target.value })} placeholder={tr("π.χ. Πτυχίο ΤΕΙ Γραφιστικής, 12 χρόνια εμπειρία")} />
            </Field>
          </div>
        )
      case "look":
        return (
          <div className="space-y-6">
            {imagePicker("logoUrl", tr("Λογότυπο"), tr("Τετράγωνη εικόνα, PNG, JPG, WEBP ή SVG έως 3 MB. Αν δεν έχεις, βάζουμε τα αρχικά σου."), false)}
            {imagePicker("bannerUrl", tr("Εικόνα εξωφύλλου"), tr("Οριζόντια φωτογραφία της δουλειάς ή του χώρου σου, έως 3 MB."), true)}
            <fieldset>
              <legend className="mb-2 text-[13.5px] font-semibold text-[#1F3628]">{tr("Χρώμα βιτρίνας")}</legend>
              <div className="grid grid-cols-3 gap-3">
                {PALETTES.map((p) => {
                  const on = basics.palette === p.value
                  return (
                    <button key={p.value} type="button" aria-pressed={on} onClick={() => setB({ palette: p.value })} className={`rounded-xl border bg-white p-2.5 text-left transition ${on ? "border-[#2E4A37] ring-2 ring-[#2E4A37]/20" : "border-[#2E4A37]/15 hover:border-[#2E4A37]/40"}`}>
                      <span className="mb-2 flex h-10 overflow-hidden rounded-lg"><span className="flex-1" style={{ background: p.color }} /><span className="w-1/3" style={{ background: p.soft }} /></span>
                      <span className="text-[13px] font-semibold text-[#1F3628]">{tr(p.label)}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </div>
        )
      case "contact":
        return (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={id("cemail")} label={tr("Δημόσιο email")} optional={opt} error={err("basics.contactEmail")}>
                <input id={id("cemail")} className={inputCls(Boolean(err("basics.contactEmail")))} type="email" value={basics.contactEmail} onChange={(e) => setB({ contactEmail: e.target.value })} />
              </Field>
              <Field id={id("phone")} label={tr("Τηλέφωνο")} optional={opt} error={err("basics.contactPhone")}>
                <input id={id("phone")} className={inputCls(Boolean(err("basics.contactPhone")))} type="tel" inputMode="tel" value={basics.contactPhone} onChange={(e) => setB({ contactPhone: e.target.value })} placeholder="2101234567" />
              </Field>
              <Field id={id("whatsapp")} label="WhatsApp" optional={opt} error={err("profile.whatsapp")}>
                <input id={id("whatsapp")} className={inputCls(Boolean(err("profile.whatsapp")))} type="tel" inputMode="tel" value={profile.whatsapp} onChange={(e) => setP({ whatsapp: e.target.value })} placeholder="69XXXXXXXX" />
              </Field>
              <Field id={id("viber")} label="Viber" optional={opt} error={err("profile.viber")}>
                <input id={id("viber")} className={inputCls(Boolean(err("profile.viber")))} type="tel" inputMode="tel" value={profile.viber} onChange={(e) => setP({ viber: e.target.value })} placeholder="69XXXXXXXX" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {([["instagram", "Instagram", "@to_onoma_sou"], ["facebook", "Facebook", "facebook.com/…"], ["tiktok", "TikTok", "@to_onoma_sou"], ["website", "Website", "www.example.gr"]] as const).map(([key, label, ph]) => (
                <Field key={key} id={id(key)} label={label} optional={opt} error={err(`profile.socials.${key}`)}>
                  <input id={id(key)} className={inputCls(Boolean(err(`profile.socials.${key}`)))} autoCapitalize="none" spellCheck={false} value={profile.socials[key]} placeholder={ph} onChange={(e) => setP({ socials: { ...profile.socials, [key]: e.target.value } })} />
                </Field>
              ))}
            </div>
            <div>
              <p className="text-[13.5px] font-semibold text-[#1F3628]">{tr("Σε ποιες γλώσσες εξυπηρετείς;")}</p>
              <Chips options={LANGUAGES} value={profile.languages} onChange={(v) => setP({ languages: v })} label={(t) => t} />
            </div>
          </div>
        )
      case "location":
        return (
          <div className="space-y-5">
            {type === "services" || type === "beauty" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Toggle checked={profile.services.atClient} onChange={(v) => setP({ services: { ...profile.services, atClient: v } })} label={tr("Έρχομαι στον πελάτη")} hint={tr("Κατ' οίκον ή στον χώρο του.")} />
                  <Toggle checked={profile.services.online} onChange={(v) => setP({ services: { ...profile.services, online: v } })} label={tr("Εξυπηρετώ και online")} />
                </div>
                <Field id={id("area-served")} label={tr("Περιοχή εξυπηρέτησης")} optional={opt}>
                  <input id={id("area-served")} className={inputCls()} value={profile.services.serviceArea} onChange={(e) => setP({ services: { ...profile.services, serviceArea: e.target.value } })} placeholder={tr("π.χ. Βόρεια προάστια Αθήνας")} />
                </Field>
              </>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={id("street")} label={tr("Διεύθυνση")} optional={opt}>
                <input id={id("street")} className={inputCls()} autoComplete="street-address" value={profile.address.street} onChange={(e) => setP({ address: { ...profile.address, street: e.target.value } })} placeholder={tr("Οδός και αριθμός")} />
              </Field>
              <Field id={id("area")} label={tr("Περιοχή")} optional={opt}>
                <input id={id("area")} className={inputCls()} value={profile.address.area} onChange={(e) => setP({ address: { ...profile.address, area: e.target.value } })} placeholder={tr("π.χ. Κουκάκι")} />
              </Field>
              <Field id={id("city")} label={tr("Πόλη")} optional={opt}>
                <input id={id("city")} className={inputCls()} autoComplete="address-level2" value={profile.address.city} onChange={(e) => setP({ address: { ...profile.address, city: e.target.value } })} placeholder={tr("π.χ. Αθήνα")} />
              </Field>
              <Field id={id("postal")} label={tr("Τ.Κ.")} optional={opt} error={err("profile.address.postalCode")}>
                <input id={id("postal")} className={inputCls(Boolean(err("profile.address.postalCode")))} inputMode="numeric" autoComplete="postal-code" value={profile.address.postalCode} onChange={(e) => setP({ address: { ...profile.address, postalCode: e.target.value } })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle checked={profile.address.showMap} onChange={(v) => setP({ address: { ...profile.address, showMap: v } })} label={tr("Κουμπί «Δες στον χάρτη»")} hint={tr("Ανοίγει τη διεύθυνση στους χάρτες.")} />
              <Toggle checked={profile.address.hideStreet} onChange={(v) => setP({ address: { ...profile.address, hideStreet: v } })} label={tr("Δείξε μόνο περιοχή/πόλη")} hint={tr("Για όσους δουλεύουν από το σπίτι.")} />
            </div>
            <div className="space-y-3 rounded-2xl border border-[#2E4A37]/12 bg-[#F7F2E8]/60 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle checked={profile.hoursEnabled} onChange={(v) => setP({ hoursEnabled: v, hours: v && !Object.values(profile.hours).some((d) => d.open) ? DEFAULT_HOURS : profile.hours })} label={tr("Έχω σταθερό ωράριο")} />
                <Toggle checked={profile.byAppointment} onChange={(v) => setP({ byAppointment: v })} label={tr("Μόνο κατόπιν ραντεβού")} />
              </div>
              {profile.hoursEnabled ? (
                <div className="space-y-2">
                  {DAYS.map(([day, label]) => {
                    const d = profile.hours[day] || dayOff
                    const setD = (patch: Partial<Day>) => setP({ hours: { ...profile.hours, [day]: { ...d, ...patch } } })
                    return (
                      <div key={day} className="flex flex-wrap items-center gap-2 text-[14px] text-[#1F3628]">
                        <span className="w-24 font-semibold">{tr(label)}</span>
                        <label className="flex items-center gap-1.5 text-[13px]"><input type="checkbox" className="accent-[#2E4A37]" checked={d.closed} onChange={(e) => setD({ closed: e.target.checked })} />{tr("Κλειστά")}</label>
                        {!d.closed ? (
                          <>
                            <input type="time" value={d.open} onChange={(e) => setD({ open: e.target.value })} className={smallInput} aria-label={`${tr(label)}: ${tr("άνοιγμα")}`} />
                            <span>–</span>
                            <input type="time" value={d.close} onChange={(e) => setD({ close: e.target.value })} className={smallInput} aria-label={`${tr(label)}: ${tr("κλείσιμο")}`} />
                            <span className="text-[12px] text-[#2E4A37]/55">&amp;</span>
                            <input type="time" value={d.open2} onChange={(e) => setD({ open2: e.target.value })} className={smallInput} aria-label={`${tr(label)}: ${tr("απογευματινό άνοιγμα")}`} />
                            <span>–</span>
                            <input type="time" value={d.close2} onChange={(e) => setD({ close2: e.target.value })} className={smallInput} aria-label={`${tr(label)}: ${tr("απογευματινό κλείσιμο")}`} />
                          </>
                        ) : null}
                      </div>
                    )
                  })}
                  {Object.keys(errors).some((k) => k.startsWith("profile.hours")) ? <p className="text-[13px] font-medium text-[#B2432F]">{tr("Η ώρα γράφεται ΩΩ:ΛΛ.")}</p> : null}
                </div>
              ) : null}
              <Field id={id("hours-note")} label={tr("Σημείωση ωραρίου")} optional={opt}>
                <input id={id("hours-note")} className={inputCls()} maxLength={300} value={profile.hoursNote} onChange={(e) => setP({ hoursNote: e.target.value })} placeholder={tr("π.χ. Αύγουστο κλειστά")} />
              </Field>
            </div>
          </div>
        )
      case "retail":
        return (
          <div className="space-y-5">
            <Field id={id("categories")} label={tr("Κατηγορίες προϊόντων")} hint={tr("Χώρισε με κόμμα.")}>
              <input id={id("categories")} className={inputCls()} value={profile.retail.categories} onChange={(e) => setP({ retail: { ...profile.retail, categories: e.target.value } })} placeholder={tr("Ρούχα, αξεσουάρ, δώρα")} />
            </Field>
            <Field id={id("brands")} label={tr("Brands που διαθέτεις")} optional={opt}>
              <input id={id("brands")} className={inputCls()} value={profile.retail.brands} onChange={(e) => setP({ retail: { ...profile.retail, brands: e.target.value } })} />
            </Field>
          </div>
        )
      case "food":
        return (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={id("region")} label={tr("Περιοχή παραγωγής")} optional={opt}>
                <input id={id("region")} className={inputCls()} value={profile.food.region} onChange={(e) => setP({ food: { ...profile.food, region: e.target.value } })} placeholder={tr("π.χ. Μεσσηνία")} />
              </Field>
              <Field id={id("since")} label={tr("Παράγουμε από (έτος)")} optional={opt} error={err("profile.food.producerSince")}>
                <input id={id("since")} className={inputCls(Boolean(err("profile.food.producerSince")))} inputMode="numeric" maxLength={4} value={profile.food.producerSince} onChange={(e) => setP({ food: { ...profile.food, producerSince: e.target.value } })} placeholder="1987" />
              </Field>
            </div>
            <Field id={id("origin")} label={tr("Προέλευση & τρόπος παραγωγής")} optional={opt}>
              <textarea id={id("origin")} rows={3} className={inputCls()} value={profile.food.origin} onChange={(e) => setP({ food: { ...profile.food, origin: e.target.value } })} placeholder={tr("π.χ. Ελαιώνας 300 δέντρων κορωνέικης, συλλογή με το χέρι, ψυχρή έκθλιψη")} />
            </Field>
            <div>
              <p className="text-[13.5px] font-semibold text-[#1F3628]">{tr("Πιστοποιήσεις")}</p>
              <Chips options={CERTIFICATIONS} value={profile.food.certifications} onChange={(v) => setP({ food: { ...profile.food, certifications: v } })} label={tr} />
            </div>
            {profile.food.certifications.includes("other") ? (
              <Field id={id("cert-other")} label={tr("Άλλη πιστοποίηση")}>
                <input id={id("cert-other")} className={inputCls()} value={profile.food.certificationsOther} onChange={(e) => setP({ food: { ...profile.food, certificationsOther: e.target.value } })} />
              </Field>
            ) : null}
            <Field id={id("ingredients")} label={tr("Συστατικά / αλλεργιογόνα / συντήρηση")} optional={opt} hint={tr("Γενική σημείωση. Τα ακριβή συστατικά μπαίνουν σε κάθε προϊόν.")}>
              <textarea id={id("ingredients")} rows={3} className={inputCls()} value={profile.food.ingredientsNote} onChange={(e) => setP({ food: { ...profile.food, ingredientsNote: e.target.value } })} />
            </Field>
          </div>
        )
      case "crafts":
        return (
          <div className="space-y-5">
            <Field id={id("materials")} label={tr("Υλικά που χρησιμοποιείς")}>
              <input id={id("materials")} className={inputCls()} value={profile.crafts.materials} onChange={(e) => setP({ crafts: { ...profile.crafts, materials: e.target.value } })} placeholder={tr("π.χ. Ασήμι 925, φυσικές πέτρες")} />
            </Field>
            <Field id={id("techniques")} label={tr("Τεχνικές")} optional={opt}>
              <input id={id("techniques")} className={inputCls()} value={profile.crafts.techniques} onChange={(e) => setP({ crafts: { ...profile.crafts, techniques: e.target.value } })} placeholder={tr("π.χ. Τροχός, χύτευση, ζωγραφική με το χέρι")} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle checked={profile.crafts.madeToOrder} onChange={(v) => setP({ crafts: { ...profile.crafts, madeToOrder: v } })} label={tr("Φτιάχνω κατά παραγγελία")} />
              <Toggle checked={profile.crafts.customOrders} onChange={(v) => setP({ crafts: { ...profile.crafts, customOrders: v } })} label={tr("Δέχομαι εξατομικευμένες παραγγελίες")} hint={tr("Χάραξη, χρώμα, διαστάσεις…")} />
            </div>
            {profile.crafts.madeToOrder ? (
              <Field id={id("lead")} label={tr("Χρόνος κατασκευής")}>
                <input id={id("lead")} className={inputCls()} value={profile.crafts.leadTime} onChange={(e) => setP({ crafts: { ...profile.crafts, leadTime: e.target.value } })} placeholder={tr("π.χ. 5-7 εργάσιμες")} />
              </Field>
            ) : null}
          </div>
        )
      case "services": {
        const items = profile.services.items
        const setItems = (next: Service[]) => setP({ services: { ...profile.services, items: next } })
        return (
          <div className="space-y-4">
            {type === "beauty" ? (
              <Field id={id("specialties")} label={tr("Ειδικότητες")} optional={opt}>
                <input id={id("specialties")} className={inputCls()} value={profile.beauty.specialties} onChange={(e) => setP({ beauty: { ...profile.beauty, specialties: e.target.value } })} placeholder={tr("π.χ. Βαφές, balayage, νυφικά χτενίσματα")} />
              </Field>
            ) : null}
            {items.map((item, i) => {
              const setItem = (patch: Partial<Service>) => setItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)))
              return (
                <div key={i} className="space-y-3 rounded-2xl border border-[#2E4A37]/12 bg-[#F7F2E8]/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-bold text-[#1F3628]">{tr("Υπηρεσία")} {i + 1}</p>
                    <button type="button" className="text-[13px] font-semibold text-[#2E4A37]/70 hover:text-[#C0503C]" onClick={() => setItems(items.filter((_, j) => j !== i))}>{tr("Αφαίρεση")}</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                    <Field id={id(`svc-${i}-name`)} label={tr("Όνομα")}><input id={id(`svc-${i}-name`)} className={inputCls()} value={item.name} onChange={(e) => setItem({ name: e.target.value })} /></Field>
                    <Field id={id(`svc-${i}-dur`)} label={tr("Διάρκεια")} optional={opt}><input id={id(`svc-${i}-dur`)} className={inputCls()} value={item.duration} onChange={(e) => setItem({ duration: e.target.value })} placeholder="45′" /></Field>
                    <Field id={id(`svc-${i}-price`)} label={tr("Τιμή")} optional={opt}><input id={id(`svc-${i}-price`)} className={inputCls()} value={item.price} onChange={(e) => setItem({ price: e.target.value })} placeholder={tr("από 25€")} /></Field>
                  </div>
                  <Field id={id(`svc-${i}-desc`)} label={tr("Περιγραφή")} optional={opt}><input id={id(`svc-${i}-desc`)} className={inputCls()} value={item.description} onChange={(e) => setItem({ description: e.target.value })} /></Field>
                </div>
              )
            })}
            <button type="button" disabled={items.length >= 20} onClick={() => setItems([...items, { name: "", duration: "", price: "", description: "" }])} className={`${secondaryBtn} border-dashed`}>
              <Icon name="plus" size={17} />
              {tr("Πρόσθεσε υπηρεσία")}
            </button>
            <p className="rounded-xl bg-[#EAF1F7] p-3 text-[13px] text-[#1B3F5E]">
              <span className="mr-2 rounded-full bg-white px-2 py-0.5 text-[11.5px] font-bold text-[#265E8E]">{tr("Νέο")}</span>
              {tr("Online κρατήσεις ραντεβού: τις ανοίγεις από το Studio, στη σελίδα «Κρατήσεις». Οι υπηρεσίες σου μεταφέρονται εκεί αυτόματα.")}
            </p>
          </div>
        )
      }
      case "portfolio": {
        const projects = profile.portfolio.projects
        const setProjects = (next: Project[]) => setP({ portfolio: { ...profile.portfolio, projects: next } })
        return (
          <div className="space-y-4">
            <Field id={id("skills")} label={tr("Δεξιότητες")} hint={tr("Χώρισε με κόμμα.")}>
              <input id={id("skills")} className={inputCls()} value={profile.portfolio.skills.join(", ")} onChange={(e) => setP({ portfolio: { ...profile.portfolio, skills: e.target.value.split(",").map((s) => s.trimStart()) } })} placeholder={tr("Branding, Φωτογραφία προϊόντων, Web design")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={id("clients")} label={tr("Πελάτες / συνεργασίες")} optional={opt}>
                <input id={id("clients")} className={inputCls()} value={profile.portfolio.clients} onChange={(e) => setP({ portfolio: { ...profile.portfolio, clients: e.target.value } })} />
              </Field>
              <Field id={id("availability")} label={tr("Διαθεσιμότητα")} optional={opt}>
                <input id={id("availability")} className={inputCls()} value={profile.portfolio.availability} onChange={(e) => setP({ portfolio: { ...profile.portfolio, availability: e.target.value } })} placeholder={tr("Διαθέσιμη για νέα έργα από Νοέμβριο")} />
              </Field>
            </div>
            {projects.map((project, i) => {
              const setPr = (patch: Partial<Project>) => setProjects(projects.map((p, j) => (j === i ? { ...p, ...patch } : p)))
              return (
                <div key={i} className="space-y-3 rounded-2xl border border-[#2E4A37]/12 bg-[#F7F2E8]/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-bold text-[#1F3628]">{tr("Έργο")} {i + 1}</p>
                    <button type="button" className="text-[13px] font-semibold text-[#2E4A37]/70 hover:text-[#C0503C]" onClick={() => setProjects(projects.filter((_, j) => j !== i))}>{tr("Αφαίρεση")}</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[3fr_1fr]">
                    <Field id={id(`pr-${i}-t`)} label={tr("Τίτλος")}><input id={id(`pr-${i}-t`)} className={inputCls()} value={project.title} onChange={(e) => setPr({ title: e.target.value })} /></Field>
                    <Field id={id(`pr-${i}-y`)} label={tr("Έτος")} optional={opt}><input id={id(`pr-${i}-y`)} className={inputCls()} maxLength={4} value={project.year} onChange={(e) => setPr({ year: e.target.value })} /></Field>
                  </div>
                  <Field id={id(`pr-${i}-d`)} label={tr("Περιγραφή")} optional={opt}><input id={id(`pr-${i}-d`)} className={inputCls()} value={project.description} onChange={(e) => setPr({ description: e.target.value })} /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field id={id(`pr-${i}-img`)} label={tr("Εικόνα (URL)")} optional={opt} error={err(`profile.portfolio.projects.${i}.imageUrl`)}><input id={id(`pr-${i}-img`)} className={inputCls()} value={project.imageUrl} onChange={(e) => setPr({ imageUrl: e.target.value })} /></Field>
                    <Field id={id(`pr-${i}-l`)} label={tr("Σύνδεσμος")} optional={opt} error={err(`profile.portfolio.projects.${i}.link`)}><input id={id(`pr-${i}-l`)} className={inputCls()} value={project.link} onChange={(e) => setPr({ link: e.target.value })} /></Field>
                  </div>
                </div>
              )
            })}
            <button type="button" disabled={projects.length >= 12} onClick={() => setProjects([...projects, { title: "", description: "", imageUrl: "", link: "", year: "" }])} className={`${secondaryBtn} border-dashed`}>
              <Icon name="plus" size={17} />
              {tr("Πρόσθεσε έργο")}
            </button>
          </div>
        )
      }
      case "delivery": {
        const d = profile.delivery
        const setD = (patch: Partial<Profile["delivery"]>) => setP({ delivery: { ...d, ...patch } })
        return (
          <div className="space-y-4">
            <Toggle checked={d.shipping} onChange={(v) => setD({ shipping: v })} label={tr("Αποστολή με courier")} />
            {d.shipping ? <Field id={id("ship-areas")} label={tr("Πού στέλνεις;")} optional={opt}><input id={id("ship-areas")} className={inputCls()} value={d.shippingAreas} onChange={(e) => setD({ shippingAreas: e.target.value })} placeholder={tr("Σε όλη την Ελλάδα και Κύπρο")} /></Field> : null}
            <Toggle checked={d.pickup} onChange={(v) => setD({ pickup: v })} label={tr("Παραλαβή από το κατάστημα / εργαστήριο")} />
            {d.pickup ? <Field id={id("pickup")} label={tr("Οδηγίες παραλαβής")} optional={opt}><input id={id("pickup")} className={inputCls()} value={d.pickupNote} onChange={(e) => setD({ pickupNote: e.target.value })} /></Field> : null}
            <Toggle checked={d.localDelivery} onChange={(v) => setD({ localDelivery: v })} label={tr("Τοπική διανομή")} hint={tr("Παραδίδεις εσύ στην περιοχή σου.")} />
            {d.localDelivery ? <Field id={id("local")} label={tr("Περιοχές διανομής")} optional={opt}><input id={id("local")} className={inputCls()} value={d.localDeliveryAreas} onChange={(e) => setD({ localDeliveryAreas: e.target.value })} /></Field> : null}
            <Field id={id("ship-note")} label={tr("Σημείωση αποστολών")} optional={opt}>
              <input id={id("ship-note")} className={inputCls()} value={d.note} onChange={(e) => setD({ note: e.target.value })} placeholder={tr("π.χ. Δωρεάν αποστολή άνω των 50€")} />
            </Field>
            <Field id={id("returns")} label={tr("Πολιτική επιστροφών")} optional={opt} hint={tr("Σύντομα και καθαρά. Για αγορές από απόσταση ο καταναλωτής έχει κατά κανόνα δικαίωμα υπαναχώρησης 14 ημερών.")}>
              <textarea id={id("returns")} rows={4} className={inputCls()} value={profile.returnPolicy} onChange={(e) => setP({ returnPolicy: e.target.value })} placeholder={tr("Δεκτές επιστροφές εντός 14 ημερών από την παραλαβή, σε άριστη κατάσταση…")} />
            </Field>
          </div>
        )
      }
      case "legal":
        return (
          <div className="space-y-5">
            <PrivateBadge />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={id("legal-name")} label={tr("Επωνυμία")} optional={opt}><input id={id("legal-name")} className={inputCls()} value={priv.legal.legalName} onChange={(e) => setLegal({ legalName: e.target.value })} /></Field>
              <Field id={id("legal-form")} label={tr("Νομική μορφή")} optional={opt}>
                <select id={id("legal-form")} className={inputCls()} value={priv.legal.legalForm} onChange={(e) => setLegal({ legalForm: e.target.value })}>
                  <option value="">{tr("Επίλεξε…")}</option>
                  {LEGAL_FORMS.map(([v, l]) => <option key={v} value={v}>{tr(l)}</option>)}
                </select>
              </Field>
              <Field id={id("afm")} label={tr("ΑΦΜ")} optional={opt} error={err("private.legal.afm")} hint={tr("9 ψηφία. Ελέγχουμε ότι είναι έγκυρος.")}>
                <input id={id("afm")} className={inputCls(Boolean(err("private.legal.afm")))} inputMode="numeric" maxLength={9} value={priv.legal.afm} onChange={(e) => setLegal({ afm: e.target.value.replace(/\D/g, "") })} />
              </Field>
              <Field id={id("doy")} label={tr("ΔΟΥ")} optional={opt}><input id={id("doy")} className={inputCls()} value={priv.legal.doy} onChange={(e) => setLegal({ doy: e.target.value })} placeholder={tr("π.χ. Α' Αθηνών")} /></Field>
              <Field id={id("gemi")} label={tr("Αριθμός ΓΕΜΗ")} optional={opt} error={err("private.legal.gemi")}><input id={id("gemi")} className={inputCls(Boolean(err("private.legal.gemi")))} inputMode="numeric" value={priv.legal.gemi} onChange={(e) => setLegal({ gemi: e.target.value })} /></Field>
              <Field id={id("invoice")} label={tr("Email τιμολόγησης")} optional={opt} error={err("private.legal.invoiceEmail")}><input id={id("invoice")} className={inputCls(Boolean(err("private.legal.invoiceEmail")))} type="email" value={priv.legal.invoiceEmail} onChange={(e) => setLegal({ invoiceEmail: e.target.value })} /></Field>
            </div>
            <p className="text-[13.5px] font-semibold text-[#1F3628]">{tr("Έδρα")}</p>
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
              <Field id={id("reg-street")} label={tr("Διεύθυνση")} optional={opt}><input id={id("reg-street")} className={inputCls()} value={priv.legal.registeredAddress.street} onChange={(e) => setLegal({ registeredAddress: { ...priv.legal.registeredAddress, street: e.target.value } })} /></Field>
              <Field id={id("reg-city")} label={tr("Πόλη")} optional={opt}><input id={id("reg-city")} className={inputCls()} value={priv.legal.registeredAddress.city} onChange={(e) => setLegal({ registeredAddress: { ...priv.legal.registeredAddress, city: e.target.value } })} /></Field>
              <Field id={id("reg-postal")} label={tr("Τ.Κ.")} optional={opt} error={err("private.legal.registeredAddress.postalCode")}><input id={id("reg-postal")} className={inputCls(Boolean(err("private.legal.registeredAddress.postalCode")))} inputMode="numeric" value={priv.legal.registeredAddress.postalCode} onChange={(e) => setLegal({ registeredAddress: { ...priv.legal.registeredAddress, postalCode: e.target.value } })} /></Field>
            </div>
          </div>
        )
      case "owner":
        return (
          <div className="space-y-5">
            <PrivateBadge />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={id("owner-name")} label={tr("Ονοματεπώνυμο")} optional={opt}><input id={id("owner-name")} className={inputCls()} autoComplete="name" value={priv.owner.fullName} onChange={(e) => setOwner({ fullName: e.target.value })} /></Field>
              <Field id={id("owner-mobile")} label={tr("Κινητό")} optional={opt} error={err("private.owner.mobile")}><input id={id("owner-mobile")} className={inputCls(Boolean(err("private.owner.mobile")))} type="tel" inputMode="tel" autoComplete="tel" value={priv.owner.mobile} onChange={(e) => setOwner({ mobile: e.target.value })} placeholder="69XXXXXXXX" /></Field>
              <Field id={id("owner-email")} label={tr("Email")} optional={opt} error={err("private.owner.email")}><input id={id("owner-email")} className={inputCls(Boolean(err("private.owner.email")))} type="email" autoComplete="email" value={priv.owner.email} onChange={(e) => setOwner({ email: e.target.value })} /></Field>
              <Field id={id("owner-lang")} label={tr("Γλώσσα επικοινωνίας")}>
                <select id={id("owner-lang")} className={inputCls()} value={priv.owner.contactLanguage} onChange={(e) => setOwner({ contactLanguage: e.target.value === "en" ? "en" : "el" })}>
                  <option value="el">Ελληνικά</option>
                  <option value="en">English</option>
                </select>
              </Field>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-[#2E4A37]/15 bg-white p-4 text-[14px] text-[#1F3628]">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#2E4A37]" checked={priv.owner.gdprConsent} onChange={(e) => setOwner({ gdprConsent: e.target.checked })} />
              <span>
                {tr("Συμφωνώ να επεξεργάζεται το Vitrinaki τα παραπάνω προσωπικά στοιχεία για τη λειτουργία του λογαριασμού, την τιμολόγηση και την επικοινωνία μαζί μου, σύμφωνα με τον GDPR. Μπορώ να ανακαλέσω τη συγκατάθεση οποτεδήποτε.")}
                {priv.owner.gdprConsentAt ? <span className="mt-1 block text-[12.5px] text-[#2E4A37]/60">{tr("Δόθηκε στις")} {new Date(priv.owner.gdprConsentAt).toLocaleString(lang === "en" ? "en-GB" : "el-GR")}</span> : null}
              </span>
            </label>
          </div>
        )
      case "preview":
        return <PreviewStep data={data} profile={profile} goTo={goTo} />
      case "publish":
        return <PublishStep locale={locale} onExpired={expire} />
    }
  })()

  const palette = (PALETTES.some((p) => p.value === basics.palette) ? basics.palette : "forest") as Palette

  return (
    <div>
      {/* header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-[0.16em] text-[#C0503C]">{caps(tr("Το κατάστημά σου"))}</p>
          <h1 className="mt-1.5 text-[2rem] font-extrabold leading-[1.1] tracking-[-0.025em] text-[#1F3628] sm:text-[2.4rem]">{basics.storeName || tr("Προφίλ καταστήματος")}</h1>
          <p className="mt-1.5 max-w-2xl text-[15px] leading-6 text-[#2E4A37]/75">
            {tr("Απάντησε σε λίγες ερωτήσεις και η σελίδα σου στήνεται αυτόματα. Γύρνα και άλλαξε οτιδήποτε, όποτε θέλεις.")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Completion value={data.completion} label={tr("ολοκληρωμένο προφίλ")} />
          <button type="button" onClick={() => void logout()} className="text-[13.5px] font-semibold text-[#2E4A37]/70 underline-offset-2 hover:text-[#2E4A37] hover:underline">{tr("Αποσύνδεση")}</button>
        </div>
      </header>

      {/* step chips */}
      <nav aria-label={tr("Βήματα")} className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <ol className="flex w-max gap-1.5 sm:w-auto sm:flex-wrap">
          {steps.map((s, i) => {
            const done = profile.completedSteps.includes(s)
            const current = s === step
            return (
              <li key={s}>
                <button
                  type="button"
                  aria-current={current ? "step" : undefined}
                  onClick={() => goTo(s)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition ${current ? "bg-[#2E4A37] text-[#F7F2E8]" : done ? "bg-[#E6ECE3] text-[#2E4A37] hover:bg-[#d9e3d5]" : "bg-white text-[#2E4A37]/65 ring-1 ring-[#2E4A37]/12 hover:text-[#2E4A37]"}`}
                >
                  {done && !current ? <Icon name="check" size={12} /> : <span className="opacity-60">{i + 1}.</span>}
                  {tr(STEP_META[s].title)}
                  {STEP_META[s].private ? <Icon name="lock" size={12} /> : null}
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
        <section aria-labelledby={`${uid}-q`} className="min-w-0 rounded-[1.6rem] border border-[#2E4A37]/10 bg-white p-5 shadow-[0_40px_90px_-60px_rgba(31,54,40,0.6)] sm:p-8">
          <p className="text-[12px] font-semibold tracking-[0.16em] text-[#C0503C]">
            {caps(`${tr("Βήμα")} ${index + 1}/${steps.length}`)}
            {meta.private ? ` · ${caps(tr("Ιδιωτικά στοιχεία"))}` : ""}
          </p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#2E4A37]/10">
            <div className="h-full rounded-full bg-[#C0503C] transition-all duration-300" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
          </div>
          <h2 id={`${uid}-q`} ref={headingRef} tabIndex={-1} className="mt-5 text-[1.5rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] outline-none sm:text-[1.7rem]">
            {tr(meta.question)}
          </h2>
          {meta.hint ? <p className="mt-1.5 text-[14.5px] leading-6 text-[#2E4A37]/70">{tr(meta.hint)}</p> : null}

          <div aria-live="polite" className="empty:hidden">
            {failure ? <div className="mt-5"><Notice tone="error">{failure}</Notice></div> : null}
            {message ? <div className="mt-5"><Notice tone="ok">{message}</Notice></div> : null}
          </div>

          <div className="mt-6">{body}</div>

          {step !== "publish" ? (
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#2E4A37]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" disabled={!prevStep || saving} onClick={() => prevStep && goTo(prevStep)} className={`${ghostBtn} sm:-ml-4`}>
                <Icon name="back" size={17} />
                {tr("Πίσω")}
              </button>
              <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
                {step !== "type" && step !== "preview" && nextStep ? (
                  <button type="button" disabled={saving} onClick={() => goTo(nextStep)} className={ghostBtn}>{tr("Αργότερα")}</button>
                ) : null}
                <button type="button" disabled={saving} onClick={() => void save(nextStep)} className={primaryBtn}>
                  {saving ? <><Spinner />{tr("Αποθήκευση…")}</> : step === "preview" ? <>{tr("Συνέχεια στη δημοσίευση")} <Icon name="arrow" /></> : <>{tr("Αποθήκευση & συνέχεια")} <Icon name="arrow" /></>}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-8 border-t border-[#2E4A37]/10 pt-5">
              <button type="button" onClick={() => prevStep && goTo(prevStep)} className={`${ghostBtn} -ml-4`}>
                <Icon name="back" size={17} />
                {tr("Πίσω στο προφίλ")}
              </button>
            </div>
          )}
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-[#2E4A37]/60">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C0503C]" />
              {caps(tr("Ζωντανή προεπισκόπηση"))}
            </p>
            <ShopPreview
              lang={lang}
              name={basics.storeName}
              handle={session?.handle || ""}
              palette={palette}
              businessType={profile.businessType}
              tagline={basics.tagline}
              logoUrl={basics.logoUrl}
              city={profile.address.city || profile.address.area}
              phone={basics.contactPhone || profile.whatsapp}
              instagram={profile.socials.instagram}
            />
          </div>
          <section className="rounded-2xl border border-[#2E4A37]/10 bg-white p-5">
            <h3 className="text-[14px] font-bold text-[#1F3628]">{tr("Τι λείπει ακόμα")}</h3>
            <ul className="mt-3 space-y-1.5">
              {data.checklist.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => steps.includes(item.step) && goTo(item.step)} className="flex w-full items-center gap-2.5 rounded-lg px-1 py-0.5 text-left text-[14px] hover:bg-[#F7F2E8]">
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${item.done ? "bg-[#2E4A37] text-white" : "border border-dashed border-[#2E4A37]/35 text-transparent"}`}><Icon name="check" size={12} /></span>
                    <span className={item.done ? "text-[#2E4A37]/55 line-through" : "font-medium text-[#1F3628]"}>{tr(item.label)}</span>
                    {item.private ? <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#2E4A37]/50"><Icon name="lock" size={11} />{tr("ιδιωτικό")}</span> : null}
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
  const { tr } = useTranslator()
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[#265E8E]/20 bg-[#EAF1F7] p-3.5 text-[13.5px] text-[#1B3F5E]">
      <Icon name="lock" size={17} className="mt-[1px] shrink-0" />
      <p>
        {tr("Αυτά τα στοιχεία αποθηκεύονται χωριστά και")} <strong>{tr("δεν εμφανίζονται ποτέ")}</strong> {tr("στη δημόσια σελίδα σου.")}
      </p>
    </div>
  )
}

function Completion({ value, label }: { value: number; label: string }) {
  const r = 20
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5 ring-1 ring-[#2E4A37]/10">
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="5" stroke="#2E4A37" strokeOpacity="0.1" />
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="5" stroke="#C0503C" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 24 24)" />
      </svg>
      <div>
        <p className="text-[1.35rem] font-extrabold leading-none text-[#1F3628]">{value}%</p>
        <p className="mt-1 text-[12px] text-[#2E4A37]/65">{label}</p>
      </div>
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
  return SECTION_ORDER[type].filter((section) => has[section])
}

function PreviewStep({ data, profile, goTo }: { data: Payload; profile: Profile; goTo: (s: StepId) => void }) {
  const { tr } = useTranslator()
  const missing = data.checklist.filter((item) => !item.done)
  const sections = visibleSections(profile)
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-[#F7F2E8] p-5">
        <p className="text-[14.5px] font-bold text-[#1F3628]">{tr("Η σελίδα σου θα έχει αυτές τις ενότητες, με αυτή τη σειρά:")}</p>
        <ol className="mt-3 flex flex-wrap gap-2">
          {sections.map((section, i) => (
            <li key={section} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-[#1F3628] ring-1 ring-[#2E4A37]/10">
              <span className="text-[#C0503C]">{i + 1}</span>
              {tr(SECTION_LABELS[section])}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[12.5px] text-[#2E4A37]/65">{tr("Ενότητες χωρίς στοιχεία δεν εμφανίζονται. Συμπλήρωσε περισσότερα για πιο πλούσια σελίδα.")}</p>
      </div>
      {missing.length ? (
        <div>
          <p className="text-[14px] font-semibold text-[#1F3628]">{tr("Για 100%, συμπλήρωσε ακόμα:")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {missing.map((item) => (
              <button key={item.id} type="button" onClick={() => goTo(item.step)} className="rounded-full border border-[#2E4A37]/20 bg-white px-3 py-1.5 text-[13px] font-semibold text-[#2E4A37] hover:border-[#2E4A37]">
                {tr(item.label)} →
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Notice tone="ok">{tr("Το προφίλ σου είναι πλήρες!")}</Notice>
      )}
    </div>
  )
}
