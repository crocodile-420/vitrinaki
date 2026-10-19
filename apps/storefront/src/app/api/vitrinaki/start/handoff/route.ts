import { NextRequest, NextResponse } from "next/server"

import { readStartSession, studioBaseUrl } from "@/lib/data/vitrinaki-start"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Hands the fresh session over to the Studio (a different origin, which keeps
// its login in its own localStorage). The token travels in the URL fragment:
// fragments are never sent to a server or in a Referer, and the Studio's
// bootstrap (apps/vendor/src/main.tsx) stores it and strips it from the address
// bar before the app renders. POST-only, so another site cannot trigger it with
// a link (the session cookie is SameSite=Lax).
const TARGETS: Record<string, string> = {
  studio: "/",
  profile: "/vitrinaki-profile",
  website: "/vitrinaki-storefront",
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const target = TARGETS[String(form?.get("to") || "studio")] || "/"
  const studio = studioBaseUrl()
  const session = await readStartSession()
  if (!session) {
    return NextResponse.redirect(`${studio}/login`, 303)
  }
  const fragment = new URLSearchParams({ vk_handoff: session.token, vk_seller: session.sellerId })
  return NextResponse.redirect(`${studio}${target === "/" ? "/" : target}#${fragment}`, 303)
}

export async function GET() {
  return NextResponse.redirect(`${studioBaseUrl()}/login`, 303)
}
