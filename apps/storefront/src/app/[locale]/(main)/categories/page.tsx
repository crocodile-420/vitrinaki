import { redirect } from "next/navigation"

// Vitrinaki has no shared marketplace catalogue; send visitors to the shops.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}#vitrina`)
}
