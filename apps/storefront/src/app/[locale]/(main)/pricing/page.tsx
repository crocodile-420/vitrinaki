import type { Metadata } from "next"

import { Reveal } from "@/components/atoms/Reveal/Reveal"
import { PricingPlans } from "@/components/sections/Pricing/PricingPlans"
import { formatMoney, getPublicPricing, type PlanPrice } from "@/lib/data/vitrinaki-plans"
import { getTranslator } from "@/lib/i18n/server"
import { startHref } from "@/lib/vitrinaki-links"

// «Συνδρομή»: the plans in full. Prices come from Stripe through the backend
// (/store/vitrinaki/plans); a plan without a configured price says so instead
// of showing a number.

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTranslator()
  return {
    title: tr("Συνδρομή και πακέτα"),
    description: tr("Μία συνδρομή για ιστοσελίδα, e-shop, παραγγελίες, πληρωμές και αποστολές. Τα πακέτα διαφέρουν μόνο στο μέγεθος της ομάδας και στη βοήθεια που παίρνεις."),
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
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></>,
  lang: <><path d="M4 5h9M8.5 3v2M6 5c.8 3.5 3 6 6 7.5M11 5c-.8 3.5-3 6-6 7.5" /><path d="m13 21 4-9 4 9M14.5 18h5" /></>,
  megaphone: <><path d="M4 10v4h3l7 4V6L7 10H4Z" /><path d="M17.5 9.5a3.5 3.5 0 0 1 0 5M7 14l1.5 5h2.5l-1-4.4" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />,
  doc: <><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v4h4M9 12h6M9 16h4" /></>,
}

// Everything every plan has. Only features that exist today; myDATA is marked as coming.
const included = [
  { icon: "spark", title: "Ιστοσελίδα & e-shop", text: "Με το όνομα, το λογότυπο και τα χρώματά σου." },
  { icon: "box", title: "Προϊόντα & απόθεμα", text: "Ό,τι πουλάς, με φωτογραφίες, παραλλαγές και απόθεμα." },
  { icon: "orders", title: "Παραγγελίες & πελάτες", text: "Όλες οι παραγγελίες και οι πελάτες σου σε ένα μέρος." },
  { icon: "card", title: "Πληρωμές με κάρτα", text: "Οι πελάτες πληρώνουν με ασφάλεια, απευθείας στο κατάστημά σου." },
  { icon: "truck", title: "Αποστολές με courier", text: "Στέλνεις σε όλη την Ελλάδα με τις εταιρείες που ήδη ξέρεις." },
  { icon: "calendar", title: "Κρατήσεις online", text: "Ραντεβού και κρατήσεις κατευθείαν από την ιστοσελίδα σου." },
  { icon: "star", title: "Πόντοι επιβράβευσης", text: "Οι πελάτες μαζεύουν πόντους και ξαναγυρνούν σε σένα." },
  { icon: "globe", title: "Το δικό σου domain", text: "Ξεκινάς στο vitrinaki.gr ή συνδέεις το δικό σου." },
  { icon: "lang", title: "Ελληνικά & Αγγλικά", text: "Για πελάτες στην Ελλάδα και στο εξωτερικό." },
  { icon: "megaphone", title: "Προβολή στο Vitrinaki", text: "Η κοινή βιτρίνα βοηθά περισσότερους να σε βρουν." },
  { icon: "heart", title: "Υποστήριξη από ανθρώπους", text: "Πραγματική βοήθεια όταν τη χρειαστείς." },
  { icon: "doc", title: "Τιμολόγια myDATA", text: "Έκδοση παραστατικών με διασύνδεση στην ΑΑΔΕ.", soon: true },
] as const

