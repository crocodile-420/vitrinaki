import { randomBytes } from "crypto"

import { isEmail, isGreekPhone, normalizePhone, WEEK_DAYS, type DayHours, type PublicProfile } from "./vitrinaki-profile"

// Online bookings for service businesses (trainers, physiotherapists, tattoo
// artists, transfers…). Each shop keeps its rules in
// seller.metadata.vitrinaki_bookings: which services can be booked and for how
// long, the weekly schedule, days off and a few limits. The bookings
// themselves live in the vitrinaki-bookings module.
//
// Capacity: a shop without resources takes one booking at a time (a slot is
// free when no pending or confirmed booking, plus the buffer, overlaps it). A
// shop with resources (vehicles, drivers, trainers, chairs, rooms) takes one
// booking per resource at a time, and each booking gets one of the resources
// that can do its service.
//
// All times are Greek local time (Europe/Athens); the database stores UTC.

export const BOOKINGS_METADATA_KEY = "vitrinaki_bookings"
export const BOOKINGS_TIMEZONE = "Europe/Athens"

export const MAX_SERVICES = 20
export const MAX_DAYS_OFF = 40
export const SLOT_STEPS = [10, 15, 20, 30, 45, 60] as const
export const MIN_DURATION = 5
export const MAX_DURATION = 8 * 60
export const MAX_ACTIVE_PER_CONTACT = 3
export const MAX_RESOURCES = 30
export const MAX_PASSENGERS = 60

export type WeekDay = (typeof WEEK_DAYS)[number]
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "declined" | "completed" | "no_show"
// Statuses that hold the slot.
export const ACTIVE_STATUSES: BookingStatus[] = ["pending", "confirmed"]

export type BookingService = {
  id: string
  name: string
  durationMinutes: number
  price: string
  description: string
  active: boolean
  // Resources that can do this service; empty: all of them.
  resourceIds: string[]
}

// A vehicle, a driver, a trainer, a chair, a room: one booking at a time each.
export type BookingResource = { id: string; name: string; active: boolean }

export type DayOff = { from: string; to: string; note: string }

export type BookingSettings = {
  enabled: boolean
  // Off: each online booking waits for the shop to confirm it.
  autoConfirm: boolean
  services: BookingService[]
  schedule: Record<WeekDay, DayHours>
  slotStepMinutes: number
  bufferMinutes: number
  minNoticeHours: number
  maxDaysAhead: number
  cancelHours: number
  daysOff: DayOff[]
  note: string
  resources: BookingResource[]
  // What the shop calls its resources («Όχημα», «Trainer»…), for its Studio.
  resourceLabel: string
  // Transfers and taxis: the booking form asks for the trip.
  tripDetails: boolean
}

const day = (open: string, close: string): DayHours => ({ closed: false, open, close, open2: "", close2: "" })
const closedDay = (): DayHours => ({ closed: true, open: "", close: "", open2: "", close2: "" })

export const defaultSchedule = (): Record<WeekDay, DayHours> => ({
  mon: day("09:00", "17:00"),
  tue: day("09:00", "17:00"),
  wed: day("09:00", "17:00"),
  thu: day("09:00", "17:00"),
  fri: day("09:00", "17:00"),
  sat: closedDay(),
  sun: closedDay(),
})

export const DEFAULT_BOOKINGS: BookingSettings = {
  enabled: false,
  autoConfirm: false,
  services: [],
  schedule: defaultSchedule(),
  slotStepMinutes: 30,
  bufferMinutes: 0,
  minNoticeHours: 2,
  maxDaysAhead: 60,
  cancelHours: 24,
  daysOff: [],
  note: "",
  resources: [],
  resourceLabel: "",
  tripDetails: false,
}

const str = (value: unknown, limit: number) => (typeof value === "string" ? value.trim().slice(0, limit) : "")
const obj = (value: unknown) => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {})
const toInt = (value: unknown) => {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value.trim()) : NaN
  return Number.isFinite(n) ? Math.round(n) : NaN
}
const isTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
export const isDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value

