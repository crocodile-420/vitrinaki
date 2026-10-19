import type { Metadata } from "next"

import { Reveal } from "@/components/atoms/Reveal/Reveal"
import { StartFlow } from "@/components/sections/StartFlow/StartFlow"
import { readStartSession } from "@/lib/data/vitrinaki-start"
import { getTranslator } from "@/lib/i18n/server"
import { privacyUrl, studioLoginUrl, termsUrl } from "@/lib/vitrinaki-links"
import { caps } from "@/lib/vitrinaki-start"

// «Άνοιξε τη βιτρίνα σου»: the product page and the sign-up in one. The form
// creates a real shop (see /api/vitrinaki/start) and then offers a few optional
// first steps before handing the new seller over to the Studio.

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTranslator()
  return {
    title: tr("Άνοιξε τη βιτρίνα σου"),
    description: tr("Το δικό σου e-shop με το όνομα, τα χρώματα και την ιστορία της επιχείρησής σου. Ξεκινάς με ένα όνομα και ένα email."),
  }
}

const WRAP = "mx-auto max-w-[1280px] px-4 sm:px-8 lg:px-12"

const features = [
  { icon: "spark", color: "#C0503C", title: "Δημιουργία website σε λίγα λεπτά", text: "Διαλέγεις template, βάζεις όνομα, λογότυπο και χρώματα και το site σου είναι έτοιμο." },
  { icon: "cart", color: "#2E4A37", title: "Online κατάστημα με πλήρη διαχείριση", text: "Προϊόντα, παραλλαγές, απόθεμα, καλάθι και παραγγελίες, όλα σε ένα σημείο." },
  { icon: "globe", color: "#265E8E", title: "Το δικό σου domain", text: "Ξεκινάς στο vitrinaki.gr/το-όνομά-σου ή συνδέεις το δικό σου domain." },
  { icon: "box", color: "#2E4A37", title: "Διαχείριση αποθέματος από το Studio", text: "Βλέπεις τι τελειώνει και ενημερώνεις ποσότητες με ένα κλικ." },
  { icon: "lang", color: "#265E8E", title: "Ελληνικά & Αγγλικά", text: "Το κατάστημά σου μιλά τη γλώσσα των πελατών σου, στην Ελλάδα και στο εξωτερικό." },
  { icon: "heart", color: "#C0503C", title: "Υποστήριξη που σε νοιάζεται", text: "Άνθρωποι δίπλα σου, με οδηγούς και πραγματική βοήθεια όταν τη χρειαστείς." },
] as const

const soon = [
  { icon: "card", title: "Πληρωμές με κάρτα" },
  { icon: "calendar", title: "Κρατήσεις online" },
  { icon: "doc", title: "Τιμολόγια myDATA" },
] as const

const steps = [
  { title: "Ανοίγεις τη βιτρίνα σου", text: "Όνομα, email και κωδικός. Παίρνεις αμέσως τη δική σου διεύθυνση στο vitrinaki.gr." },
  { title: "Τη στήνεις στο Studio", text: "Προϊόντα ή υπηρεσίες, φωτογραφίες, χρώματα και η ιστορία σου, με τον δικό σου ρυθμό." },
  { title: "Τη δημοσιεύεις", text: "Όταν είσαι έτοιμος, ανοίγεις στους πελάτες και μοιράζεσαι το link. Πριν δημοσιεύσεις, ξέρεις ακριβώς τι πληρώνεις." },
] as const

const notAsked = [
  { title: "Κάρτα", text: "Δεν χρειάζεται για να φτιάξεις τη βιτρίνα σου." },
  { title: "ΑΦΜ & νομικά στοιχεία", text: "Τα συμπληρώνεις αργότερα, από το Studio." },
  { title: "Τεχνικές γνώσεις", text: "Αν ξέρεις να στέλνεις email, ξέρεις αρκετά." },
] as const

const faqs = [
  { q: "Πόσο κοστίζει;", a: "Οι τιμές οριστικοποιούνται. Η δέσμευσή μας είναι απλή: πριν ξεκινήσεις θα ξέρεις ακριβώς τι πληρώνεις, τι περιλαμβάνεται και τι όχι." },
  { q: "Πότε θα βλέπουν οι πελάτες τη σελίδα μου;", a: "Όταν τη δημοσιεύσεις από το Studio. Μέχρι τότε τη στήνεις με την ησυχία σου και τη βλέπεις μόνο εσύ." },
  { q: "Μπορώ να αλλάξω όνομα, χρώματα ή κείμενα αργότερα;", a: "Ναι. Όλα όσα συμπληρώνεις εδώ αλλάζουν όποτε θέλεις από το Studio." },
  { q: "Κι αν δεν θέλω να το στήσω μόνος μου;", a: "Δεν χρειάζεται. Μπορείς να ξεκινήσεις μόνος σου, με καθοδήγηση, ή να μας ζητήσεις βοήθεια στο αρχικό στήσιμο." },
] as const

