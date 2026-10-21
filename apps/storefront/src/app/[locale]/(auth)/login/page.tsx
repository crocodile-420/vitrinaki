import { getTranslator } from "@/lib/i18n/server"
import { LoginForm } from "@/components/molecules"
import { retrieveCustomer } from "@/lib/data/customer"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTranslator()
  return {
  title: tr("Σύνδεση"),
  robots: { index: false, follow: false },
  }
}

export default async function LoginPage() {
  const user = await retrieveCustomer()

  if (user) {
    redirect("/user")
  }

  return <LoginForm />
}

