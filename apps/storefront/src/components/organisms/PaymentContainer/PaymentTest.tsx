"use client"

import { useTranslator } from "@/lib/i18n/client"
import { Badge } from "@medusajs/ui"

const PaymentTest = ({ className }: { className?: string }) => {
  const { tr } = useTranslator()
  return (
    <Badge color="orange" className={className}>
      <span className="font-semibold px-4">{tr("Προσοχή:")}</span>{" "}
      {tr("Μόνο για δοκιμή.")}
    </Badge>
  )
}

export default PaymentTest
