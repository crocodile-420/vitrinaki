import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Badge, Button, Container, Drawer, Heading, Input, Label, Select, Switch, Text, Textarea, toast } from "@medusajs/ui"
import type { RouteConfig } from "@mercurjs/dashboard-sdk"
import { getAuthHeaders } from "@mercurjs/vendor"

// «Κρατήσεις»: online appointments for service businesses. The calendar shows
// the week's bookings and the requests waiting for an answer; the settings say
// what can be booked, when, and with which limits. Backend:
// /vendor/vitrinaki/bookings (bookings) and /vendor/vitrinaki/bookings/settings
// (seller.metadata.vitrinaki_bookings). All times are Greek time.

export const config: RouteConfig = {
  label: "vitrinakiBookings.nav",
  translationNs: "translation",
  rank: 46,
}

declare const __BACKEND_URL__: string
const backend = () => __BACKEND_URL__.replace(/\/+$/, "")

const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
type WeekDay = (typeof WEEK_DAYS)[number]
type DayHours = { closed: boolean; open: string; close: string; open2: string; close2: string }
type Service = { id?: string; name: string; durationMinutes: number; price: string; description: string; active: boolean }
type DayOff = { from: string; to: string; note: string }
type Settings = {
  enabled: boolean
  autoConfirm: boolean
  services: Service[]
  schedule: Record<WeekDay, DayHours>
  slotStepMinutes: number
  bufferMinutes: number
  minNoticeHours: number
  maxDaysAhead: number
  cancelHours: number
  daysOff: DayOff[]
  note: string
}
type Status = "pending" | "confirmed" | "declined" | "cancelled" | "completed" | "no_show"
type Booking = {
  id: string
  service_id: string | null
  service_name: string
  duration_minutes: number
  price: string
  start_at: string
  date: string
  time: string
  end_time: string
  status: Status
  source: "online" | "studio"
  customer_name: string
  customer_phone: string
  customer_email: string
  customer_note: string
  shop_note: string
  cancelled_by: "shop" | "customer" | null
}
type Stats = { pending: number; upcoming: number; today: number }

const SLOT_STEPS = [10, 15, 20, 30, 45, 60]
const DURATIONS = [15, 20, 30, 45, 60, 75, 90, 120, 150, 180, 240]
const STATUS_COLOR: Record<Status, "orange" | "green" | "grey" | "blue" | "red"> = {
  pending: "orange",
  confirmed: "green",
  declined: "grey",
  cancelled: "grey",
  completed: "blue",
  no_show: "red",
}

