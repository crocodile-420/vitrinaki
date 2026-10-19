import { NextRequest, NextResponse } from "next/server"

import { checkAvailability } from "@/lib/data/vitrinaki-start"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Live «is this name / address free?» check for the sign-up form.
export async function GET(request: NextRequest) {
  const name = (request.nextUrl.searchParams.get("name") || "").trim().slice(0, 100)
  const handle = (request.nextUrl.searchParams.get("handle") || "").trim().toLowerCase().slice(0, 48)
  if (!name && !handle) return NextResponse.json({})
  try {
    const result = await checkAvailability({ name, handle })
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch {
    // Unknown is not "taken": the final check happens again on submit.
    return NextResponse.json({ unknown: true }, { status: 200 })
  }
}
