import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { publicShopView, type PublicStorefront } from "../../../../../lib/vitrinaki-shop-view"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const handle = String(req.params.handle || "").trim().toLowerCase()
  if (!handle || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(handle)) {
    return res.status(400).json({ message: "Μη έγκυρη διεύθυνση καταστήματος." })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "handle", "description", "email", "phone", "logo", "banner", "status", "metadata"],
    filters: { handle },
  })

  const seller = data?.[0] as any
  const storefront = seller?.metadata?.vitrinaki_storefront as PublicStorefront | undefined
  const subscription = seller?.metadata?.vitrinaki_subscription as { status?: string; source?: string; currentPeriodEnd?: string | null } | undefined

  if (!seller || !storefront?.isPublished) {
    return res.status(404).json({ message: "Το κατάστημα δεν είναι δημοσιευμένο." })
  }

  const promoExpired =
    subscription?.source === "promo" &&
    Boolean(subscription.currentPeriodEnd) &&
    new Date(String(subscription.currentPeriodEnd)).getTime() < Date.now()
  if (!subscription || !["active", "trialing"].includes(String(subscription.status)) || promoExpired) {
    return res.status(404).json({ message: "Το κατάστημα δεν είναι διαθέσιμο αυτή τη στιγμή." })
  }

  return res.json(publicShopView(seller))
}
