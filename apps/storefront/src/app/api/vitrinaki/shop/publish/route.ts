import { NextRequest, NextResponse } from "next/server"

import { callAs, relay, trFor, withSession } from "@/lib/data/vitrinaki-shop"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Publishes or withdraws the public page. The backend action needs the current
// website settings with it, so they are read first and sent back unchanged.
export async function POST(request: NextRequest) {
  const raw = ((await request.json().catch(() => ({}))) || {}) as { action?: unknown }
  const action = raw.action === "unpublish" ? "unpublish" : raw.action === "publish" ? "publish" : ""
  if (!action) return NextResponse.json({ message: trFor(request)("Άγνωστη ενέργεια.") }, { status: 400 })
  return withSession(request, async (session, tr) => {
    const current = await callAs(session, "/vendor/vitrinaki/storefront")
    if (!current.ok) return relay(current, tr)
    const result = await callAs(session, "/vendor/vitrinaki/storefront", { action, storefront: current.body.storefront })
    if (!result.ok) return relay(result, tr)
    return NextResponse.json({ isPublished: Boolean(result.body.storefront?.isPublished) })
  })
}
