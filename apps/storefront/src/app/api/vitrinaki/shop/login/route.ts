import { NextRequest, NextResponse } from "next/server"

import { trFor, unreachable } from "@/lib/data/vitrinaki-shop"
import { backend, writeStartSession } from "@/lib/data/vitrinaki-start"
import { isEmail } from "@/lib/vitrinaki-start"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Membership = { seller?: { id: string; handle: string; name: string; status?: string } }

// Vitrinaki login for sellers: the same member login the Studio uses, then the
// member's shop (GET /vendor/sellers needs no seller id yet).
export async function POST(request: NextRequest) {
  const tr = trFor(request)
  const raw = ((await request.json().catch(() => ({}))) || {}) as { email?: unknown; password?: unknown }
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : ""
  const password = typeof raw.password === "string" ? raw.password : ""
  if (!isEmail(email) || !password) {
    return NextResponse.json({ message: tr("Γράψε το email και τον κωδικό σου.") }, { status: 400 })
  }
  try {
    const login = await backend<{ token?: string }>("/auth/member/emailpass", { body: { email, password } })
    if (!login.ok || !login.body.token) {
      return NextResponse.json({ message: tr("Λάθος email ή κωδικός.") }, { status: 401 })
    }
    const token = login.body.token
    const sellers = await backend<{ seller_members?: Membership[] }>("/vendor/sellers?limit=20", { token })
    const seller = sellers.body.seller_members?.map((m) => m.seller).find((s) => s && s.status !== "terminated")
    if (!sellers.ok || !seller) {
      return NextResponse.json({ code: "no_shop", message: tr("Δεν βρήκαμε κατάστημα σε αυτόν τον λογαριασμό. Άνοιξε τη βιτρίνα σου από την αρχή.") }, { status: 404 })
    }
    await writeStartSession({ token, sellerId: seller.id, handle: seller.handle, name: seller.name, email })
    return NextResponse.json({ ok: true, seller: { name: seller.name, handle: seller.handle } })
  } catch (error) {
    console.error("[vitrinaki/shop/login] failed", error)
    return unreachable(tr)
  }
}
