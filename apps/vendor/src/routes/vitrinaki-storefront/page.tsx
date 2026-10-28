import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { RouteConfig } from "@mercurjs/dashboard-sdk"
import { getAuthHeaders } from "@mercurjs/vendor"

declare const __BACKEND_URL__: string

export const config: RouteConfig = {
  label: "Website & domain",
  rank: 45,
}

type PageSection = {
  id: string
  type: "text" | "image" | "feature"
  title: string
  body: string
  imageUrl: string | null
}
// Options match STYLE_OPTIONS in packages/api/src/lib/vitrinaki-storefront-style.ts.
type StorefrontStyle = {
  font: "classic" | "modern" | "minimal"
  corners: "round" | "soft" | "sharp"
  buttons: "solid" | "outline"
  theme: "light" | "dark"
}
type StorefrontForm = {
  storeName: string
  tagline: string
  description: string
  template: "atelier" | "local" | "services"
  palette: "forest" | "terracotta" | "ocean" | "plum"
  style: StorefrontStyle
  contactEmail: string
  contactPhone: string
  logoUrl: string
  bannerUrl: string
  sections: PageSection[]
  customDomain: string
  domainStatus: string
  domainVerificationToken: string
  isPublished: boolean
}
type Seller = { id: string; name: string; handle: string; description?: string | null }
type Subscription = { status?: string; planId?: string; interval?: string; currentPeriodEnd?: string; cancelAtPeriodEnd?: boolean } | null
type Storage = { usedBytes: number; limitBytes: number }
type Tab = "basics" | "look" | "images" | "sections" | "domain" | "plan"

// Team sizes and features match PLAN_MEMBER_LIMITS and PLAN_FEATURES in packages/api/src/lib/vitrinaki-plans.ts.
// Prices come from the Stripe Price IDs configured in the backend, so none here.
const PLANS = [
  { id: "starter", label: "Starter", text: "1 άτομο · 100 προϊόντα · 2 GB · υποστήριξη με email" },
  { id: "growth", label: "Growth", text: "έως 3 άτομα · 1.000 προϊόντα · 10 GB · πόντοι επιβράβευσης · email και chat" },
  { id: "pro", label: "Pro", text: "έως 5 άτομα · 5.000 προϊόντα · 30 GB · προβολή στην αρχική · προτεραιότητα στην υποστήριξη" },
  { id: "business", label: "Επιχείρηση", text: "έως 15 άτομα · απεριόριστα προϊόντα · 100 GB · πρώτη θέση στην προβολή · προσωπικός σύμβουλος · χωρίς κόστος στησίματος" },
] as const

const TABS: { id: Tab; label: string }[] = [
  { id: "basics", label: "Βασικά" },
  { id: "look", label: "Εμφάνιση" },
  { id: "images", label: "Εικόνες" },
  { id: "sections", label: "Ενότητες" },
  { id: "domain", label: "Domain" },
  { id: "plan", label: "Συνδρομή" },
]

