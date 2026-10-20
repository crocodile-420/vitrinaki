import { getTranslator } from "@/lib/i18n/server"
import { retrieveOrderTracking } from "@/lib/data/orders"
import { courierName, safeTrackingUrl } from "@/lib/helpers/couriers"

// Tracking numbers the shop entered when it shipped the order, with a link to
// the courier's public tracking page where one exists (built by the backend,
// see packages/api/src/workflows/hooks/courier-tracking.ts).
export const OrderParcelTracking = async ({ orderId }: { orderId: string }) => {
  const shipments = await retrieveOrderTracking(orderId)
  if (!shipments.length) return null
  const { tr } = await getTranslator()

  return (
    <div className="p-4 border-b" data-testid="order-tracking">
      <p className="label-md text-secondary uppercase mb-2">{tr("Παρακολούθηση αποστολής")}</p>
      <ul className="flex flex-col gap-2">
        {shipments.flatMap((shipment) => {
          const courier = courierName(shipment.courier)
          return shipment.labels.map((label) => {
            const url = safeTrackingUrl(label.tracking_url)
            return (
              <li key={`${shipment.fulfillment_id}-${label.tracking_number}`} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {courier ? (
                  <span className="inline-flex items-center rounded-full border border-[#2E4A37]/25 bg-[#2E4A37]/[0.07] px-2 py-0.5 text-[11px] font-semibold text-[#2E4A37]">
                    {courier}
                  </span>
                ) : null}
                <span className="text-primary">
                  {tr("Αριθμός αποστολής")}: <span className="font-semibold">{label.tracking_number}</span>
                </span>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-md text-action-on-secondary underline underline-offset-2"
                    data-testid="tracking-link"
                  >
                    {tr("Παρακολούθηση στη μεταφορική")} ↗
                  </a>
                ) : null}
              </li>
            )
          })
        })}
      </ul>
    </div>
  )
}
