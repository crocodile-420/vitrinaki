"use client"

import { useState, type FormEvent } from "react"

import { useTranslator } from "@/lib/i18n/client"
import { caps } from "@/lib/vitrinaki-start"

import { Field, Icon, Notice, Spinner, inputCls, primaryBtn } from "./ui"

// The Vitrinaki login for sellers, shown when there is no session (or it
// expired). Same email and password as at sign-up.
export function ShopLogin({ startHref, notice, onLoggedIn }: { startHref: string; notice?: string; onLoggedIn: () => void }) {
  const { tr } = useTranslator()
  const uid = "vk-login"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!email.trim() || !password) return setError(tr("Γράψε το email και τον κωδικό σου."))
    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/vitrinaki/shop/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const body = (await response.json().catch(() => ({}))) as { message?: string }
      if (!response.ok) return setError(body.message || tr("Κάτι πήγε στραβά. Δοκίμασε ξανά."))
      onLoggedIn()
    } catch {
      setError(tr("Δεν μπορέσαμε να συνδεθούμε. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[460px]">
      <div className="rounded-[1.6rem] border border-[#2E4A37]/10 bg-white p-6 shadow-[0_40px_90px_-50px_rgba(31,54,40,0.6)] sm:p-8">
        <p className="text-[12px] font-semibold tracking-[0.16em] text-[#C0503C]">{caps(tr("Το κατάστημά σου"))}</p>
        <h1 className="mt-2 text-[1.75rem] font-extrabold leading-tight tracking-[-0.02em] text-[#1F3628]">{tr("Σύνδεση στη βιτρίνα σου")}</h1>
        <p className="mt-1.5 text-[14.5px] leading-6 text-[#2E4A37]/70">{tr("Με το email και τον κωδικό που έβαλες όταν άνοιξες τη βιτρίνα σου.")}</p>

        <form noValidate onSubmit={submit} className="mt-6 space-y-5">
          {notice ? <Notice tone="info">{notice}</Notice> : null}
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Field id={`${uid}-email`} label={tr("Email")}>
            <input id={`${uid}-email`} type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls()} placeholder="esy@paradeigma.gr" />
          </Field>
          <Field id={`${uid}-password`} label={tr("Κωδικός")}>
            <div className="relative">
              <input id={`${uid}-password`} type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls()} pr-12`} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? tr("Απόκρυψη κωδικού") : tr("Εμφάνιση κωδικού")} className="absolute inset-y-0 right-1 grid w-10 place-items-center text-[#2E4A37]/60 hover:text-[#2E4A37]">
                <Icon name={show ? "eyeOff" : "eye"} />
              </button>
            </div>
          </Field>
          <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>
            {busy ? <><Spinner />{tr("Σύνδεση…")}</> : <>{tr("Σύνδεση")} <Icon name="arrow" /></>}
          </button>
        </form>
        <p className="mt-5 text-center text-[14px] text-[#2E4A37]/70">
          {tr("Δεν έχεις ακόμα βιτρίνα;")}{" "}
          <a href={startHref} className="font-semibold text-[#2E4A37] underline-offset-2 hover:underline">{tr("Άνοιξε τη δική σου")}</a>
        </p>
      </div>
    </div>
  )
}
