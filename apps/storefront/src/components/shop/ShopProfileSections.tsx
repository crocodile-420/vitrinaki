import type { ShopColors } from "./ShopProductCard"
import { ShopImage } from "./ShopImage"
import type { BusinessType, ShopProfile } from "./shop-data"

// Children of the small layout helpers. (The workspace has two @types/react
// copies, so the imported ReactNode type does not fit JSX here.)
type Kids = string | number | null | false | React.JSX.Element | Kids[]

// Building blocks of a shop page generated from the Studio store profile.
// Every section renders only when the seller filled the matching answers.

type Tr = (greek: string) => string

// Order of sections per business type. "catalog" is the product grid.
export const SECTION_ORDER: Record<BusinessType | "legacy", string[]> = {
  food: ["catalog", "origin", "story", "delivery", "visit", "contact"],
  crafts: ["catalog", "craft", "story", "delivery", "contact"],
  retail: ["catalog", "visit", "delivery", "story", "contact"],
  beauty: ["services", "visit", "story", "catalog", "contact"],
  services: ["services", "area", "story", "catalog", "contact"],
  portfolio: ["projects", "skills", "story", "services", "contact"],
  other: ["catalog", "story", "visit", "delivery", "contact"],
  legacy: ["catalog", "story", "contact"],
}

// Hero copy defaults per type (Greek source strings, translated with tr()).
export const HERO_COPY: Record<BusinessType, { eyebrow: string; cta: string; ctaHref: string; secondary: string; secondaryHref: string }> = {
  food: { eyebrow: "Τοπικά προϊόντα", cta: "Δες τα προϊόντα", ctaHref: "#catalog", secondary: "Η ιστορία μας", secondaryHref: "#about" },
  crafts: { eyebrow: "Χειροποίητα", cta: "Δες τη συλλογή", ctaHref: "#catalog", secondary: "Πώς τα φτιάχνουμε", secondaryHref: "#craft" },
  retail: { eyebrow: "Το κατάστημα", cta: "Δες τη συλλογή", ctaHref: "#catalog", secondary: "Επισκέψου μας", secondaryHref: "#visit" },
  beauty: { eyebrow: "Ομορφιά & ευεξία", cta: "Δες τις υπηρεσίες", ctaHref: "#services", secondary: "Ζήτησε ραντεβού", secondaryHref: "#contact" },
  services: { eyebrow: "Υπηρεσίες", cta: "Δες τις υπηρεσίες", ctaHref: "#services", secondary: "Ζήτησε προσφορά", secondaryHref: "#contact" },
  portfolio: { eyebrow: "Portfolio", cta: "Δες τα έργα", ctaHref: "#projects", secondary: "Ας συνεργαστούμε", secondaryHref: "#contact" },
  other: { eyebrow: "Καλώς ήρθες", cta: "Δες τη συλλογή", ctaHref: "#catalog", secondary: "Επικοινωνία", secondaryHref: "#contact" },
}

export const CERT_LABELS: Record<string, string> = {
  pop: "ΠΟΠ", pge: "ΠΓΕ", organic: "Βιολογικό", haccp: "HACCP", iso22000: "ISO 22000", vegan: "Vegan", glutenfree: "Χωρίς γλουτένη",
}
const LANGUAGE_LABELS: Record<string, string> = {
  el: "Ελληνικά", en: "English", de: "Deutsch", fr: "Français", it: "Italiano", es: "Español", ru: "Русский", bg: "Български", sq: "Shqip", tr: "Türkçe", zh: "中文", ar: "العربية",
}
const DAY_LABELS: [keyof NonNullable<ShopProfile["hours"]>, string][] = [
  ["mon", "Δευτέρα"], ["tue", "Τρίτη"], ["wed", "Τετάρτη"], ["thu", "Πέμπτη"], ["fri", "Παρασκευή"], ["sat", "Σάββατο"], ["sun", "Κυριακή"],
]

