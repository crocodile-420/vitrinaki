"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react"

type ReactNode = React.ReactNode

import { useTranslator } from "@/lib/i18n/client"
import {
  BUSINESS_TYPES,
  HANDLE_MAX,
  OPTIONAL_STEPS,
  PALETTES,
  PASSWORD_MIN,
  TAGLINE_IDEAS,
  caps,
  cleanHandleInput,
  isEmail,
  isGreekPhone,
  isMessengerPhone,
  isPostalCode,
  isValidHandle,
  passwordStrength,
  slugify,
  type BusinessType,
  type OptionalStep,
  type Palette,
  type StartResponse,
} from "@/lib/vitrinaki-start"

import { ShopPreview } from "./ShopPreview"

type Phase = "account" | OptionalStep | "done"
type Created = { name: string; handle: string; email: string; saved?: string[] }
type HandleState = { status: "idle" | "checking" | "ok" | "taken" | "invalid" | "unknown"; suggestion?: string }

const API = "/api/vitrinaki/start"

// ---------- tiny UI primitives ----------

const inputBase =
  "block w-full rounded-xl border bg-white px-3.5 py-3 text-[15px] text-[#1F3628] placeholder:text-[#2E4A37]/40 outline-none transition focus:border-[#2E4A37] focus:ring-4 focus:ring-[#2E4A37]/10 disabled:opacity-60"
const inputCls = (invalid?: boolean) => `${inputBase} ${invalid ? "border-[#C0503C] focus:border-[#C0503C] focus:ring-[#C0503C]/15" : "border-[#2E4A37]/20"}`

function Icon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const paths: Record<string, ReactNode> = {
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    x: <path d="M6 6l12 12M18 6 6 18" />,
    eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="M3 3l18 18M10.6 5.6A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 4M6.4 6.5C3.9 8.2 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.1-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></>,
    store: <><path d="M4 9.5 5.5 4h13L20 9.5" /><path d="M4 9.5h16v1a3 3 0 0 1-5.3 1.9 3 3 0 0 1-5.4 0A3 3 0 0 1 4 10.5v-1Z" /><path d="M5.5 13v7h13v-7M10 20v-4h4v4" /></>,
    hand: <><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v7.5c0 4-2.5 7-6.5 7-2.6 0-4.3-1.3-5.6-3.4L3.6 14.5a1.5 1.5 0 0 1 2.5-1.7L8 15" /></>,
    leaf: <><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19 13 11" /></>,
    drop: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />,
    tool: <path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 1-2-2Zm0 0L17 4" />,
    brief: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5h6v2M3 12h18" /></>,
    dots: <><circle cx="6" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18" cy="12" r="1.3" /></>,
    upload: <><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {paths[name]}
    </svg>
  )
}

function Spinner({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} />
}

function Field({
  id,
  label,
  optional,
  error,
  hint,
  children,
  aside,
}: {
  id: string
  label: string
  optional?: string
  error?: string
  hint?: ReactNode
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13.5px] font-semibold text-[#1F3628]">
          {label}
          {optional ? <span className="ml-1.5 font-normal text-[#2E4A37]/55">{optional}</span> : null}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-[#B2432F]">
          <Icon name="alert" size={15} className="mt-[1px] shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[12.5px] leading-5 text-[#2E4A37]/65">{hint}</p>
      ) : null}
    </div>
  )
}

const describedBy = (id: string, error?: string, hint?: unknown) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined)

const primaryBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C0503C] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(192,80,60,0.85)] transition hover:bg-[#ad4633] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C0503C]/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
const ghostBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold text-[#2E4A37] transition hover:bg-[#2E4A37]/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2E4A37]/15 disabled:opacity-50"
const secondaryBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#2E4A37]/25 bg-white px-5 py-3 text-[15px] font-semibold text-[#1F3628] transition hover:border-[#2E4A37] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2E4A37]/15"

// ---------- the flow ----------

const TOTAL_STEPS = OPTIONAL_STEPS.length + 1

// One bar for the whole flow: step 1 (the account) is required, the rest optional.
function StepBar({ current, done = () => true }: { current: number; done?: (index: number) => boolean }) {
  const { tr } = useTranslator()
  return (
    <div className="mt-2.5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${TOTAL_STEPS}, minmax(0, 1fr))` }} role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={current + 1} aria-label={tr("Πρόοδος")}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <span key={i} className={`h-1.5 rounded-full transition-colors duration-300 ${i < current ? (done(i) ? "bg-[#2E4A37]" : "bg-[#2E4A37]/35") : i === current ? "bg-[#C0503C]" : "bg-[#2E4A37]/10"}`} />
      ))}
    </div>
  )
}