const faqs = [
  { q: "Ποια είναι η διαφορά ανάμεσα στα πακέτα;", a: "Όλα τα πακέτα έχουν όλα τα εργαλεία. Διαφέρουν στο πόσα άτομα μπορούν να δουλεύουν στον λογαριασμό σου και στη βοήθεια που παίρνεις από την ομάδα μας." },
  { q: "Μπορώ να αλλάξω πακέτο αργότερα;", a: "Ναι. Από το Studio, στη «Διαχείριση συνδρομής», βλέπεις τη συνδρομή σου και τις επιλογές που έχεις. Αν μεγαλώσει η ομάδα σου, περνάς σε μεγαλύτερο πακέτο." },
  { q: "Πώς πληρώνω;", a: "Με κάρτα, μέσω Stripe. Η χρέωση γίνεται κάθε μήνα ή μία φορά τον χρόνο, ανάλογα με την περίοδο που διαλέγεις." },
  { q: "Μπορώ να ακυρώσω;", a: "Ναι, από τη «Διαχείριση συνδρομής» στο Studio. Η συνδρομή μένει ενεργή μέχρι το τέλος της περιόδου που έχεις ήδη πληρώσει." },
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

function SetupPrice({ price, tr }: { price: PlanPrice | null; tr: (s: string) => string }) {
  return price ? (
    <p className="mt-4 flex items-baseline gap-1.5">
      <span className="text-3xl font-extrabold text-[#A8432F]">{formatMoney(price.amount, price.currency)}</span>
      <span className={`text-[14px] ${MUTED}`}>{tr("μία φορά")}</span>
    </p>
  ) : (
    <p className="mt-4 text-[14px] font-semibold text-[#A8432F]">{tr("Η τιμή ανακοινώνεται σύντομα")}</p>
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
              {tr("Δεν πληρώνεις χωριστά για ιστοσελίδα, e-shop και διαχείριση. Όλα τα πακέτα έχουν όλα τα εργαλεία. Διαλέγεις ανάλογα με το μέγεθος της ομάδας σου.")}
            </p>
          </div>
          <div className="mt-10 lg:mt-12">
            <PricingPlans plans={pricing.plans} startHref={start} />
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-[13.5px] leading-6 text-[#F7F2E8]/70">
            {hasPrices
              ? tr("Ξεκινάς χωρίς κάρτα. Πληρώνεις μόνο όταν ενεργοποιήσεις τη συνδρομή στο Studio. Ήρθες με σύσταση από άλλο κατάστημα; Ο πρώτος σου μήνας είναι δωρεάν.")
              : tr("Οι τιμές οριστικοποιούνται. Πριν ξεκινήσεις θα ξέρεις ακριβώς τι πληρώνεις. Ήρθες με σύσταση από άλλο κατάστημα; Ο πρώτος σου μήνας είναι δωρεάν.")}
          </p>
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

      {/* Setup services */}
      <section aria-labelledby="setup-title" className="bg-[#F3DCD2]">
        <div className={`${WRAP} grid gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-20`}>
          <Reveal>
            <Eyebrow>{tr("Βοήθεια στο στήσιμο")}</Eyebrow>
            <H2 id="setup-title">{tr("Δεν θέλεις να το στήσεις μόνος σου;")}</H2>
            <p className={`mt-5 max-w-md text-[16px] leading-7 ${MUTED}`}>
              {tr("Μπορείς να ξεκινήσεις μόνος σου, με τους οδηγούς μας. Αν προτιμάς, το στήνουμε μαζί ή το αναλαμβάνουμε ολόκληρο. Είναι προαιρετική, εφάπαξ υπηρεσία, ξεχωριστή από τη συνδρομή. Στο πακέτο Επιχείρηση το στήσιμο είναι δωρεάν.")}
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal className="h-full">
              <div className="flex h-full flex-col rounded-3xl bg-[#F7F2E8] p-6 ring-1 ring-[#A8432F]/15">
                <p className="text-xl font-extrabold text-[#1F3628]">{tr("Το στήνουμε μαζί")}</p>
                <p className={`mt-2 flex-1 text-[14px] leading-6 ${MUTED}`}>{tr("Δουλεύουμε μαζί σου στη ρύθμιση του brand, του περιεχομένου και του αρχικού καταλόγου.")}</p>
                <SetupPrice price={pricing.setup.assisted} tr={tr} />
              </div>
            </Reveal>
            <Reveal delay={80} className="h-full">
              <div className="flex h-full flex-col rounded-3xl bg-[#F7F2E8] p-6 ring-1 ring-[#A8432F]/15">
                <p className="text-xl font-extrabold text-[#1F3628]">{tr("Το στήνουμε εμείς")}</p>
                <p className={`mt-2 flex-1 text-[14px] leading-6 ${MUTED}`}>{tr("Μας δίνεις υλικό και φωτογραφίες, κι εμείς παραδίδουμε τη βιτρίνα σου έτοιμη.")}</p>
                <SetupPrice price={pricing.setup.done_for_you} tr={tr} />
              </div>
            </Reveal>
          </div>
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
