import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { canCustomerCancel } from "../../../../../../lib/vitrinaki-bookings"
import { customerBookingView, loadBookingShop } from "../../../../../../lib/vitrinaki-bookings-store"
import { VITRINAKI_BOOKINGS_MODULE } from "../../../../../../modules/vitrinaki-bookings"
import type VitrinakiBookingsModuleService from "../../../../../../modules/vitrinaki-bookings/service"

// «Το ραντεβού μου»: the customer's own booking, reached by the secret link
// they got when they booked. Shows it and lets them cancel in time.

async function load(req: MedusaRequest) {
  const token = String(req.params.token || "")
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null
  const module = req.scope.resolve<VitrinakiBookingsModuleService>(VITRINAKI_BOOKINGS_MODULE)
  const [booking] = await module.listBookings({ cancel_token: token }, { take: 1 })
  if (!booking) return null
  const shop = await loadBookingShop(req.scope, booking.seller_id)
  if (!shop) return null
  return { module, booking, shop }
}

const cancellable = (found: NonNullable<Awaited<ReturnType<typeof load>>>, now = new Date()) =>
  ["pending", "confirmed"].includes(found.booking.status) && canCustomerCancel(found.shop.settings, new Date(found.booking.start_at), now)

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "no-store")
  const found = await load(req)
  if (!found) return res.status(404).json({ message: "Δεν βρέθηκε το ραντεβού." })
  return res.json({ booking: customerBookingView(found.booking, found.shop, cancellable(found)) })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const found = await load(req)
  if (!found) return res.status(404).json({ message: "Δεν βρέθηκε το ραντεβού." })
  if ((req.body as Record<string, unknown>)?.action !== "cancel") return res.status(400).json({ message: "Μη έγκυρη ενέργεια." })
  if (!cancellable(found)) {
    return res.status(400).json({ message: "Το ραντεβού δεν μπορεί πια να ακυρωθεί online. Επικοινώνησε με την επιχείρηση." })
  }
  await found.module.updateBookings({ id: found.booking.id, status: "cancelled", cancelled_by: "customer" })
  const booking = await found.module.retrieveBooking(found.booking.id)
  return res.json({ booking: customerBookingView(booking, found.shop, false) })
}
