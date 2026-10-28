"use client"

import { useState, useTransition } from "react"

import { cancelBookingByToken, type CustomerBooking } from "@/lib/data/bookings"
import { useTranslator } from "@/lib/i18n/client"

import type { ShopColors } from "./ShopProductCard"

const STATUS_TEXT: Record<CustomerBooking["status"], { title: string; text: string }> = {
  pending: { title: "Περιμένει επιβεβαίωση", text: "Η ώρα κρατήθηκε για σένα. Η επιχείρηση θα επιβεβαιώσει το ραντεβού και θα σε ενημερώσει." },
  confirmed: { title: "Επιβεβαιωμένο", text: "Σε περιμένουμε!" },
  declined: { title: "Δεν έγινε δεκτό", text: "Η επιχείρηση δεν μπορεί να σε εξυπηρετήσει αυτή την ώρα. Διάλεξε μια άλλη ώρα ή επικοινώνησε μαζί της." },
  cancelled: { title: "Ακυρώθηκε", text: "Το ραντεβού ακυρώθηκε." },
  completed: { title: "Ολοκληρώθηκε", text: "Ευχαριστούμε που μας προτίμησες!" },
  no_show: { title: "Δεν πραγματοποιήθηκε", text: "Το ραντεβού δεν πραγματοποιήθηκε." },
}

export function BookingStatusCard({
  initial,
  token,
  colors,
  home,
  contactPhone,
}: {
  initial: CustomerBooking
  token: string
  colors: ShopColors
  home: string
  contactPhone: string
}) {
  const { lang, tr } = useTranslator()
  const [booking, setBooking] = useState(initial)
  const [error, setError] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [y, m, d] = booking.date.split("-").map(Number)
  const day = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "el-GR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
    new Date(Date.UTC(y, m - 1, d))
  )
  const status = STATUS_TEXT[booking.status]

  const cancel = () =>
    startTransition(async () => {
      setError("")
      const result = await cancelBookingByToken(token)
      if (result.ok) setBooking(result.booking)
      else setError(result.message)
      setConfirming(false)
    })

  return (
    <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20" data-testid="booking-status">
      <div style={{ background: colors.soft }} className="rounded-3xl p-7 sm:p-10">
        <p style={{ color: colors.accent }} className="text-xs font-bold uppercase tracking-[0.22em]">{tr("Το ραντεβού μου")}</p>
        <h1 className="font-serif mt-3 text-3xl font-bold sm:text-4xl">{day}, {booking.time}</h1>
        <p className="mt-2 text-lg opacity-80">
          {booking.service_name} · {booking.time}–{booking.end_time}{booking.price ? ` · ${booking.price}` : ""}
        </p>
        <div style={{ background: colors.page }} className="mt-6 rounded-2xl p-5">
          <p className="font-bold" data-testid="booking-status-title">{tr(status.title)}</p>
          <p className="mt-1 leading-7 opacity-75">{tr(status.text)}</p>
        </div>
        {error ? <p className="mt-4 font-semibold text-red-700" role="alert">{error}</p> : null}
        <div className="mt-7 flex flex-wrap gap-3">
          {booking.can_cancel ? (
            confirming ? (
              <>
                <button type="button" onClick={cancel} disabled={isPending} className="rounded-full bg-red-700 px-6 py-3 font-bold text-white hover:opacity-90 disabled:opacity-60" data-testid="booking-cancel-confirm">
                  {isPending ? tr("Ακυρώνουμε…") : tr("Ναι, ακύρωσέ το")}
                </button>
                <button type="button" onClick={() => setConfirming(false)} style={{ borderColor: colors.ink }} className="rounded-full border px-6 py-3 font-bold hover:opacity-80">
                  {tr("Όχι, κράτησέ το")}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} style={{ borderColor: colors.ink }} className="rounded-full border px-6 py-3 font-bold hover:opacity-80" data-testid="booking-cancel">
                {tr("Ακύρωση ραντεβού")}
              </button>
            )
          ) : null}
          <a href={`${home}#booking`} style={{ background: colors.accent, color: colors.onAccent || "#fff" }} className="vk-btn rounded-full px-6 py-3 font-bold hover:opacity-90">
            {tr(booking.status === "pending" || booking.status === "confirmed" ? "Κλείσε κι άλλο ραντεβού" : "Κλείσε νέο ραντεβού")}
          </a>
        </div>
        {!booking.can_cancel && (booking.status === "pending" || booking.status === "confirmed") ? (
          <p className="mt-4 text-sm opacity-70">
            {tr("Για αλλαγή ή ακύρωση επικοινώνησε με την επιχείρηση.")}
            {contactPhone ? <> <a href={`tel:${contactPhone}`} className="font-bold underline underline-offset-4">{contactPhone}</a></> : null}
          </p>
        ) : null}
      </div>
    </section>
  )
}
