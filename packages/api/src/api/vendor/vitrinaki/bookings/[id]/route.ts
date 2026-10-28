import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { DEFAULT_BOOKINGS, isDate, localToUtc, readBookingSettings, toMinutes } from "../../../../../lib/vitrinaki-bookings"
import { resourceChoice, vendorBookingView } from "../../../../../lib/vitrinaki-bookings-store"
import { loadSeller } from "../../../../../lib/stripe-connect-seller"
import { VITRINAKI_BOOKINGS_MODULE } from "../../../../../modules/vitrinaki-bookings"
import type VitrinakiBookingsModuleService from "../../../../../modules/vitrinaki-bookings/service"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

// Which status each action leads to, and from which statuses it is allowed.
const TRANSITIONS: Record<string, { to: string; from: string[]; started?: boolean }> = {
  confirm: { to: "confirmed", from: ["pending"] },
  decline: { to: "declined", from: ["pending"] },
  cancel: { to: "cancelled", from: ["pending", "confirmed"] },
  complete: { to: "completed", from: ["confirmed", "pending", "no_show"], started: true },
  no_show: { to: "no_show", from: ["confirmed", "pending", "completed"], started: true },
}

// One booking: change its status, move it, give it to another resource
// (vehicle, driver, trainer…), or keep a private note on it.
export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  const module = req.scope.resolve<VitrinakiBookingsModuleService>(VITRINAKI_BOOKINGS_MODULE)
  const [booking] = await module.listBookings({ id: String(req.params.id || ""), seller_id: sellerId }, { take: 1 })
  if (!booking) return res.status(404).json({ message: "Δεν βρέθηκε το ραντεβού." })

  const body = (req.body || {}) as Record<string, unknown>
  const action = String(body.action || "")

  if (action === "note") {
    const note = typeof body.shop_note === "string" ? body.shop_note.trim().slice(0, 500) : ""
    await module.updateBookings({ id: booking.id, shop_note: note || null })
  } else if (action === "move" || action === "assign") {
    const assigning = action === "assign"
    const date = assigning ? null : String(body.date || "")
    const time = assigning ? null : String(body.time || "")
    if (!assigning && (!isDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(time)))) return res.status(400).json({ message: "Διάλεξε μέρα και ώρα." })
    const seller = await loadSeller(req.scope, sellerId)
    const settings = readBookingSettings(seller?.metadata)
    const resourceId = assigning ? String(body.resource_id || "") : booking.resource_id
    if (assigning && !settings?.resources.some((r) => r.id === resourceId && r.active)) {
      return res.status(400).json({ message: "Διάλεξε ένα από τα οχήματα, άτομα ή χώρους σου." })
    }
    const service = settings?.services.find((s) => s.id === booking.service_id) ?? null
    const start = assigning ? new Date(booking.start_at) : localToUtc(String(date), toMinutes(String(time)))
    try {
      await module.move({
        id: booking.id,
        seller_id: sellerId,
        start_at: start,
        end_at: new Date(start.getTime() + Number(booking.duration_minutes) * 60000),
        buffer_minutes: settings?.bufferMinutes ?? DEFAULT_BOOKINGS.bufferMinutes,
        allow_overlap: body.force === true,
        // Moving keeps the resource when it is free; assigning asks for that one.
        resources: assigning ? resourceChoice(settings, null, resourceId, true) : resourceChoice(settings, service, resourceId),
      })
    } catch (error) {
      if (error instanceof MedusaError && error.type === MedusaError.Types.NOT_ALLOWED) {
        return res.status(409).json({ message: error.message, overlap: true })
      }
      if (error instanceof MedusaError && error.type === MedusaError.Types.NOT_FOUND) {
        return res.status(400).json({ message: "Μόνο ενεργά ραντεβού μετακινούνται." })
      }
      throw error
    }
  } else {
    const transition = TRANSITIONS[action]
    if (!transition) return res.status(400).json({ message: "Μη έγκυρη ενέργεια." })
    if (!transition.from.includes(booking.status)) {
      return res.status(400).json({ message: "Αυτή η αλλαγή δεν γίνεται για ραντεβού σε αυτή την κατάσταση." })
    }
    if (transition.started && new Date(booking.start_at).getTime() > Date.now()) {
      return res.status(400).json({ message: "Αυτό μπορείς να το σημειώσεις όταν έρθει η ώρα του ραντεβού." })
    }
    await module.updateBookings({
      id: booking.id,
      status: transition.to as any,
      ...(action === "cancel" ? { cancelled_by: "shop" } : {}),
    })
  }
  return res.json({ booking: vendorBookingView(await module.retrieveBooking(booking.id)) })
}