// wa.me and viber need the full international number without "+".
export const intlNumber = (phone: string) => {
  const digits = phone.replace(/[^\d+]/g, "").replace(/^\+/, "")
  return /^(69|2)\d{8,9}$/.test(digits) ? `30${digits}` : digits
}
export const mapUrl = (profile: ShopProfile) => {
  const q = [profile.address.street, profile.address.area, profile.address.city, profile.address.postalCode].filter(Boolean).join(", ")
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : ""
}

// Which profile sections have data to show.
export function sectionHasData(id: string, p: ShopProfile | null | undefined): boolean {
  if (!p) return id === "story" || id === "contact" || id === "catalog"
  switch (id) {
    case "origin": return Boolean(p.food.region || p.food.origin || p.food.certifications.length || p.food.ingredientsNote)
    case "craft": return Boolean(p.crafts.materials || p.crafts.techniques || p.crafts.madeToOrder || p.crafts.customOrders)
    case "delivery": return p.delivery.shipping || p.delivery.pickup || p.delivery.localDelivery || Boolean(p.returnPolicy || p.delivery.note)
    case "visit": return Boolean(p.hours || p.byAppointment || p.hoursNote || p.address.city || p.address.area || p.address.street)
    case "area": return Boolean(p.services.serviceArea || p.services.online || p.services.atClient || p.address.city || p.address.area)
    case "services": return p.services.items.length > 0
    case "projects": return p.portfolio.projects.length > 0
    case "skills": return p.portfolio.skills.length > 0 || Boolean(p.portfolio.clients)
    default: return true
  }
}

function Eyebrow({ colors, children }: { colors: ShopColors; children: Kids }) {
  return <p style={{ color: colors.accent }} className="text-xs font-bold uppercase tracking-[0.22em]">{children}</p>
}
function Section({ id, colors, soft, children }: { id: string; colors: ShopColors; soft?: boolean; children: Kids }) {
  return (
    <section id={id} style={soft ? { background: colors.soft } : undefined} className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">{children}</div>
    </section>
  )
}
function Badge({ colors, children }: { colors: ShopColors; children: Kids }) {
  return <span style={{ borderColor: `${colors.ink}33` }} className="inline-flex items-center rounded-full border bg-white/60 px-3 py-1 text-sm font-semibold">{children}</span>
}

