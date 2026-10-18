import Link from "next/link"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { SitePreview } from "@/components/sections/SitePreview/SitePreview"
import { listPublishedStorefronts, templateLabels, type DirectoryStorefront } from "@/lib/data/vitrinaki-storefronts"
import { listRegions } from "@/lib/data/regions"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
  toHreflang,
} from "@/lib/helpers/hreflang"

const businessUrl =
  process.env.NEXT_PUBLIC_VENDOR_URL || "http://localhost:7001"

const steps = [
  { number: "01", title: "Μας λες για την επιχείρησή σου", text: "Τι κάνεις, σε ποιους απευθύνεσαι, πώς θέλεις να φαίνεσαι. Μια σύντομη κουβέντα, χωρίς τεχνικούς όρους." },
  { number: "02", title: "Σχεδιάζουμε το e-shop σου", text: "Στήνουμε σελίδες, χρώματα, κατηγορίες και πληρωμές στα μέτρα σου. Το βλέπεις, μας λες αλλαγές, το τελειοποιούμε μαζί." },
  { number: "03", title: "Ξεκινάς να πουλάς", text: "Το e-shop σου ανοίγει με δική του διεύθυνση. Εσύ διαχειρίζεσαι παραγγελίες, εμείς είμαστε δίπλα σου για ό,τι χρειαστείς." },
]

const audiences = [
  { icon: "leaf", title: "Παραγωγοί τροφίμων", text: "Λάδι, μέλι, κρασί, τυριά: πούλα τα προϊόντα σου απευθείας σε πελάτες σε όλη την Ελλάδα." },
  { icon: "hand", title: "Χειροποίητα & δημιουργοί", text: "Κοσμήματα, κεραμικά, ρούχα: δείξε τη δουλειά σου με τον τρόπο που της αξίζει." },
  { icon: "store", title: "Φυσικά καταστήματα", text: "Το μαγαζί σου ανοιχτό και online, 24 ώρες το 24ωρο, για τους πελάτες της γειτονιάς και όχι μόνο." },
  { icon: "laptop", title: "Freelancers & υπηρεσίες", text: "Graphic designer, online δάσκαλος, φωτογράφος, σύμβουλος: προβάλλεις τη δουλειά σου και δέχεσαι κρατήσεις ή παραγγελίες." },
  { icon: "sprout", title: "Νέες επιχειρήσεις", text: "Ξεκίνα μικρά, με χαμηλό κόστος, και μεγάλωσε το e-shop σου μαζί με την επιχείρηση." },
] as const

const lineIcons: Record<(typeof audiences)[number]["icon"], string> = {
  leaf: "M5 19c0-8 5-14 14-14 0 9-6 14-14 14Zm0 0 7-7",
  hand: "M7 11V6a1.5 1.5 0 0 1 3 0v4m0-5a1.5 1.5 0 0 1 3 0v5m0-4a1.5 1.5 0 0 1 3 0v6c0 4-2.5 7-6 7-2.5 0-4-1.5-5.5-4L4 13a1.5 1.5 0 0 1 2.6-1.5L7 12",
  store: "M4 9l1.5-5h13L20 9M4 9h16M4 9v11h16V9M9 20v-6h6v6",
  laptop: "M5 6h14v9H5zM3 18h18",
  sprout: "M12 20v-8m0 0c0-4-3-6-7-6 0 4 3 6 7 6Zm0 0c0-3 2.5-5 6-5 0 3-2.5 5-6 5Z",
}

function LineIcon({ name }: { name: keyof typeof lineIcons }) {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2E4A37]/[0.06] text-[#2E4A37]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={lineIcons[name]} />
      </svg>
    </span>
  )
}

