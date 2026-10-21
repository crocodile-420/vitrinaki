import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

import { MAX_PROMOTED_PER_SHOP, PROMOTED_KEY, isStorefrontVisible, promotedIds } from "../../../../lib/vitrinaki-promoted"

// Every shop with a Vitrinaki website, its products (one row per product it
// sells) and the ones promoted on the homepage.
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "handle", "metadata"],
    pagination: { take: 500 },
  })
  const shops = (sellers as any[]).filter((seller) => seller.metadata?.vitrinaki_storefront)
  if (!shops.length) return res.json({ shops: [] })

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: ["seller_id", "product_id", "product.id", "product.title", "product.thumbnail", "product.status"],
    filters: { seller_id: shops.map((shop) => shop.id) },
    pagination: { take: 5000 },
  })

  const productsBySeller = new Map<string, Map<string, { id: string; title: string; thumbnail: string | null; status: string }>>()
  for (const offer of offers as any[]) {
    if (!offer.product?.id) continue
    const products = productsBySeller.get(offer.seller_id) || new Map()
    products.set(offer.product.id, {
      id: offer.product.id,
      title: offer.product.title || "",
      thumbnail: offer.product.thumbnail || null,
      status: offer.product.status || "",
    })
    productsBySeller.set(offer.seller_id, products)
  }

  const now = Date.now()
  return res.json({
    maxPerShop: MAX_PROMOTED_PER_SHOP,
    shops: shops.map((seller) => ({
      sellerId: seller.id,
      handle: seller.handle,
      storeName: seller.metadata.vitrinaki_storefront.storeName || seller.name,
      isVisible: isStorefrontVisible(seller, now),
      promoted: promotedIds(seller.metadata),
      products: Array.from(productsBySeller.get(seller.id)?.values() || []),
    })),
  })
}

// Replaces one shop's promoted list. Ids the shop does not sell are dropped.
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as { sellerId?: unknown; productIds?: unknown }
  const sellerId = typeof body.sellerId === "string" ? body.sellerId : ""
  if (!sellerId || !Array.isArray(body.productIds)) {
    return res.status(400).json({ message: "Χρειάζεται κατάστημα και λίστα προϊόντων." })
  }
  const wanted = Array.from(new Set(body.productIds.filter((id): id is string => typeof id === "string")))
  if (wanted.length > MAX_PROMOTED_PER_SHOP) {
    return res.status(400).json({ message: `Έως ${MAX_PROMOTED_PER_SHOP} προϊόντα ανά κατάστημα.` })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "seller", fields: ["id", "metadata"], filters: { id: sellerId } })
  const seller = data?.[0] as any
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε το κατάστημα." })

  const { data: offers } = wanted.length
    ? await query.graph({ entity: "offer", fields: ["product_id"], filters: { seller_id: sellerId, product_id: wanted } })
    : { data: [] }
  const sold = new Set((offers as any[]).map((offer) => offer.product_id))
  const productIds = wanted.filter((id) => sold.has(id))

  const metadata = { ...(seller.metadata || {}) }
  if (productIds.length) metadata[PROMOTED_KEY] = productIds
  else delete metadata[PROMOTED_KEY]
  await updateSellersWorkflow(req.scope).run({ input: { selector: { id: sellerId }, update: { metadata } } })

  return res.json({ sellerId, promoted: productIds })
}