async function callAPI(path: string, init?: RequestInit) {
  const response = await fetch(`${backend()}${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    credentials: "omit",
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw Object.assign(new Error(json.message || `${response.status}`), { body: json })
  return json
}

// ---------- Greek dates ----------

const athensToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Athens" }).format(new Date())
const parse = (date: string) => {
  const [y, m, d] = date.split("-").map(Number)
  return Date.UTC(y, m - 1, d)
}
const addDays = (date: string, days: number) => new Date(parse(date) + days * 86400000).toISOString().slice(0, 10)
const mondayOf = (date: string) => addDays(date, -((new Date(parse(date)).getUTCDay() + 6) % 7))
const intlLocale = (lang: string) => (lang === "en" ? "en-IE" : "el-GR")
const dayLabel = (date: string, lang: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(intlLocale(lang), { timeZone: "UTC", ...opts }).format(new Date(parse(date)))
const durationLabel = (minutes: number, t: (k: string, o?: Record<string, unknown>) => string) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return t("vitrinakiBookings.minutes", { n: m })
  return m ? t("vitrinakiBookings.hoursMinutes", { h, m }) : t("vitrinakiBookings.hours", { count: h })
}
const telHref = (phone: string) => `tel:${phone}`
const whatsappHref = (phone: string) => `https://wa.me/${phone.replace(/^\+/, "").replace(/^(69\d{8})$/, "30$1")}`

const emptyContact = { name: "", phone: "", email: "", note: "" }
// 409 from the backend: another booking already holds that time.
const isOverlap = (cause: unknown) => Boolean((cause as { body?: { overlap?: boolean } } | null)?.body?.overlap)

export default function VitrinakiBookingsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [tab, setTab] = useState<"calendar" | "settings">("calendar")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saved, setSaved] = useState(false)

  const [weekStart, setWeekStart] = useState(() => mondayOf(athensToday()))
  const [bookings, setBookings] = useState<Booking[]>([])
  const [pending, setPending] = useState<Booking[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [weekLoading, setWeekLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Booking | null>(null)
  const [creating, setCreating] = useState(false)

  const loadWeek = async (start = weekStart) => {
    setWeekLoading(true)
    try {
      const data = await callAPI(`/vendor/vitrinaki/bookings?from=${start}&to=${addDays(start, 6)}`)
      setBookings(data.bookings)
      setPending(data.pending)
      setStats(data.stats)
    } catch (cause) {
      toast.error(cause instanceof Error && cause.message ? cause.message : t("vitrinakiBookings.loadError"))
    } finally {
      setWeekLoading(false)
    }
  }

  const load = async () => {
    setLoading(true)
    setLoadError("")
    try {
      const data = await callAPI("/vendor/vitrinaki/bookings/settings")
      setSettings(data.settings)
      setSaved(data.saved)
      if (!data.saved) setTab("settings")
      await loadWeek()
    } catch (cause) {
      setLoadError(cause instanceof Error && cause.message ? cause.message : t("vitrinakiBookings.loadError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goWeek = (start: string) => {
    setWeekStart(start)
    void loadWeek(start)
  }

  const act = async (booking: Booking, action: string, extra: Record<string, unknown> = {}) => {
    setBusyId(booking.id)
    try {
      const data = await callAPI(`/vendor/vitrinaki/bookings/${booking.id}`, { method: "POST", body: JSON.stringify({ action, ...extra }) })
      if (selected?.id === booking.id) setSelected(data.booking)
      toast.success(t(`vitrinakiBookings.done.${action}`))
      await loadWeek()
      return data.booking as Booking
    } catch (cause) {
      if (isOverlap(cause) && window.confirm(t("vitrinakiBookings.overlapConfirm"))) return act(booking, action, { ...extra, force: true })
      toast.error(cause instanceof Error && cause.message ? cause.message : t("vitrinakiBookings.saveError"))
      return null
    } finally {
      setBusyId(null)
    }
  }

  const today = athensToday()
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const byDay = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of bookings) map.set(b.date, [...(map.get(b.date) || []), b])
    return map
  }, [bookings])

  return (
    <div className="flex flex-col gap-y-3" data-testid="vitrinaki-bookings">
      <Container className="divide-y p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
          <div>
            <Heading>{t("vitrinakiBookings.title")}</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">{t("vitrinakiBookings.subtitle")}</Text>
          </div>
          {!loading && !loadError && settings ? (
            <Badge size="2xsmall" color={settings.enabled && saved ? "green" : "grey"}>
              {settings.enabled && saved ? t("vitrinakiBookings.on") : t("vitrinakiBookings.off")}
            </Badge>
          ) : null}
        </div>

        {loading ? (
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-subtle">{t("vitrinakiBookings.loading")}</Text>
          </div>
        ) : loadError ? (
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <Text size="small" className="text-ui-fg-error">{loadError}</Text>
            <Button size="small" variant="secondary" onClick={() => void load()}>{t("vitrinakiBookings.retry")}</Button>
          </div>
        ) : (
          <>
            {stats ? (
              <div className="bg-ui-border-base" style={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))" }} data-testid="bookings-stats">
                {(["pending", "today", "upcoming"] as const).map((key) => (
                  <div key={key} className="bg-ui-bg-base px-6 py-4">
                    <Text size="xsmall" className="text-ui-fg-subtle">{t(`vitrinakiBookings.stats.${key}`)}</Text>
                    <Text size="xlarge" weight="plus" className="mt-1">{stats[key]}</Text>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2 px-6 py-3">
              {(["calendar", "settings"] as const).map((key) => (
                <Button key={key} size="small" variant={tab === key ? "primary" : "transparent"} onClick={() => setTab(key)} data-testid={`bookings-tab-${key}`}>
                  {t(`vitrinakiBookings.tabs.${key}`)}
                </Button>
              ))}
            </div>
          </>
        )}
      </Container>

      {!loading && !loadError && settings && tab === "calendar" ? (
        <>
          {!settings.enabled || !saved ? (
            <Container className="px-6 py-4">
              <Text size="small" weight="plus">{t("vitrinakiBookings.closedTitle")}</Text>
              <Text size="small" className="text-ui-fg-subtle mt-1">{t("vitrinakiBookings.closedText")}</Text>
              <Button size="small" variant="secondary" className="mt-3" onClick={() => setTab("settings")}>{t("vitrinakiBookings.openSettings")}</Button>
            </Container>
          ) : null}

          {pending.length ? (
            <Container className="divide-y p-0" data-testid="bookings-pending">
              <div className="px-6 py-4">
                <Heading level="h2">{t("vitrinakiBookings.pendingTitle", { count: pending.length })}</Heading>
                <Text size="small" className="text-ui-fg-subtle mt-1">{t("vitrinakiBookings.pendingHint")}</Text>
              </div>
              {pending.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
                  <button type="button" className="min-w-0 text-left" onClick={() => setSelected(b)}>
                    <Text size="small" weight="plus">
                      {dayLabel(b.date, lang, { weekday: "long", day: "numeric", month: "long" })} · {b.time}–{b.end_time}
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle">{b.service_name} · {b.customer_name} · {b.customer_phone}</Text>
                    {b.customer_note ? <Text size="xsmall" className="text-ui-fg-subtle mt-1">«{b.customer_note}»</Text> : null}
                  </button>
                  <div className="flex gap-2">
                    <Button size="small" variant="secondary" isLoading={busyId === b.id} onClick={() => void act(b, "decline")}>{t("vitrinakiBookings.actions.decline")}</Button>
                    <Button size="small" isLoading={busyId === b.id} onClick={() => void act(b, "confirm")} data-testid="booking-confirm">{t("vitrinakiBookings.actions.confirm")}</Button>
                  </div>
                </div>
              ))}
            </Container>
          ) : null}

          <Container className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
              <div>
                <Heading level="h2">
                  {dayLabel(days[0], lang, { day: "numeric", month: "short" })} – {dayLabel(days[6], lang, { day: "numeric", month: "short", year: "numeric" })}
                </Heading>
                {weekLoading ? <Text size="xsmall" className="text-ui-fg-subtle">{t("vitrinakiBookings.loading")}</Text> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="small" variant="secondary" onClick={() => goWeek(addDays(weekStart, -7))} aria-label={t("vitrinakiBookings.prevWeek")}>←</Button>
                <Button size="small" variant="secondary" onClick={() => goWeek(mondayOf(today))}>{t("vitrinakiBookings.thisWeek")}</Button>
                <Button size="small" variant="secondary" onClick={() => goWeek(addDays(weekStart, 7))} aria-label={t("vitrinakiBookings.nextWeek")}>→</Button>
                <Button size="small" onClick={() => setCreating(true)} data-testid="booking-new">{t("vitrinakiBookings.new")}</Button>
              </div>
            </div>
            <div
              className="bg-ui-border-base border-t"
              style={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
              data-testid="bookings-week"
            >
              {days.map((date) => {
                const list = byDay.get(date) || []
                const day = WEEK_DAYS[(new Date(parse(date)).getUTCDay() + 6) % 7]
                const hours = settings.schedule[day]
                const off = settings.daysOff.some((o) => date >= o.from && date <= o.to)
                return (
                  <div key={date} className={date === today ? "bg-ui-bg-highlight" : "bg-ui-bg-base"} style={{ minHeight: 140, padding: "12px 12px 16px" }}>
                    <Text size="small" weight="plus">{dayLabel(date, lang, { weekday: "short", day: "numeric", month: "short" })}</Text>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      {off ? t("vitrinakiBookings.dayOff") : hours.closed ? t("vitrinakiBookings.closed") : `${hours.open}–${hours.close}${hours.open2 ? `, ${hours.open2}–${hours.close2}` : ""}`}
                    </Text>
                    <div className="flex flex-col" style={{ gap: 6, marginTop: 8 }}>
                      {list.length === 0 ? <Text size="xsmall" className="text-ui-fg-muted">—</Text> : null}
                      {list.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelected(b)}
                          className="bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover rounded-md border text-left"
                          style={{ padding: "6px 8px", minWidth: 0, overflow: "hidden", opacity: ["cancelled", "declined"].includes(b.status) ? 0.55 : 1 }}
                          data-testid="booking-card"
                        >
                          <Text size="xsmall" weight="plus" style={{ whiteSpace: "nowrap" }}>{b.time}–{b.end_time}</Text>
                          <Text size="xsmall" className="truncate">{b.customer_name}</Text>
                          <Text size="xsmall" className="text-ui-fg-subtle truncate">{b.service_name}</Text>
                          <div style={{ marginTop: 4 }}>
                            <Badge size="2xsmall" color={STATUS_COLOR[b.status]}>{t(`vitrinakiBookings.status.${b.status}`)}</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Container>
        </>
      ) : null}

      {!loading && !loadError && settings && tab === "settings" ? (
        <SettingsForm
          initial={settings}
          saved={saved}
          onSaved={(next) => {
            setSettings(next)
            setSaved(true)
          }}
        />
      ) : null}

      {selected ? (
        <BookingDrawer
          key={`${selected.id}:${selected.status}:${selected.start_at}:${selected.shop_note}`}
          booking={selected} busy={busyId === selected.id} onClose={() => setSelected(null)} onAction={act} />
      ) : null}
      {creating && settings ? (
        <NewBookingDrawer
          settings={settings}
          defaultDate={weekStart <= today && today <= addDays(weekStart, 6) ? today : weekStart}
          onClose={() => setCreating(false)}
          onCreated={async (b) => {
            setCreating(false)
            const start = mondayOf(b.date)
            setWeekStart(start)
            await loadWeek(start)
          }}
        />
      ) : null}
    </div>
  )
}

// ---------- one booking ----------

function BookingDrawer({
  booking,
  busy,
  onClose,
  onAction,
}: {
  booking: Booking
  busy: boolean
  onClose: () => void
  onAction: (b: Booking, action: string, extra?: Record<string, unknown>) => Promise<Booking | null>
}) {
  const { t, i18n } = useTranslation()
  // Remounted (by key) whenever the booking changes, so these start fresh.
  const [note, setNote] = useState(booking.shop_note)
  const [moving, setMoving] = useState(false)
  const [date, setDate] = useState(booking.date)
  const [time, setTime] = useState(booking.time)
  const [openedAt] = useState(() => Date.now())

  const active = booking.status === "pending" || booking.status === "confirmed"
  const started = new Date(booking.start_at).getTime() <= openedAt

  return (
    <Drawer open onOpenChange={(open) => !open && onClose()}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>{booking.service_name}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="overflow-y-auto" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="flex items-center gap-2">
            <Badge size="2xsmall" color={STATUS_COLOR[booking.status]}>{t(`vitrinakiBookings.status.${booking.status}`)}</Badge>
            <Text size="xsmall" className="text-ui-fg-subtle">
              {t(`vitrinakiBookings.source.${booking.source}`)}
              {booking.cancelled_by ? ` · ${t(`vitrinakiBookings.cancelledBy.${booking.cancelled_by}`)}` : ""}
            </Text>
          </div>
          <div>
            <Text size="large" weight="plus">
              {dayLabel(booking.date, i18n.language, { weekday: "long", day: "numeric", month: "long" })}
            </Text>
            <Text>{booking.time}–{booking.end_time} · {durationLabel(booking.duration_minutes, t)}{booking.price ? ` · ${booking.price}` : ""}</Text>
          </div>
          <div className="bg-ui-bg-subtle rounded-lg border px-4 py-3">
            <Text size="small" weight="plus">{booking.customer_name}</Text>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <a className="text-ui-fg-interactive txt-compact-small" href={telHref(booking.customer_phone)}>{booking.customer_phone}</a>
              <a className="text-ui-fg-interactive txt-compact-small" href={whatsappHref(booking.customer_phone)} target="_blank" rel="noreferrer">WhatsApp</a>
              {booking.customer_email ? <a className="text-ui-fg-interactive txt-compact-small" href={`mailto:${booking.customer_email}`}>{booking.customer_email}</a> : null}
            </div>
            {booking.customer_note ? <Text size="small" className="text-ui-fg-subtle mt-2">«{booking.customer_note}»</Text> : null}
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="booking-note" size="small" weight="plus">{t("vitrinakiBookings.shopNote")}</Label>
            <Textarea id="booking-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            <Text size="xsmall" className="text-ui-fg-subtle">{t("vitrinakiBookings.shopNoteHint")}</Text>
            {note !== booking.shop_note ? (
              <Button size="small" variant="secondary" className="self-start" isLoading={busy} onClick={() => void onAction(booking, "note", { shop_note: note })}>
                {t("vitrinakiBookings.saveNote")}
              </Button>
            ) : null}
          </div>

          {active ? (
            moving ? (
              <div className="flex flex-col gap-y-2">
                <Text size="small" weight="plus">{t("vitrinakiBookings.moveTitle")}</Text>
                <div className="flex flex-wrap gap-2">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 170 }} />
                  <Input type="time" step={300} value={time} onChange={(e) => setTime(e.target.value)} style={{ width: 120 }} />
                </div>
                <div className="flex gap-2">
                  <Button size="small" variant="secondary" onClick={() => setMoving(false)}>{t("vitrinakiBookings.back")}</Button>
                  <Button
                    size="small"
                    isLoading={busy}
                    onClick={async () => {
                      if (await onAction(booking, "move", { date, time })) setMoving(false)
                    }}
                  >
                    {t("vitrinakiBookings.actions.move")}
                  </Button>
                </div>
                <Text size="xsmall" className="text-ui-fg-subtle">{t("vitrinakiBookings.moveHint")}</Text>
              </div>
            ) : null
          ) : null}
        </Drawer.Body>
        <Drawer.Footer className="flex flex-wrap justify-end gap-2">
          {booking.status === "pending" ? (
            <>
              <Button size="small" variant="secondary" isLoading={busy} onClick={() => void onAction(booking, "decline")}>{t("vitrinakiBookings.actions.decline")}</Button>
              <Button size="small" isLoading={busy} onClick={() => void onAction(booking, "confirm")}>{t("vitrinakiBookings.actions.confirm")}</Button>
            </>
          ) : null}
          {active && !moving ? (
            <Button size="small" variant="secondary" onClick={() => setMoving(true)}>{t("vitrinakiBookings.actions.move")}</Button>
          ) : null}
          {active && !started ? (
            <Button
              size="small"
              variant="danger"
              isLoading={busy}
              onClick={() => window.confirm(t("vitrinakiBookings.cancelConfirm")) && void onAction(booking, "cancel")}
            >
              {t("vitrinakiBookings.actions.cancel")}
            </Button>
          ) : null}
          {started && ["pending", "confirmed", "no_show"].includes(booking.status) ? (
            <Button size="small" variant="secondary" isLoading={busy} onClick={() => void onAction(booking, "complete")}>{t("vitrinakiBookings.actions.complete")}</Button>
          ) : null}
          {started && ["pending", "confirmed", "completed"].includes(booking.status) ? (
            <Button size="small" variant="secondary" isLoading={busy} onClick={() => void onAction(booking, "no_show")}>{t("vitrinakiBookings.actions.no_show")}</Button>
          ) : null}
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

// ---------- a booking the shop adds itself ----------

function NewBookingDrawer({
  settings,
  defaultDate,
  onClose,
  onCreated,
}: {
  settings: Settings
  defaultDate: string
  onClose: () => void
  onCreated: (b: Booking) => void
}) {
  const { t } = useTranslation()
  const services = settings.services.filter((s) => s.id)
  const [serviceId, setServiceId] = useState(services[0]?.id || "other")
  const [serviceName, setServiceName] = useState("")
  const [duration, setDuration] = useState("60")
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState("10:00")
  const [contact, setContact] = useState(emptyContact)
  const [shopNote, setShopNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const submit = async (event: FormEvent, force = false) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      const data = await callAPI("/vendor/vitrinaki/bookings", {
        method: "POST",
        body: JSON.stringify({
          ...(serviceId === "other" ? { service_name: serviceName, duration_minutes: Number(duration) } : { service_id: serviceId }),
          date,
          time,
          contact,
          shop_note: shopNote,
          force,
        }),
      })
      toast.success(t("vitrinakiBookings.created"))
      onCreated(data.booking)
    } catch (cause) {
      if (isOverlap(cause) && !force && window.confirm(t("vitrinakiBookings.overlapConfirm"))) {
        setSaving(false)
        return submit(event, true)
      }
      setError(cause instanceof Error && cause.message ? cause.message : t("vitrinakiBookings.saveError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open onOpenChange={(open) => !open && onClose()}>
      <Drawer.Content>
        <form onSubmit={(e) => void submit(e)} className="flex h-full flex-col" noValidate>
          <Drawer.Header>
            <Drawer.Title>{t("vitrinakiBookings.new")}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="overflow-y-auto" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Text size="small" className="text-ui-fg-subtle">{t("vitrinakiBookings.newHint")}</Text>
            <div className="flex flex-col gap-y-1">
              <Label size="small" weight="plus">{t("vitrinakiBookings.form.service")}</Label>
              <Select size="small" value={serviceId} onValueChange={setServiceId}>
                <Select.Trigger><Select.Value /></Select.Trigger>
                <Select.Content>
                  {services.map((s) => (
                    <Select.Item key={s.id} value={s.id!}>{s.name} · {durationLabel(s.durationMinutes, t)}</Select.Item>
                  ))}
                  <Select.Item value="other">{t("vitrinakiBookings.form.otherService")}</Select.Item>
                </Select.Content>
              </Select>
            </div>
            {serviceId === "other" ? (
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-1 flex-col gap-y-1" style={{ minWidth: 180 }}>
                  <Label htmlFor="nb-service" size="small" weight="plus">{t("vitrinakiBookings.form.serviceName")}</Label>
                  <Input id="nb-service" size="small" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-y-1" style={{ width: 140 }}>
                  <Label size="small" weight="plus">{t("vitrinakiBookings.form.duration")}</Label>
                  <Select size="small" value={duration} onValueChange={setDuration}>
                    <Select.Trigger><Select.Value /></Select.Trigger>
                    <Select.Content>
                      {DURATIONS.map((d) => <Select.Item key={d} value={String(d)}>{durationLabel(d, t)}</Select.Item>)}
                    </Select.Content>
                  </Select>
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col gap-y-1">
                <Label htmlFor="nb-date" size="small" weight="plus">{t("vitrinakiBookings.form.date")}</Label>
                <Input id="nb-date" type="date" size="small" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-y-1">
                <Label htmlFor="nb-time" size="small" weight="plus">{t("vitrinakiBookings.form.time")}</Label>
                <Input id="nb-time" type="time" step={300} size="small" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-y-1">
              <Label htmlFor="nb-name" size="small" weight="plus">{t("vitrinakiBookings.form.customerName")}</Label>
              <Input id="nb-name" size="small" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-1 flex-col gap-y-1" style={{ minWidth: 160 }}>
                <Label htmlFor="nb-phone" size="small" weight="plus">{t("vitrinakiBookings.form.phone")}</Label>
                <Input id="nb-phone" size="small" inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
              </div>
              <div className="flex flex-1 flex-col gap-y-1" style={{ minWidth: 160 }}>
                <Label htmlFor="nb-email" size="small" weight="plus">{t("vitrinakiBookings.form.emailOptional")}</Label>
                <Input id="nb-email" size="small" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-y-1">
              <Label htmlFor="nb-note" size="small" weight="plus">{t("vitrinakiBookings.shopNote")}</Label>
              <Textarea id="nb-note" rows={2} value={shopNote} onChange={(e) => setShopNote(e.target.value)} />
            </div>
            {error ? <Text size="small" className="text-ui-fg-error">{error}</Text> : null}
          </Drawer.Body>
          <Drawer.Footer>
            <Button type="button" size="small" variant="secondary" onClick={onClose}>{t("vitrinakiBookings.back")}</Button>
            <Button type="submit" size="small" isLoading={saving}>{t("vitrinakiBookings.form.create")}</Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  )
}

// ---------- settings ----------

type ServiceDraft = Omit<Service, "durationMinutes"> & { durationMinutes: string }

function SettingsForm({ initial, saved, onSaved }: { initial: Settings; saved: boolean; onSaved: (s: Settings) => void }) {
  const { t } = useTranslation()
  const [enabled, setEnabled] = useState(initial.enabled)
  const [autoConfirm, setAutoConfirm] = useState(initial.autoConfirm)
  const [services, setServices] = useState<ServiceDraft[]>(initial.services.map((s) => ({ ...s, durationMinutes: String(s.durationMinutes) })))
  const [schedule, setSchedule] = useState(initial.schedule)
  const [rules, setRules] = useState({
    slotStepMinutes: String(initial.slotStepMinutes),
    bufferMinutes: String(initial.bufferMinutes),
    minNoticeHours: String(initial.minNoticeHours),
    maxDaysAhead: String(initial.maxDaysAhead),
    cancelHours: String(initial.cancelHours),
  })
  const [daysOff, setDaysOff] = useState<DayOff[]>(initial.daysOff)
  const [note, setNote] = useState(initial.note)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const updateService = (i: number, patch: Partial<ServiceDraft>) => setServices((list) => list.map((s, j) => (i === j ? { ...s, ...patch } : s)))
  const updateDay = (day: WeekDay, patch: Partial<DayHours>) => setSchedule((s) => ({ ...s, [day]: { ...s[day], ...patch } }))

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      const data = await callAPI("/vendor/vitrinaki/bookings/settings", {
        method: "POST",
        body: JSON.stringify({
          settings: {
            enabled,
            autoConfirm,
            services: services.map((s) => ({ ...s, durationMinutes: Number(s.durationMinutes) })),
            schedule: Object.fromEntries(
              WEEK_DAYS.map((d) => [d, schedule[d].closed ? { closed: true } : { ...schedule[d], open2: schedule[d].open2 || "", close2: schedule[d].close2 || "" }])
            ),
            slotStepMinutes: Number(rules.slotStepMinutes),
            bufferMinutes: Number(rules.bufferMinutes),
            minNoticeHours: Number(rules.minNoticeHours),
            maxDaysAhead: Number(rules.maxDaysAhead),
            cancelHours: Number(rules.cancelHours),
            daysOff: daysOff.map((d) => ({ ...d, to: d.to || d.from })),
            note,
          },
        }),
      })
      setServices(data.settings.services.map((s: Service) => ({ ...s, durationMinutes: String(s.durationMinutes) })))
      onSaved(data.settings)
      toast.success(t("vitrinakiBookings.saved"))
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : t("vitrinakiBookings.saveError"))
    } finally {
      setSaving(false)
    }
  }

  const numberField = (key: keyof typeof rules, width = 110) => (
    <div className="flex flex-col gap-y-1" style={{ width }}>
      <Label htmlFor={`rule-${key}`} size="xsmall" weight="plus">{t(`vitrinakiBookings.rules.${key}`)}</Label>
      <Input id={`rule-${key}`} size="small" inputMode="numeric" value={rules[key]} onChange={(e) => setRules({ ...rules, [key]: e.target.value })} />
    </div>
  )

  return (
    <Container className="p-0">
      <form onSubmit={save} className="flex flex-col gap-y-8 px-6" style={{ paddingTop: 20, paddingBottom: 20 }} noValidate data-testid="bookings-settings">
        {!saved ? (
          <div className="bg-ui-bg-subtle rounded-lg border px-4 py-3">
            <Text size="small" weight="plus">{t("vitrinakiBookings.firstTimeTitle")}</Text>
            <Text size="xsmall" className="text-ui-fg-subtle mt-1">{t("vitrinakiBookings.firstTimeText")}</Text>
          </div>
        ) : null}

        <div className="flex flex-col gap-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="bookings-enabled" size="small" weight="plus">{t("vitrinakiBookings.form.enabled")}</Label>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">{t("vitrinakiBookings.form.enabledHint")}</Text>
            </div>
            <Switch id="bookings-enabled" className="shrink-0" checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="bookings-auto" size="small" weight="plus">{t("vitrinakiBookings.form.autoConfirm")}</Label>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">{t("vitrinakiBookings.form.autoConfirmHint")}</Text>
            </div>
            <Switch id="bookings-auto" className="shrink-0" checked={autoConfirm} onCheckedChange={setAutoConfirm} />
          </div>
        </div>

        <div className="flex flex-col gap-y-3">
          <div>
            <Heading level="h2">{t("vitrinakiBookings.form.services")}</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">{t("vitrinakiBookings.form.servicesHint")}</Text>
          </div>
          {services.length === 0 ? <Text size="small" className="text-ui-fg-subtle">{t("vitrinakiBookings.form.noServices")}</Text> : null}
          {services.map((s, i) => (
            <div key={s.id ?? `new-${i}`} className="bg-ui-bg-subtle flex flex-wrap items-end gap-3 rounded-lg border px-4 py-3" data-testid="bookings-service-row">
              <div className="flex flex-1 flex-col gap-y-1" style={{ minWidth: 180 }}>
                <Label htmlFor={`svc-name-${i}`} size="xsmall" weight="plus">{t("vitrinakiBookings.form.serviceName")}</Label>
                <Input id={`svc-name-${i}`} size="small" value={s.name} onChange={(e) => updateService(i, { name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-y-1" style={{ width: 140 }}>
                <Label size="xsmall" weight="plus">{t("vitrinakiBookings.form.duration")}</Label>
                <Select size="small" value={s.durationMinutes} onValueChange={(v) => updateService(i, { durationMinutes: v })}>
                  <Select.Trigger><Select.Value /></Select.Trigger>
                  <Select.Content>
                    {Array.from(new Set([...DURATIONS, Number(s.durationMinutes)])).filter((d) => d > 0).sort((a, b) => a - b).map((d) => (
                      <Select.Item key={d} value={String(d)}>{durationLabel(d, t)}</Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <div className="flex flex-col gap-y-1" style={{ width: 110 }}>
                <Label htmlFor={`svc-price-${i}`} size="xsmall" weight="plus">{t("vitrinakiBookings.form.price")}</Label>
                <Input id={`svc-price-${i}`} size="small" value={s.price} placeholder="30 €" onChange={(e) => updateService(i, { price: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 pb-1.5">
                <Switch id={`svc-active-${i}`} checked={s.active} onCheckedChange={(v) => updateService(i, { active: v })} />
                <Label htmlFor={`svc-active-${i}`} size="xsmall">{t("vitrinakiBookings.form.bookable")}</Label>
              </div>
              <Button type="button" size="small" variant="transparent" className="ml-auto" onClick={() => setServices((list) => list.filter((_, j) => j !== i))}>
                {t("vitrinakiBookings.form.remove")}
              </Button>
            </div>
          ))}
          {services.length < 20 ? (
            <Button
              type="button"
              size="small"
              variant="secondary"
              className="self-start"
              onClick={() => setServices((list) => [...list, { name: "", durationMinutes: "60", price: "", description: "", active: true }])}
            >
              {t("vitrinakiBookings.form.addService")}
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-y-3">
          <div>
            <Heading level="h2">{t("vitrinakiBookings.form.schedule")}</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">{t("vitrinakiBookings.form.scheduleHint")}</Text>
          </div>
          {WEEK_DAYS.map((d) => {
            const h = schedule[d]
            const split = Boolean(h.open2 || h.close2)
            return (
              <div key={d} className="flex flex-wrap items-center gap-3 border-b pb-3" data-testid={`bookings-day-${d}`}>
                <Text size="small" weight="plus" style={{ width: 96 }}>{t(`vitrinakiBookings.days.${d}`)}</Text>
                <div className="flex items-center gap-2" style={{ width: 110 }}>
                  <Switch id={`day-${d}`} checked={!h.closed} onCheckedChange={(open) => updateDay(d, open ? { closed: false, open: h.open || "09:00", close: h.close || "17:00" } : { closed: true })} />
                  <Label htmlFor={`day-${d}`} size="xsmall">{h.closed ? t("vitrinakiBookings.closed") : t("vitrinakiBookings.open")}</Label>
                </div>
                {!h.closed ? (
                  <>
                    <Input type="time" size="small" value={h.open} onChange={(e) => updateDay(d, { open: e.target.value })} style={{ width: 110 }} aria-label={t("vitrinakiBookings.form.from")} />
                    <Text size="small">–</Text>
                    <Input type="time" size="small" value={h.close} onChange={(e) => updateDay(d, { close: e.target.value })} style={{ width: 110 }} aria-label={t("vitrinakiBookings.form.to")} />
                    {split ? (
                      <>
                        <Text size="small">·</Text>
                        <Input type="time" size="small" value={h.open2} onChange={(e) => updateDay(d, { open2: e.target.value })} style={{ width: 110 }} aria-label={t("vitrinakiBookings.form.from")} />
                        <Text size="small">–</Text>
                        <Input type="time" size="small" value={h.close2} onChange={(e) => updateDay(d, { close2: e.target.value })} style={{ width: 110 }} aria-label={t("vitrinakiBookings.form.to")} />
                        <Button type="button" size="small" variant="transparent" onClick={() => updateDay(d, { open2: "", close2: "" })}>{t("vitrinakiBookings.form.remove")}</Button>
                      </>
                    ) : (
                      <Button type="button" size="small" variant="transparent" onClick={() => updateDay(d, { open2: "17:00", close2: "21:00" })}>{t("vitrinakiBookings.form.addSplit")}</Button>
                    )}
                  </>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-y-3">
          <div>
            <Heading level="h2">{t("vitrinakiBookings.form.rules")}</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">{t("vitrinakiBookings.form.rulesHint")}</Text>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-y-1" style={{ width: 150 }}>
              <Label size="xsmall" weight="plus">{t("vitrinakiBookings.rules.slotStepMinutes")}</Label>
              <Select size="small" value={rules.slotStepMinutes} onValueChange={(v) => setRules({ ...rules, slotStepMinutes: v })}>
                <Select.Trigger><Select.Value /></Select.Trigger>
                <Select.Content>
                  {SLOT_STEPS.map((s) => <Select.Item key={s} value={String(s)}>{durationLabel(s, t)}</Select.Item>)}
                </Select.Content>
              </Select>
            </div>
            {numberField("bufferMinutes", 150)}
            {numberField("minNoticeHours", 150)}
            {numberField("maxDaysAhead", 150)}
            {numberField("cancelHours", 170)}
          </div>
          <Text size="xsmall" className="text-ui-fg-subtle">{t("vitrinakiBookings.rules.explain")}</Text>
        </div>

        <div className="flex flex-col gap-y-3">
          <div>
            <Heading level="h2">{t("vitrinakiBookings.form.daysOff")}</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">{t("vitrinakiBookings.form.daysOffHint")}</Text>
          </div>
          {daysOff.map((off, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-y-1">
                <Label size="xsmall" weight="plus">{t("vitrinakiBookings.form.from")}</Label>
                <Input type="date" size="small" value={off.from} onChange={(e) => setDaysOff((l) => l.map((o, j) => (j === i ? { ...o, from: e.target.value } : o)))} />
              </div>
              <div className="flex flex-col gap-y-1">
                <Label size="xsmall" weight="plus">{t("vitrinakiBookings.form.to")}</Label>
                <Input type="date" size="small" value={off.to} onChange={(e) => setDaysOff((l) => l.map((o, j) => (j === i ? { ...o, to: e.target.value } : o)))} />
              </div>
              <div className="flex flex-1 flex-col gap-y-1" style={{ minWidth: 160 }}>
                <Label size="xsmall" weight="plus">{t("vitrinakiBookings.form.offNote")}</Label>
                <Input size="small" value={off.note} placeholder={t("vitrinakiBookings.form.offNotePlaceholder")} onChange={(e) => setDaysOff((l) => l.map((o, j) => (j === i ? { ...o, note: e.target.value } : o)))} />
              </div>
              <Button type="button" size="small" variant="transparent" onClick={() => setDaysOff((l) => l.filter((_, j) => j !== i))}>{t("vitrinakiBookings.form.remove")}</Button>
            </div>
          ))}
          <Button
            type="button"
            size="small"
            variant="secondary"
            className="self-start"
            onClick={() => {
              const today = athensToday()
              setDaysOff((l) => [...l, { from: today, to: today, note: "" }])
            }}
          >
            {t("vitrinakiBookings.form.addDayOff")}
          </Button>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label htmlFor="bookings-note" size="small" weight="plus">{t("vitrinakiBookings.form.note")}</Label>
          <Textarea id="bookings-note" rows={2} value={note} placeholder={t("vitrinakiBookings.form.notePlaceholder")} onChange={(e) => setNote(e.target.value)} />
          <Text size="xsmall" className="text-ui-fg-subtle">{t("vitrinakiBookings.form.noteHint")}</Text>
        </div>

        {error ? <Text size="small" className="text-ui-fg-error" data-testid="bookings-settings-error">{error}</Text> : null}
        <div className="flex justify-end">
          <Button type="submit" size="small" isLoading={saving}>{t("vitrinakiBookings.form.save")}</Button>
        </div>
      </form>
    </Container>
  )
}
