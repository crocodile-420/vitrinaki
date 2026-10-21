import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { isStorefrontVisible, promotedIds } from "../../../../lib/vitrinaki-promoted"

// The homepage marketplace: shops with promoted products, featured shops first.
// Returns only ids and the shop's public card details; the storefront loads
// prices and stock through /store/offers.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "handle", "is_premium", "metadata"],
  })

  const now = Date.now()
  const shops = (data as any[])
    .filter((seller) => isStorefrontVisible(seller, now) && promotedIds(seller.metadata).length)
    .map((seller) => {
      const storefront = seller.metadata.vitrinaki_storefront
      return {
        sellerId: seller.id,
        handle: seller.handle,
        storeName: storefront.storeName || seller.name,
        palette: storefront.palette || "forest",
        customDomain: storefront.domainStatus === "verified" ? storefront.customDomain || "" : "",
        isFeatured: Boolean(seller.is_premium),
        productIds: promotedIds(seller.metadata),
      }
    })
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))

  return res.json({ shops })
}
