import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { decideCardPayment, STRIPE_CONNECT_METADATA_KEY, type CardPaymentDecision } from "./stripe-connect"

// Whether a cart can be paid by card on its shop's Stripe account. Pass the
// cart id, or the id of the cart's payment collection.
export async function cardPaymentForCart(
  scope: MedusaContainer,
  ref: { cartId?: string; paymentCollectionId?: string }
): Promise<CardPaymentDecision> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  let cartId = ref.cartId
  if (!cartId && ref.paymentCollectionId) {
    const { data } = await query.graph({
      entity: "cart_payment_collection",
      fields: ["cart_id"],
      filters: { payment_collection_id: ref.paymentCollectionId },
    })
    cartId = (data?.[0] as any)?.cart_id
  }
  if (!cartId) return decideCardPayment([], {})

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "items.id", "items.offer.seller_id"],
    filters: { id: cartId },
  })
  const sellerIds = ((carts?.[0] as any)?.items || []).map((item: any) => item?.offer?.seller_id)
  const unique = Array.from(new Set(sellerIds.filter(Boolean))) as string[]
  if (unique.length !== 1) return decideCardPayment(sellerIds, {})

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id", "metadata"],
    filters: { id: unique },
  })
  const connectBySeller = Object.fromEntries(
    (sellers || []).map((seller: any) => [seller.id, seller.metadata?.[STRIPE_CONNECT_METADATA_KEY] || null])
  )
  return decideCardPayment(sellerIds, connectBySeller)
}
