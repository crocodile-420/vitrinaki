import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Public directory of published Vitrinaki websites, used by the homepage.
// Same visibility rules as /store/vitrinaki/storefronts/:handle.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "handle", "description", "logo", "banner", "metadata"],
  })

  const now = Date.now()
  const storefronts = (data as any[])
    .filter((seller) => {
      const storefront = seller.metadata?.vitrinaki_storefront
      const subscription = seller.metadata?.vitrinaki_subscription
      if (!storefront?.isPublished || !subscription) return false
      if (!["active", "trialing"].includes(String(subscription.status))) return false
      const promoExpired =
        subscription.source === "promo" &&
        Boolean(subscription.currentPeriodEnd) &&
        new Date(String(subscription.currentPeriodEnd)).getTime() < now
      return !promoExpired
    })
    .map((seller) => {
      const storefront = seller.metadata.vitrinaki_storefront
      return {
        handle: seller.handle,
        storeName: storefront.storeName || seller.name,
        tagline: storefront.tagline || "",
        description: storefront.description || seller.description || "",
        template: storefront.template || "atelier",
        palette: storefront.palette || "forest",
        businessType: seller.metadata?.vitrinaki_profile?.businessType || null,
        logo: seller.logo || null,
        banner: seller.banner || null,
        customDomain: storefront.domainStatus === "verified" ? storefront.customDomain || "" : "",
        publishedAt: storefront.publishedAt || null,
      }
    })
    .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")))

  return res.json({ storefronts })
}
