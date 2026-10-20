import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ShopRegistration } from "@/components/sections/ShopRegistration/ShopRegistration"
import { readStartSession } from "@/lib/data/vitrinaki-start"
import { getTranslator } from "@/lib/i18n/server"
import { startHref } from "@/lib/vitrinaki-links"

// «Το κατάστημά σου»: after the sign-up the seller completes the whole shop
// profile here, on Vitrinaki, then activates and publishes it. Without a
// session the page shows the seller login. Products stay in the Studio.

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTranslator()
  return {
    title: tr("Το προφίλ του καταστήματός σου"),
    robots: { index: false, follow: false },
  }
}

export default async function ShopRegistrationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ ref?: string | string[] }>
}) {
  const { locale } = await params
  const session = await readStartSession()
  // A referral link (?ref=CODE) is for someone without a shop yet: sign-up.
  const ref = (await searchParams).ref
  const referralCode = (Array.isArray(ref) ? ref[0] : ref || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 16)
  if (referralCode && !session) redirect(`${startHref(locale)}?ref=${encodeURIComponent(referralCode)}`)

  return (
    <main className="min-h-[calc(100svh-5rem)] bg-[#F7F2E8] text-[#2E4A37]">
      <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 sm:px-8 sm:pt-10 lg:px-12">
        <ShopRegistration
          locale={locale}
          session={session ? { name: session.name, handle: session.handle, email: session.email } : null}
          startHref={startHref(locale)}
        />
      </div>
    </main>
  )
}
