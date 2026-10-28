import { NextRequest, NextResponse } from "next/server"

import { backend, readStartSession } from "@/lib/data/vitrinaki-start"
import { translator, isLang } from "@/lib/i18n/vitrinaki"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = { logo: 3 * 1024 * 1024, photo: 10 * 1024 * 1024 }
const TYPES = { logo: new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]), photo: new Set(["image/png", "image/jpeg", "image/webp"]) }

// The logo and photos of the «Φωτογραφίες» step (kind=logo|photo): uploads
// through the Studio's own /vendor/uploads, which counts them against the
// plan's space, and returns the public URL (saved with the step).
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const tr = translator(isLang(form?.get("lang")) ? (form!.get("lang") as "el" | "en") : "el")
  const session = await readStartSession()
  if (!session) return NextResponse.json({ message: tr("Η σύνδεση έληξε. Συνδέσου ξανά για να συνεχίσεις.") }, { status: 401 })

  const kind = form?.get("kind") === "photo" ? "photo" : "logo"
  const file = form?.get("file")
  if (!(file instanceof File)) return NextResponse.json({ message: tr("Διάλεξε μια εικόνα.") }, { status: 400 })
  if (!TYPES[kind].has(file.type)) return NextResponse.json({ message: tr(kind === "photo" ? "Ανέβασε PNG, JPG ή WEBP." : "Ανέβασε PNG, JPG, WEBP ή SVG.") }, { status: 400 })
  if (file.size > MAX_BYTES[kind]) return NextResponse.json({ message: tr(kind === "photo" ? "Η φωτογραφία είναι μεγαλύτερη από 10 MB." : "Η εικόνα είναι μεγαλύτερη από 3 MB.") }, { status: 400 })

  const upload = new FormData()
  upload.append("files", file, file.name || kind)
  try {
    const result = await backend<{ files?: { url: string }[] }>("/vendor/uploads", { token: session.token, sellerId: session.sellerId, form: upload })
    const url = result.body.files?.[0]?.url
    if (!result.ok || !url) {
      // The plan's space is full: say so instead of a generic failure.
      const message = result.status === 400 && result.body.message ? result.body.message : "Δεν ανέβηκε η εικόνα. Δοκίμασε ξανά."
      return NextResponse.json({ message: tr(message) }, { status: result.status === 400 ? 400 : 502 })
    }
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ message: tr("Δεν ανέβηκε η εικόνα. Δοκίμασε ξανά.") }, { status: 502 })
  }
}
