import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Each shop's Studio shows only that shop's own products. Mercur's own rule is
// a shared marketplace catalog: every seller sees every published product that
// is not assigned to someone else, so a brand-new shop opened a Studio already
// full of Vitrinaki's and the other shops' products. Vitrinaki is a SaaS where
// every shop runs its own store, so a shop's products are only:
//   - the products it created (Mercur records the creator on the product's
//     first change, PRODUCT_ADD),
//   - the products the platform assigned to it (product_seller link),
//   - the products it already sells (its offers), so no existing shop loses a
//     product it has been selling.

// An id no product has: an empty id list must match nothing, not everything.
export const NO_PRODUCT = "prod_vitrinaki_none"

// The product ids from the three sources, without blanks or repeats.
export function shopProductIdsFrom(sources: { created?: unknown[]; assigned?: unknown[]; offered?: unknown[] }) {
  const ids = new Set<string>()
  for (const list of [sources.created, sources.assigned, sources.offered]) {
    for (const id of list || []) if (typeof id === "string" && id) ids.add(id)
  }
  return [...ids]
}

// A query filter value for "one of these products", never an empty list.
export function productIdFilter(ids: string[]) {
  return ids.length ? ids : [NO_PRODUCT]
}

export async function shopProductIds(scope: MedusaContainer, sellerId: string): Promise<string[]> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const all = { take: 100000 }
  const [created, assigned, offered] = await Promise.all([
    query.graph({
      entity: "product_change_action",
      fields: ["product_id"],
      filters: { action: "PRODUCT_ADD", product_change: { created_by: sellerId } } as any,
      pagination: all,
    }),
    query.graph({ entity: "product_seller", fields: ["product_id"], filters: { seller_id: sellerId } as any, pagination: all }),
    query.graph({ entity: "offer", fields: ["product_id"], filters: { seller_id: sellerId } as any, pagination: all }),
  ])
  const ids = (rows: any[]) => (rows || []).map((row) => row?.product_id)
  return shopProductIdsFrom({ created: ids(created.data), assigned: ids(assigned.data), offered: ids(offered.data) })
}

// The products behind these variants that are not the shop's own.
export async function foreignProductsOfVariants(scope: MedusaContainer, sellerId: string, variantIds: string[]) {
  const wanted = variantIds.filter(Boolean)
  if (!wanted.length) return []
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const [{ data: variants }, own] = await Promise.all([
    query.graph({ entity: "product_variant", fields: ["id", "product_id"], filters: { id: wanted } }),
    shopProductIds(scope, sellerId),
  ])
  const mine = new Set(own)
  // A variant that does not exist is left to Mercur's own validation.
  const products = (variants || []).map((variant: any) => String(variant.product_id || "")).filter((id) => id && !mine.has(id))
  return [...new Set(products)]
}
