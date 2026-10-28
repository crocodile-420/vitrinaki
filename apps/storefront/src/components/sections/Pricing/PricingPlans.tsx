"use client"

import { useState } from "react"

import { formatMoney, type PlanId, type PlanPrice, type PublicPlan } from "@/lib/data/vitrinaki-plans"
import { useTranslator } from "@/lib/i18n/client"

type Interval = "month" | "year"

// Plans differ only in team size (enforced in the Studio) and in the help that
// comes with them. Nothing here promises a feature gated by plan.
const planCopy: Record<PlanId, { label: string; text: string; points: string[] }> = {
  starter: { label: "Starter", text: "Η βιτρίνα σου με όλα τα βασικά.", points: ["Ιστοσελίδα & e-shop", "Παραγγελίες, πληρωμές και αποστολές", "Υποστήριξη από ανθρώπους"] },
  growth: { label: "Growth", text: "Για καταστήματα που μεγαλώνουν.", points: ["Όλα όσα έχει το Starter", "Μοιράζεσαι τη δουλειά με την ομάδα σου"] },
  pro: { label: "Pro", text: "Για ομάδες που δουλεύουν μαζί κάθε μέρα.", points: ["Όλα όσα έχει το Growth", "Χώρος για μεγαλύτερη ομάδα"] },
  business: { label: "Επιχείρηση", text: "Για μεγάλες ομάδες, με τη βοήθειά μας από την αρχή.", points: ["Όλα όσα έχει το Pro", "Δωρεάν στήσιμο από την ομάδα μας", "Προτεραιότητα στην υποστήριξη"] },
}

const RECOMMENDED: PlanId = "growth"

const team = (n: number) => (n === 1 ? "1 άτομο" : `έως ${n} άτομα`)

export function PricingPlans({ plans, startHref }: { plans: PublicPlan[]; startHref: string }) {
  const { tr } = useTranslator()
  const hasMonth = plans.some((p) => p.month)
  const hasYear = plans.some((p) => p.year)
  const [interval, setInterval] = useState<Interval>(hasMonth || !hasYear ? "month" : "year")

  return (
    <div>
      {hasMonth && hasYear ? (
        <div role="group" aria-label={tr("Περίοδος χρέωσης")} className="mx-auto mb-8 flex w-fit rounded-full bg-[#F7F2E8]/10 p-1 ring-1 ring-[#F7F2E8]/15">
          {(["month", "year"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={interval === value}
              onClick={() => setInterval(value)}
              className={`min-h-10 rounded-full px-5 text-[14px] font-semibold transition ${interval === value ? "bg-[#F7F2E8] text-[#173A57]" : "text-[#F7F2E8]/80 hover:text-[#F7F2E8]"}`}
            >
              {tr(value === "month" ? "Μηνιαία" : "Ετήσια")}
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
              <PriceBlock month={plan.month} year={plan.year} interval={interval} tr={tr} />
              <ul className="mt-5 flex-1 space-y-2 border-t border-[#2E4A37]/10 pt-5 text-[14px]">
                {copy.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#DCE6F0" /><path d="m7.5 12 3 3 6-6" stroke="#265E8E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {tr(point)}
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

function PriceBlock({ month, year, interval, tr }: { month: PlanPrice | null; year: PlanPrice | null; interval: Interval; tr: (s: string) => string }) {
  const price = interval === "month" ? month : year
  if (!price) {
    return (
      <div className="mt-5 rounded-xl bg-[#DCE6F0] px-4 py-3">
        <p className="text-[14px] font-semibold text-[#173A57]">{tr("Η τιμή ανακοινώνεται σύντομα")}</p>
      </div>
    )
  }
  if (interval === "month") {
    return (
      <p className="mt-5 flex items-baseline gap-1.5">
        <span className="text-[2.2rem] font-extrabold leading-none tracking-[-0.02em] text-[#173A57]">{formatMoney(price.amount, price.currency)}</span>
        <span className="text-[14px] text-[#2E4A37]/70">{tr("/ μήνα")}</span>
      </p>
    )
  }
  const saving = month && month.currency === price.currency ? Math.round((1 - price.amount / (month.amount * 12)) * 100) : 0
  return (
    <div className="mt-5">
      <p className="flex items-baseline gap-1.5">
        <span className="text-[2.2rem] font-extrabold leading-none tracking-[-0.02em] text-[#173A57]">{formatMoney(Math.round(price.amount / 12), price.currency)}</span>
        <span className="text-[14px] text-[#2E4A37]/70">{tr("/ μήνα")}</span>
      </p>
      <p className="mt-1.5 text-[13px] text-[#2E4A37]/70">
        {formatMoney(price.amount, price.currency)} {tr("τον χρόνο")}
        {saving > 0 ? <span className="ml-2 rounded-full bg-[#F3DCD2] px-2 py-0.5 font-semibold text-[#A8432F]">−{saving}%</span> : null}
      </p>
    </div>
  )
}
