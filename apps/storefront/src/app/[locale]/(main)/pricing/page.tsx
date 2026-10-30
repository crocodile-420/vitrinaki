import type { Metadata } from "next"

import { Reveal } from "@/components/atoms/Reveal/Reveal"
import { PricingPlans, SetupFee } from "@/components/sections/Pricing/PricingPlans"
import { formatMoney, getPublicPricing, groupThousands, SUPPORT_LABELS, type PlanPrice, type PublicPlan, type PublicPricing } from "@/lib/data/vitrinaki-plans"
import { getTranslator } from "@/lib/i18n/server"
import { startHref } from "@/lib/vitrinaki-links"

// «Συνδρομή»: the plans in full. Prices come from Stripe through the backend
// (/store/vitrinaki/plans); a plan without a configured price says so instead
// of showing a number.

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTranslator()
  return {
    title: tr("Συνδρομή και πακέτα"),
    description: tr("Μία συνδρομή για ιστοσελίδα, e-shop, παραγγελίες, πληρωμές και αποστολές. Διάλεξε πακέτο ανάλογα με την ομάδα, τα προϊόντα και τη βοήθεια που χρειάζεσαι."),
  }
}

const WRAP = "mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12"
const MUTED = "text-[#2E4A37]/70"

const iconPaths: Record<string, React.ReactNode> = {
  spark: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 8h18M8 21h8M12 18v3" /></>,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  orders: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M12 14h2M8 17h2" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></>,
  lang: <><path d="M4 5h9M8.5 3v2M6 5c.8 3.5 3 6 6 7.5M11 5c-.8 3.5-3 6-6 7.5" /><path d="m13 21 4-9 4 9M14.5 18h5" /></>,
  megaphone: <><path d="M4 10v4h3l7 4V6L7 10H4Z" /><path d="M17.5 9.5a3.5 3.5 0 0 1 0 5M7 14l1.5 5h2.5l-1-4.4" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />,
  doc: <><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v4h4M9 12h6M9 16h4" /></>,
}

// Everything every plan has (the rest is in the comparison). Only features that
// exist today; myDATA is marked as coming.
const included = [
  { icon: "spark", title: "Ιστοσελίδα & e-shop", text: "Με το όνομα, το λογότυπο και τα χρώματά σου." },
  { icon: "box", title: "Προϊόντα & απόθεμα", text: "Ό,τι πουλάς, με φωτογραφίες, παραλλαγές και απόθεμα." },
  { icon: "orders", title: "Παραγγελίες & πελάτες", text: "Όλες οι παραγγελίες και οι πελάτες σου σε ένα μέρος." },
  { icon: "card", title: "Πληρωμές με κάρτα", text: "Οι πελάτες πληρώνουν με ασφάλεια, απευθείας στο κατάστημά σου." },
  { icon: "truck", title: "Αποστολές με courier", text: "Στέλνεις σε όλη την Ελλάδα με τις εταιρείες που ήδη ξέρεις." },
  { icon: "calendar", title: "Κρατήσεις online", text: "Ραντεβού και κρατήσεις κατευθείαν από την ιστοσελίδα σου." },
  { icon: "globe", title: "Το δικό σου domain", text: "Ξεκινάς στο vitrinaki.gr ή συνδέεις το δικό σου." },
  { icon: "lang", title: "Ελληνικά & Αγγλικά", text: "Για πελάτες στην Ελλάδα και στο εξωτερικό." },
  { icon: "megaphone", title: "Στα καταστήματα του Vitrinaki", text: "Η βιτρίνα σου εμφανίζεται στον κοινό κατάλογο, για να σε βρίσκουν περισσότεροι." },
  { icon: "heart", title: "Υποστήριξη από ανθρώπους", text: "Πραγματική βοήθεια όταν τη χρειαστείς." },
  { icon: "doc", title: "Τιμολόγια myDATA", text: "Έκδοση παραστατικών με διασύνδεση στην ΑΑΔΕ.", soon: true },
] as const

