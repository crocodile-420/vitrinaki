"use client"

import { useRouter } from "next/navigation"

import { LANG_COOKIE, LANGS, type Lang } from "@/lib/i18n/vitrinaki"

const labels: Record<Lang, string> = { el: "ΕΛ", en: "EN" }

export function LanguageSwitcher({ lang, label, className = "" }: { lang: Lang; label: string; className?: string }) {
  const router = useRouter()
  const choose = (next: Lang) => {
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }
  return (
    <div role="group" aria-label={label} className={`inline-flex rounded-full border border-current/20 p-0.5 text-xs font-bold ${className}`}>
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => choose(code)}
          aria-pressed={code === lang}
          className={`rounded-full px-2.5 py-1 transition ${code === lang ? "bg-current/10" : "opacity-60 hover:opacity-100"}`}
        >
          {labels[code]}
        </button>
      ))}
    </div>
  )
}