const backend = () => __BACKEND_URL__.replace(/\/+$/, "")
const DEFAULT_STYLE: StorefrontStyle = { font: "classic", corners: "round", buttons: "solid", theme: "light" }
const blank: StorefrontForm = {
  storeName: "", tagline: "Καλώς ήρθες στο κατάστημά μας", description: "",
  template: "atelier", palette: "forest", style: DEFAULT_STYLE, contactEmail: "", contactPhone: "",
  logoUrl: "", bannerUrl: "", sections: [],
  customDomain: "", domainStatus: "not_configured", domainVerificationToken: "", isPublished: false,
}
const palettes = [
  { value: "forest", label: "Δάσος", color: "#173f34" },
  { value: "terracotta", label: "Κεραμιδί", color: "#b95232" },
  { value: "ocean", label: "Ωκεανός", color: "#1e7184" },
  { value: "plum", label: "Δαμασκηνί", color: "#7e4b78" },
] as const
const templates = [
  { value: "atelier", label: "Atelier", text: "Προϊόντα και brand" },
  { value: "local", label: "Local", text: "Τοπικά προϊόντα" },
  { value: "services", label: "Services", text: "Υπηρεσίες και ραντεβού" },
] as const
const styleChoices: { [K in keyof StorefrontStyle]: { label: string; options: { value: StorefrontStyle[K]; label: string }[] } } = {
  font: { label: "Γραμματοσειρά τίτλων", options: [{ value: "classic", label: "Κλασική" }, { value: "modern", label: "Μοντέρνα" }, { value: "minimal", label: "Λιτή" }] },
  corners: { label: "Γωνίες", options: [{ value: "round", label: "Στρογγυλές" }, { value: "soft", label: "Ήπιες" }, { value: "sharp", label: "Ευθείες" }] },
  buttons: { label: "Κουμπιά", options: [{ value: "solid", label: "Γεμάτα" }, { value: "outline", label: "Περίγραμμα" }] },
  theme: { label: "Φόντο", options: [{ value: "light", label: "Φωτεινό" }, { value: "dark", label: "Σκούρο" }] },
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
// The preview renders the shop at this width and is scaled down to fit.
const DESKTOP_WIDTH = 1280
const MOBILE_WIDTH = 390

const input = "mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5 text-sm"
const formatBytes = (bytes: number) => {
  const gb = bytes / 1024 ** 3
  if (gb >= 1) return `${gb.toFixed(gb >= 10 ? 0 : 1).replace(".", ",")} GB`
  return `${Math.max(0, Math.round(bytes / 1024 ** 2))} MB`
}
const withStyle = (storefront: any): StorefrontForm => ({ ...blank, ...storefront, style: { ...DEFAULT_STYLE, ...(storefront?.style || {}) } })

export default function VitrinakiStorefrontSettingsPage() {
  const [form, setForm] = useState<StorefrontForm>(blank)
  const [saved, setSaved] = useState("")
  const [seller, setSeller] = useState<Seller | null>(null)
  const [profile, setProfile] = useState<unknown>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [storage, setStorage] = useState<Storage | null>(null)
  const [subscription, setSubscription] = useState<Subscription>(null)
  const [billingConfigured, setBillingConfigured] = useState(false)
  const [availablePlans, setAvailablePlans] = useState<Record<string, string[]>>({})
  const [domainTarget, setDomainTarget] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [promoCode, setPromoCode] = useState("")
  const [tab, setTab] = useState<Tab>("basics")
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")

  const dirty = saved !== "" && JSON.stringify(form) !== saved

  const callAPI = async (url: string, init?: RequestInit) => {
    const isJson = Boolean(init?.body) && !(init?.body instanceof FormData)
    const response = await fetch(`${backend()}${url}`, {
      ...init,
      headers: { ...getAuthHeaders(), ...(isJson ? { "Content-Type": "application/json" } : {}), ...(init?.headers || {}) },
      credentials: "omit",
    })
    const json = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(json.message || `Το αίτημα απέτυχε (${response.status}).`)
    return json
  }

  const refresh = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await callAPI("/vendor/vitrinaki/storefront")
      const next = withStyle(data.storefront)
      setForm(next)
      setSaved(JSON.stringify(next))
      setSeller(data.seller || null)
      setProfile(data.profile || null)
      setPreviewUrl(data.previewUrl || "")
      setStorage(data.storage || null)
      setSubscription(data.subscription || null)
      setBillingConfigured(Boolean(data.billingConfigured))
      setAvailablePlans(data.availablePlans || {})
      setDomainTarget(data.domainTarget || "")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Δεν ήταν δυνατή η φόρτωση των ρυθμίσεων.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = "" }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const update = <K extends keyof StorefrontForm>(key: K, value: StorefrontForm[K]) => {
    setForm(current => ({ ...current, [key]: value }))
  }
  const updateStyle = <K extends keyof StorefrontStyle>(key: K, value: StorefrontStyle[K]) => {
    setForm(current => ({ ...current, style: { ...current.style, [key]: value } }))
  }

  const addSection = () => {
    setForm(current => ({
      ...current,
      sections: [...(current.sections || []), {
        id: `section-${Date.now()}`,
        type: "text" as const,
        title: "Νέα ενότητα",
        body: "",
        imageUrl: null,
      }].slice(0, 8),
    }))
  }

  const updateSection = (id: string, key: keyof PageSection, value: string | null) => {
    setForm(current => ({
      ...current,
      sections: (current.sections || []).map(section => section.id === id
        ? { ...section, [key]: value }
        : section),
    }))
  }

  const moveSection = (index: number, by: -1 | 1) => {
    setForm(current => {
      const sections = [...(current.sections || [])]
      const target = index + by
      if (target < 0 || target >= sections.length) return current
      ;[sections[index], sections[target]] = [sections[target], sections[index]]
      return { ...current, sections }
    })
  }

  const removeSection = (id: string) => {
    setForm(current => ({
      ...current,
      sections: (current.sections || []).filter(section => section.id !== id),
    }))
  }

  const submit = async (action: "save" | "publish" | "unpublish" = "save") => {
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const data = await callAPI("/vendor/vitrinaki/storefront", {
        method: "POST",
        body: JSON.stringify({ action, storefront: form }),
      })
      const next = withStyle(data.storefront)
      setForm(next)
      setSaved(JSON.stringify(next))
      setSubscription(data.subscription || null)
      setMessage(action === "publish" ? "Το website δημοσιεύτηκε." : action === "unpublish" ? "Το website αποσύρθηκε από τη δημοσίευση." : "Οι αλλαγές αποθηκεύτηκαν.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Δεν ήταν δυνατή η αποθήκευση.")
    } finally {
      setSaving(false)
    }
  }

  // Uploads one image with Mercur's /vendor/uploads and returns its URL. The
  // backend counts it against the plan's space and refuses it when full.
  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) throw new Error("Διάλεξε αρχείο εικόνας (JPG, PNG, WebP).")
    if (file.size > MAX_IMAGE_BYTES) throw new Error("Η εικόνα είναι πάνω από 10 MB. Διάλεξε μικρότερη.")
    const body = new FormData()
    body.append("files", file)
    const data = await callAPI("/vendor/uploads", { method: "POST", body })
    const url = data.files?.[0]?.url
    if (!url) throw new Error("Η μεταφόρτωση δεν επέστρεψε διεύθυνση εικόνας.")
    setStorage(current => current ? { ...current, usedBytes: current.usedBytes + file.size } : current)
    return url as string
  }

  const verifyDomain = async () => {
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const data = await callAPI("/vendor/vitrinaki/storefront/domain/verify", { method: "POST" })
      setMessage(data.message || "Το domain επαληθεύτηκε.")
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Δεν ήταν δυνατή η επαλήθευση του domain.")
    } finally {
      setSaving(false)
    }
  }

  const startBilling = async (planId: string, interval: "month" | "year") => {
    setSaving(true); setError(""); setMessage("")
    try {
      const data = await callAPI("/vendor/vitrinaki/billing/checkout", { method: "POST", body: JSON.stringify({ planId, interval }) })
      if (data.url) window.location.assign(data.url)
      else setMessage("Το αίτημα ολοκληρώθηκε, αλλά δεν επιστράφηκε σύνδεσμος πληρωμής.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Δεν ήταν δυνατή η έναρξη της συνδρομής.")
    } finally { setSaving(false) }
  }

  const redeemPromo = async () => {
    setSaving(true); setError(""); setMessage("")
    try {
      await callAPI("/vendor/vitrinaki/billing/promo", { method: "POST", body: JSON.stringify({ code: promoCode }) })
      setPromoCode("")
      setMessage("Ο κωδικός ενεργοποιήθηκε. Η συνδρομή σου είναι ενεργή.")
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Δεν ήταν δυνατή η ενεργοποίηση του κωδικού.")
    } finally { setSaving(false) }
  }

  const openBillingPortal = async () => {
    setSaving(true); setError("")
    try {
      const data = await callAPI("/vendor/vitrinaki/billing/portal", { method: "POST" })
      if (data.url) window.location.assign(data.url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Δεν ήταν δυνατή η διαχείριση της συνδρομής.")
    } finally { setSaving(false) }
  }

  // What the preview renders: the draft as the storefront API would return it.
  const draft = useMemo(() => seller ? {
    seller: { ...seller, logo: form.logoUrl || null, banner: form.bannerUrl || null },
    storefront: { ...form, handle: seller.handle },
    profile,
  } : null, [seller, form, profile])

  if (loading) return <div className="p-8"><div className="h-8 animate-pulse rounded bg-ui-bg-subtle" style={{ width: 240 }}/><div className="mt-6 animate-pulse rounded-xl bg-ui-bg-subtle" style={{ height: 480 }}/></div>

  return (
    <div className="vk-editor flex flex-col">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-ui-border-base bg-ui-bg-base px-6 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ui-fg-subtle">Vitrinaki Studio</p>
          <h1 className="truncate text-lg font-semibold text-ui-fg-base">{form.storeName || "Το website σου"}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${form.isPublished ? "bg-ui-tag-green-bg text-ui-tag-green-text" : "bg-ui-bg-subtle text-ui-fg-subtle"}`}>
            {form.isPublished ? "Δημοσιευμένο" : "Πρόχειρο"}
          </span>
          {dirty ? <span className="text-xs font-medium text-ui-tag-orange-text">Μη αποθηκευμένες αλλαγές</span> : null}
          <button type="button" disabled={saving || !dirty} onClick={() => void submit("save")} className="rounded-lg border border-ui-border-base px-4 py-2 text-sm font-semibold disabled:opacity-50">{saving ? "Αποθήκευση…" : "Αποθήκευση"}</button>
          {form.isPublished
            ? <button type="button" disabled={saving} onClick={() => void submit("unpublish")} className="rounded-lg border border-ui-border-base px-4 py-2 text-sm font-semibold disabled:opacity-50">Απόσυρση</button>
            : <button type="button" disabled={saving} onClick={() => void submit("publish")} className="rounded-lg bg-ui-button-inverted px-4 py-2 text-sm font-semibold text-ui-fg-on-inverted disabled:opacity-50">Δημοσίευση</button>}
        </div>
      </header>

      {error ? <div role="alert" className="vk-editor-alert rounded-xl border border-ui-tag-red-border bg-ui-tag-red-bg p-3 text-sm text-ui-tag-red-text">{error}</div> : null}
      {message ? <div role="status" className="vk-editor-alert rounded-xl border border-ui-tag-green-border bg-ui-tag-green-bg p-3 text-sm text-ui-tag-green-text">{message}</div> : null}

      <div className="vk-editor-body">
        <div className="min-w-0 rounded-2xl border border-ui-border-base bg-ui-bg-base">
          <nav role="tablist" aria-label="Ρυθμίσεις website" className="flex flex-wrap gap-1 border-b border-ui-border-base p-2">
            {TABS.map(item => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                data-state={tab === item.id ? "active" : "inactive"}
                onClick={() => setTab(item.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${tab === item.id ? "bg-ui-bg-subtle text-ui-fg-base" : "text-ui-fg-subtle hover:text-ui-fg-base"}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="space-y-5 p-5">
            {tab === "basics" ? (
              <>
                <Intro title="Βασικά" text="Τα στοιχεία που βλέπει πρώτα ο επισκέπτης." />
                <label className="block text-sm font-medium">Όνομα καταστήματος<input required maxLength={100} value={form.storeName} onChange={e => update("storeName", e.target.value)} className={input} /></label>
                <label className="block text-sm font-medium">Κεντρικό μήνυμα<input maxLength={160} value={form.tagline} onChange={e => update("tagline", e.target.value)} className={input} /></label>
                <label className="block text-sm font-medium">Περιγραφή<textarea rows={5} maxLength={1800} value={form.description} onChange={e => update("description", e.target.value)} className={input} /></label>
                <label className="block text-sm font-medium">Email επικοινωνίας<input type="email" value={form.contactEmail} onChange={e => update("contactEmail", e.target.value)} className={input} /></label>
                <label className="block text-sm font-medium">Τηλέφωνο<input value={form.contactPhone} onChange={e => update("contactPhone", e.target.value)} className={input} /></label>
                <a href="/seller/vitrinaki-profile" className="block text-sm font-semibold text-ui-fg-interactive">Ωράριο, υπηρεσίες και στοιχεία στο προφίλ καταστήματος →</a>
              </>
            ) : null}

            {tab === "look" ? (
              <>
                <Intro title="Εμφάνιση" text="Διάλεξε και δες αμέσως πώς φαίνεται δεξιά." />
                <Choice label="Πρότυπο">
                  <div className="grid gap-2">
                    {templates.map(t => (
                      <Option key={t.value} active={form.template === t.value} onClick={() => update("template", t.value)}>
                        <span className="font-semibold">{t.label}</span><span className="ml-2 text-ui-fg-subtle">{t.text}</span>
                      </Option>
                    ))}
                  </div>
                </Choice>
                <Choice label="Χρώματα">
                  <div className="grid grid-cols-4 gap-2">
                    {palettes.map(p => (
                      <button key={p.value} type="button" aria-pressed={form.palette === p.value} onClick={() => update("palette", p.value)} className={`rounded-xl border p-2 text-left ${form.palette === p.value ? "border-ui-border-interactive ring-2 ring-ui-border-interactive" : "border-ui-border-base"}`}>
                        <span className="mb-1.5 block h-7 rounded-md" style={{ backgroundColor: p.color }} />
                        <span className="text-[11px] font-semibold">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </Choice>
                {(Object.keys(styleChoices) as (keyof StorefrontStyle)[]).map(key => (
                  <Choice key={key} label={styleChoices[key].label}>
                    <div className="flex flex-wrap gap-2">
                      {styleChoices[key].options.map(option => (
                        <Option key={option.value} active={form.style[key] === option.value} onClick={() => updateStyle(key, option.value as never)}>
                          {option.label}
                        </Option>
                      ))}
                    </div>
                  </Choice>
                ))}
              </>
            ) : null}

            {tab === "images" ? (
              <>
                <Intro title="Εικόνες" text="Ανέβασε το λογότυπο και την εικόνα εξωφύλλου από τον υπολογιστή ή το κινητό σου." />
                {storage ? <StorageMeter storage={storage} /> : null}
                <ImageField label="Λογότυπο" hint="Τετράγωνο, τουλάχιστον 200×200." value={form.logoUrl} onChange={url => update("logoUrl", url)} upload={uploadImage} />
                <ImageField label="Εικόνα εξωφύλλου" hint="Οριζόντια, τουλάχιστον 1600 πλάτος." value={form.bannerUrl} onChange={url => update("bannerUrl", url)} upload={uploadImage} wide />
              </>
            ) : null}

            {tab === "sections" ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <Intro title="Ενότητες" text="Κείμενα και εικόνες κάτω από τα προϊόντα. Έως 8." />
                  <button type="button" disabled={(form.sections || []).length >= 8} onClick={addSection} className="shrink-0 rounded-lg border border-ui-border-base px-3 py-2 text-sm font-semibold disabled:opacity-50">+ Νέα</button>
                </div>
                {(form.sections || []).length ? (form.sections || []).map((section, index) => (
                  <div key={section.id} className="space-y-3 rounded-xl border border-ui-border-base p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">Ενότητα {index + 1}</p>
                      <div className="flex items-center gap-1 text-xs font-semibold text-ui-fg-subtle">
                        <button type="button" aria-label="Πάνω" disabled={index === 0} onClick={() => moveSection(index, -1)} className="rounded px-2 py-1 hover:bg-ui-bg-subtle disabled:opacity-40">↑</button>
                        <button type="button" aria-label="Κάτω" disabled={index === form.sections.length - 1} onClick={() => moveSection(index, 1)} className="rounded px-2 py-1 hover:bg-ui-bg-subtle disabled:opacity-40">↓</button>
                        <button type="button" onClick={() => removeSection(section.id)} className="rounded px-2 py-1 hover:bg-ui-bg-subtle hover:text-ui-fg-base">Αφαίρεση</button>
                      </div>
                    </div>
                    <label className="block text-sm font-medium">Τύπος<select value={section.type} onChange={e => updateSection(section.id, "type", e.target.value)} className={input}><option value="text">Κείμενο</option><option value="feature">Κάρτα / highlight</option><option value="image">Εικόνα και κείμενο</option></select></label>
                    <label className="block text-sm font-medium">Τίτλος<input maxLength={160} value={section.title} onChange={e => updateSection(section.id, "title", e.target.value)} className={input} /></label>
                    <label className="block text-sm font-medium">Κείμενο<textarea rows={3} maxLength={1600} value={section.body} onChange={e => updateSection(section.id, "body", e.target.value)} className={input} /></label>
                    {section.type === "image" ? <ImageField label="Εικόνα" value={section.imageUrl || ""} onChange={url => updateSection(section.id, "imageUrl", url || null)} upload={uploadImage} wide /> : null}
                  </div>
                )) : <p className="rounded-xl bg-ui-bg-subtle p-4 text-sm text-ui-fg-subtle">Δεν έχεις ενότητες ακόμη. Η σελίδα δείχνει την κεφαλίδα, τα προϊόντα και τα στοιχεία επικοινωνίας.</p>}
              </>
            ) : null}

            {tab === "domain" ? (
              <>
                <Intro title="Domain" text="Η επαλήθευση DNS είναι ένα βήμα. Το hosting πρέπει επίσης να έχει ρυθμιστεί για το domain σου." />
                <label className="block text-sm font-medium">Το domain σου<input placeholder="shop.example.gr" value={form.customDomain} onChange={e => update("customDomain", e.target.value)} className={input} /></label>
                {form.customDomain && !form.domainVerificationToken ? <p className="text-xs text-ui-fg-subtle">Αποθήκευσε για να πάρεις τις εγγραφές DNS.</p> : null}
                {form.customDomain && form.domainVerificationToken ? <div className="rounded-xl bg-ui-bg-subtle p-4 text-sm"><p className="font-semibold">1. TXT verification</p><p className="mt-1 break-all text-ui-fg-subtle">Host: _vitrinaki-verification.{form.customDomain}</p><p className="break-all text-ui-fg-subtle">Value: vitrinaki-verification={form.domainVerificationToken}</p><p className="mt-3 font-semibold">2. CNAME</p><p className="mt-1 text-ui-fg-subtle">Host: {form.customDomain}</p><p className="text-ui-fg-subtle">Target: {domainTarget || "Δεν έχει ρυθμιστεί από το hosting του Vitrinaki ακόμη."}</p></div> : null}
                {form.domainStatus === "verified" ? <p className="text-sm font-semibold text-ui-tag-green-text">Το DNS domain έχει επαληθευτεί.</p> : null}
                <button type="button" disabled={saving || !form.customDomain || !form.domainVerificationToken} onClick={() => void verifyDomain()} className="rounded-lg border border-ui-border-base px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Επαλήθευση domain</button>
              </>
            ) : null}

            {tab === "plan" ? (
              <>
                <Intro title="Συνδρομή" text="Η συνδρομή καλύπτει την πλατφόρμα και τη λειτουργία του website. Η δημοσίευση χρειάζεται ενεργή συνδρομή." />
                <div className="rounded-xl bg-ui-bg-subtle p-4"><p className="text-xs uppercase tracking-wide text-ui-fg-subtle">Κατάσταση</p><p className="mt-1 font-semibold">{subscription?.status || "Δεν έχει ενεργοποιηθεί"}</p>{subscription?.planId ? <p className="mt-1 text-sm text-ui-fg-subtle">Πλάνο: {PLANS.find(plan => plan.id === subscription.planId)?.label || subscription.planId} · {subscription.interval === "year" ? "12 μήνες" : subscription.interval === "month" ? "χωρίς δέσμευση" : "—"}</p> : null}</div>
                {storage ? <StorageMeter storage={storage} /> : null}
                {!billingConfigured ? <p className="text-sm leading-6 text-ui-fg-subtle">Χρειάζεται να ρυθμιστούν τα στοιχεία Stripe στο backend πριν ενεργοποιηθούν πραγματικές πληρωμές.</p> : null}
                <div className="space-y-2">{PLANS.map(plan => <div key={plan.id} className="rounded-xl border border-ui-border-base p-3"><div className="font-semibold">{plan.label}</div><p className="mt-1 text-xs leading-5 text-ui-fg-subtle">{plan.text}</p><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" disabled={saving || !billingConfigured || !(availablePlans[plan.id] || []).includes("month")} onClick={() => void startBilling(plan.id, "month")} className="rounded-lg border border-ui-border-base px-2 py-2 text-xs font-semibold disabled:opacity-50">Χωρίς δέσμευση</button><button type="button" disabled={saving || !billingConfigured || !(availablePlans[plan.id] || []).includes("year")} onClick={() => void startBilling(plan.id, "year")} className="rounded-lg border border-ui-border-base px-2 py-2 text-xs font-semibold disabled:opacity-50">12 μήνες</button></div></div>)}</div>
                <div className="flex gap-2"><input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Κωδικός προσφοράς" className="min-w-0 flex-1 rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5 text-sm" /><button type="button" disabled={saving || !promoCode.trim()} onClick={() => void redeemPromo()} className="rounded-lg border border-ui-border-base px-3 py-2.5 text-sm font-semibold disabled:opacity-50">Ενεργοποίηση</button></div>
                {subscription ? <button type="button" disabled={saving || !billingConfigured} onClick={() => void openBillingPortal()} className="w-full rounded-lg border border-ui-border-base px-3 py-2.5 text-sm font-semibold disabled:opacity-50">Διαχείριση συνδρομής</button> : null}
              </>
            ) : null}
          </div>
        </div>

        <Preview url={previewUrl} draft={draft} device={device} onDevice={setDevice} />
      </div>
    </div>
  )
}

function Intro({ title, text }: { title: string; text: string }) {
  return <div><h2 className="text-base font-semibold">{title}</h2><p className="mt-1 text-sm text-ui-fg-subtle">{text}</p></div>
}

function Choice({ label, children }: { label: string; children: ReactNode }) {
  return <fieldset><legend className="mb-2 text-sm font-medium">{label}</legend>{children}</fieldset>
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-lg border px-3 py-2 text-left text-sm ${active ? "border-ui-border-interactive bg-ui-bg-subtle ring-1 ring-ui-border-interactive" : "border-ui-border-base hover:bg-ui-bg-subtle"}`}>
      {children}
    </button>
  )
}