export function StartFlow({
  shopHref,
  resetPasswordUrl,
  termsUrl,
  privacyUrl,
  resume,
  intro,
  benefits,
  referralCode = "",
}: {
  shopHref: string
  resetPasswordUrl: string
  termsUrl?: string
  privacyUrl?: string
  resume?: Created | null
  intro: ReactNode
  benefits: ReactNode
  /** From a colleague's share link (?ref=CODE). */
  referralCode?: string
}) {
  const { lang, tr } = useTranslator()
  const uid = "vk-start"
  const ids = {
    name: `${uid}-name`, handle: `${uid}-handle`, email: `${uid}-email`, password: `${uid}-password`, terms: `${uid}-terms`,
    tagline: `${uid}-tagline`, story: `${uid}-story`, area: `${uid}-area`, city: `${uid}-city`, postal: `${uid}-postal`,
    phone: `${uid}-phone`, whatsapp: `${uid}-whatsapp`, cemail: `${uid}-cemail`, instagram: `${uid}-ig`, facebook: `${uid}-fb`, other: `${uid}-other`,
  }

  const [phase, setPhase] = useState<Phase>(resume ? "done" : "account")
  const [created, setCreated] = useState<Created | null>(resume || null)

  // Step 1: account
  const [storeName, setStoreName] = useState(resume?.name || "")
  const [handle, setHandle] = useState(resume?.handle || "")
  const [handleEdited, setHandleEdited] = useState(false)
  const [editingHandle, setEditingHandle] = useState(false)
  const [email, setEmail] = useState(resume?.email || "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [terms, setTerms] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [serverFields, setServerFields] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<{ code: string; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [handleState, setHandleState] = useState<HandleState>({ status: "idle" })
  const [nameTaken, setNameTaken] = useState(false)

  // Optional steps
  const [businessType, setBusinessType] = useState<BusinessType | "">("")
  const [businessTypeOther, setBusinessTypeOther] = useState("")
  const [palette, setPalette] = useState<Palette>("forest")
  const [logoUrl, setLogoUrl] = useState("")
  const [logoBusy, setLogoBusy] = useState(false)
  const [tagline, setTagline] = useState("")
  const [story, setStory] = useState("")
  const [area, setArea] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [viber, setViber] = useState(true)
  const [contactEmail, setContactEmail] = useState(resume?.email || "")
  const [instagram, setInstagram] = useState("")
  const [facebook, setFacebook] = useState("")
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({})
  const [stepMessage, setStepMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<Set<OptionalStep>>(new Set((resume?.saved || []).filter((s): s is OptionalStep => (OPTIONAL_STEPS as readonly string[]).includes(s))))
  const [copied, setCopied] = useState(false)

  // Optional referral code: filled in from a colleague's link, or typed.
  const [referral, setReferral] = useState(referralCode)
  const [showReferral, setShowReferral] = useState(Boolean(referralCode))
  const [referralState, setReferralState] = useState<{ status: "idle" | "checking" | "ok" | "unknown"; shopName?: string }>({ status: "idle" })
  useEffect(() => {
    const code = referral.trim()
    if (!code || created) return setReferralState({ status: "idle" })
    setReferralState({ status: "checking" })
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${API}/referral?${new URLSearchParams({ code })}`, { signal: controller.signal })
        const body = await response.json()
        if (body.unknown) return setReferralState({ status: "idle" })
        setReferralState(body.valid ? { status: "ok", shopName: body.shopName } : { status: "unknown" })
      } catch (error) {
        if ((error as Error).name !== "AbortError") setReferralState({ status: "idle" })
      }
    }, 450)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [referral, created])

  const headingRef = useRef<HTMLHeadingElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)

  // Move focus to the new step's heading (and bring the card into view on phones).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus({ preventScroll: true })
    const top = cardRef.current?.getBoundingClientRect().top ?? 0
    if (top < 60 || top > window.innerHeight * 0.6) cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [phase])

  // Autofocus the first field where the form is in view (desktop); on phones
  // the page intro comes first, so jumping down to the keyboard would be rude.
  useEffect(() => {
    if (phase === "account" && window.matchMedia("(min-width: 1024px)").matches) document.getElementById(ids.name)?.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- live address from the name ----
  useEffect(() => {
    if (!handleEdited && !created) setHandle(slugify(storeName))
  }, [storeName, handleEdited, created])

  // ---- availability (debounced) ----
  useEffect(() => {
    if (created) return
    setNameTaken(false)
    if (!handle) return setHandleState({ status: "idle" })
    if (!isValidHandle(handle)) return setHandleState({ status: "invalid" })
    setHandleState({ status: "checking" })
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ handle })
        if (storeName.trim().length >= 2) params.set("name", storeName.trim())
        const response = await fetch(`${API}/availability?${params}`, { signal: controller.signal })
        const body = await response.json()
        if (body.unknown || !body.handle) return setHandleState({ status: "unknown" })
        setNameTaken(Boolean(body.name && !body.name.available))
        setHandleState(body.handle.available ? { status: "ok" } : { status: "taken", suggestion: body.handle.suggestion })
      } catch (error) {
        if ((error as Error).name !== "AbortError") setHandleState({ status: "unknown" })
      }
    }, 450)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [handle, storeName, created])

  // ---- step 1 validation ----
  const strength = passwordStrength(password, email)
  const clientErrors = useMemo(() => {
    const e: Record<string, string> = {}
    if (storeName.trim().length < 2) e.storeName = tr("Γράψε το όνομα του καταστήματός σου.")
    else if (nameTaken) e.storeName = tr("Αυτό το όνομα το έχει ήδη άλλο κατάστημα. Πρόσθεσε κάτι, π.χ. την πόλη σου.")
    if (!handle) {
      if (storeName.trim()) e.handle = tr("Χρειαζόμαστε μια διεύθυνση για τη σελίδα σου.")
    }
    else if (handleState.status === "invalid") e.handle = tr("Η διεύθυνση θέλει 3–48 λατινικά γράμματα, αριθμούς ή παύλες.")
    else if (handleState.status === "taken") e.handle = tr("Αυτή η διεύθυνση είναι πιασμένη.")
    if (!email.trim()) e.email = tr("Γράψε το email σου.")
    else if (!isEmail(email.trim())) e.email = tr("Αυτό το email δεν μοιάζει σωστό. Έλεγξε για τυπογραφικά.")
    if (!password) e.password = tr("Διάλεξε έναν κωδικό.")
    else if (password.length < PASSWORD_MIN) e.password = tr("Ο κωδικός θέλει τουλάχιστον 8 χαρακτήρες.")
    if (!terms) e.terms = tr("Χρειάζεται να αποδεχτείς τους όρους για να συνεχίσεις.")
    return e
  }, [storeName, nameTaken, handle, handleState.status, email, password, terms, tr])

  const errorFor = (key: string) => serverFields[key] || (touched[key] ? clientErrors[key] : undefined)
  const touch = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }))
  const clearServer = (key: string) => {
    if (serverFields[key]) setServerFields(({ [key]: _drop, ...rest }) => rest)
    if (serverError) setServerError(null)
  }

  const focusField: Record<string, string> = { storeName: ids.name, handle: ids.handle, email: ids.email, password: ids.password, terms: ids.terms }

  async function submitAccount(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    setTouched({ storeName: true, handle: true, email: true, password: true, terms: true })
    const order = ["storeName", "handle", "email", "password", "terms"]
    const firstInvalid = order.find((key) => clientErrors[key])
    if (firstInvalid) {
      if (firstInvalid === "handle") setEditingHandle(true)
      window.setTimeout(() => document.getElementById(focusField[firstInvalid])?.focus(), 0)
      return
    }
    setSubmitting(true)
    setServerError(null)
    setServerFields({})
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName: storeName.trim(), handle, email: email.trim(), password, terms, lang, referralCode: referralState.status === "unknown" ? "" : referral.trim() }),
      })
      const body = (await response.json().catch(() => ({ ok: false, code: "server", message: tr("Κάτι πήγε στραβά. Δοκίμασε ξανά.") }))) as StartResponse
      if (body.ok) {
        setCreated({ name: body.seller.name, handle: body.seller.handle, email: body.email })
        setContactEmail(body.email)
        setPassword("")
        setPhase("type")
        return
      }
      setServerFields(body.fields || {})
      setServerError({ code: body.code, message: body.message })
      if (body.code === "handle_taken") {
        setHandleState({ status: "taken", suggestion: body.suggestion })
        setEditingHandle(true)
      }
      const key = order.find((k) => body.fields?.[k])
      if (key) window.setTimeout(() => document.getElementById(focusField[key])?.focus(), 0)
    } catch {
      setServerError({ code: "server", message: tr("Δεν μπορέσαμε να συνδεθούμε. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.") })
    } finally {
      setSubmitting(false)
    }
  }

  // ---- optional steps ----
  const stepIndex = OPTIONAL_STEPS.indexOf(phase as OptionalStep)
  const next = useCallback(() => {
    setStepErrors({})
    setStepMessage("")
    const i = OPTIONAL_STEPS.indexOf(phase as OptionalStep)
    if (i >= 0 && i < OPTIONAL_STEPS.length - 1) return setPhase(OPTIONAL_STEPS[i + 1])
    // The rest of the profile is filled in on /shop-registration.
    setPhase("done")
    window.location.assign(shopHref)
  }, [phase, shopHref])

  function stepPayload(step: OptionalStep): Record<string, unknown> | null {
    switch (step) {
      case "type":
        return businessType ? { businessType, businessTypeOther: businessType === "other" ? businessTypeOther.trim() : "" } : null
      case "look":
        return { palette, logoUrl }
      case "story":
        return tagline.trim() || story.trim() ? { tagline: tagline.trim(), story: story.trim() } : null
      case "location":
        return area.trim() || city.trim() || postalCode.trim() ? { area: area.trim(), city: city.trim(), postalCode: postalCode.trim() } : null
      case "contact":
        return contactPhone.trim() || whatsapp.trim() || instagram.trim() || facebook.trim() || contactEmail.trim() !== (created?.email || "")
          ? {
              contactPhone: contactPhone.trim(),
              whatsapp: whatsapp.trim(),
              viberSameAsWhatsapp: viber,
              contactEmail: contactEmail.trim(),
              instagram: instagram.trim(),
              facebook: facebook.trim(),
            }
          : null
    }
  }

  function validateStep(step: OptionalStep): Record<string, string> {
    const e: Record<string, string> = {}
    if (step === "location" && postalCode.trim() && !isPostalCode(postalCode)) e.postalCode = tr("Ο Τ.Κ. έχει 5 ψηφία, π.χ. 117 42.")
    if (step === "contact") {
      if (contactPhone.trim() && !isGreekPhone(contactPhone)) e.contactPhone = tr("Γράψε ένα ελληνικό τηλέφωνο, π.χ. 2101234567 ή 69XXXXXXXX.")
      if (whatsapp.trim() && !isMessengerPhone(whatsapp)) e.whatsapp = tr("Γράψε ένα κινητό, π.χ. 69XXXXXXXX ή +30…")
      if (contactEmail.trim() && !isEmail(contactEmail.trim())) e.contactEmail = tr("Αυτό το email δεν μοιάζει σωστό.")
    }
    return e
  }

  async function saveStep(event?: FormEvent) {
    event?.preventDefault()
    const step = phase as OptionalStep
    const errors = validateStep(step)
    setStepErrors(errors)
    if (Object.keys(errors).length) {
      setStepMessage(tr("Έλεγξε τα πεδία με κόκκινο."))
      return
    }
    const payload = stepPayload(step)
    if (!payload) return next()
    setSaving(true)
    setStepMessage("")
    try {
      const response = await fetch(`${API}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, step, lang }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStepErrors(body.errors || {})
        setStepMessage(body.message || tr("Δεν αποθηκεύτηκε. Δοκίμασε ξανά."))
        return
      }
      setSaved((s) => new Set(s).add(step))
      next()
    } catch {
      setStepMessage(tr("Δεν μπορέσαμε να συνδεθούμε. Δοκίμασε ξανά."))
    } finally {
      setSaving(false)
    }
  }

  async function uploadLogo(file: File | undefined) {
    if (!file) return
    setStepErrors({})
    if (file.size > 3 * 1024 * 1024) return setStepErrors({ logoUrl: tr("Η εικόνα είναι μεγαλύτερη από 3 MB.") })
    setLogoBusy(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("lang", lang)
      const response = await fetch(`${API}/logo`, { method: "POST", body: form })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.url) return setStepErrors({ logoUrl: body.message || tr("Δεν ανέβηκε η εικόνα. Δοκίμασε ξανά.") })
      setLogoUrl(body.url)
    } catch {
      setStepErrors({ logoUrl: tr("Δεν ανέβηκε η εικόνα. Δοκίμασε ξανά.") })
    } finally {
      setLogoBusy(false)
    }
  }

  const address = `vitrinaki.gr/store/${created?.handle || handle}`
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(`https://${address}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked: the address is visible anyway */
    }
  }

  // ---------- render pieces ----------

  const handleStatus = (() => {
    switch (handleState.status) {
      case "checking":
        return <span className="inline-flex items-center gap-1.5 text-[#2E4A37]/60"><Spinner className="h-3 w-3 border-[1.5px]" />{tr("Ελέγχουμε…")}</span>
      case "ok":
        return <span className="inline-flex items-center gap-1 font-semibold text-[#2E6B45]"><Icon name="check" size={14} />{tr("Διαθέσιμη")}</span>
      case "taken":
        return <span className="inline-flex items-center gap-1 font-semibold text-[#B2432F]"><Icon name="x" size={14} />{tr("Πιασμένη")}</span>
      default:
        return null
    }
  })()

  const accountStep = (
    <form noValidate onSubmit={submitAccount} aria-labelledby={`${uid}-h`}>
      <p className="text-[12px] font-semibold tracking-[0.16em] text-[#C0503C]">{caps(`${tr("Βήμα")} 1/${TOTAL_STEPS}`)}</p>
      <StepBar current={0} />
      <h2 id={`${uid}-h`} ref={headingRef} tabIndex={-1} className="mt-2 text-[1.65rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] outline-none">
        {tr("Άνοιξε τη βιτρίνα σου")}
      </h2>
      <p className="mt-1.5 text-[14.5px] leading-6 text-[#2E4A37]/70">{tr("Μόνο τα απαραίτητα. Όλα τα υπόλοιπα, όποτε θέλεις.")}</p>

      <div aria-live="assertive" className="empty:hidden">
        {serverError && serverError.code !== "email_exists" && serverError.code !== "account_exists" ? (
          <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#C0503C]/30 bg-[#FBEDE9] px-3.5 py-3 text-[14px] text-[#7A2E20]">
            <Icon name="alert" size={18} className="mt-[1px] shrink-0" />
            <div>
              <p className="font-semibold">{serverError.message}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-5">
        <div>
        <Field id={ids.name} label={tr("Όνομα καταστήματος")} error={errorFor("storeName")}>
          <input
            id={ids.name}
            name="organization"
            autoComplete="organization"
            maxLength={100}
            value={storeName}
            onChange={(e) => {
              setStoreName(e.target.value)
              clearServer("storeName")
            }}
            onBlur={() => storeName && touch("storeName")}
            placeholder={tr("π.χ. Φούρνος Ελένη")}
            aria-invalid={Boolean(errorFor("storeName"))}
            aria-describedby={describedBy(ids.name, errorFor("storeName"))}
            className={inputCls(Boolean(errorFor("storeName")))}
          />
        </Field>
          {/* Live address */}
          <div className={`mt-2 rounded-xl border px-3 py-2.5 transition ${errorFor("handle") ? "border-[#C0503C]/50 bg-[#FBEDE9]/60" : "border-[#2E4A37]/10 bg-[#F7F2E8]"}`}>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={ids.handle} className="text-[12.5px] font-semibold text-[#2E4A37]/70">
                {tr("Η διεύθυνσή σου")}
              </label>
              <span className="text-[12px]" aria-live="polite">{handleStatus}</span>
            </div>
            <div className="mt-1 flex min-w-0 items-center text-[14.5px]">
              <span className="shrink-0 text-[#2E4A37]/60">vitrinaki.gr/store/</span>
              {editingHandle ? (
                <input
                  id={ids.handle}
                  value={handle}
                  maxLength={HANDLE_MAX}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  onChange={(e) => {
                    setHandle(cleanHandleInput(e.target.value))
                    setHandleEdited(true)
                    clearServer("handle")
                  }}
                  onBlur={() => {
                    setHandle((h) => h.replace(/-+$/, ""))
                    touch("handle")
                  }}
                  aria-invalid={Boolean(errorFor("handle"))}
                  aria-describedby={describedBy(ids.handle, errorFor("handle"))}
                  className="min-w-0 flex-1 rounded-md border border-[#2E4A37]/25 bg-white px-1.5 py-0.5 font-semibold text-[#1F3628] outline-none focus:border-[#2E4A37] focus:ring-2 focus:ring-[#2E4A37]/15"
                />
              ) : (
                <>
                  <span id={ids.handle} className={`min-w-0 truncate font-semibold ${handle ? "text-[#1F3628]" : "text-[#2E4A37]/35"}`}>{handle || tr("to-onoma-sou")}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHandle(true)
                      window.setTimeout(() => document.getElementById(ids.handle)?.focus(), 0)
                    }}
                    className="ml-auto shrink-0 rounded-md px-2 py-0.5 text-[12.5px] font-semibold text-[#265E8E] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265E8E]/30"
                  >
                    {tr("Αλλαγή")}
                  </button>
                </>
              )}
            </div>
            {errorFor("handle") ? (
              <p id={`${ids.handle}-error`} className="mt-1.5 text-[12.5px] font-medium text-[#B2432F]">
                {errorFor("handle")}
                {handleState.status === "taken" && handleState.suggestion ? (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => {
                        setHandle(handleState.suggestion!)
                        setHandleEdited(true)
                        clearServer("handle")
                      }}
                      className="font-semibold text-[#265E8E] underline underline-offset-2"
                    >
                      {tr("Πάρε το")} «{handleState.suggestion}»
                    </button>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>

        <div>
        <Field id={ids.email} label="Email" error={errorFor("email")}>
          <input
            id={ids.email}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearServer("email")
            }}
            onBlur={() => email && touch("email")}
            placeholder="esy@paradeigma.gr"
            aria-invalid={Boolean(errorFor("email"))}
            aria-describedby={describedBy(ids.email, errorFor("email"))}
            className={inputCls(Boolean(errorFor("email")))}
          />
        </Field>
          {serverError && (serverError.code === "email_exists" || serverError.code === "account_exists") && serverFields.email ? (
            <p className="mt-1 pl-[22px] text-[13px] text-[#1F3628]/80">
              {tr("Είναι δικό σου;")}{" "}
              <a href={shopHref} className="font-semibold text-[#2E4A37] underline underline-offset-2">{tr("Συνδέσου στη βιτρίνα σου")}</a>
              <span className="mx-1.5 opacity-40">·</span>
              <a href={resetPasswordUrl} className="font-semibold text-[#2E4A37] underline underline-offset-2">{tr("Ξέχασες τον κωδικό;")}</a>
            </p>
          ) : null}
        </div>

        <Field
          id={ids.password}
          label={tr("Κωδικός")}
          error={errorFor("password")}
          hint={
            password.length >= PASSWORD_MIN
              ? [tr("Πολύ εύκολος για να μαντευτεί. Δοκίμασε κάτι μεγαλύτερο."), tr("Καλός κωδικός."), tr("Δυνατός κωδικός.")][strength - 1] || tr("Τουλάχιστον 8 χαρακτήρες.")
              : tr("Τουλάχιστον 8 χαρακτήρες.")
          }
        >
          <div className="relative">
            <input
              id={ids.password}
              type={showPassword ? "text" : "password"}
              name="new-password"
              autoComplete="new-password"
              maxLength={128}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearServer("password")
              }}
              onBlur={() => password && touch("password")}
              aria-invalid={Boolean(errorFor("password"))}
              aria-describedby={[describedBy(ids.password, errorFor("password"), true), `${ids.password}-meter`].filter(Boolean).join(" ")}
              className={`${inputCls(Boolean(errorFor("password")))} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? tr("Απόκρυψη κωδικού") : tr("Εμφάνιση κωδικού")}
              aria-pressed={showPassword}
              aria-controls={ids.password}
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#2E4A37]/60 transition hover:bg-[#2E4A37]/[0.06] hover:text-[#2E4A37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E4A37]/25"
            >
              <Icon name={showPassword ? "eyeOff" : "eye"} size={19} />
            </button>
          </div>
          <div id={`${ids.password}-meter`} className="mt-2 grid grid-cols-3 gap-1.5" aria-hidden={password ? undefined : true}>
            <span className="sr-only">{password ? `${tr("Δύναμη κωδικού")}: ${[tr("πολύ μικρός"), tr("αδύναμος"), tr("καλός"), tr("δυνατός")][strength]}` : ""}</span>
            {[1, 2, 3].map((level) => (
              <span
                key={level}
                className={`h-1 rounded-full transition-colors duration-300 ${
                  password && strength >= level ? (strength === 1 ? "bg-[#C0503C]" : strength === 2 ? "bg-[#D59A3A]" : "bg-[#2E6B45]") : "bg-[#2E4A37]/10"
                }`}
              />
            ))}
          </div>
        </Field>

        {showReferral ? (
          <Field
            id={`${uid}-referral`}
            label={tr("Κωδικός σύστασης")}
            optional={tr("(προαιρετικό)")}
            hint={
              referralState.status === "ok" ? (
                <span className="font-medium text-[#2E6B45]">
                  {referralState.shopName ? `${tr("Σε σύστησε:")} ${referralState.shopName}. ` : ""}
                  {tr("Μόλις πληρώσεις την πρώτη σου συνδρομή, παίρνεις έναν μήνα δωρεάν.")}
                </span>
              ) : referralState.status === "unknown" ? (
                tr("Δεν βρήκαμε αυτόν τον κωδικό σύστασης. Μπορείς να συνεχίσεις και χωρίς.")
              ) : referralState.status === "checking" ? (
                tr("Ελέγχουμε…")
              ) : (
                tr("Αν σε σύστησε άλλη επιχείρηση, γράψε τον κωδικό της.")
              )
            }
          >
            <input
              id={`${uid}-referral`}
              name="referral-code"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={40}
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              placeholder={tr("π.χ. FOURNOS")}
              aria-describedby={`${uid}-referral-hint`}
              className={`${inputCls()} uppercase`}
            />
          </Field>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowReferral(true)
              window.setTimeout(() => document.getElementById(`${uid}-referral`)?.focus(), 0)
            }}
            className="-mt-1 text-[13.5px] font-semibold text-[#265E8E] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265E8E]/30"
          >
            {tr("Έχεις κωδικό σύστασης;")}
          </button>
        )}

        <div>
          <label htmlFor={ids.terms} className="flex cursor-pointer items-start gap-3 text-[14px] leading-6 text-[#1F3628]/85">
            <input
              id={ids.terms}
              type="checkbox"
              checked={terms}
              onChange={(e) => {
                setTerms(e.target.checked)
                touch("terms")
                clearServer("terms")
              }}
              aria-invalid={Boolean(errorFor("terms"))}
              aria-describedby={errorFor("terms") ? `${ids.terms}-error` : undefined}
              className="mt-1 h-[18px] w-[18px] shrink-0 cursor-pointer rounded border-[#2E4A37]/40 accent-[#2E4A37]"
            />
            <span>
              {tr("Συμφωνώ με τους")}{" "}
              {termsUrl ? <a href={termsUrl} target="_blank" rel="noopener" className="font-semibold text-[#2E4A37] underline underline-offset-2">{tr("Όρους χρήσης")}</a> : <span className="font-semibold">{tr("Όρους χρήσης")}</span>}{" "}
              {tr("και την")}{" "}
              {privacyUrl ? <a href={privacyUrl} target="_blank" rel="noopener" className="font-semibold text-[#2E4A37] underline underline-offset-2">{tr("Πολιτική απορρήτου")}</a> : <span className="font-semibold">{tr("Πολιτική απορρήτου")}</span>}.
            </span>
          </label>
          {errorFor("terms") ? (
            <p id={`${ids.terms}-error`} className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-[#B2432F]">
              <Icon name="alert" size={15} className="mt-[1px] shrink-0" />
              {errorFor("terms")}
            </p>
          ) : null}
        </div>
      </div>

      <button type="submit" disabled={submitting} aria-busy={submitting} className={`${primaryBtn} mt-6 w-full`}>
        {submitting ? (
          <>
            <Spinner />
            {tr("Δημιουργούμε τη βιτρίνα σου…")}
          </>
        ) : (
          <>
            {tr("Δημιούργησε τη βιτρίνα μου")} <Icon name="arrow" size={18} />
          </>
        )}
      </button>
      <p className="mt-4 text-center text-[14px] text-[#2E4A37]/70">
        {tr("Έχεις ήδη λογαριασμό;")}{" "}
        <a href={shopHref} className="font-semibold text-[#2E4A37] underline-offset-2 hover:underline">
          {tr("Σύνδεση")}
        </a>
      </p>
    </form>
  )

  const stepMeta: Record<OptionalStep, { title: string; text: string }> = {
    type: { title: tr("Τι κάνεις;"), text: tr("Έτσι διαλέγουμε το κατάλληλο ύφος και τις ενότητες της σελίδας σου.") },
    look: { title: tr("Πώς θα δείχνει;"), text: tr("Διάλεξε χρώμα και, αν έχεις, ανέβασε το λογότυπό σου.") },
    story: { title: tr("Η ιστορία σου"), text: tr("Μία φράση για την πρώτη ματιά και λίγα λόγια για το όραμά σου.") },
    location: { title: tr("Πού βρίσκεσαι;"), text: tr("Βοηθά τους πελάτες της περιοχής σου να σε βρουν. Δεν χρειάζεται ακριβής διεύθυνση.") },
    contact: { title: tr("Πώς θα σε βρίσκουν;"), text: tr("Εμφανίζονται δημόσια στη σελίδα σου. Συμπλήρωσε όσα θέλεις.") },
  }

  const stepBody = (() => {
    switch (phase) {
      case "type":
        return (
          <fieldset>
            <legend className="sr-only">{stepMeta.type.title}</legend>
            <div className="grid grid-cols-2 gap-2.5">
              {BUSINESS_TYPES.map((t) => {
                const active = businessType === t.value
                return (
                  <label
                    key={t.value}
                    className={`group relative flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition focus-within:ring-4 focus-within:ring-[#2E4A37]/15 ${
                      active ? "border-[#2E4A37] bg-[#2E4A37]/[0.05] shadow-[inset_0_0_0_1px_#2E4A37]" : "border-[#2E4A37]/15 bg-white hover:border-[#2E4A37]/40"
                    } ${t.value === "other" ? "col-span-2" : ""}`}
                  >
                    <input type="radio" name="businessType" value={t.value} checked={active} onChange={() => setBusinessType(t.value)} className="sr-only" />
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition ${active ? "bg-[#2E4A37] text-white" : "bg-[#F7F2E8] text-[#2E4A37]"}`}>
                      <Icon name={t.icon} size={18} />
                    </span>
                    <span className="min-w-0 pr-4">
                      <span className="block text-[14px] font-bold leading-tight text-[#1F3628]">{tr(t.label)}</span>
                      <span className="mt-0.5 hidden text-[12px] leading-4 text-[#2E4A37]/60 sm:block">{tr(t.hint)}</span>
                    </span>
                    {active ? <Icon name="check" size={16} className="absolute right-2.5 top-2.5 text-[#2E4A37]" /> : null}
                  </label>
                )
              })}
            </div>
            {businessType === "other" ? (
              <div className="mt-3">
                <Field id={ids.other} label={tr("Τι κάνεις, με δυο λέξεις;")}>
                  <input id={ids.other} autoFocus maxLength={80} value={businessTypeOther} onChange={(e) => setBusinessTypeOther(e.target.value)} placeholder={tr("π.χ. Σχολή χορού")} className={inputCls()} />
                </Field>
              </div>
            ) : null}
          </fieldset>
        )
      case "look":
        return (
          <div className="space-y-6">
            <fieldset>
              <legend className="mb-2 text-[13.5px] font-semibold text-[#1F3628]">{tr("Χρώμα")}</legend>
              <div className="grid grid-cols-3 gap-2.5">
                {PALETTES.map((p) => {
                  const active = palette === p.value
                  return (
                    <label key={p.value} className={`relative cursor-pointer overflow-hidden rounded-xl border bg-white transition focus-within:ring-4 focus-within:ring-[#2E4A37]/15 ${active ? "border-[#1F3628] shadow-[inset_0_0_0_1px_#1F3628]" : "border-[#2E4A37]/15 hover:border-[#2E4A37]/40"}`}>
                      <input type="radio" name="palette" value={p.value} checked={active} onChange={() => setPalette(p.value)} className="sr-only" />
                      <span className="flex h-16" aria-hidden="true">
                        <span className="flex-[2]" style={{ background: p.color }} />
                        <span className="flex-1" style={{ background: p.soft }} />
                        <span className="flex-1" style={{ background: p.page }} />
                      </span>
                      <span className="flex items-center justify-between px-2.5 py-2 text-[13px] font-semibold text-[#1F3628]">
                        {tr(p.label)}
                        {active ? <Icon name="check" size={15} /> : null}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
            <div>
              <p className="mb-2 text-[13.5px] font-semibold text-[#1F3628]">
                {tr("Λογότυπο")} <span className="font-normal text-[#2E4A37]/55">{tr("(αν έχεις)")}</span>
              </p>
              <div className={`flex items-center gap-3.5 rounded-xl border border-dashed p-3.5 ${stepErrors.logoUrl ? "border-[#C0503C]" : "border-[#2E4A37]/30"} bg-[#F7F2E8]/60`}>
                <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt={tr("Το λογότυπό σου")} className="h-full w-full object-contain" />
                  ) : logoBusy ? (
                    <Spinner className="text-[#2E4A37]" />
                  ) : (
                    <Icon name="upload" size={22} className="text-[#2E4A37]/50" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#2E4A37]/25 bg-white px-3 py-1.5 text-[13.5px] font-semibold text-[#1F3628] transition focus-within:ring-4 focus-within:ring-[#2E4A37]/15 hover:border-[#2E4A37]">
                    {logoBusy ? tr("Ανεβαίνει…") : logoUrl ? tr("Άλλαξε εικόνα") : tr("Διάλεξε εικόνα")}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={logoBusy} onChange={(e) => uploadLogo(e.target.files?.[0])} className="sr-only" />
                  </label>
                  {logoUrl ? (
                    <button type="button" onClick={() => setLogoUrl("")} className="ml-2 text-[13px] font-semibold text-[#2E4A37]/70 underline-offset-2 hover:underline">
                      {tr("Αφαίρεση")}
                    </button>
                  ) : null}
                  <p className="mt-1.5 text-[12px] text-[#2E4A37]/60">{tr("PNG, JPG, WEBP ή SVG, έως 3 MB. Αν δεν έχεις, βάζουμε τα αρχικά σου.")}</p>
                </div>
              </div>
              {stepErrors.logoUrl ? <p className="mt-1.5 text-[13px] font-medium text-[#B2432F]" role="alert">{stepErrors.logoUrl}</p> : null}
            </div>
          </div>
        )
      case "story": {
        const idea = TAGLINE_IDEAS[businessType || "other"]
        return (
          <div className="space-y-5">
            <Field
              id={ids.tagline}
              label={tr("Η φράση σου")}
              optional={`${tagline.length}/160`}
              hint={
                tagline.trim() ? (
                  tr("Εμφανίζεται μεγάλη, στην κορυφή της σελίδας σου.")
                ) : (
                  <button type="button" onClick={() => setTagline(tr(idea))} className="text-left text-[#265E8E] underline-offset-2 hover:underline">
                    <span className="font-semibold">{tr("Ιδέα:")}</span> «{tr(idea)}»
                  </button>
                )
              }
            >
              <input id={ids.tagline} maxLength={160} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder={tr(idea)} className={inputCls()} aria-describedby={`${ids.tagline}-hint`} />
            </Field>
            <Field id={ids.story} label={tr("Το όραμά σου")} optional={tr("(λίγα λόγια)")} hint={tr("Τι κάνεις, για ποιον και τι σε κάνει διαφορετικό. Δυο-τρεις προτάσεις αρκούν.")}>
              <textarea
                id={ids.story}
                rows={4}
                maxLength={1200}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder={tr("π.χ. Ψήνουμε ψωμί με προζύμι από το 1987, στην ίδια γωνιά της γειτονιάς…")}
                className={`${inputCls()} resize-y leading-6`}
                aria-describedby={`${ids.story}-hint`}
              />
            </Field>
          </div>
        )
      }
      case "location":
        return (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            <div className="col-span-2 sm:col-span-1">
              <Field id={ids.area} label={tr("Περιοχή")}>
                <input id={ids.area} maxLength={120} autoComplete="address-level3" value={area} onChange={(e) => setArea(e.target.value)} placeholder={tr("π.χ. Κουκάκι")} className={inputCls()} />
              </Field>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field id={ids.city} label={tr("Πόλη")}>
                <input id={ids.city} maxLength={120} autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} placeholder={tr("π.χ. Αθήνα")} className={inputCls()} />
              </Field>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field id={ids.postal} label={tr("Τ.Κ.")} optional={tr("(προαιρετικό)")} error={stepErrors.postalCode}>
                <input
                  id={ids.postal}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/[^\d\s]/g, ""))}
                  placeholder="117 42"
                  aria-invalid={Boolean(stepErrors.postalCode)}
                  aria-describedby={describedBy(ids.postal, stepErrors.postalCode)}
                  className={inputCls(Boolean(stepErrors.postalCode))}
                />
              </Field>
            </div>
            <p className="col-span-2 rounded-xl bg-[#F7F2E8] px-3.5 py-2.5 text-[13px] leading-5 text-[#2E4A37]/75">
              {tr("Δουλεύεις μόνο online; Πάτα «Αργότερα». Ωράριο και ακριβή διεύθυνση τα βάζεις μετά, στο προφίλ του καταστήματος, αν θέλεις.")}
            </p>
          </div>
        )
      case "contact":
        return (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            <div className="col-span-2 sm:col-span-1">
              <Field id={ids.phone} label={tr("Τηλέφωνο καταστήματος")} error={stepErrors.contactPhone}>
                <input id={ids.phone} type="tel" autoComplete="tel" inputMode="tel" maxLength={30} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="210 123 4567" aria-invalid={Boolean(stepErrors.contactPhone)} aria-describedby={describedBy(ids.phone, stepErrors.contactPhone)} className={inputCls(Boolean(stepErrors.contactPhone))} />
              </Field>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field id={ids.whatsapp} label={tr("Κινητό για WhatsApp")} error={stepErrors.whatsapp}>
                <input id={ids.whatsapp} type="tel" autoComplete="tel" inputMode="tel" maxLength={30} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="69X XXX XXXX" aria-invalid={Boolean(stepErrors.whatsapp)} aria-describedby={describedBy(ids.whatsapp, stepErrors.whatsapp)} className={inputCls(Boolean(stepErrors.whatsapp))} />
              </Field>
              <label className={`mt-2 flex items-center gap-2 text-[13px] text-[#1F3628]/80 ${whatsapp.trim() ? "" : "opacity-50"}`}>
                <input type="checkbox" checked={viber} disabled={!whatsapp.trim()} onChange={(e) => setViber(e.target.checked)} className="h-4 w-4 accent-[#2E4A37]" />
                {tr("Έχω Viber στο ίδιο νούμερο")}
              </label>
            </div>
            <div className="col-span-2">
              <Field id={ids.cemail} label={tr("Email επικοινωνίας")} error={stepErrors.contactEmail} hint={tr("Το βλέπουν οι πελάτες. Αν θες άλλο από αυτό του λογαριασμού σου, άλλαξέ το.")}>
                <input id={ids.cemail} type="email" autoComplete="email" maxLength={254} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} aria-invalid={Boolean(stepErrors.contactEmail)} aria-describedby={describedBy(ids.cemail, stepErrors.contactEmail, true)} className={inputCls(Boolean(stepErrors.contactEmail))} />
              </Field>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field id={ids.instagram} label="Instagram" error={stepErrors.instagram}>
                <input id={ids.instagram} maxLength={300} autoCapitalize="none" spellCheck={false} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@to_magazi_mou" className={inputCls(Boolean(stepErrors.instagram))} />
              </Field>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field id={ids.facebook} label="Facebook" error={stepErrors.facebook}>
                <input id={ids.facebook} maxLength={300} autoCapitalize="none" spellCheck={false} value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder={tr("όνομα σελίδας ή link")} className={inputCls(Boolean(stepErrors.facebook))} />
              </Field>
            </div>
          </div>
        )
      default:
        return null
    }
  })()

  const optionalStep =
    stepIndex >= 0 ? (
      <form noValidate onSubmit={saveStep} aria-labelledby={`${uid}-h`}>
        {phase === "type" ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl bg-[#E6ECE3] px-3.5 py-3 text-[14px] text-[#1F3628]" role="status">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#2E4A37] text-white"><Icon name="check" size={14} /></span>
            <p>
              <span className="font-bold">{tr("Η βιτρίνα σου δημιουργήθηκε!")}</span> {tr("Θες να τη φτιάξουμε λίγο ακόμα; Κάθε βήμα είναι προαιρετικό.")}
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-semibold tracking-[0.16em] text-[#C0503C]">
            {caps(`${tr("Βήμα")} ${stepIndex + 2}/${TOTAL_STEPS}`)} · {caps(tr("Προαιρετικό"))}
          </p>
          <button type="button" onClick={() => setPhase("done")} className="text-[13px] font-semibold text-[#2E4A37]/70 underline-offset-2 hover:text-[#2E4A37] hover:underline">
            {tr("Παράλειψη όλων")}
          </button>
        </div>
        <StepBar current={stepIndex + 1} done={(i) => i === 0 || saved.has(OPTIONAL_STEPS[i - 1])} />

        <h2 id={`${uid}-h`} ref={headingRef} tabIndex={-1} className="mt-5 text-[1.5rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] outline-none">
          {stepMeta[phase as OptionalStep].title}
        </h2>
        <p className="mb-5 mt-1 text-[14.5px] leading-6 text-[#2E4A37]/70">{stepMeta[phase as OptionalStep].text}</p>

        {stepBody}

        <div aria-live="polite" className="empty:hidden">
          {stepMessage ? (
            <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-[#FBEDE9] px-3.5 py-2.5 text-[13.5px] font-medium text-[#7A2E20]">
              <Icon name="alert" size={16} /> {stepMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={next} disabled={saving} className={ghostBtn}>
            {tr("Αργότερα")}
          </button>
          <button type="submit" disabled={saving || logoBusy} aria-busy={saving} className={`${primaryBtn} sm:min-w-[11rem]`}>
            {saving ? <><Spinner />{tr("Αποθήκευση…")}</> : <>{stepIndex === OPTIONAL_STEPS.length - 1 ? tr("Ολοκλήρωση") : tr("Συνέχεια")} <Icon name="arrow" size={18} /></>}
          </button>
        </div>
      </form>
    ) : null

  const doneStep =
    phase === "done" && created ? (
      <div>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#2E4A37] text-[#F7F2E8] shadow-[0_10px_24px_-10px_rgba(46,74,55,0.8)]">
            <Icon name="check" size={24} />
          </span>
          <p className="text-[12px] font-semibold tracking-[0.16em] text-[#C0503C]">{caps(tr("Όλα έτοιμα"))}</p>
        </div>
        <h2 ref={headingRef} tabIndex={-1} className="mt-4 text-[1.75rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] outline-none">
          {tr("Η βιτρίνα σου είναι έτοιμη")}
        </h2>
        <p className="mt-1.5 text-[14.5px] leading-6 text-[#2E4A37]/75">
          {tr("Συμπλήρωσε το προφίλ του καταστήματος, ενεργοποίησε το πακέτο σου και δημοσίευσε τη σελίδα σου, όλα εδώ στο Vitrinaki.")}
        </p>

        <div className="mt-5 rounded-xl border border-[#2E4A37]/12 bg-[#F7F2E8] p-3.5">
          <p className="text-[12.5px] font-semibold text-[#2E4A37]/70">{tr("Η διεύθυνσή σου")}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-[15px] font-semibold text-[#1F3628]">{address}</span>
            <button type="button" onClick={copyAddress} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-semibold text-[#265E8E] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265E8E]/30">
              <Icon name={copied ? "check" : "copy"} size={15} />
              <span aria-live="polite">{copied ? tr("Αντιγράφηκε") : tr("Αντιγραφή")}</span>
            </button>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-5 text-[#2E4A37]/65">{tr("Κλεισμένη για σένα. Ανοίγει στους πελάτες μόλις δημοσιεύσεις τη σελίδα σου.")}</p>
        </div>

        <ul className="mt-4 space-y-1.5 text-[14px]">
          {OPTIONAL_STEPS.map((s) => (
            <li key={s} className="flex items-center gap-2.5">
              <span className={`grid h-5 w-5 place-items-center rounded-full ${saved.has(s) ? "bg-[#2E4A37] text-white" : "border border-dashed border-[#2E4A37]/35 text-transparent"}`}>
                <Icon name="check" size={12} />
              </span>
              <span className={saved.has(s) ? "font-medium text-[#1F3628]" : "text-[#2E4A37]/60"}>{stepMeta[s].title.replace(/;$/, "")}</span>
              {!saved.has(s) ? <span className="text-[12.5px] text-[#2E4A37]/50">· {tr("αργότερα, στο προφίλ")}</span> : null}
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-2.5">
          <a href={shopHref} className={`${primaryBtn} w-full`}>
            {tr("Συνέχισε στο προφίλ του καταστήματος")} <Icon name="arrow" size={18} />
          </a>
          <form method="post" action={`${API}/handoff`}>
            <input type="hidden" name="to" value="studio" />
            <button type="submit" className={`${secondaryBtn} w-full text-[14px]`}>{tr("Πρόσθεσε προϊόντα στο Studio")}</button>
          </form>
        </div>
        {saved.size < OPTIONAL_STEPS.length ? (
          <p className="mt-4 text-center text-[13.5px] text-[#2E4A37]/70">
            <button type="button" onClick={() => setPhase(OPTIONAL_STEPS.find((s) => !saved.has(s)) || "type")} className="font-semibold text-[#2E4A37] underline-offset-2 hover:underline">
              {tr("Συνέχισε τα προαιρετικά βήματα εδώ")}
            </button>
          </p>
        ) : null}
      </div>
    ) : null

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,470px)] lg:gap-12 xl:gap-16">
      <div className="min-w-0">
        {intro}
        <div className="relative mt-7 hidden lg:block">
          <span className="absolute -top-3 left-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#1F3628] px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-[#F7F2E8] shadow-lg">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E08A76]" />
            {caps(tr("Ζωντανή προεπισκόπηση"))}
          </span>
          <ShopPreview
            lang={lang}
            name={created?.name || storeName}
            handle={created?.handle || handle}
            palette={palette}
            businessType={businessType}
            tagline={tagline}
            logoUrl={logoUrl}
            city={city || area}
            phone={contactPhone || whatsapp}
            instagram={instagram}
          />
        </div>
        <div className="hidden lg:block">{benefits}</div>
      </div>

      <div ref={cardRef} id="signup" className="min-w-0 scroll-mt-24 lg:sticky lg:top-24">
        <div className="rounded-[1.6rem] border border-[#2E4A37]/10 bg-white p-5 shadow-[0_40px_90px_-50px_rgba(31,54,40,0.6)] sm:p-7">
          {phase === "account" ? accountStep : phase === "done" ? doneStep : optionalStep}
        </div>
        {/* Phones: the preview follows the card */}
        <div className="mt-6 lg:hidden">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-[#2E4A37]/60">{caps(tr("Ζωντανή προεπισκόπηση"))}</p>
          <ShopPreview
            lang={lang}
            name={created?.name || storeName}
            handle={created?.handle || handle}
            palette={palette}
            businessType={businessType}
            tagline={tagline}
            logoUrl={logoUrl}
            city={city || area}
            phone={contactPhone || whatsapp}
            instagram={instagram}
          />
          {benefits}
        </div>
      </div>
    </div>
  )
}
