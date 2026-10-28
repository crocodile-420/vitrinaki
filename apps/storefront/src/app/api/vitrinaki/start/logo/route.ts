import { NextRequest, NextResponse } from "next/server"

import { backend, readStartSession } from "@/lib/data/vitrinaki-start"
import { MAX_VIDEO_MB } from "@/lib/vitrinaki-start"
import { translator, isLang } from "@/lib/i18n/vitrinaki"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = { logo: 3 * 1024 * 1024, photo: 10 * 1024 * 1024, video: MAX_VIDEO_MB * 1024 * 1024 }
const TYPES = {
  logo: new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
  photo: new Set(["image/png", "image/jpeg", "image/webp"]),
  video: new Set(["video/mp4", "video/webm", "video/quicktime"]),
}
const MESSAGES = {
  logo: { type: "Ανέβασε PNG, JPG, WEBP ή SVG.", size: "Η εικόνα είναι μεγαλύτερη από 3 MB.", failed: "Δεν ανέβηκε η εικόνα. Δοκίμασε ξανά." },
  photo: { type: "Ανέβασε PNG, JPG ή WEBP.", size: "Η φωτογραφία είναι μεγαλύτερη από 10 MB.", failed: "Δεν ανέβηκε η φωτογραφία. Δοκίμασε ξανά." },
  video: { type: "Ανέβασε βίντεο MP4, MOV ή WEBM.", size: "Το βίντεο είναι μεγαλύτερο από 50 MB. Ανέβασέ το στο YouTube και βάλε εδώ τον σύνδεσμο.", failed: "Δεν ανέβηκε το βίντεο. Δοκίμασε ξανά." },
}

// The logo, photos and video introduction of the «Φωτογραφίες» step (kind=logo|photo|video): uploads
// through the Studio's own /vendor/uploads, which counts them against the
// plan's space, and returns the public URL (saved with the step).
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const tr = translator(isLang(form?.get("lang")) ? (form!.get("lang") as "el" | "en") : "el")
  const session = await readStartSession()
  if (!session) return NextResponse.json({ message: tr("Η σύνδεση έληξε. Συνδέσου ξανά για να συνεχίσεις.") }, { status: 401 })

  const requested = form?.get("kind")
  const kind = requested === "photo" || requested === "video" ? requested : "logo"
  const file = form?.get("file")
  if (!(file instanceof File)) return NextResponse.json({ message: tr("Διάλεξε μια εικόνα.") }, { status: 400 })
  if (!TYPES[kind].has(file.type)) return NextResponse.json({ message: tr(MESSAGES[kind].type) }, { status: 400 })
  if (file.size > MAX_BYTES[kind]) return NextResponse.json({ message: tr(MESSAGES[kind].size) }, { status: 400 })

  const upload = new FormData()
  upload.append("files", file, file.name || kind)
  try {
    const result = await backend<{ files?: { url: string }[] }>("/vendor/uploads", { token: session.token, sellerId: session.sellerId, form: upload })
    const url = result.body.files?.[0]?.url
    if (!result.ok || !url) {
      // The plan's space is full: say so instead of a generic failure.
      const message = result.status === 400 && result.body.message ? result.body.message : MESSAGES[kind].failed
      return NextResponse.json({ message: tr(message) }, { status: result.status === 400 ? 400 : 502 })
    }
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ message: tr(MESSAGES[kind].failed) }, { status: 502 })
  }
}
