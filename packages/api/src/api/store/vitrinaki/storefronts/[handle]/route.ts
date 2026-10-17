import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

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
  const subscription = seller?.metadata?.vitrinaki_subscription as { status?: string } | undefined

  if (!seller || !storefront?.isPublished) {
    return res.status(404).json({ message: "Το κατάστημα δεν είναι δημοσιευμένο." })
  }

  if (subscription && !["active", "trialing"].includes(String(subscription.status))) {
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
    },
  })
}
