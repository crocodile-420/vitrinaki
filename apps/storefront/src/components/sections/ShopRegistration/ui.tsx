"use client"

type ReactNode = React.ReactNode

// Form primitives of /shop-registration, in the same look as the sign-up flow
// (components/sections/StartFlow).

export const inputBase =
  "block w-full rounded-xl border bg-white px-3.5 py-3 text-[15px] text-[#1F3628] placeholder:text-[#2E4A37]/40 outline-none transition focus:ring-4 disabled:opacity-60"
export const inputCls = (invalid?: boolean) =>
  `${inputBase} ${invalid ? "border-[#C0503C] focus:border-[#C0503C] focus:ring-[#C0503C]/15" : "border-[#2E4A37]/20 focus:border-[#2E4A37] focus:ring-[#2E4A37]/10"}`
export const smallInput =
  "rounded-lg border border-[#2E4A37]/20 bg-white px-2.5 py-1.5 text-[14px] text-[#1F3628] outline-none focus:border-[#2E4A37] focus:ring-4 focus:ring-[#2E4A37]/10"

export const primaryBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C0503C] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(192,80,60,0.85)] transition hover:bg-[#ad4633] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C0503C]/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
export const darkBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#2E4A37] px-6 py-3 text-[15px] font-semibold text-[#F7F2E8] transition hover:bg-[#243b2c] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2E4A37]/30 disabled:cursor-not-allowed disabled:opacity-60"
export const ghostBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold text-[#2E4A37] transition hover:bg-[#2E4A37]/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2E4A37]/15 disabled:opacity-40"
export const secondaryBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#2E4A37]/25 bg-white px-5 py-3 text-[15px] font-semibold text-[#1F3628] transition hover:border-[#2E4A37] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2E4A37]/15 disabled:opacity-50"

export function Icon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const paths: Record<string, ReactNode> = {
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    x: <path d="M6 6l12 12M18 6 6 18" />,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></>,
    lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    back: <path d="M19 12H5M11 6l-6 6 6 6" />,
    upload: <><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
    spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="M3 3l18 18M10.6 5.6A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 4M6.4 6.5C3.9 8.2 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.1-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {paths[name]}
    </svg>
  )
}

export function Spinner({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} />
}

export function Field({
  id,
  label,
  optional,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  optional?: string
  error?: string
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13.5px] font-semibold text-[#1F3628]">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-[#2E4A37]/55">{optional}</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-[#B2432F]">
          <Icon name="alert" size={15} className="mt-[1px] shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[12.5px] leading-5 text-[#2E4A37]/65">{hint}</p>
      ) : null}
    </div>
  )
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (value: boolean) => void; label: string; hint?: string }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-[14px] transition ${checked ? "border-[#2E4A37] bg-[#E6ECE3]" : "border-[#2E4A37]/15 bg-white hover:border-[#2E4A37]/40"}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#2E4A37]" />
      <span>
        <span className="font-semibold text-[#1F3628]">{label}</span>
        {hint ? <span className="mt-0.5 block text-[12.5px] text-[#2E4A37]/65">{hint}</span> : null}
      </span>
    </label>
  )
}

export function Chips({ options, value, onChange, label }: { options: readonly (readonly [string, string])[]; value: string[]; onChange: (value: string[]) => void; label: (text: string) => string }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map(([code, text]) => {
        const on = value.includes(code)
        return (
          <button
            key={code}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== code) : [...value, code])}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${on ? "border-[#2E4A37] bg-[#2E4A37] text-[#F7F2E8]" : "border-[#2E4A37]/20 bg-white text-[#2E4A37]/80 hover:border-[#2E4A37]/50"}`}
          >
            {on ? "✓ " : ""}
            {label(text)}
          </button>
        )
      })}
    </div>
  )
}

export function Notice({ tone, children }: { tone: "error" | "ok" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-[#C0503C]/30 bg-[#FBEDE9] text-[#7A2E20]",
    ok: "border-[#2E4A37]/20 bg-[#E6ECE3] text-[#1F3628]",
    info: "border-[#265E8E]/20 bg-[#EAF1F7] text-[#1B3F5E]",
  }
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[14px] ${styles[tone]}`}>
      <Icon name={tone === "error" ? "alert" : "check"} size={18} className="mt-[1px] shrink-0" />
      <div>{children}</div>
    </div>
  )
}