export function OriginSection({ p, colors, tr, soft = false }: { p: ShopProfile; colors: ShopColors; tr: Tr; soft?: boolean }) {
  const certs = [...p.food.certifications.filter((c) => c !== "other").map((c) => tr(CERT_LABELS[c] || c)), ...(p.food.certificationsOther ? [p.food.certificationsOther] : [])]
  return (
    <Section id="origin" colors={colors} soft={soft}>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Eyebrow colors={colors}>{tr("Προέλευση")}</Eyebrow>
          <h2 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">{p.food.region || tr("Από τον τόπο μας")}</h2>
          {p.food.producerSince ? <p className="mt-3 text-lg opacity-75">{tr("Παράγουμε από το")} {p.food.producerSince}</p> : null}
        </div>
        <div className="space-y-6">
          {p.food.origin ? <p className="whitespace-pre-line text-lg leading-8 opacity-80">{p.food.origin}</p> : null}
          {certs.length ? (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider opacity-60">{tr("Πιστοποιήσεις")}</h3>
              <div className="mt-3 flex flex-wrap gap-2">{certs.map((c) => <Badge key={c} colors={colors}>✓ {c}</Badge>)}</div>
            </div>
          ) : null}
          {p.food.ingredientsNote ? (
            <div style={{ background: soft ? colors.page : colors.soft }} className="rounded-2xl p-5">
              <h3 className="font-bold">{tr("Συστατικά & συντήρηση")}</h3>
              <p className="mt-2 whitespace-pre-line leading-7 opacity-75">{p.food.ingredientsNote}</p>
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  )
}

export function CraftSection({ p, colors, tr, soft = false }: { p: ShopProfile; colors: ShopColors; tr: Tr; soft?: boolean }) {
  const facts = [
    p.crafts.materials ? { title: tr("Υλικά"), body: p.crafts.materials } : null,
    p.crafts.techniques ? { title: tr("Τεχνικές"), body: p.crafts.techniques } : null,
    p.crafts.madeToOrder ? { title: tr("Κατά παραγγελία"), body: p.crafts.leadTime ? `${tr("Χρόνος κατασκευής")}: ${p.crafts.leadTime}` : tr("Κάθε κομμάτι φτιάχνεται όταν το παραγγείλεις.") } : null,
    p.crafts.customOrders ? { title: tr("Εξατομίκευση"), body: tr("Δεχόμαστε εξατομικευμένες παραγγελίες. Πες μας τι έχεις στο μυαλό σου.") } : null,
  ].filter((f): f is { title: string; body: string } => Boolean(f))
  return (
    <Section id="craft" colors={colors} soft={soft}>
      <Eyebrow colors={colors}>{tr("Το εργαστήρι")}</Eyebrow>
      <h2 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">{tr("Πώς τα φτιάχνουμε")}</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((f) => (
          <div key={f.title} style={{ background: soft ? colors.page : colors.soft }} className="rounded-2xl p-6">
            <h3 className="font-bold">{f.title}</h3>
            <p className="mt-2 leading-7 opacity-75">{f.body}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// `booking`: the shop takes online bookings (the booking box is on the page).
export function ServicesSection({ p, colors, tr, soft = false, booking = false }: { p: ShopProfile; colors: ShopColors; tr: Tr; soft?: boolean; booking?: boolean }) {
  return (
    <Section id="services" colors={colors} soft={soft}>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4" style={{ borderColor: `${colors.ink}1f` }}>
        <div>
          <Eyebrow colors={colors}>{tr("Τιμοκατάλογος")}</Eyebrow>
          <h2 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">{tr("Υπηρεσίες & τιμές")}</h2>
          {p.beauty.specialties ? <p className="mt-2 opacity-70">{tr("Ειδικότητες")}: {p.beauty.specialties}</p> : null}
        </div>
        {booking ? <a href="#booking" style={{ background: soft ? colors.page : colors.soft }} className="rounded-full px-3 py-1.5 text-xs font-bold hover:opacity-80">{tr("Online κρατήσεις")} →</a> : null}
      </div>
      <div className="mt-6 divide-y" style={{ borderColor: `${colors.ink}1f` }}>
        {p.services.items.map((item, i) => (
          <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5" style={{ borderColor: `${colors.ink}1a` }}>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold">{item.name}</h3>
              {item.description ? <p className="mt-1 max-w-2xl leading-7 opacity-70">{item.description}</p> : null}
            </div>
            <div className="flex items-baseline gap-4 text-right">
              {item.duration ? <span className="text-sm opacity-60">{item.duration}</span> : null}
              {item.price ? <span style={{ color: colors.accent }} className="text-lg font-extrabold">{item.price}</span> : null}
            </div>
          </div>
        ))}
      </div>
      {p.beauty.brands ? <p className="mt-4 text-sm opacity-70">{tr("Προϊόντα που χρησιμοποιούμε")}: {p.beauty.brands}</p> : null}
      <a href={booking ? "#booking" : "#contact"} style={{ background: colors.accent, color: colors.onAccent || "#fff" }} className="vk-btn mt-8 inline-block rounded-full px-6 py-3 font-bold hover:opacity-90">{tr(booking ? "Κλείσε ραντεβού" : "Ζήτησε ραντεβού")}</a>
    </Section>
  )
}

export function ProjectsSection({ p, colors, tr, soft = false }: { p: ShopProfile; colors: ShopColors; tr: Tr; soft?: boolean }) {
  return (
    <Section id="projects" colors={colors} soft={soft}>
      <Eyebrow colors={colors}>{tr("Επιλεγμένη δουλειά")}</Eyebrow>
      <h2 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">{tr("Έργα")}</h2>
      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {p.portfolio.projects.map((project, i) => {
          const card = (
            <article className="group">
              <ShopImage src={project.imageUrl || null} alt={project.title} label={project.title} accent={colors.accent} soft={colors.soft} className="aspect-[4/3] w-full rounded-2xl transition group-hover:opacity-90" />
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-bold">{project.title}</h3>
                {project.year ? <span className="text-sm opacity-60">{project.year}</span> : null}
              </div>
              {project.description ? <p className="mt-1 leading-7 opacity-70">{project.description}</p> : null}
            </article>
          )
          return project.link ? <a key={i} href={project.link} target="_blank" rel="noopener noreferrer">{card}</a> : <div key={i}>{card}</div>
        })}
      </div>
    </Section>
  )
}

export function SkillsSection({ p, colors, tr, soft = false }: { p: ShopProfile; colors: ShopColors; tr: Tr; soft?: boolean }) {
  return (
    <Section id="skills" colors={colors} soft={soft}>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Eyebrow colors={colors}>{tr("Τι κάνω")}</Eyebrow>
          <h2 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">{tr("Δεξιότητες")}</h2>
          {p.portfolio.availability ? <p style={{ background: soft ? colors.page : colors.soft }} className="mt-5 inline-block rounded-full px-4 py-2 text-sm font-bold">● {p.portfolio.availability}</p> : null}
        </div>
        <div className="space-y-6">
          {p.portfolio.skills.length ? <div className="flex flex-wrap gap-2">{p.portfolio.skills.map((s) => <Badge key={s} colors={colors}>{s}</Badge>)}</div> : null}
          {p.portfolio.clients ? <div><h3 className="text-sm font-bold uppercase tracking-wider opacity-60">{tr("Πελάτες & συνεργασίες")}</h3><p className="mt-2 text-lg leading-8 opacity-80">{p.portfolio.clients}</p></div> : null}
        </div>
      </div>
    </Section>
  )
}

function Hours({ p, tr }: { p: ShopProfile; tr: Tr }) {
  if (!p.hours) return null
  return (
    <table className="w-full max-w-sm text-sm">
      <tbody>
        {DAY_LABELS.map(([day, label]) => {
          const d = p.hours![day]
          const ranges = [d.open && d.close ? `${d.open}–${d.close}` : "", d.open2 && d.close2 ? `${d.open2}–${d.close2}` : ""].filter(Boolean).join(", ")
          return (
            <tr key={day} className="border-b border-black/5">
              <td className="py-2 pr-4 font-semibold">{tr(label)}</td>
              <td className="py-2 text-right opacity-75">{d.closed ? tr("Κλειστά") : ranges || "—"}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function VisitSection({ p, colors, tr, soft = false }: { p: ShopProfile; colors: ShopColors; tr: Tr; soft?: boolean }) {
  const address = [p.address.street, p.address.area, [p.address.postalCode, p.address.city].filter(Boolean).join(" ")].filter(Boolean)
  const map = p.address.showMap ? mapUrl(p) : ""
  return (
    <Section id="visit" colors={colors} soft={soft}>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow colors={colors}>{tr("Επισκέψου μας")}</Eyebrow>
          <h2 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">{tr("Ωράριο & τοποθεσία")}</h2>
          {address.length ? <p className="mt-5 text-lg leading-8 opacity-80">{address.map((line) => <span key={line} className="block">{line}</span>)}</p> : null}
          {map ? <a href={map} target="_blank" rel="noopener noreferrer" style={{ borderColor: colors.ink }} className="mt-5 inline-block rounded-full border px-5 py-2.5 font-bold hover:opacity-80">{tr("Δες στον χάρτη")} ↗</a> : null}
        </div>
        <div style={{ background: soft ? colors.page : colors.soft }} className="rounded-3xl p-6 sm:p-8">
          {p.hours ? <Hours p={p} tr={tr} /> : null}
          {p.byAppointment ? <p className="mt-4 font-bold">{tr("Κατόπιν ραντεβού")}</p> : null}
          {p.hoursNote ? <p className="mt-3 opacity-75">{p.hoursNote}</p> : null}
          {!p.hours && !p.byAppointment && !p.hoursNote ? <p className="opacity-75">{tr("Επικοινώνησε μαζί μας για το ωράριο.")}</p> : null}
        </div>
      </div>
    </Section>
  )
}

export function AreaSection({ p, colors, tr, soft = false }: { p: ShopProfile; colors: ShopColors; tr: Tr; soft?: boolean }) {
  const items = [
    p.services.serviceArea ? { title: tr("Περιοχή εξυπηρέτησης"), body: p.services.serviceArea } : null,
    p.services.atClient ? { title: tr("Στον χώρο σου"), body: tr("Ερχόμαστε εμείς σε εσένα.") } : null,
    p.services.online ? { title: tr("Και online"), body: tr("Εξυπηρέτηση και με βιντεοκλήση.") } : null,
    !p.services.serviceArea && (p.address.city || p.address.area) ? { title: tr("Βρισκόμαστε"), body: [p.address.area, p.address.city].filter(Boolean).join(", ") } : null,
  ].filter((f): f is { title: string; body: string } => Boolean(f))
  return (
    <Section id="area" colors={colors} soft={soft}>
      <Eyebrow colors={colors}>{tr("Πού εξυπηρετούμε")}</Eyebrow>
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {items.map((f) => (
          <div key={f.title} style={{ background: soft ? colors.page : colors.soft }} className="rounded-2xl p-6">
            <h3 className="font-bold">{f.title}</h3>
            <p className="mt-2 leading-7 opacity-75">{f.body}</p>
          </div>
        ))}
      </div>
      {p.hours || p.byAppointment || p.hoursNote ? (
        <div className="mt-8">
          {p.hours ? <Hours p={p} tr={tr} /> : null}
          {p.byAppointment ? <p className="mt-3 font-bold">{tr("Κατόπιν ραντεβού")}</p> : null}
          {p.hoursNote ? <p className="mt-2 opacity-75">{p.hoursNote}</p> : null}
        </div>
      ) : null}
    </Section>
  )
}

export function DeliverySection({ p, colors, tr, soft = false }: { p: ShopProfile; colors: ShopColors; tr: Tr; soft?: boolean }) {
  const options = [
    p.delivery.shipping ? { title: tr("Αποστολή με courier"), body: p.delivery.shippingAreas || tr("Σε όλη την Ελλάδα") } : null,
    p.delivery.pickup ? { title: tr("Παραλαβή από το κατάστημα"), body: p.delivery.pickupNote || tr("Πέρασε να το πάρεις από κοντά.") } : null,
    p.delivery.localDelivery ? { title: tr("Τοπική διανομή"), body: p.delivery.localDeliveryAreas || tr("Στην περιοχή μας") } : null,
  ].filter((f): f is { title: string; body: string } => Boolean(f))
  return (
    <Section id="delivery" colors={colors} soft={soft}>
      <Eyebrow colors={colors}>{tr("Παράδοση")}</Eyebrow>
      <h2 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">{tr("Αποστολή & επιστροφές")}</h2>
      {options.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {options.map((f) => (
            <div key={f.title} style={{ background: soft ? colors.page : colors.soft }} className="rounded-2xl p-6">
              <h3 className="font-bold">{f.title}</h3>
              <p className="mt-2 leading-7 opacity-75">{f.body}</p>
            </div>
          ))}
        </div>
      ) : null}
      {p.delivery.note ? <p className="mt-5 font-semibold">{p.delivery.note}</p> : null}
      {p.returnPolicy ? (
        <details className="mt-6 rounded-2xl border p-5" style={{ borderColor: `${colors.ink}22` }}>
          <summary className="cursor-pointer font-bold">{tr("Πολιτική επιστροφών")}</summary>
          <p className="mt-3 whitespace-pre-line leading-7 opacity-75">{p.returnPolicy}</p>
        </details>
      ) : null}
    </Section>
  )
}

export function LanguagesLine({ p, tr }: { p: ShopProfile; tr: Tr }) {
  if (p.languages.length <= 1) return null
  return <p className="text-sm opacity-70">{tr("Μιλάμε")}: {p.languages.map((code) => LANGUAGE_LABELS[code] || code).join(" · ")}</p>
}