export const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
export const fromMinutes = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`

export const newServiceId = () => `svc_${randomBytes(4).toString("hex")}`
export const newResourceId = () => `res_${randomBytes(4).toString("hex")}`
export const newCancelToken = () => randomBytes(24).toString("base64url")

// «45'», «45 λεπτά», «1 ώρα», «1,5 ώρες», «1h30», «90 min» → minutes.
export function parseDurationMinutes(text: string): number | null {
  const value = text.toLowerCase().replace(",", ".").trim()
  if (!value) return null
  const hm = value.match(/^(\d+(?:\.\d+)?)\s*(?:h|ώρ[αεες]*|ωρ[αεες]*|hours?|hrs?)\s*(?:και\s*)?(\d+)?\s*(?:'|λ|λεπτ[αά]|min|m)?/)
  if (hm) {
    const minutes = Math.round(Number(hm[1]) * 60 + (hm[2] ? Number(hm[2]) : 0))
    return minutes >= MIN_DURATION && minutes <= MAX_DURATION ? minutes : null
  }
  const m = value.match(/^(\d+)\s*(?:'|΄|λ|λεπτ[αά]|min|mins|minutes|m)?(?:\s|$|\.)/)
  if (m) {
    const minutes = Number(m[1])
    return minutes >= MIN_DURATION && minutes <= MAX_DURATION ? minutes : null
  }
  return null
}

function validateDay(input: unknown, label: string): { day: DayHours } | { error: string } {
  const raw = obj(input)
  if (raw.closed === true) return { day: closedDay() }
  const open = str(raw.open, 5)
  const close = str(raw.close, 5)
  const open2 = str(raw.open2, 5)
  const close2 = str(raw.close2, 5)
  if (!isTime(open) || !isTime(close) || toMinutes(close) <= toMinutes(open)) {
    return { error: `${label}: η ώρα λήξης πρέπει να είναι μετά την ώρα έναρξης.` }
  }
  if (open2 || close2) {
    if (!isTime(open2) || !isTime(close2) || toMinutes(close2) <= toMinutes(open2) || toMinutes(open2) < toMinutes(close)) {
      return { error: `${label}: το δεύτερο διάστημα πρέπει να ξεκινά μετά το πρώτο και να λήγει μετά την έναρξή του.` }
    }
    return { day: { closed: false, open, close, open2, close2 } }
  }
  return { day: { closed: false, open, close, open2: "", close2: "" } }
}

export const DAY_LABELS: Record<WeekDay, string> = {
  mon: "Δευτέρα", tue: "Τρίτη", wed: "Τετάρτη", thu: "Πέμπτη", fri: "Παρασκευή", sat: "Σάββατο", sun: "Κυριακή",
}

export function validateService(input: unknown): { service: BookingService } | { error: string } {
  const raw = obj(input)
  const name = str(raw.name, 120)
  if (!name) return { error: "Κάθε υπηρεσία χρειάζεται όνομα." }
  const durationMinutes = toInt(raw.durationMinutes)
  if (!(durationMinutes >= MIN_DURATION && durationMinutes <= MAX_DURATION)) {
    return { error: `«${name}»: η διάρκεια πρέπει να είναι από ${MIN_DURATION} λεπτά έως ${MAX_DURATION / 60} ώρες.` }
  }
  const id = typeof raw.id === "string" && /^[a-z0-9_]{3,40}$/i.test(raw.id) ? raw.id : newServiceId()
  return {
    service: {
      id,
      name,
      durationMinutes,
      price: str(raw.price, 40),
      description: str(raw.description, 400),
      active: raw.active !== false,
      resourceIds: Array.isArray(raw.resourceIds) ? raw.resourceIds.filter((v): v is string => typeof v === "string").slice(0, MAX_RESOURCES) : [],
    },
  }
}

const inRange = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max

// Validates what the Studio sends. Errors are Greek, shown as they are.
export function validateBookingSettings(input: unknown): { settings: BookingSettings } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Μη έγκυρες ρυθμίσεις." }
  const raw = input as Record<string, unknown>

  const resourceList = raw.resources === undefined ? [] : raw.resources
  if (!Array.isArray(resourceList)) return { error: "Μη έγκυρη λίστα πόρων." }
  if (resourceList.length > MAX_RESOURCES) return { error: `Μέχρι ${MAX_RESOURCES} οχήματα, άτομα ή χώροι.` }
  const resources: BookingResource[] = []
  for (const item of resourceList) {
    const res = obj(item)
    const name = str(res.name, 60)
    if (!name) return { error: "Κάθε όχημα, άτομο ή χώρος χρειάζεται όνομα." }
    let id = typeof res.id === "string" && /^[a-z0-9_]{3,40}$/i.test(res.id) ? res.id : newResourceId()
    if (resources.some((r) => r.id === id)) id = newResourceId()
    resources.push({ id, name, active: res.active !== false })
  }
  const resourceIds = new Set(resources.map((r) => r.id))

  const list = raw.services === undefined ? [] : raw.services
  if (!Array.isArray(list)) return { error: "Μη έγκυρη λίστα υπηρεσιών." }
  if (list.length > MAX_SERVICES) return { error: `Μέχρι ${MAX_SERVICES} υπηρεσίες.` }
  const services: BookingService[] = []
  const seen = new Set<string>()
  for (const item of list) {
    const result = validateService(item)
    if ("error" in result) return result
    let service = result.service
    if (seen.has(service.id)) service = { ...service, id: newServiceId() }
    seen.add(service.id)
    services.push({ ...service, resourceIds: service.resourceIds.filter((id) => resourceIds.has(id)) })
  }

  const scheduleRaw = raw.schedule === undefined ? defaultSchedule() : obj(raw.schedule)
  const schedule = {} as Record<WeekDay, DayHours>
  for (const d of WEEK_DAYS) {
    const result = validateDay((scheduleRaw as Record<string, unknown>)[d] ?? { closed: true }, DAY_LABELS[d])
    if ("error" in result) return result
    schedule[d] = result.day
  }

  const num = (key: keyof BookingSettings) => (raw[key] === undefined ? (DEFAULT_BOOKINGS[key] as number) : toInt(raw[key]))
  const slotStepMinutes = num("slotStepMinutes")
  if (!(SLOT_STEPS as readonly number[]).includes(slotStepMinutes)) return { error: "Μη έγκυρο βήμα ωρών." }
  const bufferMinutes = num("bufferMinutes")
  if (!inRange(bufferMinutes, 0, 120)) return { error: "Το διάλειμμα ανάμεσα στα ραντεβού πρέπει να είναι από 0 έως 120 λεπτά." }
  const minNoticeHours = num("minNoticeHours")
  if (!inRange(minNoticeHours, 0, 168)) return { error: "Η ελάχιστη προειδοποίηση πρέπει να είναι από 0 έως 168 ώρες." }
  const maxDaysAhead = num("maxDaysAhead")
  if (!inRange(maxDaysAhead, 1, 365)) return { error: "Οι κρατήσεις μπορούν να γίνονται από 1 έως 365 μέρες μπροστά." }
  const cancelHours = num("cancelHours")
  if (!inRange(cancelHours, 0, 168)) return { error: "Η ακύρωση από τον πελάτη πρέπει να επιτρέπεται έως 0 έως 168 ώρες πριν." }

  const offList = raw.daysOff === undefined ? [] : raw.daysOff
  if (!Array.isArray(offList)) return { error: "Μη έγκυρη λίστα ημερών άδειας." }
  if (offList.length > MAX_DAYS_OFF) return { error: `Μέχρι ${MAX_DAYS_OFF} περίοδοι άδειας.` }
  const daysOff: DayOff[] = []
  for (const item of offList) {
    const off = obj(item)
    const from = str(off.from, 10)
    const to = str(off.to, 10) || from
    if (!isDate(from) || !isDate(to) || to < from) return { error: "Μη έγκυρες ημερομηνίες άδειας." }
    daysOff.push({ from, to, note: str(off.note, 120) })
  }
  daysOff.sort((a, b) => a.from.localeCompare(b.from))

  const enabled = raw.enabled === true
  if (enabled && !services.some((s) => s.active)) {
    return { error: "Πρόσθεσε τουλάχιστον μία υπηρεσία για να ανοίξεις τις κρατήσεις." }
  }
  if (enabled && WEEK_DAYS.every((d) => schedule[d].closed)) {
    return { error: "Όρισε τουλάχιστον μία μέρα με ωράριο για να ανοίξεις τις κρατήσεις." }
  }

  return {
    settings: {
      enabled,
      autoConfirm: raw.autoConfirm === true,
      services,
      schedule,
      slotStepMinutes,
      bufferMinutes,
      minNoticeHours,
      maxDaysAhead,
      cancelHours,
      daysOff,
      note: str(raw.note, 500),
      resources,
      resourceLabel: str(raw.resourceLabel, 30),
      tripDetails: raw.tripDetails === true,
    },
  }
}

// Whatever is stored, read it back as valid settings. Anything malformed falls
// back to bookings switched off, so a hand-edited value never takes bookings
// the shop cannot see in its Studio.
export function readBookingSettings(metadata: unknown): BookingSettings | null {
  const stored = obj(metadata)[BOOKINGS_METADATA_KEY]
  if (!stored || typeof stored !== "object") return null
  const result = validateBookingSettings(stored)
  if ("settings" in result) return result.settings
  const fallback = validateBookingSettings({ ...(stored as object), enabled: false })
  return "settings" in fallback ? fallback.settings : { ...DEFAULT_BOOKINGS, schedule: defaultSchedule() }
}

// First visit to the Studio page: start from what the shop already told us in
// its profile (services with a readable duration, opening hours).
export function suggestedSettings(profile: Partial<PublicProfile> | null | undefined): BookingSettings {
  const settings: BookingSettings = { ...DEFAULT_BOOKINGS, schedule: defaultSchedule(), services: [], daysOff: [], resources: [] }
  const items = profile?.services?.items || []
  settings.services = items.slice(0, MAX_SERVICES).map((item) => ({
    id: newServiceId(),
    name: String(item.name || "").slice(0, 120),
    durationMinutes: parseDurationMinutes(String(item.duration || "")) ?? 60,
    price: String(item.price || "").slice(0, 40),
    description: String(item.description || "").slice(0, 400),
    active: true,
    resourceIds: [],
  })).filter((s) => s.name)
  if (profile?.hoursEnabled && profile.hours) {
    const schedule = {} as Record<WeekDay, DayHours>
    let ok = true
    for (const d of WEEK_DAYS) {
      const result = validateDay(profile.hours[d], DAY_LABELS[d])
      if ("error" in result) ok = false
      else schedule[d] = result.day
    }
    if (ok && WEEK_DAYS.some((d) => !schedule[d].closed)) settings.schedule = schedule
  }
  return settings
}

// What a shopper may see of the rules.
export const publicBookings = (settings: BookingSettings | null) =>
  settings?.enabled
    ? {
        enabled: true as const,
        services: settings.services
          .filter((s) => s.active)
          .map(({ id, name, durationMinutes, price, description }) => ({ id, name, durationMinutes, price, description })),
        maxDaysAhead: settings.maxDaysAhead,
        cancelHours: settings.cancelHours,
        autoConfirm: settings.autoConfirm,
        note: settings.note,
        tripDetails: settings.tripDetails,
      }
    : { enabled: false as const }

// ---------- Greek local time ----------

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BOOKINGS_TIMEZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

function localParts(utcMs: number) {
  const parts = partsFormatter.formatToParts(new Date(utcMs))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24, minute: get("minute"), second: get("second") }
}

// Minutes Athens is ahead of UTC at that instant (120 in winter, 180 in summer).
export function athensOffsetMinutes(utcMs: number): number {
  const p = localParts(utcMs)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000)
}

// «2026-10-21» + 9:30 (in minutes) Greek time → the UTC instant.
export function localToUtc(date: string, minutes: number): Date {
  const [y, m, d] = date.split("-").map(Number)
  const wall = Date.UTC(y, m - 1, d, 0, minutes)
  let utc = wall - athensOffsetMinutes(wall) * 60000
  const corrected = wall - athensOffsetMinutes(utc) * 60000
  if (corrected !== utc) utc = corrected
  return new Date(utc)
}

export function localDate(instant: Date): string {
  const p = localParts(instant.getTime())
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`
}

