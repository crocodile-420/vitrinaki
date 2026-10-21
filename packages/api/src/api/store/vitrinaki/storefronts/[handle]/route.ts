import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { publicProfileView } from "../../../../../lib/vitrinaki-profile"

type PublicStorefront = {
  handle?: string
  storeName?: string
  tagline?: string
  description?: string
  template?: "atelier" | "local" | "services"
  palette?: "forest" | "terracotta" | "ocean" | "plum"
  contactEmail?: string
  contactPhone?: string
  isPublished?: boolean
  customDomain?: string
  domainStatus?: string
  sections?: unknown[]
}

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

  return res.json({
    seller: {
      id: seller.id,
      name: seller.name,
      handle: seller.handle,
      description: seller.description,
      email: seller.email,
      phone: seller.phone,
      logo: seller.logo,
      banner: seller.banner,
    },
    storefront: {
      handle: seller.handle,
      storeName: storefront.storeName || seller.name,
      tagline: storefront.tagline || "Καλώς ήρθες στο κατάστημά μας",
      description: storefront.description || seller.description || "",
      template: storefront.template || "atelier",
      palette: storefront.palette || "forest",
      contactEmail: storefront.contactEmail || seller.email || "",
      contactPhone: storefront.contactPhone || seller.phone || "",
      customDomain: storefront.domainStatus === "verified" ? storefront.customDomain || "" : "",
      domainStatus: storefront.domainStatus || "not_configured",
      sections: Array.isArray(storefront.sections) ? storefront.sections.slice(0, 8).map((section: any, index: number) => ({
        id: typeof section.id === "string" ? section.id.slice(0, 80) : `section-${index + 1}`,
        type: ["text", "image", "feature"].includes(String(section.type)) ? section.type : "text",
        title: typeof section.title === "string" ? section.title.slice(0, 160) : "",
        body: typeof section.body === "string" ? section.body.slice(0, 1600) : "",
        imageUrl: typeof section.imageUrl === "string" ? section.imageUrl : null,
      })) : [],
    },
    // Whitelisted public answers of the Studio store profile. Private legal and
    // owner details live in a separate table and are never read here.
    profile: seller.metadata?.vitrinaki_profile ? publicProfileView(seller.metadata.vitrinaki_profile) : null,
  })
}
