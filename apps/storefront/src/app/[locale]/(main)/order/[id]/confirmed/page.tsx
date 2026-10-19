import { getTranslator } from "@/lib/i18n/server"
import { OrderConfirmedSection } from "@/components/sections/OrderConfirmedSection/OrderConfirmedSection"
import { retrieveOrder } from "@/lib/data/orders"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}
export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getTranslator()
  return {
  title: tr("Η παραγγελία επιβεβαιώθηκε"),
  description: tr("Η αγορά σου ολοκληρώθηκε με επιτυχία"),
  }
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  return (
    <main className="container">
      <OrderConfirmedSection order={order} />
    </main>
  )
}
