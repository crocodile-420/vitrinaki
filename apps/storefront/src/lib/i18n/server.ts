import { cookies } from "next/headers"

import { LANG_COOKIE, isLang, translator, type Lang } from "./vitrinaki"

export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value
  return isLang(value) ? value : "el"
}

export async function getTranslator() {
  const lang = await getLang()
  return { lang, tr: translator(lang) }
}
