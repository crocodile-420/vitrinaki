import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { planFeaturesFor } from "./vitrinaki-plans"

// Products a shop sells are the distinct products behind its offers (an offer
// is per variant). The plan caps how many there can be (PLAN_FEATURES.products).

// How many distinct products there would be after adding these ones.
export function productsAfter(current: Iterable<string>, adding: Iterable<string>) {
  const all = new Set(current)
  for (const id of adding) if (id) all.add(id)
  return all.size
}

// null when the request may go ahead, otherwise the plan's limit.
export async function exceedsProductLimit(
  scope: MedusaContainer,
  sellerId: string,
  adding: { variantIds?: string[]; newProducts?: number }
): Promise<number | null> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: sellers } = await query.graph({ entity: "seller", fields: ["id", "metadata"], filters: { id: sellerId } })
  const seller = sellers?.[0] as any
  if (!seller) return null
  const limit = planFeaturesFor(seller.metadata?.vitrinaki_subscription).products
  if (limit === null) return null

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: ["id", "product_id"],
    filters: { seller_id: sellerId },
    pagination: { take: 100000 },
  })
  const current = (offers || []).map((offer: any) => String(offer.product_id || "")).filter(Boolean)

  const variantIds = (adding.variantIds || []).filter(Boolean)
  const { data: variants } = variantIds.length
    ? await query.graph({ entity: "product_variant", fields: ["id", "product_id"], filters: { id: variantIds } })
    : { data: [] as any[] }
  const total = productsAfter(current, (variants || []).map((variant: any) => String(variant.product_id || ""))) + (adding.newProducts || 0)
  return total > limit ? limit : null
}
