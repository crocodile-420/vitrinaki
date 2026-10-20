import { NextResponse } from "next/server"

import { clearStartSession } from "@/lib/data/vitrinaki-start"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  await clearStartSession()
  return NextResponse.json({ ok: true })
}
