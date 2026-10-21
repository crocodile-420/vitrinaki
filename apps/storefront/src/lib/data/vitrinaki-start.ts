import { cookies } from "next/headers"

// Server-side half of the public sign-up page (/start) and the shop profile
// (/shop-registration). The browser only ever talks to this storefront's own
// /api/vitrinaki/* route handlers; they call the Medusa/Mercur backend
// server-to-server (so no CORS changes are needed) and keep the member's token
// in an httpOnly cookie, the seller's Vitrinaki session. The Studio is only
// reached through the handoff, for products and orders.

export const backendUrl = () => (process.env.MEDUSA_BACKEND_URL || "http://localhost:9100").replace(/\/+$/, "")
const publishableKey = () => process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export const START_COOKIE = "vk_start"
const START_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days; the backend token inside may expire sooner, then the page asks to log in again

export type StartSession = { token: string; sellerId: string; handle: string; name: string; email: string; saved?: string[] }

export async function readStartSession(): Promise<StartSession | null> {
  const raw = (await cookies()).get(START_COOKIE)?.value
  if (!raw) return null
  try {
    const value = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as StartSession
    if (!value.token || !value.sellerId) return null
    return value
  } catch {
    return null
  }
}

export async function writeStartSession(session: StartSession) {
  ;(await cookies()).set(START_COOKIE, Buffer.from(JSON.stringify(session), "utf8").toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: START_COOKIE_MAX_AGE,
  })
}

export async function clearStartSession() {
  ;(await cookies()).delete(START_COOKIE)
}

type BackendResult<T> = { ok: boolean; status: number; body: T & { message?: string; type?: string } }

export async function backend<T = Record<string, unknown>>(
  path: string,
  init: { method?: string; body?: unknown; token?: string; sellerId?: string; store?: boolean; form?: FormData } = {}
): Promise<BackendResult<T>> {
  const headers: Record<string, string> = {}
  if (init.body !== undefined) headers["Content-Type"] = "application/json"
  if (init.token) headers.Authorization = `Bearer ${init.token}`
  if (init.sellerId) headers["x-seller-id"] = init.sellerId
  if (init.store) headers["x-publishable-api-key"] = publishableKey()
  const response = await fetch(`${backendUrl()}${path}`, {
    method: init.method || (init.body !== undefined || init.form ? "POST" : "GET"),
    headers,
    body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
    cache: "no-store",
  })
  const body = (await response.json().catch(() => ({}))) as T & { message?: string; type?: string }
  return { ok: response.ok, status: response.status, body }
}

export type Availability = {
  name?: { available: boolean }
  handle?: { valid: boolean; available: boolean; suggestion?: string }
  email?: { available: boolean }
}

export async function checkAvailability(params: { name?: string; handle?: string; email?: string }) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value)
  const result = await backend<Availability>(`/store/vitrinaki/availability?${search}`, { store: true })
  if (!result.ok) throw new Error(result.body.message || "availability check failed")
  return result.body
}

// Where the Studio (vendor panel) lives, e.g. http://localhost:9100/seller.
export const studioBaseUrl = () =>
  (process.env.NEXT_PUBLIC_VENDOR_URL || `${backendUrl()}/seller`).replace(/\/+$/, "")
