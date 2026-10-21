import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { memberLimitFor } from "./vitrinaki-plans"

// How many people a seller's plan allows and how many seats are taken:
// current members plus invites still pending (not accepted, not expired).
export async function teamSeats(scope: MedusaContainer, sellerId: string) {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const [{ data: sellers }, { data: members }, { data: invites }] = await Promise.all([
    query.graph({ entity: "seller", fields: ["id", "metadata"], filters: { id: sellerId } }),
    query.graph({ entity: "seller_member", fields: ["id"], filters: { seller_id: sellerId } }),
    query.graph({ entity: "member_invite", fields: ["id", "expires_at"], filters: { seller_id: sellerId, accepted: false } }),
  ])
  const seller = sellers?.[0] as any
  if (!seller) return null
  const now = Date.now()
  const pending = (invites || []).filter((invite: any) => !invite.expires_at || new Date(invite.expires_at).getTime() > now).length
  return {
    limit: memberLimitFor(seller.metadata?.vitrinaki_subscription, now),
    members: (members || []).length,
    pending,
  }
}
