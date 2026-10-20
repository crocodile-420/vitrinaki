import type { Metadata } from "next"

import { StartFlow } from "@/components/sections/StartFlow/StartFlow"
import { readStartSession } from "@/lib/data/vitrinaki-start"
import { getTranslator } from "@/lib/i18n/server"
import { privacyUrl, studioLoginUrl, termsUrl } from "@/lib/vitrinaki-links"
import { caps } from "@/lib/vitrinaki-start"

// «Άνοιξε τη βιτρίνα σου»: the sign-up as a short question flow. The first step
// creates a real shop (see /api/vitrinaki/start), the next ones are optional and
// fill the live preview, then the new seller is handed over to the Studio. The
// pitch lives on the homepage, so this page carries only the flow.

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTranslator()
  return {
    title: tr("Άνοιξε τη βιτρίνα σου"),
    description: tr("Το δικό σου e-shop με το όνομα, τα χρώματα και την ιστορία της επιχείρησής σου. Ξεκινάς με ένα όνομα και ένα email."),
  }
}

const WRAP = "mx-auto max-w-[1280px] px-4 sm:px-8 lg:px-12"

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
        {tr("Λίγες σύντομες ερωτήσεις και η σελίδα σου παίρνει μορφή, εδώ δίπλα. Υποχρεωτικό είναι μόνο το πρώτο βήμα, τα υπόλοιπα τα συμπληρώνεις τώρα ή αργότερα.")}
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
        <div className={`${WRAP} flex min-h-[calc(100svh-5rem)] flex-col justify-center pb-14 pt-8 sm:pt-10 lg:pb-16`}>
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

    </main>
  )
}