export function localTime(instant: Date): string {
  const p = localParts(instant.getTime())
  return fromMinutes(p.hour * 60 + p.minute)
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function weekDayOf(date: string): WeekDay {
  const [y, m, d] = date.split("-").map(Number)
  // getUTCDay: 0 = Sunday
  return WEEK_DAYS[(new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7]
}

export const isDayOff = (settings: BookingSettings, date: string) =>
  settings.daysOff.some((off) => date >= off.from && date <= off.to)

// ---------- free slots ----------

export type Busy = { start: Date; end: Date; resourceId?: string | null }

const overlapping = (start: number, end: number, busy: Busy[], bufferMs: number) =>
  busy.filter((b) => start < b.end.getTime() + bufferMs && b.start.getTime() < end + bufferMs)

// Which resources a service can use: null when the shop has none (one booking
// at a time), otherwise all active resources and those that do the service.
export type ResourcePool = { all: string[]; candidates: string[] } | null

export function resourcePool(settings: Pick<BookingSettings, "resources"> | null | undefined, service?: Pick<BookingService, "resourceIds"> | null): ResourcePool {
  const all = (settings?.resources || []).filter((r) => r.active).map((r) => r.id)
  if (!all.length) return null
  const chosen = (service?.resourceIds || []).filter((id) => all.includes(id))
  return { all, candidates: chosen.length ? chosen : all }
}

// Whether [start, end) can take one more booking, and on which resource. A
// booking without a resource (made before the shop added resources, or on a
// resource since removed) still takes up one of them.
export function assignResource(input: { pool: ResourcePool; start: number; end: number; busy: Busy[]; bufferMs: number; prefer?: string | null }):
  | { free: false }
  | { free: true; resourceId: string | null } {
  const { pool, start, end, busy, bufferMs, prefer } = input
  const clash = overlapping(start, end, busy, bufferMs)
  if (!pool) return clash.length ? { free: false } : { free: true, resourceId: null }
  const used = new Set(clash.map((b) => b.resourceId).filter((id): id is string => Boolean(id) && pool.all.includes(id as string)))
  const unassigned = clash.length - clash.filter((b) => b.resourceId && pool.all.includes(b.resourceId)).length
  const freeAll = pool.all.filter((id) => !used.has(id))
  const freeCandidates = pool.candidates.filter((id) => !used.has(id))
  if (!freeCandidates.length || freeAll.length - unassigned <= 0) return { free: false }
  return { free: true, resourceId: prefer && freeCandidates.includes(prefer) ? prefer : freeCandidates[0] }
}

// The start times («09:30») a service can be booked at on one day.
export function freeSlots(input: {
  settings: BookingSettings
  durationMinutes: number
  date: string
  busy: Busy[]
  now: Date
  pool?: ResourcePool
}): string[] {
  const { settings, durationMinutes, date, busy, now } = input
  const pool = input.pool ?? null
  const today = localDate(now)
  if (date < today || date > addDays(today, settings.maxDaysAhead)) return []
  if (isDayOff(settings, date)) return []
  const hours = settings.schedule[weekDayOf(date)]
  if (!hours || hours.closed) return []

  const earliest = now.getTime() + settings.minNoticeHours * 3600000
  const bufferMs = settings.bufferMinutes * 60000
  const windows: Array<[number, number]> = [[toMinutes(hours.open), toMinutes(hours.close)]]
  if (hours.open2 && hours.close2) windows.push([toMinutes(hours.open2), toMinutes(hours.close2)])

  const slots: string[] = []
  for (const [open, close] of windows) {
    for (let t = open; t + durationMinutes <= close; t += settings.slotStepMinutes) {
      const start = localToUtc(date, t).getTime()
      if (start < earliest) continue
      const end = start + durationMinutes * 60000
      if (!assignResource({ pool, start, end, busy, bufferMs }).free) continue
      slots.push(fromMinutes(t))
    }
  }
  return slots
}

// ---------- the shopper's details ----------

export type BookingContact = { name: string; phone: string; email: string; note: string }

export function validateContact(input: unknown): { contact: BookingContact } | { error: string } {
  const raw = obj(input)
  const name = str(raw.name, 100)
  if (name.length < 2) return { error: "Γράψε το ονοματεπώνυμό σου." }
  const phoneRaw = str(raw.phone, 30)
  const phone = normalizePhone(phoneRaw)
  if (!isGreekPhone(phone) && !/^\+\d{8,15}$/.test(phone)) {
    return { error: "Γράψε ένα έγκυρο τηλέφωνο (π.χ. 69XXXXXXXX ή +30…)." }
  }
  const email = str(raw.email, 254).toLowerCase()
  if (email && !isEmail(email)) return { error: "Μη έγκυρο email." }
  return { contact: { name, phone, email, note: str(raw.note, 500) } }
}

// A shopper may cancel online until `cancelHours` before the start.
export const canCustomerCancel = (settings: BookingSettings | null, startsAt: Date, now: Date) =>
  startsAt.getTime() - now.getTime() >= (settings?.cancelHours ?? DEFAULT_BOOKINGS.cancelHours) * 3600000

// ---------- the trip (transfers, taxis) ----------

export type TripDetails = {
  pickup: string
  dropoff: string
  passengers: number
  luggage: number | null
  flight: string
  returnDate: string
  returnTime: string
}

// Asked when the shop has «Στοιχεία διαδρομής» on. The return leg is kept as
// a request for the shop to book, not as a second slot.
export function validateTrip(input: unknown, start?: { date: string; time: string }): { trip: TripDetails } | { error: string } {
  const raw = obj(input)
  const pickup = str(raw.pickup, 200)
  if (pickup.length < 3) return { error: "Γράψε από πού θα σε παραλάβουμε." }
  const dropoff = str(raw.dropoff, 200)
  if (dropoff.length < 3) return { error: "Γράψε πού πηγαίνεις." }
  const passengers = toInt(raw.passengers)
  if (!(passengers >= 1 && passengers <= MAX_PASSENGERS)) return { error: `Τα άτομα πρέπει να είναι από 1 έως ${MAX_PASSENGERS}.` }
  const luggageRaw = raw.luggage === undefined || raw.luggage === null || raw.luggage === "" ? null : toInt(raw.luggage)
  if (luggageRaw !== null && !(luggageRaw >= 0 && luggageRaw <= 99)) return { error: "Μη έγκυρος αριθμός αποσκευών." }
  const returnDate = str(raw.returnDate, 10)
  const returnTime = str(raw.returnTime, 5)
  if (returnDate || returnTime) {
    if (!isDate(returnDate) || !isTime(returnTime)) return { error: "Γράψε μέρα και ώρα για την επιστροφή." }
    if (start && `${returnDate} ${returnTime}` <= `${start.date} ${start.time}`) return { error: "Η επιστροφή πρέπει να είναι μετά την παραλαβή." }
  }
  return {
    trip: { pickup, dropoff, passengers, luggage: luggageRaw, flight: str(raw.flight, 20).toUpperCase(), returnDate, returnTime },
  }
}