function StorageMeter({ storage }: { storage: Storage }) {
  const share = storage.limitBytes ? Math.min(1, storage.usedBytes / storage.limitBytes) : 0
  return (
    <div className="rounded-xl bg-ui-bg-subtle p-3">
      <div className="flex justify-between text-xs font-medium"><span>Χώρος για φωτογραφίες</span><span className="text-ui-fg-subtle">{formatBytes(storage.usedBytes)} από {formatBytes(storage.limitBytes)}</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ui-border-base"><div className={`h-full rounded-full ${share > 0.9 ? "bg-ui-tag-red-icon" : "bg-ui-fg-interactive"}`} style={{ width: `${Math.max(2, share * 100)}%` }} /></div>
    </div>
  )
}

function ImageField({ label, hint, value, onChange, upload, wide }: { label: string; hint?: string; value: string; onChange: (url: string) => void; upload: (file: File) => Promise<string>; wide?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState("")
  const [showUrl, setShowUrl] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setProblem("")
    try {
      onChange(await upload(file))
    } catch (cause) {
      setProblem(cause instanceof Error ? cause.message : "Η μεταφόρτωση απέτυχε.")
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-3">
        <div className={`grid shrink-0 place-items-center overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle ${wide ? "h-16 w-28" : "h-16 w-16"}`}>
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <span className="text-[11px] text-ui-fg-muted">Καμία</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="rounded-lg border border-ui-border-base px-3 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "Ανέβασμα…" : value ? "Αλλαγή" : "Ανέβασμα"}</button>
          {value ? <button type="button" onClick={() => onChange("")} className="rounded-lg px-3 py-2 text-sm font-semibold text-ui-fg-subtle hover:text-ui-fg-base">Αφαίρεση</button> : null}
        </div>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={e => void pick(e.target.files?.[0])} />
      </div>
      {hint ? <p className="text-xs text-ui-fg-subtle">{hint}</p> : null}
      {problem ? <p role="alert" className="text-xs text-ui-tag-red-text">{problem}</p> : null}
      <button type="button" onClick={() => setShowUrl(v => !v)} className="text-xs font-medium text-ui-fg-subtle underline">{showUrl ? "Κλείσιμο" : "ή βάλε διεύθυνση εικόνας"}</button>
      {showUrl ? <input type="url" value={value} onChange={e => onChange(e.target.value)} placeholder="https://example.gr/image.jpg" className={input} /> : null}
    </div>
  )
}

// The storefront's /studio-preview page in an iframe. It says when it is
// ready, then gets the draft on every change. Desktop renders at full width
// and is scaled down to fit the column.
function Preview({ url, draft, device, onDevice }: { url: string; draft: unknown; device: "desktop" | "mobile"; onDevice: (d: "desktop" | "mobile") => void }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const origin = useMemo(() => { try { return new URL(url).origin } catch { return "" } }, [url])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin === origin && event.source === frame.current?.contentWindow && event.data?.type === "vk-preview-ready") setReady(true)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [origin])

  useEffect(() => {
    if (!ready || !draft || !origin) return
    const timer = window.setTimeout(() => frame.current?.contentWindow?.postMessage({ type: "vk-preview", shop: draft }, origin), 120)
    return () => window.clearTimeout(timer)
  }, [ready, draft, origin])

  useEffect(() => {
    const element = box.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const renderWidth = device === "desktop" ? DESKTOP_WIDTH : MOBILE_WIDTH
  const scale = size.width ? Math.min(1, size.width / renderWidth) : 1

  return (
    <section aria-label="Προεπισκόπηση" className="vk-editor-preview flex min-w-0 flex-col rounded-2xl border border-ui-border-base bg-ui-bg-subtle">
      <div className="flex items-center justify-between gap-2 border-b border-ui-border-base px-4 py-2">
        <p className="text-sm font-semibold">Προεπισκόπηση</p>
        <div role="group" aria-label="Συσκευή" className="flex rounded-lg bg-ui-bg-base p-0.5 ring-1 ring-ui-border-base">
          {(["desktop", "mobile"] as const).map(d => (
            <button key={d} type="button" aria-pressed={device === d} onClick={() => onDevice(d)} className={`rounded-md px-3 py-1 text-xs font-semibold ${device === d ? "bg-ui-bg-subtle text-ui-fg-base" : "text-ui-fg-subtle"}`}>
              {d === "desktop" ? "Υπολογιστής" : "Κινητό"}
            </button>
          ))}
        </div>
      </div>
      <div ref={box} className="vk-editor-stage relative flex-1 overflow-hidden">
        {url ? (
          <div className="absolute left-1/2 top-0" style={{ width: renderWidth, height: size.height / scale, transform: `translateX(-50%) scale(${scale})`, transformOrigin: "top center" }}>
            <iframe ref={frame} src={url} title="Προεπισκόπηση website" onLoad={() => setReady(false)} className={`h-full w-full bg-white ${device === "mobile" ? "border-x border-ui-border-base" : ""}`} />
          </div>
        ) : <p className="p-6 text-sm text-ui-fg-subtle">Η προεπισκόπηση δεν είναι διαθέσιμη.</p>}
        {url && !ready ? <p className="pointer-events-none absolute inset-x-0 top-3 text-center text-xs text-ui-fg-subtle">Φόρτωση…</p> : null}
      </div>
    </section>
  )
}
