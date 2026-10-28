import type { Context } from "@medusajs/framework/types"
import {
  generateEntityId,
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils"

import { assignResource, type ResourcePool } from "../../lib/vitrinaki-bookings"
import Booking from "./models/booking"

type SqlManager = { execute: (sql: string, params?: unknown[]) => Promise<any[]> }

const manager = (context: Context, transactional: boolean) =>
  (transactional ? context.transactionManager : context.manager) as unknown as SqlManager

export type NewBooking = {
  seller_id: string
  service_id: string | null
  service_name: string
  duration_minutes: number
  price: string | null
  start_at: Date
  end_at: Date
  status: "pending" | "confirmed"
  source: "online" | "studio"
  customer_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  customer_note: string | null
  shop_note: string | null
  cancel_token: string
  details?: Record<string, unknown> | null
}

// Where a booking may go: the shop's resources for its service, their names,
// and (Studio) the one the shop picked.
export type ResourceChoice = { pool: ResourcePool; names: Record<string, string>; prefer?: string | null }

export const SLOT_TAKEN_MESSAGE = "Αυτή η ώρα μόλις κλείστηκε. Διάλεξε μια άλλη."

// Every write that takes a slot runs under a per-shop advisory lock, so two
// people booking the same time at the same moment cannot both get it: the
// second one sees the first booking when it checks for overlaps.
class VitrinakiBookingsModuleService extends MedusaService({ Booking }) {
  private async lockShop(em: SqlManager, sellerId: string) {
    await em.execute(`select pg_advisory_xact_lock(hashtext(?))`, [`vitrinaki_booking:${sellerId}`])
  }

  // Active bookings that overlap [start, end) once the buffer is added.
  private async overlapping(em: SqlManager, sellerId: string, start: Date, end: Date, bufferMinutes: number, excludeId?: string) {
    const buffer = `${Math.max(0, Math.floor(bufferMinutes))} minutes`
    const rows = await em.execute(
      `select "start_at", "end_at", "resource_id" from "vitrinaki_booking"
       where "seller_id" = ? and "deleted_at" is null and "status" in ('pending', 'confirmed')
         and "start_at" < (?::timestamptz + ?::interval) and "end_at" + ?::interval > ?::timestamptz
         ${excludeId ? `and "id" <> ?` : ""}`,
      [sellerId, end.toISOString(), buffer, buffer, start.toISOString(), ...(excludeId ? [excludeId] : [])]
    )
    return rows.map((row) => ({ start: new Date(row.start_at), end: new Date(row.end_at), resourceId: row.resource_id ?? null }))
  }

  // The resource [start, end) goes to (null for a shop without resources),
  // or false when it is full.
  private async place(em: SqlManager, sellerId: string, start: Date, end: Date, bufferMinutes: number, choice: ResourceChoice | undefined, excludeId?: string) {
    const busy = await this.overlapping(em, sellerId, start, end, bufferMinutes, excludeId)
    const result = assignResource({ pool: choice?.pool ?? null, start: start.getTime(), end: end.getTime(), busy, bufferMs: Math.max(0, Math.floor(bufferMinutes)) * 60000, prefer: choice?.prefer })
    return result.free ? result.resourceId : false
  }

  // Pending and confirmed bookings that touch [from, to): what the free-slot
  // search must avoid.
  @InjectManager()
  async busyBetween(sellerId: string, from: Date, to: Date, @MedusaContext() context: Context = {}) {
    const rows = await manager(context, false).execute(
      `select "start_at", "end_at", "resource_id" from "vitrinaki_booking"
       where "seller_id" = ? and "deleted_at" is null and "status" in ('pending', 'confirmed')
         and "start_at" < ?::timestamptz and "end_at" > ?::timestamptz
       order by "start_at"`,
      [sellerId, to.toISOString(), from.toISOString()]
    )
    return rows.map((row) => ({ start: new Date(row.start_at), end: new Date(row.end_at), resourceId: (row.resource_id as string | null) ?? null }))
  }

  // Takes the slot or throws. `maxActivePerPhone` limits how many upcoming
  // bookings one phone number can hold in one shop (online bookings only).
  @InjectTransactionManager()
  async reserve(
    input: NewBooking & { buffer_minutes: number; allow_overlap?: boolean; max_active_per_phone?: number; resources?: ResourceChoice },
    @MedusaContext() context: Context = {}
  ): Promise<{ id: string }> {
    const em = manager(context, true)
    await this.lockShop(em, input.seller_id)
    let resourceId: string | null = null
    if (input.allow_overlap) {
      resourceId = input.resources?.prefer && input.resources.pool?.all.includes(input.resources.prefer) ? input.resources.prefer : null
    } else {
      const placed = await this.place(em, input.seller_id, input.start_at, input.end_at, input.buffer_minutes, input.resources)
      if (placed === false) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, SLOT_TAKEN_MESSAGE)
      resourceId = placed
    }
    if (input.max_active_per_phone) {
      const [row] = await em.execute(
        `select count(*)::int as "count" from "vitrinaki_booking"
         where "seller_id" = ? and "customer_phone" = ? and "deleted_at" is null
           and "status" in ('pending', 'confirmed') and "end_at" > now()`,
        [input.seller_id, input.customer_phone]
      )
      if (Number(row?.count ?? 0) >= input.max_active_per_phone) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Έχεις ήδη αρκετά ανοιχτά ραντεβού σε αυτή την επιχείρηση. Επικοινώνησε μαζί της για περισσότερα."
        )
      }
    }
    const id = generateEntityId(undefined, "vkbk")
    await em.execute(
      `insert into "vitrinaki_booking" ("id", "seller_id", "service_id", "service_name", "duration_minutes", "price",
         "start_at", "end_at", "status", "source", "customer_id", "customer_name", "customer_phone", "customer_email",
         "customer_note", "shop_note", "cancel_token", "resource_id", "resource_name", "details")
       values (?, ?, ?, ?, ?, ?, ?::timestamptz, ?::timestamptz, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb)`,
      [
        id, input.seller_id, input.service_id, input.service_name, input.duration_minutes, input.price,
        input.start_at.toISOString(), input.end_at.toISOString(), input.status, input.source, input.customer_id,
        input.customer_name, input.customer_phone, input.customer_email, input.customer_note, input.shop_note,
        input.cancel_token, resourceId, resourceId ? input.resources?.names[resourceId] ?? null : null,
        input.details ? JSON.stringify(input.details) : null,
      ]
    )
    return { id }
  }

  // Moves a booking to another time or resource (Studio). Same overlap rule
  // as reserve, ignoring the booking itself; it keeps its resource when that
  // one is free (resources.prefer), otherwise gets another.
  @InjectTransactionManager()
  async move(
    input: { id: string; seller_id: string; start_at: Date; end_at: Date; buffer_minutes: number; allow_overlap?: boolean; resources?: ResourceChoice },
    @MedusaContext() context: Context = {}
  ): Promise<void> {
    const em = manager(context, true)
    await this.lockShop(em, input.seller_id)
    let resourceId: string | null = null
    if (input.allow_overlap) {
      resourceId = input.resources?.prefer && input.resources.pool?.all.includes(input.resources.prefer) ? input.resources.prefer : null
    } else {
      const placed = await this.place(em, input.seller_id, input.start_at, input.end_at, input.buffer_minutes, input.resources, input.id)
      if (placed === false) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          input.resources?.pool ? "Δεν υπάρχει ελεύθερο όχημα, άτομο ή χώρος εκείνη την ώρα." : "Υπάρχει ήδη ραντεβού εκείνη την ώρα."
        )
      }
      resourceId = placed
    }
    const rows = await em.execute(
      `update "vitrinaki_booking" set "start_at" = ?::timestamptz, "end_at" = ?::timestamptz,
         "duration_minutes" = ?, "resource_id" = ?, "resource_name" = ?, "updated_at" = now()
       where "id" = ? and "seller_id" = ? and "deleted_at" is null and "status" in ('pending', 'confirmed')
       returning "id"`,
      [
        input.start_at.toISOString(), input.end_at.toISOString(),
        Math.round((input.end_at.getTime() - input.start_at.getTime()) / 60000),
        resourceId, resourceId ? input.resources?.names[resourceId] ?? null : null, input.id, input.seller_id,
      ]
    )
    if (!rows.length) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Δεν βρέθηκε ενεργό ραντεβού.")
  }

  // Upcoming-bookings counters for the Studio header.
  @InjectManager()
  async sellerStats(sellerId: string, @MedusaContext() context: Context = {}) {
    const [row] = await manager(context, false).execute(
      `select
         count(*) filter (where "status" = 'pending' and "end_at" > now())::int as "pending",
         count(*) filter (where "status" = 'confirmed' and "end_at" > now())::int as "upcoming",
         count(*) filter (where "status" in ('pending', 'confirmed')
           and "start_at" >= date_trunc('day', now() at time zone 'Europe/Athens') at time zone 'Europe/Athens'
           and "start_at" < (date_trunc('day', now() at time zone 'Europe/Athens') + interval '1 day') at time zone 'Europe/Athens')::int as "today"
       from "vitrinaki_booking" where "seller_id" = ? and "deleted_at" is null`,
      [sellerId]
    )
    return { pending: Number(row?.pending ?? 0), upcoming: Number(row?.upcoming ?? 0), today: Number(row?.today ?? 0) }
  }
}

export default VitrinakiBookingsModuleService
