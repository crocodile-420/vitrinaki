import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  addDays,
  DEFAULT_BOOKINGS,
  isDate,
  localDate,
  localToUtc,
  MAX_DURATION,
  MIN_DURATION,
  newCancelToken,
  readBookingSettings,
  toMinutes,
  validateContact,
  validateTrip,
} from "../../../../lib/vitrinaki-bookings"
import { resourceChoice, vendorBookingView } from "../../../../lib/vitrinaki-bookings-store"
import { loadSeller } from "../../../../lib/stripe-connect-seller"
import { VITRINAKI_BOOKINGS_MODULE } from "../../../../modules/vitrinaki-bookings"
import type VitrinakiBookingsModuleService from "../../../../modules/vitrinaki-bookings/service"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

const MAX_RANGE_DAYS = 62

// The Studio calendar: bookings whose start falls in [from, to] (Greek dates,
// both included), plus the pending requests still waiting for an answer.
export async function GET(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  const today = localDate(new Date())
  const from = isDate(req.query.from) ? String(req.query.from) : today
  let to = isDate(req.query.to) ? String(req.query.to) : addDays(from, 6)
  if (to < from) to = from
  if (to > addDays(from, MAX_RANGE_DAYS)) to = addDays(from, MAX_RANGE_DAYS)

  const module = req.scope.resolve<VitrinakiBookingsModuleService>(VITRINAKI_BOOKINGS_MODULE)
  const [inRange, pending, stats] = await Promise.all([
    module.listBookings(
      { seller_id: sellerId, start_at: { $gte: localToUtc(from, 0), $lt: localToUtc(addDays(to, 1), 0) } },
      { order: { start_at: "ASC" }, take: 1000 }
    ),
    module.listBookings(
      { seller_id: sellerId, status: "pending", end_at: { $gt: new Date() } },
      { order: { start_at: "ASC" }, take: 100 }
    ),
    module.sellerStats(sellerId),
  ])
  return res.json({
    from,
    to,
    bookings: inRange.map(vendorBookingView),
    pending: pending.map(vendorBookingView),
    stats,
  })
}

// A booking the shop adds itself (a phone call, a walk-in). Only the overlap
// check applies, and `force` skips even that (e.g. two people at once).
export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  const body = (req.body || {}) as Record<string, unknown>
  const seller = await loadSeller(req.scope, sellerId)
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })
  const settings = readBookingSettings(seller.metadata)

  const service = settings?.services.find((s) => s.id === body.service_id)
  const name = service?.name ?? (typeof body.service_name === "string" ? body.service_name.trim().slice(0, 120) : "")
  const duration = service?.durationMinutes ?? Math.round(Number(body.duration_minutes))
  if (!name) return res.status(400).json({ message: "Διάλεξε ή γράψε υπηρεσία." })
  if (!(duration >= MIN_DURATION && duration <= MAX_DURATION)) return res.status(400).json({ message: "Μη έγκυρη διάρκεια." })
  const date = String(body.date || "")
  const time = String(body.time || "")
  if (!isDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return res.status(400).json({ message: "Διάλεξε μέρα και ώρα." })
  const contact = validateContact(body.contact ?? body)
  if ("error" in contact) return res.status(400).json({ message: contact.error })
  // The shop fills the trip when it has one to note; it is not required here.
  const trip = body.trip && typeof body.trip === "object" ? validateTrip(body.trip, { date, time }) : null
  if (trip && "error" in trip) return res.status(400).json({ message: trip.error })
  const resourceId = typeof body.resource_id === "string" && body.resource_id ? body.resource_id : null

  const start = localToUtc(date, toMinutes(time))
  const module = req.scope.resolve<VitrinakiBookingsModuleService>(VITRINAKI_BOOKINGS_MODULE)
  try {
    const { id } = await module.reserve({
      seller_id: sellerId,
      service_id: service?.id ?? null,
      service_name: name,
      duration_minutes: duration,
      price: service?.price || null,
      start_at: start,
      end_at: new Date(start.getTime() + duration * 60000),
      status: "confirmed",
      source: "studio",
      customer_id: null,
      customer_name: contact.contact.name,
      customer_phone: contact.contact.phone,
      customer_email: contact.contact.email || null,
      customer_note: contact.contact.note || null,
      shop_note: typeof body.shop_note === "string" ? body.shop_note.trim().slice(0, 500) || null : null,
      cancel_token: newCancelToken(),
      buffer_minutes: settings?.bufferMinutes ?? DEFAULT_BOOKINGS.bufferMinutes,
      allow_overlap: body.force === true,
      details: trip ? { trip: trip.trip } : null,
      // A resource the shop picked must be free; otherwise any that does the service.
      resources: resourceChoice(settings, resourceId ? null : service, resourceId, Boolean(resourceId)),
    })
    return res.status(201).json({ booking: vendorBookingView(await module.retrieveBooking(id)) })
  } catch (error) {
    if (error instanceof MedusaError && error.type === MedusaError.Types.NOT_ALLOWED) {
      return res.status(409).json({ message: resourceId ? "Αυτό το όχημα, άτομο ή χώρος είναι πιασμένο εκείνη την ώρα." : "Υπάρχει ήδη ραντεβού εκείνη την ώρα.", overlap: true })
    }
    throw error
  }
}
