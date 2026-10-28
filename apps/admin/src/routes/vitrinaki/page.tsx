import { useEffect, useState } from "react"
import type { RouteConfig } from "@mercurjs/dashboard-sdk"
import { getAuthHeaders } from "@mercurjs/admin"

declare const __BACKEND_URL__: string

export const config: RouteConfig = { label: "Vitrinaki overview", rank: 10 }

type StorefrontRecord = {
  sellerId: string
  businessName: string
  handle: string
  status?: string
  email?: string
  storefront: {
    name: string
    template: string
    palette: string
    isPublished: boolean
    customDomain: string
    domainStatus: string
  }
  subscription: null | {
    planId: string
    interval: string
    status: string
    currentPeriodEnd?: string | null
    cancelAtPeriodEnd?: boolean
  }
  setupOrders: { id: string; packageId: string; status: string; createdAt?: string; amountTotal?: number; currency?: string }[]
}
type Overview = {
  summary: { businesses: number; storefronts: number; published: number; subscriptionsActive: number; subscriptionsPastDue: number; domainsPending: number }
  storefronts: StorefrontRecord[]
  billingConfigured: boolean
  customDomainTargetConfigured: boolean
}

const statusLabel: Record<string, string> = {
  active: "Ενεργή",
  trialing: "Δοκιμαστική",
  past_due: "Εκκρεμεί πληρωμή",
  unpaid: "Ανεξόφλητη",
  canceled: "Ακυρωμένη",
  incomplete: "Μη ολοκληρωμένη",
  pending: "Σε αναμονή",
  verified: "Επαληθευμένο",
  not_configured: "Δεν ρυθμίστηκε",
  paid: "Πληρωμένο",
  checkout_created: "Checkout δημιουργήθηκε",
}

type PromotedShop = {
  sellerId: string
  handle: string
  storeName: string
  isVisible: boolean
  planAllows?: boolean
  promoted: string[]
  products: { id: string; title: string; thumbnail: string | null; status: string }[]
}

