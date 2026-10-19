"use client"

import { useTranslator } from "@/lib/i18n/client"
import { Button } from "@/components/atoms"
import Link from "next/link"

export const OrderReturn = ({ order }: { order: any }) => {
  const { tr } = useTranslator()
  return (
    <div className="md:flex justify-between items-center">
      <div className="mb-4 md:mb-0">
        <h2 className="text-primary label-lg uppercase">{tr("Επιστροφή παραγγελίας")}</h2>
        <p className="text-secondary label-md max-w-sm">
          {tr("Από τη στιγμή που θα παραλάβεις την παραγγελία σου, έχεις 14 ημέρες για να επιστρέψεις προϊόντα.")}{" "}
          {tr("Μάθε περισσότερα για τις")}{" "}
          <Link href="/returns" className="underline">
            {tr("επιστροφές και επιστροφές χρημάτων")}
          </Link>
          .
        </p>
      </div>
      <Link href={`/user/orders/${order.id}/return`}>
        <Button variant="tonal" className="uppercase" onClick={() => null}>
          {tr("Επιστροφή")}
        </Button>
      </Link>
    </div>
  )
}
