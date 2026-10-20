"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"

import { translator, type Lang } from "./vitrinaki"

// The root layout reads the language cookie on the server and hands it down,
// so client components render in the right language from the first paint.
const LangContext = createContext<Lang>("el")

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext value={lang}>{children}</LangContext>
}

export function useTranslator() {
  const lang = useContext(LangContext)
  // Stable per language, so `tr` is safe in hook dependency lists.
  const tr = useMemo(() => translator(lang), [lang])
  return { lang, tr }
}
