import { getTranslator } from "@/lib/i18n/server"
import { RegisterForm } from "@/components/molecules"
import { retrieveCustomer } from "@/lib/data/customer"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTranslator()
  return {
  title: tr("Εγγραφή"),
  robots: { index: false, follow: false },
  }
}

export default async function RegisterPage() {
  const user = await retrieveCustomer()

  if (user) {
    redirect("/user")
  }

  return <RegisterForm />
}

