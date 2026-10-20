import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { publicLoyalty, readLoyaltySettings, type LoyaltySettings } from "./vitrinaki-loyalty"

// Cart metadata key for reward codes taken in the cart that could not be
// applied yet (free shipping before a shipping method is chosen). The
// storefront applies them once the customer picks a shipping method.
export const PENDING_CODES_KEY = "vitrinaki_loyalty_codes"

export type LoyaltyShop = {
  id: string
  name: string
  handle: string
  settings: LoyaltySettings
}

// Shop name/handle and loyalty rules, and nothing else of the seller: the
// rest of seller.metadata never leaves this helper.
export async function loadLoyaltyShops(scope: MedusaContainer, sellerIds: string[]): Promise<Map<string, LoyaltyShop>> {
  const ids = Array.from(new Set(sellerIds.filter(Boolean)))
  const shops = new Map<string, LoyaltyShop>()
  if (!ids.length) return shops
  const { data } = await scope.resolve(ContainerRegistrationKeys.QUERY).graph({
    entity: "seller",
    fields: ["id", "name", "handle", "metadata"],
    filters: { id: ids },
  })
  for (const seller of (data || []) as any[]) {
    shops.set(seller.id, {
      id: seller.id,
      name: String(seller.name || ""),
      handle: String(seller.handle || ""),
      settings: readLoyaltySettings(seller.metadata),
    })
  }
  return shops
}

export const shopView = (shop: LoyaltyShop) => ({
  seller: { id: shop.id, name: shop.name, handle: shop.handle },
  ...publicLoyalty(shop.settings),
})

export type LoyaltyCart = {
  id: string
  customer_id: string | null
  seller_id: string | null
  item_total: number
  promo_codes: string[]
  metadata: Record<string, unknown>
}

// The cart's shop (null unless the whole cart is from one shop), its item
// total and the codes already applied.
export async function loadLoyaltyCart(scope: MedusaContainer, cartId: string): Promise<LoyaltyCart | null> {
  const { data } = await scope.resolve(ContainerRegistrationKeys.QUERY).graph({
    entity: "cart",
    fields: ["id", "customer_id", "item_total", "metadata", "promotions.code", "items.id", "items.offer.seller_id"],
    filters: { id: cartId },
  })
  const cart = data?.[0] as any
  if (!cart) return null
  const sellerIds = Array.from(new Set((cart.items || []).map((item: any) => item?.offer?.seller_id).filter(Boolean))) as string[]
  return {
    id: cart.id,
    customer_id: cart.customer_id || null,
    seller_id: sellerIds.length === 1 ? sellerIds[0] : null,
    item_total: Number(cart.item_total ?? 0),
    promo_codes: (cart.promotions || []).map((p: any) => p?.code).filter(Boolean),
    metadata: (cart.metadata as Record<string, unknown>) || {},
  }
}

export const pendingCodes = (metadata: Record<string, unknown> | null | undefined): string[] => {
  const list = metadata?.[PENDING_CODES_KEY]
  return Array.isArray(list) ? list.filter((code): code is string => typeof code === "string") : []
}
