import { NextRequest, NextResponse } from "next/server"

import { backend } from "@/lib/data/vitrinaki-start"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Live «does this referral code exist?» check for the sign-up form. Answers the
// referring shop's name so the form can say who sent you.
export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get("code") || "").trim().slice(0, 300)
  if (!code) return NextResponse.json({ valid: false })
  try {
    const result = await backend<{ valid?: boolean; code?: string; shopName?: string }>(`/store/vitrinaki/referral?${new URLSearchParams({ code })}`, { store: true })
    if (!result.ok) return NextResponse.json({ unknown: true })
    return NextResponse.json(result.body, { headers: { "Cache-Control": "no-store" } })
  } catch {
    // Unknown is not "invalid": the code is checked again on submit.
    return NextResponse.json({ unknown: true })
  }
}
