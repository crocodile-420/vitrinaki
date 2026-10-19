import { NextRequest, NextResponse } from "next/server"

import { backend, readStartSession } from "@/lib/data/vitrinaki-start"
import { translator, isLang } from "@/lib/i18n/vitrinaki"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = 3 * 1024 * 1024
const TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"])

// Optional logo for the «Πώς θα δείχνει» step: uploads through the Studio's
// own /vendor/uploads and returns the public URL (saved with the step).
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const tr = translator(isLang(form?.get("lang")) ? (form!.get("lang") as "el" | "en") : "el")
  const session = await readStartSession()
  if (!session) return NextResponse.json({ message: tr("Η σύνδεση έληξε. Συνέχισε από το Studio.") }, { status: 401 })

  const file = form?.get("file")
  if (!(file instanceof File)) return NextResponse.json({ message: tr("Διάλεξε μια εικόνα.") }, { status: 400 })
  if (!TYPES.has(file.type)) return NextResponse.json({ message: tr("Ανέβασε PNG, JPG, WEBP ή SVG.") }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ message: tr("Η εικόνα είναι μεγαλύτερη από 3 MB.") }, { status: 400 })

  const upload = new FormData()
  upload.append("files", file, file.name || "logo")
  try {
    const result = await backend<{ files?: { url: string }[] }>("/vendor/uploads", { token: session.token, sellerId: session.sellerId, form: upload })
    const url = result.body.files?.[0]?.url
    if (!result.ok || !url) return NextResponse.json({ message: tr("Δεν ανέβηκε η εικόνα. Δοκίμασε ξανά.") }, { status: 502 })
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ message: tr("Δεν ανέβηκε η εικόνα. Δοκίμασε ξανά.") }, { status: 502 })
  }
}
