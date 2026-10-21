import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

import {
  cardPaymentsConfigured,
  connectStatusOf,
  STRIPE_CONNECT_METADATA_KEY,
  type StoredConnectAccount,
} from "./stripe-connect"

export async function loadSeller(scope: MedusaContainer, sellerId: string) {
  const { data } = await scope.resolve(ContainerRegistrationKeys.QUERY).graph({
    entity: "seller",
    fields: ["id", "name", "handle", "email", "metadata"],
    filters: { id: sellerId },
  })
  return (data?.[0] as any) || null
}

// Merge `patch` into seller.metadata.vitrinaki_stripe_connect, keeping the
// rest of the metadata as it is.
export async function saveConnectState(scope: MedusaContainer, seller: any, patch: StoredConnectAccount) {
  const current = (seller.metadata?.[STRIPE_CONNECT_METADATA_KEY] || {}) as StoredConnectAccount
  const next: StoredConnectAccount = { ...current, ...patch, updatedAt: new Date().toISOString() }
  const metadata = { ...(seller.metadata || {}), [STRIPE_CONNECT_METADATA_KEY]: next }
  await updateSellersWorkflow(scope).run({ input: { selector: { id: seller.id }, update: { metadata } } })
  seller.metadata = metadata
  return next
}

// What the Studio's «Πληρωμές με κάρτα» section shows.
export function connectView(stored: StoredConnectAccount | null | undefined) {
  return {
    configured: cardPaymentsConfigured(),
    status: connectStatusOf(stored),
    accountId: stored?.accountId || null,
    chargesEnabled: Boolean(stored?.chargesEnabled),
    payoutsEnabled: Boolean(stored?.payoutsEnabled),
    detailsSubmitted: Boolean(stored?.detailsSubmitted),
    requirementsDue: (stored?.requirementsDue || []).length,
    disabledReason: stored?.disabledReason || null,
    updatedAt: stored?.updatedAt || null,
  }
}