const faqs = [
  { q: "Ποια είναι η διαφορά ανάμεσα στα πακέτα;", a: "Όλα τα πακέτα έχουν ιστοσελίδα, e-shop, παραγγελίες, πληρωμές, αποστολές και κρατήσεις. Διαφέρουν στα άτομα της ομάδας, στον αριθμό προϊόντων, στον χώρο για φωτογραφίες, στους πόντους επιβράβευσης, στην προβολή στην αρχική και στην υποστήριξη." },
  { q: "Μπορώ να αλλάξω πακέτο αργότερα;", a: "Ναι. Από το Studio, στη «Διαχείριση συνδρομής», βλέπεις τη συνδρομή σου και τις επιλογές που έχεις. Αν φτάσεις το όριο προϊόντων ή ατόμων, περνάς σε μεγαλύτερο πακέτο." },
  { q: "Τι σημαίνει «με δέσμευση 12 μηνών»;", a: "Πληρώνεις κάθε μήνα, σε χαμηλότερη τιμή, και δεσμεύεσαι για 12 μήνες. Χωρίς δέσμευση η μηνιαία τιμή είναι μεγαλύτερη και η πρώτη χρέωση περιλαμβάνει ένα εφάπαξ κόστος στησίματος." },
  { q: "Πώς πληρώνω;", a: "Με κάρτα, μέσω Stripe. Η χρέωση γίνεται κάθε μήνα και στις δύο επιλογές." },
  { q: "Μπορώ να ακυρώσω;", a: "Ναι, από τη «Διαχείριση συνδρομής» στο Studio. Χωρίς δέσμευση, η συνδρομή σταματά στο τέλος του μήνα που έχεις πληρώσει. Με δέσμευση 12 μηνών, η ακύρωση ισχύει όταν ολοκληρωθούν οι 12 μήνες." },
  { q: "Έχω κωδικό προσφοράς. Πού τον βάζω;", a: "Στο Studio, στην ενότητα «Συνδρομή», υπάρχει πεδίο για κωδικό προσφοράς." },
  { q: "Χρειάζεται να πληρώσω για να ξεκινήσω;", a: "Όχι. Ανοίγεις τη βιτρίνα σου και τη στήνεις χωρίς κάρτα. Τη συνδρομή την ενεργοποιείς όταν είσαι έτοιμος να τη δημοσιεύσεις." },
]

