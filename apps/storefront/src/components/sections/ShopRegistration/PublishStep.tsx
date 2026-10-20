"use client"

import { useCallback, useEffect, useId, useState } from "react"

import { useTranslator } from "@/lib/i18n/client"
import { caps } from "@/lib/vitrinaki-start"

import { Field, Icon, Notice, Spinner, darkBtn, inputCls, primaryBtn, secondaryBtn } from "./ui"

type Subscription = { planId?: string; status?: string; currentPeriodEnd?: string | null } | null
type Billing = { subscription: Subscription; isPublished: boolean; handle: string }

// Team sizes match PLAN_MEMBER_LIMITS in packages/api/src/lib/vitrinaki-plans.ts.
// Prices come from the Stripe Price IDs the owner configures, so none here.
const PLANS = [
  { id: "starter", label: "Starter", text: "1 άτομο · η βιτρίνα σου με τα βασικά" },
  { id: "growth", label: "Growth", text: "έως 3 άτομα · για καταστήματα που μεγαλώνουν" },
  { id: "pro", label: "Pro", text: "έως 5 άτομα · ρόλους για την ομάδα" },
  { id: "business", label: "Επιχείρηση", text: "έως 15 άτομα με ρόλους · πολλά καταστήματα από έναν λογαριασμό · δωρεάν στήσιμο από την ομάδα μας · προτεραιότητα στην υποστήριξη" },
] as const