const comparison = [
  { label: "Στήσιμο", us: "Το σχεδιάζουμε εμείς για σένα", diy: "Το στήνεις μόνος σου από template", agency: "Κατά παραγγελία, σε εβδομάδες" },
  { label: "Γλώσσα & υποστήριξη", us: "Ελληνικά, από ανθρώπους", diy: "Αγγλικά, μέσω ticket", agency: "Ανάλογα με το συμβόλαιο" },
  { label: "Κόστος", us: "Σταθερή μηνιαία τιμή", diy: "Συνδρομή + apps + προμήθειες", agency: "Χιλιάδες ευρώ εφάπαξ" },
  { label: "Αλλαγές μετά", us: "Τις κάνεις εσύ ή μας τις ζητάς", diy: "Μόνος σου", agency: "Χρεώνονται ξεχωριστά" },
  { label: "Προβολή", us: "Στη βιτρίνα του Vitrinaki", diy: "Καμία", agency: "Καμία" },
]

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") || "https"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`

  let locales: string[] = []
  try {
    locales = getStorefrontLocales(await listRegions())
  } catch {
    locales = [locale]
  }

  const { canonical, languages } = buildHreflangAlternates({
    baseUrl,
    path: "",
    locale,
    locales,
  })

  const title = "Η βιτρίνα σου στο ψηφιακό εμπόριο"
  const description =
    "Σου φτιάχνουμε το e-shop που ταιριάζει στην επιχείρησή σου. Για παραγωγούς, δημιουργούς, καταστήματα και freelancers."
  const ogImage = "/B2C_Storefront_Open_Graph.png"

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    },
    alternates: { canonical, languages },
    openGraph: {
      title: `${title} | Vitrinaki`,
      description,
      url: canonical,
      siteName: "Vitrinaki",
      type: "website",
      images: [{ url: ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`, width: 1200, height: 630, alt: "Vitrinaki — ψηφιακές λύσεις για μικρές επιχειρήσεις" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`],
    },
  }
}


// Shown in the hero when no website is published yet (e.g. a fresh database).
const fallbackSites: DirectoryStorefront[] = [
  { handle: "", storeName: "Φούρνος Ελένη", tagline: "Ζεστό ψωμί κάθε πρωί από το 1987", description: "", template: "local", palette: "terracotta", logo: null, banner: null, customDomain: "" },
  { handle: "", storeName: "Studio Αλκυόνη", tagline: "Pilates και yoga στο κέντρο της πόλης", description: "", template: "services", palette: "plum", logo: null, banner: null, customDomain: "" },
  { handle: "", storeName: "Atelier Μύρτω", tagline: "Χειροποίητα κοσμήματα από ασήμι", description: "", template: "atelier", palette: "ocean", logo: null, banner: null, customDomain: "" },
]

