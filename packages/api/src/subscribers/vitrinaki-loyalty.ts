import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, OrderWorkflowEvents } from "@medusajs/framework/utils"

import { pointsForAmount, readLoyaltySettings } from "../lib/vitrinaki-loyalty"
import { VITRINAKI_LOYALTY_MODULE } from "../modules/vitrinaki-loyalty"
import type VitrinakiLoyaltyModuleService from "../modules/vitrinaki-loyalty/service"

// Loyalty points per shop. Mercur splits a cart into one order per shop, so
// every order earns in its own shop.
// Only customers with an account earn (a guest checkout creates a customer
// record without one). A canceled order gives its points back.
export default async function vitrinakiLoyaltyHandler({
  event,
  container,
}: SubscriberArgs<{ id: string } | { id: string }[]>) {
  // Mercur's checkout emits order.placed once with every order of the cart.
  const payloads = Array.isArray(event.data) ? event.data : [event.data]
  for (const payload of payloads) {
    if (payload?.id) await handleOrder(event.name, payload.id, container)
  }
}

async function handleOrder(eventName: string, orderId: string, container: SubscriberArgs<unknown>["container"]) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const loyalty = container.resolve<VitrinakiLoyaltyModuleService>(VITRINAKI_LOYALTY_MODULE)

  try {
    if (eventName === OrderWorkflowEvents.CANCELED) {
      const reversed = await loyalty.reverseOrder(orderId)
      if (reversed) logger.info(`vitrinaki-loyalty: took back ${reversed} points of canceled order ${orderId}`)
      return
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "customer_id", "customer.has_account", "item_total", "currency_code", "seller.id", "seller.metadata"],
      filters: { id: orderId },
    })
    const o = order as any
    const seller = Array.isArray(o?.seller) ? o.seller[0] : o?.seller
    if (!o?.customer_id || !o.customer?.has_account || !seller?.id) return
    if (String(o.currency_code || "").toLowerCase() !== "eur") return

    const settings = readLoyaltySettings(seller.metadata)
    if (!settings.enabled) return
    const points = pointsForAmount(o.item_total, settings.pointsPerEuro)
    const awarded = await loyalty.earnForOrder({
      seller_id: seller.id,
      customer_id: o.customer_id,
      order_id: o.id,
      points,
    })
    if (awarded) logger.info(`vitrinaki-loyalty: ${awarded} points for order ${orderId}`)
  } catch (error) {
    logger.warn(
      `vitrinaki-loyalty: could not update points for order ${orderId}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const config: SubscriberConfig = {
  event: [OrderWorkflowEvents.PLACED, OrderWorkflowEvents.CANCELED],
  context: { subscriberId: "vitrinaki-loyalty" },
}
