import type { Metadata } from "next"

import { PremiumCategory } from "@/components/sections/Premium/PremiumCategory"
import { formatMoney, getPublicPricing } from "@/lib/data/vitrinaki-plans"
import { getTranslator } from "@/lib/i18n/server"
import { startHref } from "@/lib/vitrinaki-links"

// «Premium»: the category of motion templates. The glass entrance opens onto
// the gallery; every template has a live demo in public/premium/demo.html.

// The faces the gallery cards are set in, the same ones the demos use.
const FONTS = "https://fonts.googleapis.com/css2?family=Commissioner:wght@400;500;600;700;800&family=Noto+Serif+Display:ital,wght@0,500;0,700;1,400&family=Piazzolla:ital,wght@0,600;0,800;1,500&family=Sofia+Sans:wght@400;600;800&family=Sofia+Sans+Extra+Condensed:wght@700;900&family=Comfortaa:wght@600;700&family=Literata:ital,wght@0,400;0,600;1,500&family=EB+Garamond:ital,wght@0,500;0,600;1,400&family=Roboto+Slab:wght@600;800&family=GFS+Didot&family=Inter:wght@400;500;600;700&family=Advent+Pro:wght@500;700;800&family=Alegreya+Sans:wght@400;700;800&display=swap"

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTranslator()
  return {
    title: tr("Premium πρότυπα με κίνηση"),
    description: tr("16 premium πρότυπα με κίνηση, 3D και αλληλεπίδραση, για κάθε είδος μικρής επιχείρησης. Δες τα live και διάλεξε αυτό που σου ταιριάζει."),
  }
}

export default async function PremiumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { tr } = await getTranslator()
  // The add-on's prices come from Stripe; without them the page names no amount.
  const { premium } = await getPublicPricing()
  const price = premium?.month
    ? `${formatMoney(premium.month.amount, premium.month.currency)}${tr("/μήνα")}${premium.activation ? ` + ${formatMoney(premium.activation.amount, premium.activation.currency)} ${tr("εφάπαξ")}` : ""}`
    : null
  return (
    <main className="overflow-x-clip bg-[#050507]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <PremiumCategory startHref={startHref(locale)} price={price} />
    </main>
  )
}
