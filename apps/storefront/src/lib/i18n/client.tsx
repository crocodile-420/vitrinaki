"use client"

import { createContext, useContext, type ReactNode } from "react"

import { translator, type Lang } from "./vitrinaki"

// The root layout reads the language cookie on the server and hands it down,
// so client components render in the right language from the first paint.
const LangContext = createContext<Lang>("el")

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext value={lang}>{children}</LangContext>
}

export function useTranslator() {
  const lang = useContext(LangContext)
  return { lang, tr: translator(lang) }
}
