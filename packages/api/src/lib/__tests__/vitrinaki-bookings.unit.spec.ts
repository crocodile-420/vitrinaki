import {
  addDays,
  athensOffsetMinutes,
  BOOKINGS_METADATA_KEY,
  canCustomerCancel,
  DEFAULT_BOOKINGS,
  freeSlots,
  isDate,
  localDate,
  localTime,
  localToUtc,
  parseDurationMinutes,
  publicBookings,
  readBookingSettings,
  resourcePool,
  assignResource,
  validateTrip,
  suggestedSettings,
  validateBookingSettings,
  validateContact,
  weekDayOf,
  type BookingSettings,
} from "../vitrinaki-bookings"

const service = { id: "svc_1", name: "Φυσικοθεραπεία", durationMinutes: 60, price: "40€", description: "", active: true, resourceIds: [] as string[] }
const settings = (patch: Partial<BookingSettings> = {}): BookingSettings => {
  const result = validateBookingSettings({ enabled: true, services: [service], ...patch })
  if ("error" in result) throw new Error(result.error)
  return result.settings
}

describe("vitrinaki bookings", () => {
  describe("Greek local time", () => {
    it("knows winter and summer time", () => {
      expect(athensOffsetMinutes(Date.UTC(2026, 0, 15, 12))).toBe(120)
      expect(athensOffsetMinutes(Date.UTC(2026, 6, 15, 12))).toBe(180)
    })

    it("turns a Greek wall time into UTC and back", () => {
      expect(localToUtc("2026-07-15", 9 * 60 + 30).toISOString()).toBe("2026-07-15T06:30:00.000Z")
      expect(localToUtc("2026-12-01", 9 * 60).toISOString()).toBe("2026-12-01T07:00:00.000Z")
      const instant = new Date("2026-10-25T21:30:00Z")
      expect(localDate(instant)).toBe("2026-10-25")
      expect(localTime(instant)).toBe("23:30")
      // The day the clocks go back (25 Oct 2026, 04:00 → 03:00).
      expect(localToUtc("2026-10-25", 10 * 60).toISOString()).toBe("2026-10-25T08:00:00.000Z")
      expect(localToUtc("2026-03-29", 10 * 60).toISOString()).toBe("2026-03-29T07:00:00.000Z")
    })

    it("counts days and week days", () => {
      expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
      expect(addDays("2026-03-01", -1)).toBe("2026-02-28")
      expect(weekDayOf("2026-10-21")).toBe("wed")
      expect(weekDayOf("2026-10-25")).toBe("sun")
      expect(isDate("2026-02-30")).toBe(false)
      expect(isDate("2026-02-28")).toBe(true)
    })
  })

  describe("parseDurationMinutes", () => {
    it("reads the ways people write a duration", () => {
      expect(parseDurationMinutes("45'")).toBe(45)
      expect(parseDurationMinutes("45 λεπτά")).toBe(45)
      expect(parseDurationMinutes("90 min")).toBe(90)
      expect(parseDurationMinutes("1 ώρα")).toBe(60)
      expect(parseDurationMinutes("1,5 ώρες")).toBe(90)
      expect(parseDurationMinutes("1h30")).toBe(90)
      expect(parseDurationMinutes("2h")).toBe(120)
      expect(parseDurationMinutes("")).toBeNull()
      expect(parseDurationMinutes("ανάλογα")).toBeNull()
      expect(parseDurationMinutes("2 λ")).toBeNull()
    })
  })

  describe("validateBookingSettings", () => {
    it("accepts a full set of rules", () => {
      const s = settings({ slotStepMinutes: 15, bufferMinutes: 10, daysOff: [{ from: "2026-08-10", to: "2026-08-20", note: "Διακοπές" }] } as any)
      expect(s.enabled).toBe(true)
      expect(s.slotStepMinutes).toBe(15)
      expect(s.daysOff).toEqual([{ from: "2026-08-10", to: "2026-08-20", note: "Διακοπές" }])
      expect(s.schedule.sat.closed).toBe(true)
    })

    it("refuses to open bookings without a service or a working day", () => {
      expect(validateBookingSettings({ enabled: true, services: [] })).toEqual({ error: expect.stringContaining("υπηρεσία") })
      const closed = Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [d, { closed: true }]))
      expect(validateBookingSettings({ enabled: true, services: [service], schedule: closed })).toEqual({ error: expect.stringContaining("μέρα") })
      expect("settings" in validateBookingSettings({ enabled: false, services: [] })).toBe(true)
    })

    it("checks durations, hours and limits", () => {
      expect("error" in validateBookingSettings({ services: [{ ...service, durationMinutes: 0 }] })).toBe(true)
      expect("error" in validateBookingSettings({ schedule: { mon: { open: "18:00", close: "09:00" } } })).toBe(true)
      expect("error" in validateBookingSettings({ schedule: { mon: { open: "09:00", close: "14:00", open2: "13:00", close2: "20:00" } } })).toBe(true)
      expect("error" in validateBookingSettings({ slotStepMinutes: 7 })).toBe(true)
      expect("error" in validateBookingSettings({ daysOff: [{ from: "2026-08-20", to: "2026-08-10" }] })).toBe(true)
    })

    it("reads back a stored value, switching it off when it is broken", () => {
      expect(readBookingSettings({})).toBeNull()
      expect(readBookingSettings({ [BOOKINGS_METADATA_KEY]: { enabled: true, services: [service] } })?.enabled).toBe(true)
      expect(readBookingSettings({ [BOOKINGS_METADATA_KEY]: { enabled: true, services: [] } })?.enabled).toBe(false)
    })
  })

  describe("suggestedSettings", () => {
    it("starts from the profile's services and hours", () => {
      const s = suggestedSettings({
        services: { items: [{ name: "Personal training", duration: "45'", price: "30€", description: "" }, { name: "Πρόγραμμα", duration: "", price: "", description: "" }], serviceArea: "", online: false, atClient: false },
        hoursEnabled: true,
        hours: {
          mon: { closed: false, open: "08:00", close: "14:00", open2: "17:00", close2: "21:00" },
          tue: { closed: false, open: "08:00", close: "21:00", open2: "", close2: "" },
          wed: { closed: true, open: "", close: "", open2: "", close2: "" },
          thu: { closed: false, open: "08:00", close: "21:00", open2: "", close2: "" },
          fri: { closed: false, open: "08:00", close: "21:00", open2: "", close2: "" },
          sat: { closed: false, open: "10:00", close: "14:00", open2: "", close2: "" },
          sun: { closed: true, open: "", close: "", open2: "", close2: "" },
        },
      } as any)
      expect(s.enabled).toBe(false)
      expect(s.services.map((x) => [x.name, x.durationMinutes])).toEqual([["Personal training", 45], ["Πρόγραμμα", 60]])
      expect(s.schedule.mon.open2).toBe("17:00")
      expect(s.schedule.wed.closed).toBe(true)
    })
  })

  describe("freeSlots", () => {
    // Wednesday 21 Oct 2026, 07:00 Greek time.
    const now = new Date("2026-10-21T04:00:00Z")

    it("lists the start times that fit in the day's hours", () => {
      const slots = freeSlots({ settings: settings(), durationMinutes: 60, date: "2026-10-22", busy: [], now })
      expect(slots[0]).toBe("09:00")
      expect(slots[slots.length - 1]).toBe("16:00")
      expect(slots).toHaveLength(15)
    })

    it("skips taken times, the buffer around them and the notice period", () => {
      const busy = [{ start: localToUtc("2026-10-22", 11 * 60), end: localToUtc("2026-10-22", 12 * 60) }]
      const slots = freeSlots({ settings: settings({ bufferMinutes: 15 }), durationMinutes: 60, date: "2026-10-22", busy, now })
      expect(slots).not.toContain("10:00")
      expect(slots).not.toContain("10:30")
      expect(slots).not.toContain("11:30")
      expect(slots).not.toContain("12:00")
      expect(slots).toContain("09:30")
      expect(slots).toContain("12:30")

      // Today with a 2-hour notice: nothing before 09:00, since it is 07:00.
      const today = freeSlots({ settings: settings(), durationMinutes: 60, date: "2026-10-21", busy: [], now: new Date("2026-10-21T08:10:00Z") })
      expect(today[0]).toBe("13:30")
    })

    it("uses both intervals of a split day", () => {
      const s = settings({ schedule: { ...DEFAULT_BOOKINGS.schedule, thu: { closed: false, open: "09:00", close: "11:00", open2: "17:00", close2: "18:00" } } as any })
      expect(freeSlots({ settings: s, durationMinutes: 60, date: "2026-10-22", busy: [], now })).toEqual(["09:00", "09:30", "10:00", "17:00"])
    })

    it("gives nothing on closed days, days off, the past or too far ahead", () => {
      const s = settings({ daysOff: [{ from: "2026-10-23", to: "2026-10-23", note: "" }], maxDaysAhead: 10 } as any)
      expect(freeSlots({ settings: s, durationMinutes: 60, date: "2026-10-24", busy: [], now })).toEqual([])
      expect(freeSlots({ settings: s, durationMinutes: 60, date: "2026-10-23", busy: [], now })).toEqual([])
      expect(freeSlots({ settings: s, durationMinutes: 60, date: "2026-10-20", busy: [], now })).toEqual([])
      expect(freeSlots({ settings: s, durationMinutes: 60, date: "2026-11-05", busy: [], now })).toEqual([])
      expect(freeSlots({ settings: s, durationMinutes: 60, date: "2026-10-30", busy: [], now }).length).toBeGreaterThan(0)
    })
  })

  describe("resources (vehicles, drivers, trainers)", () => {
    const now = new Date("2026-10-21T04:00:00Z")
    const at = (h: number) => localToUtc("2026-10-22", h * 60)
    const fleet = (patch: Partial<BookingSettings> = {}) =>
      settings({
        resources: [
          { id: "res_car1", name: "Mercedes Vito", active: true },
          { id: "res_car2", name: "Skoda Octavia", active: true },
          { id: "res_old", name: "Παλιό", active: false },
        ],
        ...patch,
      } as any)

    it("keeps the resources and the services' choices that exist", () => {
      const s = fleet({ services: [{ ...service, resourceIds: ["res_car1", "res_gone"] }] } as any)
      expect(s.resources).toHaveLength(3)
      expect(s.services[0].resourceIds).toEqual(["res_car1"])
      expect(resourcePool(s, s.services[0])).toEqual({ all: ["res_car1", "res_car2"], candidates: ["res_car1"] })
      expect(resourcePool(settings(), service)).toBeNull()
      expect("error" in validateBookingSettings({ resources: [{ name: "" }] })).toBe(true)
    })

    it("takes one booking per resource at the same time", () => {
      const s = fleet()
      const pool = resourcePool(s, service)
      const one = [{ start: at(10), end: at(11), resourceId: "res_car1" }]
      expect(freeSlots({ settings: s, durationMinutes: 60, date: "2026-10-22", busy: one, now, pool })).toContain("10:00")
      expect(assignResource({ pool, start: at(10).getTime(), end: at(11).getTime(), busy: one, bufferMs: 0 })).toEqual({ free: true, resourceId: "res_car2" })
      const two = [...one, { start: at(10), end: at(11), resourceId: "res_car2" }]
      expect(freeSlots({ settings: s, durationMinutes: 60, date: "2026-10-22", busy: two, now, pool })).not.toContain("10:00")
      // Without resources, one booking fills the slot as before.
      expect(freeSlots({ settings: settings(), durationMinutes: 60, date: "2026-10-22", busy: one, now })).not.toContain("10:00")
    })

    it("counts bookings without a resource and limits a service to its resources", () => {
      const s = fleet()
      const unassigned = [{ start: at(10), end: at(11), resourceId: null }]
      expect(assignResource({ pool: resourcePool(s, service), start: at(10).getTime(), end: at(11).getTime(), busy: unassigned, bufferMs: 0 }).free).toBe(true)
      const both = [...unassigned, { start: at(10), end: at(11), resourceId: "res_car1" }]
      expect(assignResource({ pool: resourcePool(s, service), start: at(10).getTime(), end: at(11).getTime(), busy: both, bufferMs: 0 }).free).toBe(false)
      const vanOnly = resourcePool(s, { resourceIds: ["res_car1"] })
      const vanBusy = [{ start: at(10), end: at(11), resourceId: "res_car1" }]
      expect(assignResource({ pool: vanOnly, start: at(10).getTime(), end: at(11).getTime(), busy: vanBusy, bufferMs: 0 }).free).toBe(false)
      expect(assignResource({ pool: resourcePool(s, service), start: at(10).getTime(), end: at(11).getTime(), busy: [], bufferMs: 0, prefer: "res_car2" })).toEqual({ free: true, resourceId: "res_car2" })
    })

    it("checks the trip of a transfer", () => {
      const ok = validateTrip({ pickup: "Αεροδρόμιο Ηρακλείου", dropoff: "Χερσόνησος, Hotel Aldemar", passengers: "4", luggage: 3, flight: "a3 123" }, { date: "2026-10-22", time: "10:00" })
      expect("trip" in ok && ok.trip).toMatchObject({ passengers: 4, luggage: 3, flight: "A3 123", returnDate: "" })
      expect("error" in validateTrip({ pickup: "", dropoff: "Χανιά", passengers: 2 })).toBe(true)
      expect("error" in validateTrip({ pickup: "Λιμάνι", dropoff: "Χανιά", passengers: 0 })).toBe(true)
      expect("error" in validateTrip({ pickup: "Λιμάνι", dropoff: "Χανιά", passengers: 2, returnDate: "2026-10-21", returnTime: "09:00" }, { date: "2026-10-22", time: "10:00" })).toBe(true)
      expect(publicBookings(fleet({ tripDetails: true } as any))).toMatchObject({ tripDetails: true })
    })
  })

  describe("contact and public view", () => {
    it("checks the shopper's details", () => {
      expect(validateContact({ name: "Μαρία Π.", phone: "694 123 4567" })).toEqual({ contact: { name: "Μαρία Π.", phone: "6941234567", email: "", note: "" } })
      expect("error" in validateContact({ name: "Μ", phone: "6941234567" })).toBe(true)
      expect("error" in validateContact({ name: "Μαρία", phone: "123" })).toBe(true)
      expect("error" in validateContact({ name: "Μαρία", phone: "6941234567", email: "nope" })).toBe(true)
    })

    it("shows shoppers only what they need", () => {
      expect(publicBookings(null)).toEqual({ enabled: false })
      const view = publicBookings(settings({ services: [service, { ...service, id: "svc_2", active: false }] }))
      expect(view.enabled && view.services.map((s) => s.id)).toEqual(["svc_1"])
      expect(view).not.toHaveProperty("schedule")
    })

    it("lets the customer cancel only in time", () => {
      const now = new Date("2026-10-21T10:00:00Z")
      expect(canCustomerCancel(settings(), new Date("2026-10-22T11:00:00Z"), now)).toBe(true)
      expect(canCustomerCancel(settings(), new Date("2026-10-22T09:00:00Z"), now)).toBe(false)
      expect(canCustomerCancel(settings({ cancelHours: 0 } as any), new Date("2026-10-21T10:30:00Z"), now)).toBe(true)
    })
  })
})