function FeatureIcon({ name }: { name: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  )
}

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${light ? "border-white/15 bg-white/5 text-[#F7F2E8]/75" : "border-[#2E4A37]/15 bg-white/60 text-[#2E4A37]/70"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${light ? "bg-[#D9806F]" : "bg-[#C0503C]"}`} />
      {children}
    </p>
  )
}

function H2({ children, id, className = "" }: { children: React.ReactNode; id?: string; className?: string }) {
  return <h2 id={id} className={`font-serif mt-5 text-[2.1rem] font-medium leading-[1.06] tracking-[-0.02em] sm:text-5xl ${className}`}>{children}</h2>
}

const PLAN_LABELS: Record<string, string> = { starter: "Starter", growth: "Growth", pro: "Pro", business: "Επιχείρηση" }

// Plan comparison, built from the limits the backend enforces.
function Compare({ plans, setupListPrice, premium, tr }: { plans: PublicPlan[]; setupListPrice: PlanPrice | null; premium?: PublicPricing["premium"]; tr: (s: string) => string }) {
  // The add-on's Stripe prices, e.g. «+9 €/μήνα · 110 € εφάπαξ».
  const premiumPrice = premium?.month
    ? `+${formatMoney(premium.month.amount, premium.month.currency)}${tr("/μήνα")}${premium.activation ? ` · ${formatMoney(premium.activation.amount, premium.activation.currency)} ${tr("εφάπαξ")}` : ""}`
    : tr("Με προσθήκη")
  const yes = <svg className="mx-auto" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-label={tr("Ναι")}><circle cx="12" cy="12" r="10" fill="#DCE6F0" /><path d="m7.5 12 3 3 6-6" stroke="#265E8E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  const no = <span className="text-[#2E4A37]/35" aria-label={tr("Όχι")}>—</span>
  const rows: { label: string; cell: (p: PublicPlan) => React.ReactNode }[] = [
    { label: "Άτομα στην ομάδα", cell: (p) => (p.memberLimit === 1 ? "1" : `${tr("έως")} ${p.memberLimit}`) },
    { label: "Προϊόντα", cell: (p) => (p.features.products === null ? tr("Απεριόριστα") : groupThousands(p.features.products)) },
    { label: "Χώρος για φωτογραφίες και αρχεία", cell: (p) => `${p.features.storageGb} GB` },
    { label: "Στήσιμο και φιλοξενία της σελίδας σου", cell: () => yes },
    { label: "Ιστοσελίδα, e-shop, παραγγελίες, πληρωμές, αποστολές", cell: () => yes },
    { label: "Κρατήσεις online", cell: () => yes },
    { label: "Το δικό σου domain", cell: () => yes },
    { label: "Πόντοι επιβράβευσης πελατών", cell: (p) => (p.features.loyalty ? yes : no) },
    { label: "Προβολή στην αρχική του Vitrinaki", cell: (p) => (p.features.promoted === "priority" ? tr("Πρώτη θέση") : p.features.promoted === "standard" ? yes : no) },
    { label: "Υποστήριξη", cell: (p) => tr(SUPPORT_LABELS[p.features.support]) },
    { label: "Premium πρότυπα με κίνηση", cell: (p) => (p.features.premium === "included" ? tr("Όλα, δωρεάν") : premiumPrice) },
    { label: "Κόστος στησίματος χωρίς δέσμευση", cell: (p) => (p.id === "business" ? tr("Δωρεάν") : p.activation ? <SetupFee fee={p.activation} listPrice={setupListPrice} /> : "—") },
    { label: "Κόστος στησίματος με δέσμευση 12 μηνών", cell: () => tr("Δωρεάν") },
  ]
  return (
    <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-0 text-left text-[14.5px]">
        <thead>
          <tr>
            <th scope="col" className="w-[34%] pb-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#2E4A37]/60">{tr("Πακέτο")}</th>
            {plans.map((p) => (
              <th key={p.id} scope="col" className="pb-4 text-center text-[17px] font-extrabold text-[#1F3628]">{tr(PLAN_LABELS[p.id])}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="border-t border-[#2E4A37]/10 py-3.5 pr-4 font-semibold text-[#1F3628]">{tr(row.label)}</th>
              {plans.map((p) => (
                <td key={p.id} className="border-t border-[#2E4A37]/10 px-2 py-3.5 text-center text-[#2E4A37]">{row.cell(p)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { tr } = await getTranslator()
  const pricing = await getPublicPricing()
  const start = startHref(locale)
  const hasPrices = pricing.plans.some((plan) => plan.month || plan.year)

  return (
    <main className="overflow-x-clip bg-[#F7F2E8] text-[#2E4A37]">
      {/* Plans */}
      <section aria-labelledby="pricing-title" className="relative isolate overflow-hidden bg-[#173A57] text-[#F7F2E8]">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_70%_at_80%_10%,#265E8E_0%,transparent_70%),radial-gradient(ellipse_45%_60%_at_5%_100%,#265E8E_0%,transparent_70%)] opacity-80" />
        <div className={`${WRAP} py-14 lg:py-20`}>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow light>{tr("Συνδρομή")}</Eyebrow>
            <h1 id="pricing-title" className="font-serif mt-5 text-[2.4rem] font-medium leading-[1.04] tracking-[-0.02em] sm:text-6xl">
              {tr("Μία συνδρομή.")} <span className="italic text-[#8DB8DE]">{tr("Όλα τα εργαλεία μαζί.")}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[16px] leading-7 text-[#F7F2E8]/80">
              {tr("Στήνουμε τη σελίδα σου και τη φιλοξενούμε, με e-shop και διαχείριση μέσα. Όλα τα πακέτα έχουν τα βασικά εργαλεία. Διαλέγεις ανάλογα με το μέγεθος της επιχείρησής σου.")}
            </p>
          </div>
          <div className="mt-10 lg:mt-12">
            <PricingPlans plans={pricing.plans} startHref={start} setupListPrice={pricing.setupListPrice} />
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-[13.5px] leading-6 text-[#F7F2E8]/70">
            {hasPrices
              ? tr("Ξεκινάς χωρίς κάρτα. Πληρώνεις μόνο όταν ενεργοποιήσεις τη συνδρομή στο Studio. Ήρθες με σύσταση από άλλο κατάστημα; Ο πρώτος σου μήνας είναι δωρεάν.")
              : tr("Οι τιμές οριστικοποιούνται. Πριν ξεκινήσεις θα ξέρεις ακριβώς τι πληρώνεις. Ήρθες με σύσταση από άλλο κατάστημα; Ο πρώτος σου μήνας είναι δωρεάν.")}
          </p>
        </div>
      </section>

      {/* Compare */}
      <section aria-labelledby="compare-title" className="bg-[#F7F2E8]">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="max-w-2xl">
            <Eyebrow>{tr("Σύγκριση")}</Eyebrow>
            <H2 id="compare-title">{tr("Τι αλλάζει από πακέτο σε πακέτο.")}</H2>
          </Reveal>
          <Reveal className="mt-10 rounded-3xl bg-white/70 p-5 ring-1 ring-[#2E4A37]/10 sm:p-8">
            <Compare plans={pricing.plans} setupListPrice={pricing.setupListPrice || null} premium={pricing.premium} tr={tr} />
          </Reveal>
        </div>
      </section>

      {/* Included in every plan */}
      <section aria-labelledby="included-title" className="bg-[#DDE6D8]">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="max-w-2xl">
            <Eyebrow>{tr("Σε όλα τα πακέτα")}</Eyebrow>
            <H2 id="included-title">{tr("Ό,τι χρειάζεσαι για να πουλάς, από την πρώτη μέρα.")}</H2>
          </Reveal>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {included.map((item, i) => (
              <Reveal key={item.title} delay={(i % 4) * 60} className="h-full">
                <li className="flex h-full gap-3 rounded-2xl bg-[#F7F2E8] p-5 ring-1 ring-[#2E4A37]/10">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2E4A37]/[0.08] text-[#2E4A37]">
                    <FeatureIcon name={item.icon} />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-[#1F3628]">
                      {tr(item.title)}
                      {"soon" in item ? <span className="ml-2 rounded-full bg-[#F3DCD2] px-2 py-0.5 align-middle text-[11px] font-semibold text-[#A8432F]">{tr("Σύντομα")}</span> : null}
                    </p>
                    <p className={`mt-1 text-[13.5px] leading-6 ${MUTED}`}>{tr(item.text)}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="pricing-faq-title" className="bg-[#2E4A37] text-[#F7F2E8]">
        <div className={`${WRAP} grid gap-10 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-20`}>
          <Reveal>
            <Eyebrow light>{tr("Ερωτήσεις")}</Eyebrow>
            <H2 id="pricing-faq-title">{tr("Για τη συνδρομή και τις χρεώσεις.")}</H2>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <Reveal key={item.q} delay={i * 50}>
                <details className="group rounded-2xl bg-[#F7F2E8] px-6 py-5 text-[#1F3628]">
                  <summary className="font-serif flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium sm:text-xl [&::-webkit-details-marker]:hidden">
                    {tr(item.q)}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2E4A37]/[0.07] text-xl font-light transition duration-300 group-open:rotate-45 group-open:bg-[#265E8E] group-open:text-white" aria-hidden="true">+</span>
                  </summary>
                  <p className={`mt-4 max-w-2xl text-[15px] leading-7 ${MUTED}`}>{tr(item.a)}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-4 py-14 sm:px-6 lg:py-20">
        <Reveal className="relative isolate mx-auto max-w-[1280px] overflow-hidden rounded-[2.5rem] bg-[#A8432F] px-6 py-12 text-center text-[#F7F2E8] sm:px-12 lg:py-16">
          <div aria-hidden="true" className="absolute -left-20 -top-32 -z-10 h-96 w-96 rounded-full bg-[#D9806F]/40 blur-[100px]" />
          <h2 className="font-serif text-[2.2rem] font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl">{tr("Το όνειρό σου αξίζει μια βιτρίνα.")}</h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] leading-7 text-[#F7F2E8]/85">{tr("Ξεκίνα σήμερα, χωρίς κάρτα. Διαλέγεις πακέτο όταν είσαι έτοιμος να δημοσιεύσεις.")}</p>
          <a href={start} className="group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F7F2E8] px-7 py-3 text-[15px] font-semibold text-[#A8432F] transition hover:-translate-y-0.5 hover:bg-white">
            {tr("Άνοιξε τη βιτρίνα σου")} <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </Reveal>
      </section>
    </main>
  )
}