const siteAddress = (site: DirectoryStorefront) =>
  site.customDomain || `vitrinaki.gr/${site.handle || site.storeName.toLowerCase().replace(/\s+/g, "-")}`

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") || "https"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`

  const published = await listPublishedStorefronts()
  const heroSites = [...published, ...fallbackSites].slice(0, 3)
  const exampleFor = (template: DirectoryStorefront["template"]) =>
    published.find((site) => site.template === template)

  return (
    <main className="overflow-hidden bg-[#F7F2E8] text-[#2E4A37]">
      <Script
        id="ld-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Vitrinaki",
            url: `${baseUrl}/${locale}`,
            logo: `${baseUrl}/Logo.svg`,
          }),
        }}
      />
      <Script
        id="ld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Vitrinaki",
            url: `${baseUrl}/${locale}`,
            inLanguage: toHreflang(locale),
          }),
        }}
      />

      <section className="relative border-b border-[#eee4d6] bg-[radial-gradient(circle_at_0%_0%,#f4e6d5_0,transparent_40%),#F7F2E8]">
        <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-5 py-12 sm:px-8 md:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:px-10 lg:py-20">
          <div className="relative z-10">
            <h1 className="font-serif max-w-2xl text-4xl font-extrabold leading-[1.06] tracking-tight text-[#2E4A37] sm:text-5xl lg:text-6xl">
              Η βιτρίνα σου <span className="text-[#C0503C]">στο ψηφιακό εμπόριο.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#456257] sm:text-lg">
              Δεν σου δίνουμε ένα ακόμα έτοιμο template. Σου φτιάχνουμε το e-shop που ταιριάζει στην επιχείρησή σου, είτε είσαι παραγωγός, δημιουργός, κατάστημα ή freelancer. Εσύ ασχολείσαι με τη δουλειά σου, εμείς με την online βιτρίνα σου.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={businessUrl} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#C0503C] px-6 py-3 font-bold text-white shadow-lg shadow-[#C0503C]/20 transition hover:-translate-y-0.5 hover:bg-[#a5412f]">
                Ξεκίνα το e-shop σου <span className="ml-2" aria-hidden="true">→</span>
              </a>
              <a href="#vitrina" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#aabdb1] bg-white/80 px-6 py-3 font-bold text-[#2E4A37] transition hover:bg-white">
                Δες παραδείγματα
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[#426456]">
              <span className="inline-flex items-center gap-1.5"><svg viewBox="0 0 16 16" className="h-4 w-4 text-[#C0503C]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5" /></svg>Σχεδιασμένο για τη δική σου επιχείρηση</span>
              <span className="inline-flex items-center gap-1.5"><svg viewBox="0 0 16 16" className="h-4 w-4 text-[#C0503C]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5" /></svg>Ελληνική υποστήριξη από ανθρώπους</span>
              <span className="inline-flex items-center gap-1.5"><svg viewBox="0 0 16 16" className="h-4 w-4 text-[#C0503C]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5" /></svg>Σταθερή μηνιαία τιμή</span>
            </div>
          </div>

          <div className="relative mx-auto min-h-[420px] w-full max-w-[720px] sm:min-h-[480px]" aria-hidden="true">
            <div className="absolute inset-x-6 top-6 bottom-2 rounded-[2rem] bg-[#e7e2d6]" />
            <SitePreview site={heroSites[0]} address={siteAddress(heroSites[0])} className="absolute left-0 top-0 w-[64%] -rotate-2" />
            <SitePreview site={heroSites[1]} address={siteAddress(heroSites[1])} className="absolute right-0 top-14 w-[56%] rotate-2" />
            <SitePreview site={heroSites[2]} address={siteAddress(heroSites[2])} className="absolute bottom-0 left-[18%] w-[58%]" />
          </div>
        </div>
      </section>

      <section id="for-whom" className="mx-auto max-w-[1600px] px-5 pt-12 sm:px-8 lg:px-10 lg:pt-16">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#C0503C]">Για ποιον είναι</p>
          <h2 className="font-serif mt-2 text-3xl font-extrabold tracking-tight text-[#2E4A37] sm:text-4xl">Για κάθε επαγγελματία που θέλει να βγει online.</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {audiences.map((item) => (
            <article key={item.title} className="rounded-2xl border border-[#eae3d8] bg-white/80 p-6">
              <LineIcon name={item.icon} />
              <h3 className="mt-4 text-base font-extrabold text-[#2E4A37]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#63766c]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="vitrina" className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#C0503C]">Παραδείγματα</p>
            <h2 className="font-serif mt-2 text-3xl font-extrabold tracking-tight text-[#2E4A37] sm:text-4xl">Επιχειρήσεις που άνοιξαν το e-shop τους.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#61756a]">Κάθε e-shop έχει το δικό του όνομα, ύφος και διεύθυνση. Πάτα σε ένα για να δεις πώς μοιάζει.</p>
        </div>

        {published.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {published.map((site) => (
              <Link key={site.handle} href={`/${locale}/store/${site.handle}`} className="group rounded-3xl border border-[#e6dfd3] bg-white p-3 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#23483a]/10">
                <SitePreview site={site} address={siteAddress(site)} className="shadow-none" />
                <div className="px-2 pb-2 pt-4">
                  <h3 className="text-lg font-extrabold text-[#2E4A37]">{site.storeName}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#61756a]">{site.description || site.tagline}</p>
                  <span className="mt-3 inline-flex text-sm font-bold text-[#C0503C]">Δες το e-shop <span className="ml-1 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-[#d8cfbf] bg-white/60 p-10 text-center">
            <h3 className="text-xl font-extrabold text-[#2E4A37]">Το πρώτο e-shop μπορεί να είναι το δικό σου.</h3>
            <p className="mt-2 text-sm text-[#61756a]">Ξεκίνα σήμερα και βγες στο ψηφιακό εμπόριο.</p>
          </div>
        )}
      </section>

      <section id="how-it-works" className="border-y border-[#e8e1d6] bg-[#f1eee4]">
        <div className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#C0503C]">Πώς λειτουργεί</p>
            <h2 className="font-serif mt-2 text-3xl font-extrabold leading-tight tracking-tight text-[#2E4A37] sm:text-4xl">Εσύ μας λες τι κάνεις. Εμείς το κάνουμε e-shop.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="rounded-2xl border border-[#e1d9cb] bg-[#F7F2E8] p-6 sm:p-7">
                <span className="text-sm font-extrabold tracking-[0.16em] text-[#C0503C]">{step.number}</span>
                <h3 className="mt-4 text-xl font-extrabold text-[#2E4A37]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#61756a]">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="examples" className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#C0503C]">Δείγματα</p>
          <h2 className="font-serif mt-2 text-3xl font-extrabold tracking-tight text-[#2E4A37] sm:text-4xl">Διάλεξε το ύφος που σου ταιριάζει.</h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {(Object.keys(templateLabels) as DirectoryStorefront["template"][]).map((template) => {
            const example = exampleFor(template) || fallbackSites.find((site) => site.template === template)!
            const label = templateLabels[template]
            return (
              <article key={template} className="rounded-3xl border border-[#e6dfd3] bg-white p-3">
                <SitePreview site={example} address={siteAddress(example)} className="shadow-none" />
                <div className="px-2 pb-2 pt-4">
                  <h3 className="text-lg font-extrabold text-[#2E4A37]">{label.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#61756a]">{label.text}</p>
                  {example.handle ? (
                    <Link href={`/${locale}/store/${example.handle}`} className="mt-3 inline-flex text-sm font-bold text-[#C0503C]">
                      Δες το δείγμα ζωντανά →
                    </Link>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section id="solutions" className="mx-auto max-w-[1600px] px-5 pb-12 sm:px-8 lg:px-10 lg:pb-16">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#C0503C]">Γιατί Vitrinaki</p>
          <h2 className="font-serif mt-2 text-3xl font-extrabold tracking-tight text-[#2E4A37] sm:text-4xl">Η επαγγελματική λύση, χωρίς το επαγγελματικό κόστος.</h2>
        </div>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-[#e6dfd3] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#eee7db] text-[#61756a]">
                <th className="px-5 py-4 font-semibold" />
                <th className="bg-[#2E4A37] px-5 py-4 font-extrabold text-white">Vitrinaki</th>
                <th className="px-5 py-4 font-semibold">Πλατφόρμες «κάν' το μόνος σου»</th>
                <th className="px-5 py-4 font-semibold">Κατασκευή από εταιρεία</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.label} className="border-b border-[#f1ebe1] last:border-0">
                  <th className="px-5 py-4 font-bold text-[#2E4A37]">{row.label}</th>
                  <td className="bg-[#2E4A37]/[0.05] px-5 py-4 font-semibold text-[#2E4A37]">{row.us}</td>
                  <td className="px-5 py-4 text-[#63766c]">{row.diy}</td>
                  <td className="px-5 py-4 text-[#63766c]">{row.agency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="px-5 pb-14 sm:px-8 lg:px-10 lg:pb-20">
        <div className="relative mx-auto flex max-w-[1520px] flex-col gap-7 overflow-hidden rounded-[2rem] bg-[#2E4A37] px-6 py-9 text-white sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:px-14">
          <div className="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full border-[40px] border-white/5" />
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#f2a28f]">Το επόμενο βήμα</p>
            <h2 className="font-serif mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Πες μας για την επιχείρησή σου.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#d6e3db] sm:text-base">Σου φτιάχνουμε το e-shop που σου ταιριάζει, και η βιτρίνα σου ανοίγει στο ψηφιακό εμπόριο.</p>
          </div>
          <a href={businessUrl} className="relative z-10 inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#C0503C] px-6 py-3 font-bold text-white transition hover:bg-[#a5412f]">
            Ξεκίνα τώρα <span className="ml-2" aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </main>
  )
}
