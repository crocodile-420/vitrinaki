"use client"

import { useEffect, useState, useTransition, type FormEvent } from "react"

import {
  createBooking,
  getBookingDays,
  type BookingDay,
  type BookingService,
  type BookingTrip,
  type CustomerBooking,
} from "@/lib/data/bookings"
import { useTranslator } from "@/lib/i18n/client"

import type { ShopColors } from "./ShopProductCard"

// The shop page's booking box: service → day → time → details. Free times
// come from the backend (the shop's hours minus booked appointments, per
// vehicle/trainer/room when the shop has several); the backend checks the
// chosen time again when the booking is sent. Transfers and taxis also ask
// for the trip.

type Props = {
  sellerId: string
  services: BookingService[]
  autoConfirm: boolean
  note: string
  cancelHours: number
  // Transfers and taxis: ask for pickup, destination, passengers…
  tripDetails?: boolean
  colors: ShopColors
  soft?: boolean
  // Where «Το ραντεβού μου» lives for this shop ("/…/booking").
  manageBase: string
}

const parse = (date: string) => {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
const addDays = (date: string, days: number) => new Date(parse(date).getTime() + days * 86400000).toISOString().slice(0, 10)
const durationText = (minutes: number, tr: (s: string) => string) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} ${tr("λεπτά")}`
  return m ? `${h} ${tr("ώρ.")} ${m} ${tr("λ.")}` : `${h} ${tr(h === 1 ? "ώρα" : "ώρες")}`
}

// Pickup → destination, people, luggage, flight and return, as one block.
export function TripSummary({ trip, tr }: { trip: BookingTrip; tr: (s: string) => string }) {
  const facts = [
    `${tr("Άτομα")}: ${trip.passengers}`,
    trip.luggage !== null && trip.luggage !== undefined && trip.luggage !== "" ? `${tr("Αποσκευές")}: ${trip.luggage}` : "",
    trip.flight ? `${tr("Πτήση")}: ${trip.flight}` : "",
    trip.returnDate && trip.returnTime ? `${tr("Επιστροφή")}: ${trip.returnDate.split("-").reverse().join("/")} ${trip.returnTime}` : "",
  ].filter(Boolean)
  return (
    <div className="mt-3 space-y-1 leading-7" data-testid="booking-trip">
      <p><span className="font-bold">{tr("Από")}:</span> {trip.pickup}</p>
      <p><span className="font-bold">{tr("Προς")}:</span> {trip.dropoff}</p>
      <p className="opacity-75">{facts.join(" · ")}</p>
    </div>
  )
}

export function ShopBooking({ sellerId, services, autoConfirm, note, cancelHours, tripDetails = false, colors, soft = false, manageBase }: Props) {
  const { lang, tr } = useTranslator()
  const locale = lang === "en" ? "en-GB" : "el-GR"
  const dateText = (date: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...opts }).format(parse(date))

  const [serviceId, setServiceId] = useState(services.length === 1 ? services[0].id : "")
  const [from, setFrom] = useState<string | undefined>(undefined)
  const [days, setDays] = useState<BookingDay[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingDays, setLoadingDays] = useState(false)
  const [daysError, setDaysError] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [contact, setContact] = useState({ name: "", phone: "", email: "", note: "" })
  const [trip, setTrip] = useState({ pickup: "", dropoff: "", passengers: "1", luggage: "", flight: "", returnDate: "", returnTime: "" })
  const [withReturn, setWithReturn] = useState(false)
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState<{ booking: CustomerBooking; token: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const service = services.find((s) => s.id === serviceId) || null
  const firstDate = days[0]?.date
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Athens" }).format(new Date())

  const loadDays = async (start: string | undefined, keepDate = false) => {
    if (!serviceId) return
    setLoadingDays(true)
    setDaysError("")
    const result = await getBookingDays(sellerId, serviceId, start, 7)
    setLoadingDays(false)
    if (!result.ok) {
      setDaysError(result.message)
      setDays([])
      return
    }
    setDays(result.days)
    setHasMore(result.hasMore)
    const current = result.days.find((d) => d.date === date && d.slots.length)
    if (!keepDate || !current) {
      setDate(result.days.find((d) => d.slots.length)?.date || result.days[0]?.date || "")
      setTime("")
    } else if (!current.slots.includes(time)) {
      setTime("")
    }
  }

  useEffect(() => {
    setFrom(undefined)
    setTime("")
    void loadDays(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId])

  const goWeek = (start: string | undefined) => {
    setFrom(start)
    void loadDays(start)
  }

  const selectedDay = days.find((d) => d.date === date)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError("")
    if (!service || !date || !time) return setError(tr("Διάλεξε υπηρεσία, μέρα και ώρα."))
    if (tripDetails) {
      if (trip.pickup.trim().length < 3) return setError(tr("Γράψε από πού θα σε παραλάβουμε."))
      if (trip.dropoff.trim().length < 3) return setError(tr("Γράψε πού πηγαίνεις."))
      if (withReturn && (!trip.returnDate || !trip.returnTime)) return setError(tr("Γράψε μέρα και ώρα για την επιστροφή."))
    }
    if (contact.name.trim().length < 2) return setError(tr("Γράψε το ονοματεπώνυμό σου."))
    if (!contact.phone.trim()) return setError(tr("Γράψε ένα τηλέφωνο για να σε βρει η επιχείρηση."))
    if (!consent) return setError(tr("Χρειάζεται η συγκατάθεσή σου για να σταλούν τα στοιχεία σου στην επιχείρηση."))
    startTransition(async () => {
      const tripInput = tripDetails
        ? { ...trip, luggage: trip.luggage || null, returnDate: withReturn ? trip.returnDate : "", returnTime: withReturn ? trip.returnTime : "" }
        : null
      const result = await createBooking({ sellerId, serviceId: service.id, date, time, contact, consent, website, trip: tripInput })
      if (result.ok) {
        setDone({ booking: result.booking, token: result.token })
        return
      }
      setError(result.message)
      if (result.taken) await loadDays(from, true)
    })
  }

  const field = "w-full rounded-xl border bg-white px-4 py-3 text-base outline-none focus:ring-2"
  const fieldStyle = { borderColor: `${colors.ink}33`, "--tw-ring-color": `${colors.accent}55` } as React.CSSProperties
  const card = soft ? colors.page : colors.soft

  if (done) {
    const b = done.booking
    const confirmed = b.status === "confirmed"
    return (
      <section id="booking" style={soft ? { background: colors.soft } : undefined} className="scroll-mt-20">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20" data-testid="booking-done">
          <div style={{ background: card }} className="rounded-3xl p-7 sm:p-10">
            <p style={{ color: colors.accent }} className="text-xs font-bold uppercase tracking-[0.22em]">
              {tr(confirmed ? "Το ραντεβού κλείστηκε" : "Το αίτημα στάλθηκε")}
            </p>
            <h2 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">
              {dateText(b.date, { weekday: "long", day: "numeric", month: "long" })}, {b.time}
            </h2>
            <p className="mt-2 text-lg opacity-80">{b.service_name} · {durationText(b.duration_minutes, tr)}{b.price ? ` · ${b.price}` : ""}</p>
            {b.details?.trip ? <TripSummary trip={b.details.trip} tr={tr} /> : null}
            <p className="mt-5 leading-7 opacity-80">
              {tr(confirmed
                ? "Σε περιμένουμε! Αν χρειαστεί κάποια αλλαγή, η επιχείρηση θα επικοινωνήσει μαζί σου."
                : "Η ώρα κρατήθηκε για σένα. Η επιχείρηση θα επιβεβαιώσει το ραντεβού και θα σε ενημερώσει στο τηλέφωνο που έδωσες.")}
            </p>
            <a
              href={`${manageBase}/${done.token}`}
              style={{ background: colors.accent, color: colors.onAccent || "#fff" }}
              className="vk-btn mt-7 inline-block rounded-full px-6 py-3 font-bold hover:opacity-90"
              data-testid="booking-manage-link"
            >
              {tr("Δες ή ακύρωσε το ραντεβού σου")}
            </a>
            <p className="mt-3 text-sm opacity-60">{tr("Κράτησε αυτό το link: από εκεί βλέπεις την κατάσταση του ραντεβού σου και το ακυρώνεις αν χρειαστεί.")}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="booking" style={soft ? { background: colors.soft } : undefined} className="scroll-mt-20" data-testid="shop-booking">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <p style={{ color: colors.accent }} className="text-xs font-bold uppercase tracking-[0.22em]">{tr("Online κρατήσεις")}</p>
        <h2 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">{tr(tripDetails ? "Κλείσε τη διαδρομή σου" : "Κλείσε ραντεβού")}</h2>
        <p className="mt-3 max-w-2xl leading-7 opacity-75">
          {tr(autoConfirm ? "Διάλεξε υπηρεσία, μέρα και ώρα. Το ραντεβού κλείνει αμέσως." : "Διάλεξε υπηρεσία, μέρα και ώρα. Η επιχείρηση θα επιβεβαιώσει το ραντεβού σου.")}
        </p>
        {note ? <p style={{ background: card }} className="mt-4 max-w-2xl whitespace-pre-line rounded-2xl p-4 leading-7">{note}</p> : null}

        <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]" noValidate>
          <div className="space-y-8">
            <fieldset>
              <legend className="text-sm font-bold uppercase tracking-wider opacity-60">1 · {tr("Υπηρεσία")}</legend>
              <div className="mt-3 grid gap-3">
                {services.map((s) => {
                  const active = s.id === serviceId
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setServiceId(s.id)}
                      aria-pressed={active}
                      style={{ borderColor: active ? colors.accent : `${colors.ink}26`, background: active ? card : "transparent", boxShadow: active ? `0 0 0 1px ${colors.accent}` : undefined }}
                      className="flex items-baseline justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition"
                      data-testid="booking-service"
                    >
                      <span className="min-w-0">
                        <span className="block font-bold">{s.name}</span>
                        {s.description ? <span className="mt-0.5 block text-sm opacity-70">{s.description}</span> : null}
                      </span>
                      <span className="shrink-0 text-right text-sm">
                        <span className="block opacity-70">{durationText(s.durationMinutes, tr)}</span>
                        {s.price ? <span style={{ color: colors.accent }} className="block font-extrabold">{s.price}</span> : null}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {service ? (
              <fieldset>
                <legend className="text-sm font-bold uppercase tracking-wider opacity-60">2 · {tr("Μέρα και ώρα")}</legend>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => firstDate && goWeek(addDays(firstDate, -7) > today ? addDays(firstDate, -7) : undefined)}
                    disabled={loadingDays || !firstDate || firstDate <= today}
                    aria-label={tr("Προηγούμενες μέρες")}
                    style={{ borderColor: `${colors.ink}26` }}
                    className="h-10 w-10 shrink-0 rounded-full border text-lg disabled:opacity-30"
                  >
                    ‹
                  </button>
                  <div className="grid flex-1 grid-cols-7 gap-1.5">
                    {days.map((d) => {
                      const active = d.date === date
                      const empty = d.slots.length === 0
                      return (
                        <button
                          key={d.date}
                          type="button"
                          disabled={empty}
                          onClick={() => {
                            setDate(d.date)
                            setTime("")
                          }}
                          aria-pressed={active}
                          style={active ? { background: colors.accent, color: colors.onAccent || "#fff" } : { borderColor: `${colors.ink}1f` }}
                          className={`flex flex-col items-center rounded-xl py-2 text-center ${active ? "" : "border"} ${empty ? "opacity-35" : ""}`}
                          data-testid="booking-day"
                        >
                          <span className="text-[11px] font-semibold uppercase">{dateText(d.date, { weekday: "short" })}</span>
                          <span className="text-lg font-extrabold leading-tight">{dateText(d.date, { day: "numeric" })}</span>
                          <span className="text-[10px] opacity-80">{dateText(d.date, { month: "short" })}</span>
                        </button>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => firstDate && goWeek(addDays(firstDate, 7))}
                    disabled={loadingDays || !hasMore}
                    aria-label={tr("Επόμενες μέρες")}
                    style={{ borderColor: `${colors.ink}26` }}
                    className="h-10 w-10 shrink-0 rounded-full border text-lg disabled:opacity-30"
                  >
                    ›
                  </button>
                </div>
                <div className="mt-4 min-h-[3rem]">
                  {loadingDays ? (
                    <p className="opacity-60">{tr("Ψάχνουμε ελεύθερες ώρες…")}</p>
                  ) : daysError ? (
                    <p className="font-semibold text-red-700">{daysError}</p>
                  ) : days.length && !days.some((d) => d.slots.length) ? (
                    <p className="opacity-70">{tr("Δεν υπάρχουν ελεύθερες ώρες αυτές τις μέρες. Δες τις επόμενες.")}</p>
                  ) : selectedDay ? (
                    selectedDay.slots.length ? (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {selectedDay.slots.map((slot) => {
                          const active = slot === time
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setTime(slot)}
                              aria-pressed={active}
                              style={active ? { background: colors.accent, color: colors.onAccent || "#fff", borderColor: colors.accent } : { borderColor: `${colors.ink}26` }}
                              className="rounded-xl border py-2.5 font-bold tabular-nums"
                              data-testid="booking-slot"
                            >
                              {slot}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="opacity-70">{tr("Δεν υπάρχουν ελεύθερες ώρες αυτή τη μέρα.")}</p>
                    )
                  ) : null}
                </div>
              </fieldset>
            ) : null}
          </div>

          <fieldset className={service && time ? "" : "pointer-events-none opacity-40"} disabled={!service || !time}>
            <legend className="text-sm font-bold uppercase tracking-wider opacity-60">3 · {tr(tripDetails ? "Η διαδρομή και τα στοιχεία σου" : "Τα στοιχεία σου")}</legend>
            {service && time ? (
              <p style={{ background: card }} className="mt-3 rounded-2xl p-4 font-semibold" data-testid="booking-summary">
                {service.name} · {dateText(date, { weekday: "long", day: "numeric", month: "long" })}, {time}
              </p>
            ) : null}
            <div className="mt-4 space-y-3">
              {tripDetails ? (
                <div className="space-y-3" data-testid="booking-trip-fields">
                  <label className="block">
                    <span className="text-sm font-semibold">{tr("Σημείο παραλαβής")}</span>
                    <input className={`${field} mt-1`} style={fieldStyle} maxLength={200} placeholder={tr("π.χ. Αεροδρόμιο Ηρακλείου")} value={trip.pickup} onChange={(e) => setTrip({ ...trip, pickup: e.target.value })} data-testid="booking-pickup" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold">{tr("Προορισμός")}</span>
                    <input className={`${field} mt-1`} style={fieldStyle} maxLength={200} placeholder={tr("π.χ. ξενοδοχείο ή διεύθυνση")} value={trip.dropoff} onChange={(e) => setTrip({ ...trip, dropoff: e.target.value })} data-testid="booking-dropoff" />
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="block">
                      <span className="text-sm font-semibold">{tr("Άτομα")}</span>
                      <input className={`${field} mt-1`} style={fieldStyle} type="number" min={1} max={60} inputMode="numeric" value={trip.passengers} onChange={(e) => setTrip({ ...trip, passengers: e.target.value })} data-testid="booking-passengers" />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold">{tr("Αποσκευές")}</span>
                      <input className={`${field} mt-1`} style={fieldStyle} type="number" min={0} max={99} inputMode="numeric" value={trip.luggage} onChange={(e) => setTrip({ ...trip, luggage: e.target.value })} />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold">{tr("Πτήση")}</span>
                      <input className={`${field} mt-1`} style={fieldStyle} maxLength={20} placeholder="A3 123" value={trip.flight} onChange={(e) => setTrip({ ...trip, flight: e.target.value })} />
                    </label>
                  </div>
                  <label className="flex items-center gap-3 text-sm font-semibold">
                    <input type="checkbox" checked={withReturn} onChange={(e) => setWithReturn(e.target.checked)} className="h-4 w-4" style={{ accentColor: colors.accent }} />
                    {tr("Θέλω και επιστροφή")}
                  </label>
                  {withReturn ? (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-sm font-semibold">{tr("Μέρα επιστροφής")}</span>
                        <input className={`${field} mt-1`} style={fieldStyle} type="date" min={date || today} value={trip.returnDate} onChange={(e) => setTrip({ ...trip, returnDate: e.target.value })} />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold">{tr("Ώρα")}</span>
                        <input className={`${field} mt-1`} style={fieldStyle} type="time" value={trip.returnTime} onChange={(e) => setTrip({ ...trip, returnTime: e.target.value })} />
                      </label>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <label className="block">
                <span className="text-sm font-semibold">{tr("Ονοματεπώνυμο")}</span>
                <input className={`${field} mt-1`} style={fieldStyle} autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} data-testid="booking-name" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">{tr("Κινητό τηλέφωνο")}</span>
                <input className={`${field} mt-1`} style={fieldStyle} type="tel" inputMode="tel" autoComplete="tel" placeholder="69XXXXXXXX" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} data-testid="booking-phone" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">{tr("Email")} <span className="font-normal opacity-60">({tr("προαιρετικό")})</span></span>
                <input className={`${field} mt-1`} style={fieldStyle} type="email" autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">{tr("Θέλεις να μας πεις κάτι;")} <span className="font-normal opacity-60">({tr("προαιρετικό")})</span></span>
                <textarea className={`${field} mt-1`} style={fieldStyle} rows={2} value={contact.note} onChange={(e) => setContact({ ...contact, note: e.target.value })} />
              </label>
              {/* Honeypot: hidden from people, filled only by bots. */}
              <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />
              <label className="flex items-start gap-3 text-sm leading-6">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4" style={{ accentColor: colors.accent }} data-testid="booking-consent" />
                <span>{tr("Συμφωνώ να σταλούν τα στοιχεία μου στην επιχείρηση για το ραντεβού.")}</span>
              </label>
              {cancelHours > 0 ? (
                <p className="text-sm opacity-60">{tr("Μπορείς να ακυρώσεις online έως {n} ώρες πριν.").replace("{n}", String(cancelHours))}</p>
              ) : null}
              {error ? <p className="font-semibold text-red-700" role="alert" data-testid="booking-error">{error}</p> : null}
              <button
                type="submit"
                disabled={isPending}
                style={{ background: colors.accent, color: colors.onAccent || "#fff" }}
                className="vk-btn w-full rounded-full px-6 py-3.5 font-bold hover:opacity-90 disabled:opacity-60"
                data-testid="booking-submit"
              >
                {isPending ? tr("Στέλνουμε…") : tr(autoConfirm ? "Κλείσε το ραντεβού" : "Στείλε το αίτημα")}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </section>
  )
}
