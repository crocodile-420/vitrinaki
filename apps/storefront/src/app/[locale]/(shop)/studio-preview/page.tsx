import type { Metadata } from "next"

import { StudioPreview } from "@/components/shop/StudioPreview"
import { getTranslator } from "@/lib/i18n/server"
import { studioUrl } from "@/lib/vitrinaki-links"

// The Studio editor's live preview. The Studio shows this page in an iframe
// and posts the draft to it; the page renders it with the same ShopView as
// the public shop page. Nothing is loaded until the Studio sends a draft.

export const metadata: Metadata = { title: "Προεπισκόπηση", robots: { index: false, follow: false } }

const origin = (url: string | undefined) => {
  try {
    return url ? new URL(url).origin : ""
  } catch {
    return ""
  }
}

export default async function StudioPreviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { lang } = await getTranslator()
  // Only the Studio may send drafts: its own origin and the backend's (which
  // serves the Studio by default), plus any listed in VITRINAKI_STUDIO_ORIGINS.
  const origins = [
    origin(studioUrl),
    origin(process.env.MEDUSA_BACKEND_URL),
    ...(process.env.VITRINAKI_STUDIO_ORIGINS || "").split(",").map((o) => origin(o.trim())),
  ].filter(Boolean)
  return <StudioPreview locale={locale} lang={lang} origins={Array.from(new Set(origins))} />
}