const iconPaths: Record<string, React.ReactNode> = {
  spark: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 8h18M8 21h8M12 18v3" /></>,
  cart: <><path d="M3 4h2l2.4 11h10.2L20 8H6.2" /><circle cx="9" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></>,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  lang: <><path d="M4 5h9M8.5 3v2M6 5c.8 3.5 3 6 6 7.5M11 5c-.8 3.5-3 6-6 7.5" /><path d="m13 21 4-9 4 9M14.5 18h5" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  doc: <><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v4h4M9 12h6M9 16h4" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M12 14h2M8 17h2" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  minus: <path d="M6 12h12" />,
}

function FeatureIcon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  )
}

function Swoosh({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 24" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path d="M4 18C110 2 250 2 396 14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function OliveSprig({ className = "" }: { className?: string }) {
  const leaves: [number, number, number][] = [[30, 40, -40], [46, 66, 35], [62, 52, -35], [80, 82, 40], [96, 66, -30], [116, 96, 35], [132, 80, -25], [154, 104, 30]]
  return (
    <svg className={className} viewBox="0 0 200 140" fill="none" aria-hidden="true">
      <path d="M10 20C60 50 120 90 196 124" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {leaves.map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y}c8-6 20-6 28 0-8 6-20 6-28 0Z`} transform={`rotate(${r} ${x} ${y})`} fill="currentColor" opacity={0.6 + (i % 3) * 0.15} />
      ))}
    </svg>
  )
}

export default async function StartPage() {
  const { tr } = await getTranslator()
  const session = await readStartSession()

  const intro = (
    <div>
      <p className="hidden items-center gap-2 rounded-full sm:inline-flex border border-[#2E4A37]/15 bg-white/60 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-[#2E4A37]/70">
        <span className="h-1.5 w-1.5 rounded-full bg-[#C0503C]" />
        {caps(tr("Για καταστήματα, δημιουργούς & επαγγελματίες"))}
      </p>
      <h1 className="text-[2.3rem] sm:mt-5 font-extrabold leading-[1.05] tracking-[-0.03em] text-[#1F3628] sm:text-[3rem] lg:text-[3.1rem]">
        {tr("Η βιτρίνα σου ξεκινά")}{" "}
        <span className="relative inline-block text-[#C0503C]">
          {tr("με ένα όνομα.")}
          <Swoosh className="absolute -bottom-2 left-0 h-2.5 w-full text-[#C0503C]/45" />
        </span>
      </h1>
      <p className="mt-5 max-w-xl text-[16px] leading-7 text-[#1F3628]/75">
        {tr("Γράψε πώς λέγεται η επιχείρησή σου και δες τη σελίδα σου να παίρνει μορφή. Προϊόντα, χρώματα και την ιστορία σου τα προσθέτεις όποτε είσαι έτοιμος.")}
      </p>
    </div>
  )

  const benefits = (
    <ul className="mt-6 grid gap-2.5 text-[14.5px] font-medium leading-6 text-[#1F3628]/85 sm:grid-cols-3 sm:gap-4">
      {[
        "Δική σου διεύθυνση από την πρώτη μέρα",
        "Χωρίς κάρτα, χωρίς τεχνικές γνώσεις",
        "Άνθρωποι δίπλα σου, αν κολλήσεις",
      ].map((line) => (
        <li key={line} className="flex items-start gap-2.5">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#2E4A37] text-[#F7F2E8]"><FeatureIcon name="check" size={12} /></span>
          <span>{tr(line)}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <main className="overflow-hidden bg-[#F7F2E8] text-[#2E4A37]">
      {/* Hero: pitch + live preview + sign-up */}
      <section className="relative isolate">
        <OliveSprig className="pointer-events-none absolute -left-14 top-6 -z-10 w-44 -rotate-12 text-[#2E4A37]/15 sm:w-56" />
        <div aria-hidden="true" className="absolute -right-40 -top-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-[#C0503C]/[0.07] blur-3xl" />
        <div className={`${WRAP} pb-14 pt-8 sm:pt-12 lg:pb-20 lg:pt-14`}>
          <StartFlow
            studioLoginUrl={studioLoginUrl}
            termsUrl={termsUrl || undefined}
            privacyUrl={privacyUrl || undefined}
            resume={session ? { name: session.name, handle: session.handle, email: session.email, saved: session.saved || [] } : null}
            intro={intro}
            benefits={benefits}
          />
        </div>
      </section>

      {/* What you get */}
      <section aria-labelledby="start-included" className="bg-[#2E4A37] text-[#F7F2E8]">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 id="start-included" className="max-w-xl text-[1.8rem] font-extrabold leading-tight tracking-[-0.02em] sm:text-[2.2rem]">{tr("Τι παίρνεις από την πρώτη μέρα")}</h2>
            <p className="max-w-md text-[15px] leading-7 text-[#F7F2E8]/80">{tr("Ένα ολοκληρωμένο e-shop με τη δική σου ταυτότητα, όχι μια θέση σε κατάλογο.")}</p>
          </Reveal>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 70} className="h-full">
                <div className="flex h-full gap-4 rounded-2xl bg-[#F7F2E8] p-5 text-[#1F3628] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.6)]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: `${f.color}17`, color: f.color }}>
                    <FeatureIcon name={f.icon} />
                  </span>
                  <div>
                    <h3 className="text-[15.5px] font-bold leading-snug">{tr(f.title)}</h3>
                    <p className="mt-1 text-[14px] leading-6 text-[#2E4A37]/70">{tr(f.text)}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-5 flex flex-wrap items-center gap-2.5 text-[14px]">
            <span className="mr-1 font-semibold text-[#F7F2E8]/80">{tr("Έρχονται σύντομα:")}</span>
            {soon.map((s) => (
              <span key={s.title} className="inline-flex items-center gap-2 rounded-full border border-[#F7F2E8]/25 px-3.5 py-1.5 text-[#F7F2E8]/90">
                <FeatureIcon name={s.icon} size={16} />
                {tr(s.title)}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="start-how" className="relative">
        <div className={`${WRAP} py-14 lg:py-20`}>
          <Reveal className="max-w-2xl">
            <h2 id="start-how" className="text-[1.8rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628] sm:text-[2.2rem]">{tr("Πώς δουλεύει")}</h2>
            <p className="mt-3 text-[15px] leading-7 text-[#2E4A37]/70">{tr("Τρία βήματα. Το πρώτο το κάνεις εδώ, τώρα.")}</p>
          </Reveal>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 100} className="relative rounded-2xl border border-[#2E4A37]/10 bg-white p-6">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#F7F2E8] text-[18px] font-extrabold text-[#C0503C] ring-1 ring-[#2E4A37]/10">{i + 1}</span>
                <h3 className="mt-4 text-[18px] font-bold text-[#1F3628]">{tr(step.title)}</h3>
                <p className="mt-1.5 text-[14.5px] leading-6 text-[#2E4A37]/70">{tr(step.text)}</p>
              </Reveal>
            ))}
          </ol>

          <Reveal className="mt-10 rounded-2xl bg-[#E6ECE3] p-6 sm:p-8">
            <h3 className="text-[1.25rem] font-extrabold tracking-[-0.01em] text-[#1F3628]">{tr("Τι δεν θα σε ρωτήσουμε για να ξεκινήσεις")}</h3>
            <ul className="mt-5 grid gap-4 sm:grid-cols-3">
              {notAsked.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[#C0503C]"><FeatureIcon name="minus" size={14} /></span>
                  <span>
                    <span className="block text-[15px] font-bold text-[#1F3628]">{tr(item.title)}</span>
                    <span className="block text-[14px] leading-6 text-[#2E4A37]/70">{tr(item.text)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="start-faq" className="bg-[#2E4A37] text-[#F7F2E8]">
        <div className={`${WRAP} grid gap-10 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-20`}>
          <Reveal>
            <h2 id="start-faq" className="text-[1.8rem] font-extrabold leading-tight tracking-[-0.02em] sm:text-[2.2rem]">{tr("Πριν ξεκινήσεις")}</h2>
            <p className="mt-3 max-w-sm text-[15px] leading-7 text-[#F7F2E8]/75">{tr("Ό,τι ρωτούν συνήθως όσοι ανοίγουν τη βιτρίνα τους.")}</p>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((item) => (
              <details key={item.q} className="group rounded-2xl bg-[#F7F2E8] px-5 py-4 text-[#1F3628] sm:px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-bold [&::-webkit-details-marker]:hidden">
                  {tr(item.q)}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2E4A37]/[0.07] text-xl font-light transition duration-300 group-open:rotate-45 group-open:bg-[#C0503C] group-open:text-white" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#2E4A37]/75">{tr(item.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-4 py-14 sm:px-6 lg:py-20">
        <Reveal className="relative isolate mx-auto max-w-[1180px] overflow-hidden rounded-[2rem] bg-[#1a2e21] px-6 py-14 text-center text-[#F7F2E8] sm:px-12 lg:py-20">
          <div aria-hidden="true" className="absolute -left-20 -top-32 -z-10 h-96 w-96 rounded-full bg-[#C0503C]/30 blur-[100px]" />
          <div aria-hidden="true" className="absolute -bottom-40 -right-20 -z-10 h-96 w-96 rounded-full bg-[#265E8E]/35 blur-[100px]" />
          <h2 className="mx-auto max-w-3xl text-[2rem] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[2.8rem]">{tr("Ποτέ δεν είναι αργά για να ανοίξεις τη βιτρίνα σου.")}</h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] leading-7 text-[#F7F2E8]/70">{tr("Ένα όνομα, ένα email, ένας κωδικός. Τα υπόλοιπα, μαζί.")}</p>
          <a href="#signup" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C0503C] px-7 py-3 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(192,80,60,0.8)] transition hover:bg-[#ad4633]">
            {tr("Ξεκίνα τώρα")} <span aria-hidden="true">→</span>
          </a>
        </Reveal>
      </section>
    </main>
  )
}
