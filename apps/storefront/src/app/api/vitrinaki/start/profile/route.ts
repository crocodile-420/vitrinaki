import { NextRequest, NextResponse } from "next/server"

import { backend, readStartSession, writeStartSession } from "@/lib/data/vitrinaki-start"
import { translator, isLang } from "@/lib/i18n/vitrinaki"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Saves one optional first step (type, story, photos, location, contact) into
// the shop's profile via the backend's /vendor/vitrinaki/start route.
const ALLOWED = new Set([
  "step", "businessType", "businessTypeOther", "palette", "logoUrl", "tagline", "story", "area", "city", "postalCode",
  "contactPhone", "contactEmail", "whatsapp", "viberSameAsWhatsapp", "instagram", "facebook", "photos", "introVideo",
])

export async function POST(request: NextRequest) {
  const raw = ((await request.json().catch(() => ({}))) || {}) as Record<string, unknown>
  const tr = translator(isLang(raw.lang) ? raw.lang : "el")
  const session = await readStartSession()
  if (!session) {
    return NextResponse.json({ message: tr("Η σύνδεση έληξε. Συνδέσου ξανά για να συνεχίσεις.") }, { status: 401 })
  }
  const body = Object.fromEntries(Object.entries(raw).filter(([key]) => ALLOWED.has(key)))
  try {
    const result = await backend("/vendor/vitrinaki/start", { token: session.token, sellerId: session.sellerId, body })
    if (!result.ok) {
      const errors = (result.body as { errors?: Record<string, string> }).errors
      const translated = errors ? Object.fromEntries(Object.entries(errors).map(([key, value]) => [key, tr(value)])) : undefined
      return NextResponse.json({ message: tr(result.body.message || "Δεν αποθηκεύτηκε. Δοκίμασε ξανά."), errors: translated }, { status: result.status === 401 ? 401 : 400 })
    }
    // Remember which first steps are done, so a reload shows the right summary.
    const step = typeof raw.step === "string" ? raw.step.slice(0, 20) : ""
    if (step && !session.saved?.includes(step)) await writeStartSession({ ...session, saved: [...(session.saved || []), step] })
    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json({ message: tr("Δεν μπορέσαμε να επικοινωνήσουμε με τον server. Δοκίμασε ξανά σε λίγο.") }, { status: 502 })
  }
}
