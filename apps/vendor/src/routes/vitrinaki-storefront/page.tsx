import { useEffect, useState, type FormEvent } from "react"
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
type StorefrontForm = {
  storeName: string
  tagline: string
  description: string
  template: "atelier" | "local" | "services"
  palette: "forest" | "terracotta" | "ocean" | "plum"
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
type Subscription = { status?: string; planId?: string; interval?: string; currentPeriodEnd?: string; cancelAtPeriodEnd?: boolean } | null

const backend = () => __BACKEND_URL__.replace(/\/+$/, "")
const blank: StorefrontForm = {
  storeName: "", tagline: "Καλώς ήρθες στο κατάστημά μας", description: "",
  template: "atelier", palette: "forest", contactEmail: "", contactPhone: "",
  customDomain: "", domainStatus: "not_configured", domainVerificationToken: "", isPublished: false,
}
const palettes = [
  { value: "forest", label: "Δάσος", color: "#173f34" },
  { value: "terracotta", label: "Κεραμιδί", color: "#b95232" },
  { value: "ocean", label: "Ωκεανός", color: "#1e7184" },
  { value: "plum", label: "Δαμασκηνί", color: "#7e4b78" },
] as const

export default function VitrinakiStorefrontSettingsPage() {
  const [form, setForm] = useState<StorefrontForm>(blank)
  const [subscription, setSubscription] = useState<Subscription>(null)
  const [billingConfigured, setBillingConfigured] = useState(false)
  const [availablePlans, setAvailablePlans] = useState<Record<string, string[]>>({})
  const [setupServicesConfigured, setSetupServicesConfigured] = useState(false)
  const [domainTarget, setDomainTarget] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const callAPI = async (url: string, init?: RequestInit) => {
    const response = await fetch(`${backend()}${url}`, {
      ...init,
      headers: { ...getAuthHeaders(), ...(init?.body ? { "Content-Type": "application/json" } : {}), ...(init?.headers || {}) },
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
      setForm({ ...blank, ...data.storefront })
      setSubscription(data.subscription || null)
      setBillingConfigured(Boolean(data.billingConfigured))
      setAvailablePlans(data.availablePlans || {})
      setSetupServicesConfigured(Boolean(data.setupServicesConfigured))
      setDomainTarget(data.domainTarget || "")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Δεν ήταν δυνατή η φόρτωση των ρυθμίσεων.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  const update = (key: keyof StorefrontForm, value: string | boolean) => {
    setForm(current => ({ ...current, [key]: value }))
  }

  const addSection = () => {
    setForm(current => ({
      ...current,
      sections: [...(current.sections || []), {
        id: `section-${Date.now()}`,
        type: "text",
        title: "Νέα ενότητα",
        body: "",
        imageUrl: null,
      }].slice(0, 8),
    }))
  }

  const updateSection = (id: string, key: keyof PageSection, value: string) => {
    setForm(current => ({
      ...current,
      sections: (current.sections || []).map(section => section.id === id
        ? { ...section, [key]: value }
        : section),
    }))
  }

  const removeSection = (id: string) => {
    setForm(current => ({
      ...current,
      sections: (current.sections || []).filter(section => section.id !== id),
    }))
  }

  const submit = async (event: FormEvent, action: "save" | "publish" | "unpublish" = "save") => {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const data = await callAPI("/vendor/vitrinaki/storefront", {
        method: "POST",
        body: JSON.stringify({ action, storefront: form }),
      })
      setForm({ ...blank, ...data.storefront })
      setSubscription(data.subscription || null)
      setMessage(action === "publish" ? "Το website δημοσιεύτηκε." : action === "unpublish" ? "Το website αποσύρθηκε από τη δημοσίευση." : "Οι αλλαγές αποθηκεύτηκαν.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Δεν ήταν δυνατή η αποθήκευση.")
    } finally {
      setSaving(false)
    }
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

  const openBillingPortal = async () => {
    setSaving(true); setError("")
    try {
      const data = await callAPI("/vendor/vitrinaki/billing/portal", { method: "POST" })
      if (data.url) window.location.assign(data.url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Δεν ήταν δυνατή η διαχείριση της συνδρομής.")
    } finally { setSaving(false) }
  }

  if (loading) return <div className="mx-auto max-w-5xl p-8"><div className="h-8 w-64 animate-pulse rounded bg-ui-bg-subtle"/><div className="mt-6 h-64 animate-pulse rounded-xl bg-ui-bg-subtle"/></div>

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-fg-subtle">Vitrinaki Studio</p>
            <h1 className="mt-2 text-2xl font-semibold text-ui-fg-base sm:text-3xl">Το website της επιχείρησής σου</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ui-fg-subtle">Ρύθμισε την εικόνα, το περιεχόμενο και τη διεύθυνση της online βιτρίνας σου. Οι αλλαγές αποθηκεύονται στον λογαριασμό της επιχείρησής σου.</p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${form.isPublished ? "bg-ui-tag-green-bg text-ui-tag-green-text" : "bg-ui-bg-subtle text-ui-fg-subtle"}`}>
            {form.isPublished ? "Δημοσιευμένο" : "Πρόχειρο"}
          </span>
        </div>
      </header>

      {error ? <div role="alert" className="rounded-xl border border-ui-tag-red-border bg-ui-tag-red-bg p-4 text-sm text-ui-tag-red-text">{error}</div> : null}
      {message ? <div role="status" className="rounded-xl border border-ui-tag-green-border bg-ui-tag-green-bg p-4 text-sm text-ui-tag-green-text">{message}</div> : null}

      <form onSubmit={event => void submit(event)} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="space-y-5 rounded-2xl border border-ui-border-base bg-ui-bg-base p-6">
            <div><h2 className="text-lg font-semibold">Περιεχόμενο</h2><p className="mt-1 text-sm text-ui-fg-subtle">Τα βασικά στοιχεία που θα βλέπει ο επισκέπτης.</p></div>
            <label className="block text-sm font-medium">Όνομα καταστήματος<input required maxLength={100} value={form.storeName} onChange={e => update("storeName",e.target.value)} className="mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5" /></label>
            <label className="block text-sm font-medium">Κεντρικό μήνυμα<input maxLength={160} value={form.tagline} onChange={e => update("tagline",e.target.value)} className="mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5" /></label>
            <label className="block text-sm font-medium">Περιγραφή<textarea rows={5} maxLength={1800} value={form.description} onChange={e => update("description",e.target.value)} className="mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Email επικοινωνίας<input type="email" value={form.contactEmail} onChange={e => update("contactEmail",e.target.value)} className="mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">Τηλέφωνο<input value={form.contactPhone} onChange={e => update("contactPhone",e.target.value)} className="mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5" /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">URL λογότυπου<input type="url" value={form.logoUrl} onChange={e => update("logoUrl",e.target.value)} placeholder="https://example.gr/logo.png" className="mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">URL εικόνας εξωφύλλου<input type="url" value={form.bannerUrl} onChange={e => update("bannerUrl",e.target.value)} placeholder="https://example.gr/cover.jpg" className="mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5" /></label>
            </div>
            <p className="text-xs leading-5 text-ui-fg-subtle">Σε αυτή την έκδοση χρησιμοποιούνται URL εικόνων. Η ενσωματωμένη μεταφόρτωση εικόνων θα προστεθεί σε επόμενο βήμα.</p>
          </section>

          <section className="space-y-5 rounded-2xl border border-ui-border-base bg-ui-bg-base p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-lg font-semibold">Ενότητες σελίδας</h2><p className="mt-1 text-sm text-ui-fg-subtle">Πρόσθεσε και άλλαξε σειρά/περιεχόμενο ενοτήτων. Μέχρι 8 ενότητες σε αυτή την έκδοση.</p></div>
              <button type="button" disabled={saving || (form.sections || []).length >= 8} onClick={addSection} className="rounded-lg border border-ui-border-base px-3 py-2 text-sm font-semibold disabled:opacity-50">+ Νέα ενότητα</button>
            </div>
            {(form.sections || []).length ? (form.sections || []).map((section, index) => (
              <div key={section.id} className="space-y-3 rounded-xl border border-ui-border-base p-4">
                <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Ενότητα {index + 1}</p><button type="button" onClick={() => removeSection(section.id)} className="text-xs font-semibold text-ui-fg-subtle hover:text-ui-fg-base">Αφαίρεση</button></div>
                <label className="block text-sm font-medium">Τύπος<select value={section.type} onChange={e => updateSection(section.id,"type",e.target.value)} className="mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5"><option value="text">Κείμενο</option><option value="feature">Κάρτα / highlight</option><option value="image">Εικόνα και κείμενο</option></select></label>
                <label className="block text-sm font-medium">Τίτλος<input maxLength={160} value={section.title} onChange={e => updateSection(section.id,"title",e.target.value)} className="mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5" /></label>
                <label className="block text-sm font-medium">Κείμενο<textarea rows={3} maxLength={1600} value={section.body} onChange={e => updateSection(section.id,"body",e.target.value)} className="mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5" /></label>
                {section.type === "image" ? <label className="block text-sm font-medium">URL εικόνας<input type="url" value={section.imageUrl || ""} onChange={e => updateSection(section.id,"imageUrl",e.target.value)} placeholder="https://example.gr/image.jpg" className="mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5" /></label> : null}
              </div>
            )) : <p className="rounded-xl bg-ui-bg-subtle p-4 text-sm text-ui-fg-subtle">Δεν πρόσθεσες άλλες ενότητες. Η σελίδα θα δείχνει την κεφαλίδα, το προϊόντικό κατάλογο και τα στοιχεία επικοινωνίας.</p>}
          </section>

          <section className="space-y-5 rounded-2xl border border-ui-border-base bg-ui-bg-base p-6">
            <div><h2 className="text-lg font-semibold">Σχεδιασμός</h2><p className="mt-1 text-sm text-ui-fg-subtle">Επίλεξε τη δομή και τη χρωματική ταυτότητα της βιτρίνας.</p></div>
            <label className="block text-sm font-medium">Πρότυπο website<select value={form.template} onChange={e => update("template",e.target.value)} className="mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5"><option value="atelier">Atelier — προϊόντα & brand</option><option value="local">Local — τοπικά προϊόντα</option><option value="services">Services — υπηρεσίες</option></select></label>
            <fieldset><legend className="text-sm font-medium">Χρωματική παλέτα</legend><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{palettes.map(p => <button key={p.value} type="button" onClick={() => update("palette",p.value)} className={`rounded-xl border p-3 text-left ${form.palette===p.value ? "border-ui-border-interactive ring-2 ring-ui-border-interactive" : "border-ui-border-base"}`}><span className="mb-2 block h-8 rounded-lg" style={{backgroundColor:p.color}}/><span className="text-xs font-semibold">{p.label}</span></button>)}</div></fieldset>
            <div className="rounded-xl bg-ui-bg-subtle p-4"><p className="text-sm font-semibold">{form.storeName || "Το κατάστημά σου"}</p><p className="mt-1 text-sm text-ui-fg-subtle">{form.tagline || "Το δικό σου μήνυμα"}</p><div className="mt-3 h-2 w-2/3 rounded bg-ui-border-base"/><div className="mt-2 h-2 w-1/2 rounded bg-ui-border-base"/></div>
          </section>

          <section className="space-y-4 rounded-2xl border border-ui-border-base bg-ui-bg-base p-6">
            <div><h2 className="text-lg font-semibold">Domain</h2><p className="mt-1 text-sm text-ui-fg-subtle">Η επαλήθευση DNS είναι μόνο ένα βήμα. Το hosting πρέπει επίσης να έχει ρυθμιστεί για το domain σου.</p></div>
            <label className="block text-sm font-medium">Το domain σου<input placeholder="shop.example.gr" value={form.customDomain} onChange={e => update("customDomain",e.target.value)} className="mt-2 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5" /></label>
            {form.customDomain && form.domainVerificationToken ? <div className="rounded-xl bg-ui-bg-subtle p-4 text-sm"><p className="font-semibold">1. TXT verification</p><p className="mt-1 break-all text-ui-fg-subtle">Host: _vitrinaki-verification.{form.customDomain}</p><p className="break-all text-ui-fg-subtle">Value: vitrinaki-verification={form.domainVerificationToken}</p><p className="mt-3 font-semibold">2. CNAME</p><p className="mt-1 text-ui-fg-subtle">Host: {form.customDomain}</p><p className="text-ui-fg-subtle">Target: {domainTarget || "Δεν έχει ρυθμιστεί από το hosting του Vitrinaki ακόμη."}</p></div> : null}
            {form.domainStatus === "verified" ? <p className="text-sm font-semibold text-ui-tag-green-text">Το DNS domain έχει επαληθευτεί.</p> : null}
            <button type="button" disabled={saving || !form.customDomain || !form.domainVerificationToken} onClick={() => void verifyDomain()} className="rounded-lg border border-ui-border-base px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Επαλήθευση domain</button>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-ui-border-base bg-ui-bg-base p-6">
            <h2 className="text-lg font-semibold">Δημοσίευση</h2>
            <p className="text-sm leading-6 text-ui-fg-subtle">Αποθήκευσε πρώτα τις αλλαγές. Η δημοσίευση ενεργοποιείται όταν υπάρχει ενεργή συνδρομή.</p>
            <button type="submit" disabled={saving} className="w-full rounded-lg border border-ui-border-base px-4 py-3 text-sm font-semibold disabled:opacity-50">{saving ? "Αποθήκευση…" : "Αποθήκευση πρόχειρου"}</button>
            {form.isPublished ? <button type="button" disabled={saving} onClick={event => void submit(event as unknown as FormEvent,"unpublish")} className="w-full rounded-lg border border-ui-border-base px-4 py-3 text-sm font-semibold disabled:opacity-50">Απόσυρση website</button> : <button type="button" disabled={saving} onClick={event => void submit(event as unknown as FormEvent,"publish")} className="w-full rounded-lg bg-ui-button-inverted px-4 py-3 text-sm font-semibold text-ui-fg-on-inverted disabled:opacity-50">Δημοσίευση website</button>}
          </section>

          <section className="space-y-4 rounded-2xl border border-ui-border-base bg-ui-bg-base p-6">
            <div><h2 className="text-lg font-semibold">Συνδρομή</h2><p className="mt-1 text-sm text-ui-fg-subtle">Η συνδρομή καλύπτει την πλατφόρμα και τη λειτουργία του website. Η προαιρετική υπηρεσία setup είναι ξεχωριστή.</p></div>
            <div className="rounded-xl bg-ui-bg-subtle p-4"><p className="text-xs uppercase tracking-wide text-ui-fg-subtle">Κατάσταση</p><p className="mt-1 font-semibold">{subscription?.status || "Δεν έχει ενεργοποιηθεί"}</p>{subscription?.planId ? <p className="mt-1 text-sm text-ui-fg-subtle">Πλάνο: {subscription.planId} · {subscription.interval || "—"}</p> : null}</div>
            {!billingConfigured ? <p className="text-sm leading-6 text-ui-fg-subtle">Χρειάζεται να ρυθμιστούν τα στοιχεία Stripe στο backend πριν ενεργοποιηθούν πραγματικές πληρωμές.</p> : null}
            <div className="space-y-2">{[{id:"starter",label:"Starter"},{id:"growth",label:"Growth"},{id:"pro",label:"Pro"}].map(plan => <div key={plan.id} className="rounded-xl border border-ui-border-base p-3"><div className="font-semibold">{plan.label}</div><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" disabled={saving || !billingConfigured || !(availablePlans[plan.id] || []).includes("month")} onClick={() => void startBilling(plan.id,"month")} className="rounded-lg border border-ui-border-base px-2 py-2 text-xs font-semibold disabled:opacity-50">Μηνιαία</button><button type="button" disabled={saving || !billingConfigured || !(availablePlans[plan.id] || []).includes("year")} onClick={() => void startBilling(plan.id,"year")} className="rounded-lg border border-ui-border-base px-2 py-2 text-xs font-semibold disabled:opacity-50">Ετήσια</button></div></div>)}</div>
            {subscription ? <button type="button" disabled={saving || !billingConfigured} onClick={() => void openBillingPortal()} className="w-full rounded-lg border border-ui-border-base px-3 py-2.5 text-sm font-semibold disabled:opacity-50">Διαχείριση συνδρομής</button> : null}
          </section>

          <section className="space-y-3 rounded-2xl border border-ui-border-base bg-ui-bg-base p-6">
            <h2 className="text-lg font-semibold">Υπηρεσίες setup</h2>
            <p className="text-sm leading-6 text-ui-fg-subtle">Προαιρετική εφάπαξ εργασία: ρύθμιση brand, περιεχομένου και αρχικού καταλόγου. Η συνδρομή εξακολουθεί να ισχύει ξεχωριστά.</p>
            <button type="button" disabled={saving || !billingConfigured || !setupServicesConfigured} onClick={() => void callAPI("/vendor/vitrinaki/billing/setup-checkout",{method:"POST",body:JSON.stringify({packageId:"assisted"})}).then(data => data.url && window.location.assign(data.url)).catch(cause => setError(cause instanceof Error ? cause.message : "Δεν ήταν δυνατή η έναρξη πληρωμής."))} className="w-full rounded-lg border border-ui-border-base px-3 py-2.5 text-sm font-semibold disabled:opacity-50">Assisted Setup</button>
            <button type="button" disabled={saving || !billingConfigured || !setupServicesConfigured} onClick={() => void callAPI("/vendor/vitrinaki/billing/setup-checkout",{method:"POST",body:JSON.stringify({packageId:"done_for_you"})}).then(data => data.url && window.location.assign(data.url)).catch(cause => setError(cause instanceof Error ? cause.message : "Δεν ήταν δυνατή η έναρξη πληρωμής."))} className="w-full rounded-lg border border-ui-border-base px-3 py-2.5 text-sm font-semibold disabled:opacity-50">Done-for-you</button>
          </section>
        </aside>
      </form>
    </div>
  )
}
