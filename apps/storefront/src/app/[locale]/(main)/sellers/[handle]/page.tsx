import { redirect } from "next/navigation"

// Each seller is a shop with its own storefront page.
export default async function SellerPage({ params }: { params: Promise<{ handle: string; locale: string }> }) {
  const { handle, locale } = await params
  redirect(`/${locale}/store/${handle}`)
}
