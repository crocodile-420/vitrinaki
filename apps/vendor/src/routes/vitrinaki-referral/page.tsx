import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { RouteConfig } from "@mercurjs/dashboard-sdk"
import { getAuthHeaders } from "@mercurjs/vendor"

declare const __BACKEND_URL__: string

// «Σύστασε έναν συνάδελφο»: the shop's referral code and link. When a business
// signs up with it and pays its first subscription, both shops get a free
// month (see packages/api/src/lib/vitrinaki-referral.ts).

export const config: RouteConfig = {
  label: "vitrinakiReferral.nav",
  translationNs: "translation",
  rank: 47,
}

type Referral = {
  code: string
  url: string
  referredCount: number
  qualifiedCount: number
  monthsEarned: number
  monthsPending: number
  monthsThisYear: number
  cap: number
  referrals: { name: string; at: string; qualified: boolean }[]
}

const backend = () => __BACKEND_URL__.replace(/\/+$/, "")
// The panel's Tailwind build only carries the classes it uses itself, so the
// layout spacing here is inline.
const stack = (gap: number) => ({ display: "flex", flexDirection: "column" as const, gap })

export default function VitrinakiReferralPage() {
  const { t, i18n } = useTranslation()
  const [data, setData] = useState<Referral | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<"" | "code" | "link">("")

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`${backend()}/vendor/vitrinaki/referral`, { headers: getAuthHeaders(), credentials: "omit" })
        const json = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(json.message || "")
        setData(json.referral)
      } catch (cause) {
        setError(cause instanceof Error && cause.message ? cause.message : t("vitrinakiReferral.loadError"))
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copy = async (what: "code" | "link") => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(what === "code" ? data.code : data.url)
      setCopied(what)
      window.setTimeout(() => setCopied(""), 2000)
    } catch {
      /* clipboard blocked: the code and link are on screen anyway */
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-8" aria-busy="true" aria-label={t("vitrinakiReferral.loading")}>
        <div className="h-8 w-64 animate-pulse rounded bg-ui-bg-subtle" />
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-ui-bg-subtle" />
      </div>
    )
  }

  const primary = "rounded-lg bg-ui-button-inverted px-4 py-2.5 text-sm font-semibold text-ui-fg-on-inverted disabled:opacity-50"
  const secondary = "rounded-lg border border-ui-border-base px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
  const date = (iso: string) => {
    const value = new Date(iso)
    return Number.isNaN(value.getTime()) ? "" : value.toLocaleDateString(i18n.language === "en" ? "en-GB" : "el-GR", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8" style={stack(24)} data-testid="vitrinaki-referral">
      <header className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-fg-subtle">{t("vitrinakiReferral.eyebrow")}</p>
        <h1 className="mt-2 font-semibold text-ui-fg-base" style={{ fontSize: 26, lineHeight: "34px" }}>{t("vitrinakiReferral.title")}</h1>
        <p className="mt-2 text-sm leading-6 text-ui-fg-subtle">{t("vitrinakiReferral.intro")}</p>
      </header>

      {error ? <div role="alert" className="rounded-xl border border-ui-tag-red-border bg-ui-tag-red-bg p-4 text-sm text-ui-tag-red-text">{error}</div> : null}

      {data ? (
        <>
          <section className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-6" style={stack(16)}>
            <div>
              <p className="text-xs uppercase tracking-wide text-ui-fg-subtle">{t("vitrinakiReferral.codeLabel")}</p>
              <div className="mt-2 flex flex-wrap items-center" style={{ gap: 12 }}>
                <span data-testid="referral-code" className="rounded-xl bg-ui-bg-subtle px-4 py-2 font-mono font-semibold text-ui-fg-base" style={{ fontSize: 24, letterSpacing: "0.08em" }}>{data.code}</span>
                <button type="button" className={secondary} onClick={() => void copy("code")}>{copied === "code" ? t("vitrinakiReferral.copied") : t("vitrinakiReferral.copyCode")}</button>
              </div>
            </div>
            <div>
              <label htmlFor="vk-referral-link" className="text-xs uppercase tracking-wide text-ui-fg-subtle">{t("vitrinakiReferral.linkLabel")}</label>
              <div className="mt-2 flex flex-wrap" style={{ gap: 8 }}>
                <input id="vk-referral-link" readOnly value={data.url} onFocus={(event) => event.currentTarget.select()} className="min-w-0 flex-1 rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2.5 text-sm text-ui-fg-base" style={{ minWidth: 220 }} />
                <button type="button" className={primary} onClick={() => void copy("link")} aria-live="polite">{copied === "link" ? t("vitrinakiReferral.copied") : t("vitrinakiReferral.copyLink")}</button>
              </div>
            </div>
            <div className="rounded-xl bg-ui-bg-subtle p-4 text-sm leading-6 text-ui-fg-base" style={stack(6)}>
              <p className="font-semibold">{t("vitrinakiReferral.howTitle")}</p>
              <p>1. {t("vitrinakiReferral.how1")}</p>
              <p>2. {t("vitrinakiReferral.how2")}</p>
            </div>
          </section>

          <section className="grid rounded-2xl border border-ui-border-base bg-ui-bg-base p-6" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {([
              ["referred", data.referredCount],
              ["earned", data.monthsEarned],
              ["pending", data.monthsPending],
            ] as const).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-ui-bg-subtle p-4">
                <p className="font-semibold text-ui-fg-base" style={{ fontSize: 28, lineHeight: "34px" }} data-testid={`referral-${key}`}>{value}</p>
                <p className="mt-1 text-xs text-ui-fg-subtle">{t(`vitrinakiReferral.stats.${key}`)}</p>
              </div>
            ))}
            <p className="text-xs leading-5 text-ui-fg-subtle" style={{ gridColumn: "1 / -1" }}>
              {data.monthsPending > 0 ? `${t("vitrinakiReferral.pendingNote")} ` : ""}
              {t("vitrinakiReferral.cap", { count: data.cap, used: data.monthsThisYear })}
            </p>
          </section>

          {data.referrals.length ? (
            <section className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-6" style={stack(10)}>
              <h2 className="text-sm font-semibold text-ui-fg-base">{t("vitrinakiReferral.listTitle")}</h2>
              <ul style={stack(8)}>
                {data.referrals.map((entry, index) => (
                  <li key={`${entry.name}-${index}`} className="flex flex-wrap items-center justify-between rounded-xl border border-ui-border-base px-4 py-3" style={{ gap: 8 }}>
                    <div>
                      <p className="text-sm font-semibold text-ui-fg-base">{entry.name || "—"}</p>
                      <p className="text-xs text-ui-fg-subtle">{t("vitrinakiReferral.joined", { date: date(entry.at) })}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${entry.qualified ? "bg-ui-tag-green-bg text-ui-tag-green-text" : "bg-ui-bg-subtle text-ui-fg-subtle"}`}>
                      {entry.qualified ? t("vitrinakiReferral.status.qualified") : t("vitrinakiReferral.status.signedUp")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="text-sm text-ui-fg-subtle">{t("vitrinakiReferral.empty")}</p>
          )}
        </>
      ) : null}
    </div>
  )
}
