"use client"

import { useTranslator } from "@/lib/i18n/client"
import { Card } from "@/components/atoms"

export const OrderTrack = ({ order }: { order: any }) => {
  const { tr } = useTranslator()
  if (!order.fulfillments[0]?.labels?.length) return null

  const labels = order.fulfillments[0]?.labels

  return (
    <div>
      <h2 className="text-primary label-lg uppercase">{tr("Παρακολούθηση παραγγελίας")}</h2>
      <ul className="mt-4">
        {labels.map((item: any) => (
          <li key={item.id}>
            <a href={item.tracking_number} target="_blank">
              <Card className="px-4 hover:bg-secondary/30">
                {item.tracking_number}
              </Card>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
