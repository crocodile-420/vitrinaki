import { NextRequest, NextResponse } from "next/server"

import { backend, checkAvailability, writeStartSession } from "@/lib/data/vitrinaki-start"
import { translator, isLang } from "@/lib/i18n/vitrinaki"
import { PASSWORD_MIN, isEmail, isValidHandle, type StartResponse } from "@/lib/vitrinaki-start"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Creates a Vitrinaki shop from the public start page, with the same backend
// calls the Studio's own sign-up makes:
//   1. POST /auth/member/emailpass/register   → login identity
//   2. POST /vendor/sellers                   → shop + member (status pending_approval)
//   3. POST /auth/member/emailpass            → a session token that carries the member
// Name, address and email are unique on the seller, so they are checked first;
// otherwise a taken name would leave a login without a shop.

type Body = { storeName?: unknown; handle?: unknown; email?: unknown; password?: unknown; terms?: unknown; lang?: unknown; referralCode?: unknown }

const jwtPayload = (token: string): Record<string, any> => {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1] || "", "base64url").toString("utf8"))
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  const raw = ((await request.json().catch(() => ({}))) || {}) as Body
  const lang = isLang(raw.lang) ? raw.lang : "el"
  const tr = translator(lang)
  const fail = (status: number, body: Extract<StartResponse, { ok: false }>) => NextResponse.json(body, { status })

  const storeName = typeof raw.storeName === "string" ? raw.storeName.trim().replace(/\s+/g, " ").slice(0, 100) : ""
  const handle = typeof raw.handle === "string" ? raw.handle.trim().toLowerCase() : ""
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : ""
  const password = typeof raw.password === "string" ? raw.password : ""
  const referralCode = typeof raw.referralCode === "string" ? raw.referralCode.trim().slice(0, 300) : ""

  const fields: Record<string, string> = {}
  if (storeName.length < 2) fields.storeName = tr("Γράψε το όνομα του καταστήματός σου.")
  if (!isValidHandle(handle)) fields.handle = tr("Η διεύθυνση θέλει 3–48 λατινικά γράμματα, αριθμούς ή παύλες.")
  if (!isEmail(email)) fields.email = tr("Αυτό το email δεν μοιάζει σωστό.")
  if (password.length < PASSWORD_MIN) fields.password = tr("Ο κωδικός θέλει τουλάχιστον 8 χαρακτήρες.")
  if (password.length > 128) fields.password = tr("Ο κωδικός είναι πολύ μεγάλος.")
  if (raw.terms !== true) fields.terms = tr("Χρειάζεται να αποδεχτείς τους όρους για να συνεχίσεις.")
  if (Object.keys(fields).length) return fail(400, { ok: false, code: "invalid", message: tr("Έλεγξε τα πεδία με κόκκινο."), fields })

  try {
    // ---- uniqueness, before creating anything ----
    const availability = await checkAvailability({ name: storeName, handle, email })
    if (availability.email && !availability.email.available) {
      return fail(409, { ok: false, code: "account_exists", message: tr("Υπάρχει ήδη κατάστημα με αυτό το email. Συνδέσου στη βιτρίνα σου."), fields: { email: tr("Υπάρχει ήδη κατάστημα με αυτό το email.") } })
    }
    if (availability.name && !availability.name.available) {
      return fail(409, { ok: false, code: "name_taken", message: tr("Αυτό το όνομα το έχει ήδη άλλο κατάστημα."), fields: { storeName: tr("Αυτό το όνομα το έχει ήδη άλλο κατάστημα. Πρόσθεσε κάτι, π.χ. την πόλη σου.") } })
    }
    if (availability.handle && !availability.handle.available) {
      return fail(409, {
        ok: false,
        code: "handle_taken",
        message: tr("Αυτή η διεύθυνση είναι πιασμένη."),
        fields: { handle: tr("Αυτή η διεύθυνση είναι πιασμένη.") },
        suggestion: availability.handle.suggestion,
      })
    }

    // ---- 1. login identity ----
    let registrationToken = ""
    const registered = await backend<{ token?: string }>("/auth/member/emailpass/register", { body: { email, password } })
    if (registered.ok && registered.body.token) {
      registrationToken = registered.body.token
    } else if (/exist/i.test(String(registered.body.message || ""))) {
      // The email already has a login. Either a finished account (send them to
      // the Studio) or a sign-up that stopped before the shop was created, in
      // which case the right password lets them carry on.
      const login = await backend<{ token?: string }>("/auth/member/emailpass", { body: { email, password } })
      if (!login.ok || !login.body.token) {
        return fail(409, { ok: false, code: "email_exists", message: tr("Υπάρχει ήδη λογαριασμός με αυτό το email."), fields: { email: tr("Υπάρχει ήδη λογαριασμός με αυτό το email.") } })
      }
      if (jwtPayload(login.body.token).actor_id) {
        return fail(409, { ok: false, code: "account_exists", message: tr("Έχεις ήδη λογαριασμό. Συνδέσου στη βιτρίνα σου."), fields: { email: tr("Υπάρχει ήδη λογαριασμός με αυτό το email.") } })
      }
      registrationToken = login.body.token
    } else {
      console.error("[vitrinaki/start] register failed", registered.status, registered.body.message)
      return fail(502, { ok: false, code: "server", message: tr("Κάτι πήγε στραβά από τη μεριά μας. Δοκίμασε ξανά σε λίγο.") })
    }

    // ---- 2. the shop ----
    const now = new Date().toISOString()
    const created = await backend<{ seller?: { id: string; handle: string; name: string } }>("/vendor/sellers", {
      token: registrationToken,
      body: {
        name: storeName,
        handle,
        email,
        member_email: email,
        currency_code: "eur",
        metadata: {
          vitrinaki_signup: { source: "start_page", lang, termsAcceptedAt: now },
          vitrinaki_storefront: {
            storeName,
            tagline: "",
            palette: "forest",
            template: "atelier",
            contactEmail: email,
            isPublished: false,
            updatedAt: now,
          },
        },
      },
    })
    if (!created.ok || !created.body.seller) {
      const message = String(created.body.message || "")
      console.error("[vitrinaki/start] seller create failed", created.status, message)
      if (/handle/i.test(message)) return fail(409, { ok: false, code: "handle_taken", message: tr("Αυτή η διεύθυνση είναι πιασμένη."), fields: { handle: tr("Αυτή η διεύθυνση είναι πιασμένη.") } })
      if (/name/i.test(message)) return fail(409, { ok: false, code: "name_taken", message: tr("Αυτό το όνομα το έχει ήδη άλλο κατάστημα."), fields: { storeName: tr("Αυτό το όνομα το έχει ήδη άλλο κατάστημα.") } })
      return fail(502, { ok: false, code: "server", message: tr("Κάτι πήγε στραβά από τη μεριά μας. Δοκίμασε ξανά σε λίγο.") })
    }
    const seller = created.body.seller

    // ---- 3. a session that carries the new member ----
    const session = await backend<{ token?: string }>("/auth/member/emailpass", { body: { email, password } })
    if (!session.ok || !session.body.token) {
      console.error("[vitrinaki/start] login after sign-up failed", session.status, session.body.message)
      return fail(502, { ok: false, code: "server", message: tr("Το κατάστημα δημιουργήθηκε, αλλά δεν μπορέσαμε να σε συνδέσουμε. Συνδέσου στη βιτρίνα σου με το email σου.") })
    }

    await writeStartSession({ token: session.body.token, sellerId: seller.id, handle: seller.handle, name: seller.name, email })

    // ---- 4. optional referral code («Κωδικός σύστασης»), never blocks sign-up ----
    let referral: Extract<StartResponse, { ok: true }>["referral"]
    if (referralCode) {
      try {
        const claimed = await backend<{ applied?: boolean; referrer?: { name?: string } }>("/vendor/vitrinaki/referral/claim", {
          token: session.body.token,
          sellerId: seller.id,
          body: { code: referralCode },
        })
        referral = claimed.ok
          ? { applied: true, referrerName: claimed.body.referrer?.name || "" }
          : { applied: false, message: tr(String(claimed.body.message || "Δεν βρήκαμε αυτόν τον κωδικό σύστασης. Μπορείς να συνεχίσεις και χωρίς.")) }
      } catch (error) {
        console.error("[vitrinaki/start] referral claim failed", error)
        referral = { applied: false }
      }
    }
    return NextResponse.json({ ok: true, seller: { name: seller.name, handle: seller.handle }, email, ...(referral ? { referral } : {}) } satisfies StartResponse)
  } catch (error) {
    console.error("[vitrinaki/start] unexpected error", error)
    return fail(502, { ok: false, code: "server", message: tr("Δεν μπορέσαμε να επικοινωνήσουμε με τον server. Δοκίμασε ξανά σε λίγο.") })
  }
}
