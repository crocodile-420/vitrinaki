import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

import { planFeaturesFor } from "./vitrinaki-plans"

// Space a shop uses for the photos and files it uploads in the Studio (Mercur's
// /vendor/uploads), counted per seller in metadata.vitrinaki_storage and capped
// by the plan (PLAN_FEATURES.storageGb). A server-owned key: only the upload
// middleware writes it.
export const STORAGE_KEY = "vitrinaki_storage"
const GB = 1024 ** 3

export const storageUsedBytes = (metadata: Record<string, any> | null | undefined) => {
  const used = Number(metadata?.[STORAGE_KEY]?.usedBytes)
  return Number.isFinite(used) && used > 0 ? used : 0
}

export const storageLimitBytes = (subscription: any, now = Date.now()) => planFeaturesFor(subscription, now).storageGb * GB

export const storageView = (metadata: Record<string, any> | null | undefined) => ({
  usedBytes: storageUsedBytes(metadata),
  limitBytes: storageLimitBytes(metadata?.vitrinaki_subscription),
})

export const wouldExceedStorage = (usedBytes: number, addingBytes: number, limitBytes: number) => usedBytes + Math.max(0, addingBytes) > limitBytes

export const storageLimitMessage = (limitBytes: number) =>
  `Γέμισε ο χώρος του πακέτου σου (${Math.round(limitBytes / GB)} GB). Αναβάθμισε για περισσότερο χώρο.`

export async function addStorageUsage(scope: MedusaContainer, sellerId: string, bytes: number) {
  if (!(bytes > 0)) return
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "seller", fields: ["id", "metadata"], filters: { id: sellerId } })
  const seller = data?.[0] as any
  if (!seller) return
  const metadata = {
    ...(seller.metadata || {}),
    [STORAGE_KEY]: { usedBytes: storageUsedBytes(seller.metadata) + bytes, updatedAt: new Date().toISOString() },
  }
  await updateSellersWorkflow(scope).run({ input: { selector: { id: sellerId }, update: { metadata } } })
}
