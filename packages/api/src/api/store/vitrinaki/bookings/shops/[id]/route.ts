import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  addDays,
  freeSlots,
  isDate,
  localDate,
  localToUtc,
  MAX_ACTIVE_PER_CONTACT,
  newCancelToken,
  publicBookings,
  resourcePool,
  toMinutes,
  validateContact,
  validateTrip,
} from "../../../../../../lib/vitrinaki-bookings"
import { customerBookingView, loadBookingShop, resourceChoice } from "../../../../../../lib/vitrinaki-bookings-store"
import { VITRINAKI_BOOKINGS_MODULE } from "../../../../../../modules/vitrinaki-bookings"
import type VitrinakiBookingsModuleService from "../../../../../../modules/vitrinaki-bookings/service"

const MAX_DAYS_PER_REQUEST = 21
const DAY_MS = 86400000

const closedMessage = "Αυτή η επιχείρηση δεν δέχεται online κρατήσεις αυτή τη στιγμή."

// The shop page's booking box: the bookable services and, for one service,
// the free start times of each day in [from, from + days).
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "no-store")
  const shop = await loadBookingShop(req.scope, String(req.params.id || ""))
  if (!shop || !shop.open) return res.status(404).json({ message: "Το κατάστημα δεν βρέθηκε." })
  const settings = shop.settings
  const view = publicBookings(settings)
  if (!settings || !view.enabled) return res.json({ bookings: view, days: [] })

  const serviceId = String(req.query.service || "")
  const service = settings.services.find((s) => s.id === serviceId && s.active)
  if (!service) return res.json({ bookings: view, days: [] })

  const now = new Date()
  const today = localDate(now)
  const from = isDate(req.query.from) && String(req.query.from) > today ? String(req.query.from) : today
  const requested = Number(req.query.days)
  const days = Number.isInteger(requested) && requested > 0 ? Math.min(requested, MAX_DAYS_PER_REQUEST) : 7

  const busy = await req.scope
    .resolve<VitrinakiBookingsModuleService>(VITRINAKI_BOOKINGS_MODULE)
    .busyBetween(shop.id, new Date(localToUtc(from, 0).getTime() - DAY_MS), new Date(localToUtc(addDays(from, days), 0).getTime() + DAY_MS))

  const list = Array.from({ length: days }, (_, i) => {
    const date = addDays(from, i)
    return { date, slots: freeSlots({ settings, durationMinutes: service.durationMinutes, date, busy, now, pool: resourcePool(settings, service) }) }
  })
  const last = addDays(today, settings.maxDaysAhead)
  return res.json({ bookings: view, days: list, has_more: addDays(from, days) <= last })
}

// Books a slot. The slot is checked against the shop's rules here and taken
// under the shop's lock in the module, so a time cannot be booked twice.
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Record<string, unknown>
  // Honeypot: a field people never see. Only bots fill it.
  if (typeof body.website === "string" && body.website.trim()) return res.status(400).json({ message: closedMessage })

  const shop = await loadBookingShop(req.scope, String(req.params.id || ""))
  if (!shop || !shop.open) return res.status(404).json({ message: "Το κατάστημα δεν βρέθηκε." })
  const settings = shop.settings
  if (!settings?.enabled) return res.status(400).json({ message: closedMessage })

  const service = settings.services.find((s) => s.id === body.service_id && s.active)
  if (!service) return res.status(400).json({ message: "Διάλεξε μια υπηρεσία." })
  const date = String(body.date || "")
  const time = String(body.time || "")
  if (!isDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return res.status(400).json({ message: "Διάλεξε μέρα και ώρα." })
  const contact = validateContact(body.contact ?? body)
  if ("error" in contact) return res.status(400).json({ message: contact.error })
  const trip = settings.tripDetails ? validateTrip(body.trip, { date, time }) : null
  if (trip && "error" in trip) return res.status(400).json({ message: trip.error })
  if (body.consent !== true) return res.status(400).json({ message: "Χρειάζεται η συγκατάθεσή σου για να σταλούν τα στοιχεία σου στην επιχείρηση." })

  const now = new Date()
  const module = req.scope.resolve<VitrinakiBookingsModuleService>(VITRINAKI_BOOKINGS_MODULE)
  const busy = await module.busyBetween(
    shop.id,
    new Date(localToUtc(date, 0).getTime() - DAY_MS),
    new Date(localToUtc(addDays(date, 1), 0).getTime() + DAY_MS)
  )
  if (!freeSlots({ settings, durationMinutes: service.durationMinutes, date, busy, now, pool: resourcePool(settings, service) }).includes(time)) {
    return res.status(409).json({ message: "Αυτή η ώρα δεν είναι πια διαθέσιμη. Διάλεξε μια άλλη." })
  }

  const start = localToUtc(date, toMinutes(time))
  const end = new Date(start.getTime() + service.durationMinutes * 60000)
  const token = newCancelToken()
  const status = settings.autoConfirm ? "confirmed" : "pending"
  try {
    const { id } = await module.reserve({
      seller_id: shop.id,
      service_id: service.id,
      service_name: service.name,
      duration_minutes: service.durationMinutes,
      price: service.price || null,
      start_at: start,
      end_at: end,
      status,
      source: "online",
      customer_id: req.auth_context?.actor_type === "customer" ? req.auth_context.actor_id || null : null,
      customer_name: contact.contact.name,
      customer_phone: contact.contact.phone,
      customer_email: contact.contact.email || null,
      customer_note: contact.contact.note || null,
      shop_note: null,
      cancel_token: token,
      details: trip ? { trip: trip.trip } : null,
      buffer_minutes: settings.bufferMinutes,
      max_active_per_phone: MAX_ACTIVE_PER_CONTACT,
      resources: resourceChoice(settings, service),
    })
    const booking = await module.retrieveBooking(id)
    return res.status(201).json({ booking: customerBookingView(booking, shop, true), token })
  } catch (error) {
    if (error instanceof MedusaError && error.type === MedusaError.Types.NOT_ALLOWED) {
      return res.status(409).json({ message: error.message })
    }
    throw error
  }
}