const api = (path: string, init?: RequestInit) =>
  fetch(`${__BACKEND_URL__.replace(/\/+$/, "")}${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    credentials: "omit",
  }).then(async (response) => {
    const json = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(json.message || `Το αίτημα απέτυχε (${response.status}).`)
    return json
  })

/* Products promoted on the homepage marketplace («Προωθημένα προϊόντα»). Each
   card there links to the shop's own page, so promoting is advertising for it. */
function PromotedProducts() {
  const [shops, setShops] = useState<PromotedShop[] | null>(null)
  const [max, setMax] = useState(12)
  const [open, setOpen] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    api("/admin/vitrinaki/promoted")
      .then((json) => { setShops(json.shops || []); setMax(json.maxPerShop || 12) })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Δεν φορτώθηκαν τα προϊόντα."))
  }, [])

  const selected = (shop: PromotedShop) => draft[shop.sellerId] ?? shop.promoted
  const toggle = (shop: PromotedShop, id: string) => {
    const current = selected(shop)
    const next = current.includes(id) ? current.filter((value) => value !== id) : current.length < max ? [...current, id] : current
    setDraft((all) => ({ ...all, [shop.sellerId]: next }))
  }
  const save = async (shop: PromotedShop) => {
    setSaving(shop.sellerId); setError(""); setNotice("")
    try {
      const json = await api("/admin/vitrinaki/promoted", { method: "POST", body: JSON.stringify({ sellerId: shop.sellerId, productIds: selected(shop) }) })
      setShops((all) => (all || []).map((item) => item.sellerId === shop.sellerId ? { ...item, promoted: json.promoted } : item))
      setDraft((all) => { const { [shop.sellerId]: _, ...rest } = all; return rest })
      setNotice(`Αποθηκεύτηκε: ${shop.storeName}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Δεν αποθηκεύτηκε.")
    } finally {
      setSaving("")
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-ui-border-base bg-ui-bg-base">
      <div className="border-b border-ui-border-base px-5 py-4">
        <h2 className="font-semibold">Προωθημένα προϊόντα στην αρχική</h2>
        <p className="mt-1 text-sm text-ui-fg-subtle">Διάλεξε ποια προϊόντα κάθε καταστήματος εμφανίζονται στο marketplace της αρχικής σελίδας, με κουμπί προς τη σελίδα του καταστήματος. Έως {max} ανά κατάστημα. Φαίνονται μόνο όσο το κατάστημα είναι δημοσιευμένο με ενεργή συνδρομή.</p>
      </div>
      {error ? <div role="alert" className="border-b border-ui-border-base bg-ui-tag-red-bg px-5 py-3 text-sm text-ui-tag-red-text">{error}</div> : null}
      {notice ? <div role="status" className="border-b border-ui-border-base bg-ui-tag-green-bg px-5 py-3 text-sm text-ui-tag-green-text">{notice}</div> : null}
      {!shops ? <div className="p-6 text-sm text-ui-fg-subtle">{error ? "" : "Φόρτωση…"}</div> : !shops.length ? <div className="p-6 text-sm text-ui-fg-subtle">Δεν υπάρχουν ακόμα καταστήματα με website.</div> : (
        <ul>
          {shops.map((shop) => {
            const chosen = selected(shop)
            const dirty = draft[shop.sellerId] !== undefined
            const expanded = open === shop.sellerId
            return (
              <li key={shop.sellerId} className="border-t border-ui-border-base first:border-t-0">
                <button type="button" onClick={() => setOpen(expanded ? null : shop.sellerId)} aria-expanded={expanded} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-ui-bg-subtle">
                  <span>
                    <span className="font-semibold">{shop.storeName}</span>
                    <span className="ml-2 text-xs text-ui-fg-subtle">{shop.handle} · {shop.products.length} προϊόντα{shop.isVisible ? "" : " · δεν φαίνεται δημόσια"}{shop.planAllows === false ? " · το πακέτο του δεν περιλαμβάνει προβολή (από Pro)" : ""}</span>
                  </span>
                  <span className="shrink-0 text-sm text-ui-fg-subtle">{chosen.length ? `${chosen.length} προωθημένα` : "—"} {expanded ? "▴" : "▾"}</span>
                </button>
                {expanded ? (
                  <div className="space-y-3 px-5 pb-5">
                    {!shop.products.length ? <p className="text-sm text-ui-fg-subtle">Το κατάστημα δεν πουλάει ακόμα προϊόντα.</p> : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {shop.products.map((product) => {
                          const on = chosen.includes(product.id)
                          return (
                            <label key={product.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 ${on ? "border-ui-border-interactive ring-1 ring-ui-border-interactive" : "border-ui-border-base"}`}>
                              <input type="checkbox" checked={on} onChange={() => toggle(shop, product.id)} disabled={!on && chosen.length >= max} />
                              {product.thumbnail ? <img src={product.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" /> : <span className="h-10 w-10 shrink-0 rounded-md bg-ui-bg-subtle" />}
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium">{product.title}</span>
                                {product.status && product.status !== "published" ? <span className="block text-xs text-ui-fg-subtle">Μη δημοσιευμένο, δεν θα φανεί</span> : null}
                              </span>
                              {on ? <span className="ml-auto shrink-0 text-xs font-semibold text-ui-fg-subtle">#{chosen.indexOf(product.id) + 1}</span> : null}
                            </label>
                          )
                        })}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => void save(shop)} disabled={!dirty || saving === shop.sellerId} className="rounded-lg bg-ui-button-inverted px-4 py-2 text-sm font-semibold text-ui-fg-on-inverted disabled:opacity-50">{saving === shop.sellerId ? "Αποθήκευση…" : "Αποθήκευση"}</button>
                      {dirty ? <button type="button" onClick={() => setDraft((all) => { const { [shop.sellerId]: _, ...rest } = all; return rest })} className="text-sm text-ui-fg-subtle underline">Ακύρωση</button> : null}
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default function VitrinakiOverviewPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch(`${__BACKEND_URL__.replace(/\/+$/, "")}/admin/vitrinaki/overview`, {
          headers: getAuthHeaders(),
          credentials: "omit",
        })
        const json = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(json.message || `Το αίτημα απέτυχε (${response.status}).`)
        if (!cancelled) setData(json as Overview)
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Δεν φορτώθηκαν τα στοιχεία.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const metrics = data ? [
    { label: "Επιχειρήσεις", value: data.summary.businesses },
    { label: "Website που δημιουργήθηκαν", value: data.summary.storefronts },
    { label: "Δημοσιευμένα", value: data.summary.published },
    { label: "Ενεργές συνδρομές", value: data.summary.subscriptionsActive },
    { label: "Πληρωμές σε εκκρεμότητα", value: data.summary.subscriptionsPastDue },
    { label: "Domains προς επαλήθευση", value: data.summary.domainsPending },
  ] : []

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-fg-subtle">Vitrinaki · Platform Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-ui-fg-base sm:text-3xl">Επισκόπηση επιχειρήσεων & websites</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ui-fg-subtle">Παρακολούθησε τις βιτρίνες, τις συνδρομές, τις εκκρεμείς πληρωμές και τα custom domains. Η σελίδα είναι ενημερωτική· δεν αλλάζει χειροκίνητα την κατάσταση πληρωμών του Stripe.</p>
      </header>

      {error ? <div role="alert" className="rounded-xl border border-ui-tag-red-border bg-ui-tag-red-bg p-4 text-sm text-ui-tag-red-text">{error}</div> : null}
      {loading ? <div className="rounded-xl border border-ui-border-base p-8 text-sm text-ui-fg-subtle">Φόρτωση στοιχείων…</div> : null}

      {data ? <>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map(metric => <div key={metric.label} className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-5"><p className="text-sm text-ui-fg-subtle">{metric.label}</p><p className="mt-2 text-3xl font-semibold">{metric.value}</p></div>)}
        </section>
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-5"><p className="text-sm text-ui-fg-subtle">Stripe billing</p><p className="mt-2 font-semibold">{data.billingConfigured ? "Ρυθμισμένο" : "Δεν έχει ρυθμιστεί"}</p><p className="mt-1 text-sm text-ui-fg-subtle">Οι πραγματικές χρεώσεις απαιτούν έγκυρα API και webhook secrets και price IDs.</p></div>
          <div className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-5"><p className="text-sm text-ui-fg-subtle">Custom domain hosting target</p><p className="mt-2 font-semibold">{data.customDomainTargetConfigured ? "Ρυθμισμένο" : "Δεν έχει ρυθμιστεί"}</p><p className="mt-1 text-sm text-ui-fg-subtle">Η επαλήθευση DNS δεν ενεργοποιεί αυτόματα TLS ή τη διαμόρφωση του hosting.</p></div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-ui-border-base bg-ui-bg-base">
          <div className="border-b border-ui-border-base px-5 py-4"><h2 className="font-semibold">Καταστήματα</h2><p className="mt-1 text-sm text-ui-fg-subtle">Σύνολο που επιστρέφει το API: {data.storefronts.length}</p></div>
          {!data.storefronts.length ? <div className="p-8 text-sm text-ui-fg-subtle">Δεν υπάρχουν ακόμα αποθηκευμένες ρυθμίσεις website.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-ui-bg-subtle text-ui-fg-subtle"><tr><th className="px-4 py-3 font-medium">Επιχείρηση</th><th className="px-4 py-3 font-medium">Κατάσταση</th><th className="px-4 py-3 font-medium">Συνδρομή</th><th className="px-4 py-3 font-medium">Domain</th><th className="px-4 py-3 font-medium">Setup υπηρεσίες</th></tr></thead><tbody>{data.storefronts.map(item => <tr key={item.sellerId} className="border-t border-ui-border-base align-top"><td className="px-4 py-4"><div className="font-semibold">{item.storefront.name || item.businessName}</div><div className="mt-1 text-xs text-ui-fg-subtle">{item.handle} · {item.email || item.sellerId}</div></td><td className="px-4 py-4"><span className="font-semibold">{item.storefront.isPublished ? "Δημοσιευμένο" : "Πρόχειρο"}</span><div className="mt-1 text-xs text-ui-fg-subtle">{item.storefront.template} / {item.storefront.palette}</div></td><td className="px-4 py-4">{item.subscription ? <><div className="font-semibold">{statusLabel[item.subscription.status] || item.subscription.status}</div><div className="mt-1 text-xs text-ui-fg-subtle">{item.subscription.planId} · {item.subscription.interval}</div>{item.subscription.currentPeriodEnd ? <div className="mt-1 text-xs text-ui-fg-subtle">Έως {new Date(item.subscription.currentPeriodEnd).toLocaleDateString("el-GR")}</div> : null}</> : <span className="text-ui-fg-subtle">Χωρίς συνδρομή</span>}</td><td className="px-4 py-4">{item.storefront.customDomain ? <><div>{item.storefront.customDomain}</div><div className="mt-1 text-xs text-ui-fg-subtle">{statusLabel[item.storefront.domainStatus] || item.storefront.domainStatus}</div></> : <span className="text-ui-fg-subtle">Δεν ορίστηκε</span>}</td><td className="px-4 py-4">{item.setupOrders.length ? item.setupOrders.map(order => <div key={order.id} className="mb-2"><div className="font-semibold">{order.packageId}</div><div className="text-xs text-ui-fg-subtle">{statusLabel[order.status] || order.status}</div></div>) : <span className="text-ui-fg-subtle">—</span>}</td></tr>)}</tbody></table></div>}
        </section>
        <PromotedProducts />
      </> : null}
    </div>
  )
}
