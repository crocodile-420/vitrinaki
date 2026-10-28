import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { isStorefrontVisible, promotedIds, promotionTier } from "../../../../lib/vitrinaki-promoted"

// The homepage marketplace: shops with promoted products whose plan includes
// homepage promotion (Pro and up), Επιχείρηση first, then featured shops.
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
    .filter((seller) => isStorefrontVisible(seller, now) && promotionTier(seller, now) !== "none" && promotedIds(seller.metadata).length)
    .map((seller) => {
      const storefront = seller.metadata.vitrinaki_storefront
      return {
        sellerId: seller.id,
        handle: seller.handle,
        storeName: storefront.storeName || seller.name,
        palette: storefront.palette || "forest",
        customDomain: storefront.domainStatus === "verified" ? storefront.customDomain || "" : "",
        isFeatured: Boolean(seller.is_premium),
        priority: promotionTier(seller, now) === "priority",
        productIds: promotedIds(seller.metadata),
      }
    })
    // Επιχείρηση plan first, then featured shops.
    .sort((a, b) => Number(b.priority) - Number(a.priority) || Number(b.isFeatured) - Number(a.isFeatured))
    .map(({ priority: _priority, ...shop }) => shop)

  return res.json({ shops })
}
