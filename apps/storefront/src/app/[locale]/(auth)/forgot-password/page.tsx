import { getTranslator } from "@/lib/i18n/server"
import { ForgotPasswordForm } from "@/components/molecules/ForgotPasswordForm/ForgotPasswordForm"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTranslator()
  return {
  title: tr("Ξέχασες τον κωδικό σου;"),
  description: tr("Όρισε νέο κωδικό"),
  robots: { index: false, follow: false },
  }
}

export default function ForgotPasswordPage() {

  return (
    <main className="container">
      <ForgotPasswordForm />
    </main>
  )
}
