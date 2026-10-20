import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createOrderShipmentWorkflow } from "@medusajs/medusa/core-flows"

import {
  COURIER_METADATA_KEY,
  TRACKING_METADATA_KEY,
  courierFromMetadata,
  trackingForCustomer,
  withCourierTrackingUrls,
} from "../../lib/greek-couriers"

// When a shop marks a fulfillment as shipped with a tracking number and the
// order's shipping option is a Greek courier (see src/lib/greek-couriers.ts),
// add the courier's public tracking link to each label the shop left without
// one, and record the courier on the fulfillment so the storefront can name
// it. Runs inside the shipment workflow, so the Studio's response already
// carries the link. Never fails the shipment: a missing link is not worth
// rolling back a shipment the shop has already handed to the courier.
createOrderShipmentWorkflow.hooks.shipmentCreated(async ({ shipment }, { container }) => {
  const fulfillmentId = (shipment as { id?: string } | undefined)?.id
  if (!fulfillmentId) return
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [fulfillment],
    } = await query.graph({
      entity: "fulfillment",
      fields: ["id", "metadata", "labels.*", "shipping_option.metadata"],
      filters: { id: fulfillmentId },
    })
    const courier = courierFromMetadata((fulfillment as any)?.shipping_option?.metadata)
    if (!fulfillment || !courier) return

    const labels = withCourierTrackingUrls(courier.code, (fulfillment as any).labels)
    const metadata = (fulfillment as any).metadata || {}
    // The store order API does not expose fulfillment labels, so the
    // customer-facing tracking numbers and links are copied to metadata.
    const tracking = trackingForCustomer(labels ?? (fulfillment as any).labels)
    const needsMetadata =
      metadata[COURIER_METADATA_KEY] !== courier.code ||
      JSON.stringify(metadata[TRACKING_METADATA_KEY] ?? []) !== JSON.stringify(tracking)
    if (!labels && !needsMetadata) return

    const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
    await fulfillmentModule.updateFulfillment(fulfillmentId, {
      ...(labels
        ? {
            labels: labels.map((label) => ({
              id: label.id!,
              tracking_number: label.tracking_number ?? "",
              tracking_url: label.tracking_url ?? "",
              label_url: label.label_url ?? "",
            })),
          }
        : {}),
      metadata: { ...metadata, [COURIER_METADATA_KEY]: courier.code, [TRACKING_METADATA_KEY]: tracking },
    } as any)
  } catch (error) {
    logger.warn(
      `courier-tracking: could not add the tracking link to fulfillment ${fulfillmentId}: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
})
