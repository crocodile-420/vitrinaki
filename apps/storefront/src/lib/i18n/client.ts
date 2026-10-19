"use client"

import { useEffect, useState } from "react"

import { LANG_COOKIE, isLang, translator, type Lang } from "./vitrinaki"

// Client components outside the server-rendered pages read the language
// straight from the cookie the LanguageSwitcher sets.
export function useTranslator() {
  const [lang, setLang] = useState<Lang>("el")
  useEffect(() => {
    const value = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]*)`))?.[1]
    if (isLang(value)) setLang(value)
  }, [])
  return { lang, tr: translator(lang) }
}
