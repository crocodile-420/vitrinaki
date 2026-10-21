import { NextRequest, NextResponse } from "next/server"

import { backend, clearStartSession, readStartSession, writeStartSession, type StartSession } from "@/lib/data/vitrinaki-start"
import { LANG_COOKIE, isLang, translator } from "@/lib/i18n/vitrinaki"

// Route-handler helpers of /[locale]/shop-registration: every call runs as the
// seller in the vk_start session cookie and proxies one /vendor/* endpoint.

export type Tr = (greek: string) => string

export const trFor = (request: NextRequest): Tr => {
  const lang = request.cookies.get(LANG_COOKIE)?.value
  return translator(isLang(lang) ? lang : "el")
}

export const sessionExpired = (tr: Tr) =>
  NextResponse.json({ code: "session_expired", message: tr("Η σύνδεση έληξε. Συνδέσου ξανά για να συνεχίσεις.") }, { status: 401 })

export const unreachable = (tr: Tr) =>
  NextResponse.json({ message: tr("Δεν μπορέσαμε να επικοινωνήσουμε με τον server. Δοκίμασε ξανά σε λίγο.") }, { status: 502 })

// Runs `work` with the session. A missing session, or a token the backend
// refuses, ends it and the page shows the Vitrinaki login instead. A
// successful call keeps the 30-day cookie rolling.
export async function withSession(request: NextRequest, work: (session: StartSession, tr: Tr) => Promise<NextResponse>) {
  const tr = trFor(request)
  const session = await readStartSession()
  if (!session) return sessionExpired(tr)
  try {
    const response = await work(session, tr)
    if (response.status === 401) {
      await clearStartSession()
      return sessionExpired(tr)
    }
    await writeStartSession(session)
    return response
  } catch (error) {
    console.error("[vitrinaki/shop] backend call failed", error)
    return unreachable(tr)
  }
}

type Result = { ok: boolean; status: number; body: Record<string, any> }

// Passes a backend answer through, translating its messages (the backend writes Greek).
export function relay(result: Result, tr: Tr) {
  if (result.ok) return NextResponse.json(result.body)
  const errors = result.body.errors as Record<string, string> | undefined
  return NextResponse.json(
    {
      message: tr(String(result.body.message || "Κάτι πήγε στραβά. Δοκίμασε ξανά.")),
      errors: errors ? Object.fromEntries(Object.entries(errors).map(([key, value]) => [key, tr(value)])) : undefined,
    },
    { status: result.status }
  )
}

export const callAs = (session: StartSession, path: string, body?: unknown): Promise<Result> =>
  backend<Record<string, any>>(path, { token: session.token, sellerId: session.sellerId, body })
