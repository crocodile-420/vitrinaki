import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { RouteConfig } from "@mercurjs/dashboard-sdk"
import { getAuthHeaders } from "@mercurjs/vendor"

declare const __BACKEND_URL__: string

export const config: RouteConfig = {
  // Literal: the sidebar shows route labels as written (no i18n lookup).
  label: "Πληρωμές με κάρτα",
  rank: 46,
}

type PaymentsState = {
  configured: boolean
  status: "not_connected" | "pending" | "active"
  accountId: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  requirementsDue: number
}

// The panel's Tailwind build only carries the classes it uses itself, so the
// layout spacing here is inline.
const stack = (gap: number) => ({ display: "flex", flexDirection: "column" as const, gap })

const backend = () => __BACKEND_URL__.replace(/\/+$/, "")

const badge: Record<PaymentsState["status"], string> = {
  not_connected: "bg-ui-bg-subtle text-ui-fg-subtle",
  pending: "bg-ui-tag-orange-bg text-ui-tag-orange-text",
  active: "bg-ui-tag-green-bg text-ui-tag-green-text",
}

// «Πληρωμές με κάρτα»: the shop connects its own Stripe account (direct
// charges, the shop is the merchant) and sees whether card payments are on.
export default function VitrinakiPaymentsPage() {
  const { t } = useTranslation()
  const [state, setState] = useState<PaymentsState | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const callAPI = async (url: string, init?: RequestInit) => {
    const response = await fetch(`${backend()}${url}`, {
      ...init,
      headers: { ...getAuthHeaders(), ...(init?.body ? { "Content-Type": "application/json" } : {}) },
      credentials: "omit",
    })
    const json = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(json.message || `${response.status}`)
    return json
  }

  const load = async (refresh: boolean) => {
    setError("")
    try {
      const data = await callAPI(`/vendor/vitrinaki/payments${refresh ? "?refresh=1" : ""}`)
      setState(data.payments)
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : t("vitrinakiPayments.loadError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Back from Stripe's onboarding: read the account from Stripe right away.
    const params = new URLSearchParams(window.location.search)
    const back = params.has("stripe")
    if (back) window.history.replaceState(null, "", window.location.pathname)
    void load(back)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connect = async () => {
    setBusy(true)
    setError("")
    try {
      const data = await callAPI("/vendor/vitrinaki/payments/connect", { method: "POST", body: "{}" })
      if (data.url) window.location.assign(data.url)
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : t("vitrinakiPayments.connectError"))
      setBusy(false)
    }
  }

  const recheck = async () => {
    setBusy(true)
    await load(true)
    setBusy(false)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-8" aria-busy="true" aria-label={t("vitrinakiPayments.loading")}>
        <div className="h-8 w-64 animate-pulse rounded bg-ui-bg-subtle" />
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-ui-bg-subtle" />
      </div>
    )
  }

  const status = state?.status || "not_connected"
  const primary = "rounded-lg bg-ui-button-inverted px-4 py-2.5 text-sm font-semibold text-ui-fg-on-inverted disabled:opacity-50"
  const secondary = "rounded-lg border border-ui-border-base px-4 py-2.5 text-sm font-semibold disabled:opacity-50"

  return (
    <div className="mx-auto max-w-3xl px-4 py-8" style={stack(24)} data-testid="vitrinaki-payments">
      <header className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-fg-subtle">{t("vitrinakiPayments.eyebrow")}</p>
        <h1 className="mt-2 font-semibold text-ui-fg-base" style={{ fontSize: 26, lineHeight: "34px" }}>{t("vitrinakiPayments.title")}</h1>
        <p className="mt-2 text-sm leading-6 text-ui-fg-subtle">{t("vitrinakiPayments.intro")}</p>
      </header>

      {error ? <div role="alert" className="rounded-xl border border-ui-tag-red-border bg-ui-tag-red-bg p-4 text-sm text-ui-tag-red-text">{error}</div> : null}

      {state ? (
        <section className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-6" style={stack(14)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-ui-fg-subtle">{t("vitrinakiPayments.statusLabel")}</p>
              {state.accountId ? <p className="mt-1 text-xs text-ui-fg-muted">{t("vitrinakiPayments.account")}: {state.accountId}</p> : null}
            </div>
            <span data-testid="payments-status" className={`rounded-full px-3 py-1.5 text-xs font-semibold ${badge[status]}`}>
              {t(`vitrinakiPayments.status.${status}`)}
            </span>
          </div>

          {!state.configured ? (
            <p className="rounded-xl bg-ui-bg-subtle p-4 text-sm leading-6 text-ui-fg-subtle">{t("vitrinakiPayments.notConfigured")}</p>
          ) : status === "not_connected" ? (
            <>
              <p className="text-sm leading-6 text-ui-fg-base">{t("vitrinakiPayments.notConnected.text")}</p>
              <p className="text-sm leading-6 text-ui-fg-subtle">{t("vitrinakiPayments.notConnected.hidden")}</p>
              <button type="button" className={primary} style={{ alignSelf: "flex-start" }} disabled={busy} onClick={() => void connect()}>{t("vitrinakiPayments.notConnected.button")}</button>
            </>
          ) : status === "pending" ? (
            <>
              <p className="text-sm leading-6 text-ui-fg-base">{t("vitrinakiPayments.pending.text")}</p>
              {state.requirementsDue > 0 ? <p className="text-sm text-ui-fg-subtle">{t("vitrinakiPayments.pending.requirements", { count: state.requirementsDue })}</p> : null}
              <p className="text-sm leading-6 text-ui-fg-subtle">{t("vitrinakiPayments.notConnected.hidden")}</p>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                <button type="button" className={primary} disabled={busy} onClick={() => void connect()}>{t("vitrinakiPayments.pending.button")}</button>
                <button type="button" className={secondary} disabled={busy} onClick={() => void recheck()}>{t("vitrinakiPayments.pending.refresh")}</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-6 text-ui-fg-base">{t("vitrinakiPayments.active.text")}</p>
              {!state.payoutsEnabled ? <p className="rounded-xl bg-ui-bg-subtle p-4 text-sm leading-6 text-ui-fg-subtle">{t("vitrinakiPayments.active.payoutsPending")}</p> : null}
              <p className="text-sm leading-6 text-ui-fg-subtle">{t("vitrinakiPayments.active.refunds")}</p>
              <a href="https://dashboard.stripe.com/" target="_blank" rel="noreferrer" className={secondary} style={{ alignSelf: "flex-start" }}>{t("vitrinakiPayments.active.dashboard")}</a>
            </>
          )}
        </section>
      ) : null}
    </div>
  )
}
