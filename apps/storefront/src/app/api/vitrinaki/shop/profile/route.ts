import { NextRequest } from "next/server"

import { callAs, relay, withSession } from "@/lib/data/vitrinaki-shop"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// The whole store profile (public profile, basics, private legal/owner data)
// via the backend's /vendor/vitrinaki/profile, which validates and splits it.
export async function GET(request: NextRequest) {
  return withSession(request, async (session, tr) => relay(await callAs(session, "/vendor/vitrinaki/profile"), tr))
}

export async function POST(request: NextRequest) {
  const raw = ((await request.json().catch(() => ({}))) || {}) as Record<string, unknown>
  const body = { profile: raw.profile, basics: raw.basics, private: raw.private }
  return withSession(request, async (session, tr) => relay(await callAs(session, "/vendor/vitrinaki/profile", body), tr))
}
