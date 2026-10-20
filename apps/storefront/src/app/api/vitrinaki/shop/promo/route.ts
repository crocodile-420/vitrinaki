import { NextRequest, NextResponse } from "next/server"

import { callAs, relay, trFor, withSession } from "@/lib/data/vitrinaki-shop"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Activates a subscription with a promo code. Only the code counts, so a line
// copied from VITRINAKI_PROMO_CODES ("VITRINAKI-TEST:pro") works too.
export async function POST(request: NextRequest) {
  const raw = ((await request.json().catch(() => ({}))) || {}) as { code?: unknown }
  const code = String(raw.code || "").split(":")[0].trim().slice(0, 64)
  if (!code) return NextResponse.json({ message: trFor(request)("Γράψε τον κωδικό σου.") }, { status: 400 })
  return withSession(request, async (session, tr) => relay(await callAs(session, "/vendor/vitrinaki/billing/promo", { code }), tr))
}