// «Ενεργοποίηση & δημοσίευση»: activate the plan (a promo code for now; paid
// plans come with card payments), then publish or withdraw the public page.
export function PublishStep({ locale, onExpired }: { locale: string; onExpired: () => void }) {
  const { tr } = useTranslator()
  const uid = useId()
  const [billing, setBilling] = useState<Billing | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState<"" | "promo" | "publish">("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const call = useCallback(
    async (path: string, body?: unknown) => {
      const response = await fetch(`/api/vitrinaki/shop/${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
      })
      const json = (await response.json().catch(() => ({}))) as Record<string, any>
      if (response.status === 401) {
        onExpired()
        throw new Error(json.message || "")
      }
      if (!response.ok) throw new Error(json.message || tr("Κάτι πήγε στραβά. Δοκίμασε ξανά."))
      return json
    },
    [onExpired, tr]
  )

  const refresh = useCallback(async () => {
    try {
      setBilling((await call("billing")) as Billing)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "")
    } finally {
      setLoading(false)
    }
  }, [call])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function redeem() {
    const clean = code.split(":")[0].trim()
    if (!clean) return setError(tr("Γράψε τον κωδικό σου."))
    setBusy("promo")
    setError("")
    setMessage("")
    try {
      await call("promo", { code: clean })
      setCode("")
      setMessage(tr("Ο κωδικός ενεργοποιήθηκε. Το πακέτο σου είναι ενεργό."))
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "")
    } finally {
      setBusy("")
    }
  }

  async function publish(action: "publish" | "unpublish") {
    setBusy("publish")
    setError("")
    setMessage("")
    try {
      await call("publish", { action })
      setMessage(action === "publish" ? tr("Η βιτρίνα σου δημοσιεύτηκε! Μοιράσου τη διεύθυνσή σου.") : tr("Η βιτρίνα σου αποσύρθηκε. Δεν τη βλέπουν πια οι πελάτες."))
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "")
    } finally {
      setBusy("")
    }
  }

  if (loading) return <div className="space-y-3"><div className="h-24 animate-pulse rounded-2xl bg-[#2E4A37]/[0.06]" /><div className="h-40 animate-pulse rounded-2xl bg-[#2E4A37]/[0.06]" /></div>

  const sub = billing?.subscription
  const active = Boolean(sub && ["active", "trialing"].includes(String(sub.status)))
  const planFound = PLANS.find((p) => p.id === sub?.planId)
  const planLabel = planFound ? tr(planFound.label) : sub?.planId || ""
  const path = `/${locale}/store/${billing?.handle || ""}`
  const origin = typeof window !== "undefined" ? window.location.origin : ""

  return (
    <div className="space-y-6">
      {error ? <Notice tone="error">{error}</Notice> : null}
      {message ? <Notice tone="ok">{message}</Notice> : null}

      {/* 1. plan */}
      <section className="rounded-2xl border border-[#2E4A37]/12 bg-[#F7F2E8]/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.16em] text-[#2E4A37]/60">{caps(tr("1. Πακέτο"))}</p>
            <p className="mt-1 text-[17px] font-bold text-[#1F3628]">
              {active ? `${tr("Ενεργό")} · ${planLabel}` : tr("Δεν έχει ενεργοποιηθεί ακόμα")}
            </p>
            {active && sub?.currentPeriodEnd ? (
              <p className="mt-0.5 text-[13px] text-[#2E4A37]/65">{tr("Ισχύει έως")} {new Date(sub.currentPeriodEnd).toLocaleDateString(locale === "en" ? "en-GB" : "el-GR")}</p>
            ) : null}
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold ${active ? "bg-[#2E4A37] text-[#F7F2E8]" : "bg-white text-[#2E4A37]/70 ring-1 ring-[#2E4A37]/15"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#9BD3A9]" : "bg-[#C0503C]"}`} />
            {active ? tr("Ενεργό") : tr("Ανενεργό")}
          </span>
        </div>

        {!active ? (
          <div className="mt-4">
            <Field id={`${uid}-code`} label={tr("Έχεις κωδικό ενεργοποίησης;")} hint={tr("Π.χ. από την ομάδα του Vitrinaki ή από μια προσφορά.")}>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input id={`${uid}-code`} value={code} autoCapitalize="characters" spellCheck={false} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void redeem())} placeholder="VITRINAKI-…" className={`${inputCls()} sm:flex-1`} />
                <button type="button" disabled={busy !== "" || !code.trim()} onClick={() => void redeem()} className={`${darkBtn} sm:w-auto`}>
                  {busy === "promo" ? <Spinner /> : null}
                  {tr("Ενεργοποίηση")}
                </button>
              </div>
            </Field>
          </div>
        ) : null}

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {PLANS.map((plan) => {
            const current = active && sub?.planId === plan.id
            return (
              <div key={plan.id} className={`relative flex flex-col rounded-xl border bg-white p-3.5 ${current ? "border-[#2E4A37] ring-2 ring-[#2E4A37]/15" : "border-[#2E4A37]/12"}`}>
                <p className="text-[15px] font-bold text-[#1F3628]">{tr(plan.label)}</p>
                <p className="mt-0.5 text-[12.5px] leading-5 text-[#2E4A37]/65">{tr(plan.text)}</p>
                <p className="mt-auto pt-2.5">
                  {current ? (
                    <span className="text-[12.5px] font-semibold text-[#2E4A37]">✓ {tr("Το πακέτο σου")}</span>
                  ) : (
                    <span className="rounded-full bg-[#EAF1F7] px-2 py-0.5 text-[11.5px] font-bold text-[#265E8E]">{tr("Πληρωμή με κάρτα: Σύντομα")}</span>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 2. publish */}
      <section className="rounded-2xl border border-[#2E4A37]/12 bg-white p-5">
        <p className="text-[12px] font-semibold tracking-[0.16em] text-[#2E4A37]/60">{caps(tr("2. Δημοσίευση"))}</p>
        <div className="mt-2 rounded-xl bg-[#F7F2E8] p-3.5">
          <p className="text-[12.5px] font-semibold text-[#2E4A37]/70">{tr("Η διεύθυνσή σου")}</p>
          <p className="mt-0.5 break-all text-[15px] font-semibold text-[#1F3628]">{origin.replace(/^https?:\/\//, "")}{path}</p>
          <p className="mt-1 text-[12.5px] text-[#2E4A37]/65">
            {billing?.isPublished ? tr("Δημοσιευμένη: τη βλέπουν όλοι.") : tr("Κλεισμένη για σένα. Ανοίγει στους πελάτες μόλις τη δημοσιεύσεις.")}
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          {billing?.isPublished ? (
            <>
              <a href={path} target="_blank" rel="noopener" className={primaryBtn}>
                {tr("Δες τη βιτρίνα σου")} <Icon name="external" size={17} />
              </a>
              <button type="button" disabled={busy !== ""} onClick={() => void publish("unpublish")} className={secondaryBtn}>
                {busy === "publish" ? <Spinner /> : null}
                {tr("Απόσυρση")}
              </button>
            </>
          ) : (
            <button type="button" disabled={busy !== "" || !active} onClick={() => void publish("publish")} className={primaryBtn}>
              {busy === "publish" ? <Spinner /> : <Icon name="globe" />}
              {tr("Δημοσίευση βιτρίνας")}
            </button>
          )}
        </div>
        {!active && !billing?.isPublished ? <p className="mt-2.5 text-[13px] text-[#2E4A37]/65">{tr("Η δημοσίευση ανοίγει μόλις ενεργοποιήσεις το πακέτο σου.")}</p> : null}
      </section>

      {/* 3. products, in the Studio */}
      <section className="flex flex-col gap-4 rounded-2xl border border-dashed border-[#2E4A37]/25 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E6ECE3] text-[#2E4A37]"><Icon name="box" /></span>
          <div>
            <p className="text-[15px] font-bold text-[#1F3628]">{tr("Προϊόντα & παραγγελίες")}</p>
            <p className="mt-0.5 text-[13.5px] leading-5 text-[#2E4A37]/70">{tr("Τα προϊόντα, το απόθεμα και τις παραγγελίες τα διαχειρίζεσαι στο Studio.")}</p>
          </div>
        </div>
        <form method="post" action="/api/vitrinaki/start/handoff" className="shrink-0">
          <input type="hidden" name="to" value="studio" />
          <button type="submit" className={`${secondaryBtn} w-full sm:w-auto`}>
            {tr("Πρόσθεσε προϊόντα στο Studio")} <Icon name="arrow" size={17} />
          </button>
        </form>
      </section>
    </div>
  )
}
