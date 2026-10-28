"use client"

import { useState } from "react"

import { formatMoney, groupThousands, SUPPORT_LABELS, type PlanFeatures, type PlanId, type PlanPrice, type PublicPlan } from "@/lib/data/vitrinaki-plans"
import { useTranslator } from "@/lib/i18n/client"

// "year": 12-month commitment, billed monthly. "month": no commitment, plus a one-off activation fee.
type Interval = "month" | "year"

// Every plan includes building and hosting the shop's site; the cards list
// the limits that differ, as the backend enforces them.
const planCopy: Record<PlanId, { label: string; text: string; extra?: string }> = {
  starter: { label: "Starter", text: "Η βιτρίνα σου με όλα τα βασικά." },
  growth: { label: "Growth", text: "Για καταστήματα που μεγαλώνουν." },
  pro: { label: "Pro", text: "Για ομάδες που δουλεύουν μαζί κάθε μέρα." },
  business: { label: "Επιχείρηση", text: "Για μεγάλες ομάδες, με τη βοήθειά μας από την αρχή.", extra: "Στήσιμο χωρίς χρέωση, και χωρίς δέσμευση" },
}

// The card's list, from the same limits the backend enforces.
export function planPoints(features: PlanFeatures, tr: (s: string) => string, extra?: string) {
  return [
    tr("Στήσιμο και φιλοξενία της σελίδας σου"),
    features.products === null ? tr("Απεριόριστα προϊόντα") : tr("Έως {n} προϊόντα").replace("{n}", groupThousands(features.products)),
    tr("{n} GB για φωτογραφίες και αρχεία").replace("{n}", String(features.storageGb)),
    features.loyalty ? tr("Πόντοι επιβράβευσης πελατών") : "",
    features.promoted === "priority" ? tr("Πρώτη θέση στην προβολή της αρχικής") : features.promoted === "standard" ? tr("Προβολή στην αρχική του Vitrinaki") : "",
    `${tr("Υποστήριξη")}: ${tr(SUPPORT_LABELS[features.support]).toLowerCase()}`,
    extra ? tr(extra) : "",
  ].filter(Boolean)
}

const RECOMMENDED: PlanId = "growth"

const team = (n: number) => (n === 1 ? "1 άτομο" : `έως ${n} άτομα`)

export function PricingPlans({ plans, startHref, setupListPrice }: { plans: PublicPlan[]; startHref: string; setupListPrice?: PlanPrice | null }) {
  const { tr } = useTranslator()
  const hasMonth = plans.some((p) => p.month)
  const hasYear = plans.some((p) => p.year)
  const [interval, setInterval] = useState<Interval>(hasYear || !hasMonth ? "year" : "month")

  return (
    <div>
      {hasMonth && hasYear ? (
        <div role="group" aria-label={tr("Τρόπος συνδρομής")} className="mx-auto mb-8 flex w-fit rounded-full bg-[#F7F2E8]/10 p-1 ring-1 ring-[#F7F2E8]/15">
          {(["year", "month"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={interval === value}
              onClick={() => setInterval(value)}
              className={`min-h-10 rounded-full px-5 text-[14px] font-semibold transition ${interval === value ? "bg-[#F7F2E8] text-[#173A57]" : "text-[#F7F2E8]/80 hover:text-[#F7F2E8]"}`}
            >
              {tr(value === "year" ? "Με δέσμευση 12 μηνών" : "Χωρίς δέσμευση")}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const copy = planCopy[plan.id]
          const featured = plan.id === RECOMMENDED
          return (
            <li
              key={plan.id}
              className={`relative flex flex-col rounded-3xl bg-[#F7F2E8] p-6 text-[#1F3628] ${featured ? "ring-4 ring-[#D9806F] lg:-translate-y-3" : ""}`}
            >
              {featured ? (
                <span className="absolute -top-3 left-6 rounded-full bg-[#C0503C] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                  {tr("Προτείνουμε")}
                </span>
              ) : null}
              <p className="text-xl font-extrabold">{tr(copy.label)}</p>
              <p className="mt-0.5 text-[13px] font-semibold text-[#265E8E]">{tr(team(plan.memberLimit))}</p>
              <p className="mt-2 min-h-12 text-[14px] leading-6 text-[#2E4A37]/70">{tr(copy.text)}</p>
              <PriceBlock month={plan.month} year={plan.year} activation={plan.activation || null} listPrice={setupListPrice || null} interval={interval} tr={tr} />
              <ul className="mt-5 flex-1 space-y-2 border-t border-[#2E4A37]/10 pt-5 text-[14px]">
                {planPoints(plan.features, tr, copy.extra).map((point) => (
                  <li key={point} className="flex gap-2">
                    <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#DCE6F0" /><path d="m7.5 12 3 3 6-6" stroke="#265E8E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {point}
                  </li>
                ))}
              </ul>
              <a
                href={startHref}
                className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-[14.5px] font-semibold transition ${featured ? "bg-[#C0503C] text-white hover:bg-[#ad4633]" : "bg-[#173A57] text-[#F7F2E8] hover:bg-[#265E8E]"}`}
              >
                {tr("Ξεκίνα με")} {tr(copy.label)}
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PriceBlock({ month, year, activation, listPrice, interval, tr }: { month: PlanPrice | null; year: PlanPrice | null; activation: PlanPrice | null; listPrice: PlanPrice | null; interval: Interval; tr: (s: string) => string }) {
  const price = interval === "month" ? month : year
  if (!price) {
    return (
      <div className="mt-5 rounded-xl bg-[#DCE6F0] px-4 py-3">
        <p className="text-[14px] font-semibold text-[#173A57]">{tr("Η τιμή ανακοινώνεται σύντομα")}</p>
      </div>
    )
  }
  const saving = interval === "year" && month && month.currency === price.currency ? Math.round((1 - price.amount / month.amount) * 100) : 0
  return (
    <div className="mt-5">
      <p className="flex items-baseline gap-1.5">
        <span className="text-[2.2rem] font-extrabold leading-none tracking-[-0.02em] text-[#173A57]">{formatMoney(price.amount, price.currency)}</span>
        <span className="text-[14px] text-[#2E4A37]/70">{tr("/ μήνα")}</span>
      </p>
      <p className="mt-1.5 text-[13px] leading-5 text-[#2E4A37]/70">
        {interval === "year" ? (
          <>
            {tr("Δέσμευση 12 μηνών, χρέωση κάθε μήνα")}
            {saving > 0 ? <span className="ml-2 whitespace-nowrap rounded-full bg-[#F3DCD2] px-2 py-0.5 font-semibold text-[#A8432F]">−{saving}%</span> : null}
          </>
        ) : activation ? (
          <>{tr("Ακυρώνεις όποτε θέλεις")} · + <SetupFee fee={activation} listPrice={listPrice} /> {tr("εφάπαξ στήσιμο")}</>
        ) : (
          tr("Ακυρώνεις όποτε θέλεις")
        )}
      </p>
    </div>
  )
}

// The setup fee, with its full price struck through when it is higher.
export function SetupFee({ fee, listPrice }: { fee: PlanPrice; listPrice: PlanPrice | null }) {
  const discounted = listPrice && listPrice.currency === fee.currency && listPrice.amount > fee.amount
  return (
    <span className="whitespace-nowrap">
      {discounted ? <s className="mr-1 opacity-60">{formatMoney(listPrice.amount, listPrice.currency)}</s> : null}
      <span className="font-semibold">{formatMoney(fee.amount, fee.currency)}</span>
    </span>
  )
}
