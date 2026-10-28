import { model } from "@medusajs/framework/utils"

// One appointment in one shop. Times are UTC; the shop works in Greek time
// (src/lib/vitrinaki-bookings.ts). The service is copied in (name, length,
// price) so a booking keeps what was booked even if the shop later edits or
// removes that service. Not linked to the seller or customer entities, so no
// store query.graph can reach it: only the /store/vitrinaki/bookings routes
// (free slots, and a booking by its secret cancel token) and the Studio's
// /vendor/vitrinaki/bookings routes read it.
//
//   pending    waiting for the shop to confirm (holds the slot)
//   confirmed  holds the slot
//   declined   the shop said no
//   cancelled  cancelled by the shop or the customer
//   completed  took place
//   no_show    the customer did not come
//
// A shop with several resources (vehicles, drivers, trainers, chairs, rooms:
// see src/lib/vitrinaki-bookings.ts) takes one booking per resource at a
// time; resource_id says which one, resource_name keeps its name as booked.
// details holds the trip of a transfer (pickup, destination, passengers…).
const Booking = model
  .define("vitrinaki_booking", {
    id: model.id({ prefix: "vkbk" }).primaryKey(),
    seller_id: model.text(),
    service_id: model.text().nullable(),
    service_name: model.text(),
    duration_minutes: model.number(),
    price: model.text().nullable(),
    start_at: model.dateTime(),
    end_at: model.dateTime(),
    status: model.enum(["pending", "confirmed", "declined", "cancelled", "completed", "no_show"]).default("pending"),
    source: model.enum(["online", "studio"]).default("online"),
    customer_id: model.text().nullable(),
    customer_name: model.text(),
    customer_phone: model.text(),
    customer_email: model.text().nullable(),
    customer_note: model.text().nullable(),
    shop_note: model.text().nullable(),
    cancel_token: model.text().unique(),
    cancelled_by: model.text().nullable(),
    resource_id: model.text().nullable(),
    resource_name: model.text().nullable(),
    details: model.json().nullable(),
  })
  .indexes([
    { on: ["seller_id", "start_at"], where: "deleted_at IS NULL" },
  ])

export default Booking
