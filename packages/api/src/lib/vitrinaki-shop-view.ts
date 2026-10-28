import { publicProfileView } from "./vitrinaki-profile"
import { normalizeStyle } from "./vitrinaki-storefront-style"

export type PublicStorefront = {
  handle?: string
  storeName?: string
  tagline?: string
  description?: string
  template?: "atelier" | "local" | "services"
  palette?: "forest" | "terracotta" | "ocean" | "plum" | "indigo" | "sage" | "graphite"
  contactEmail?: string
  contactPhone?: string
  isPublished?: boolean
  customDomain?: string
  domainStatus?: string
  sections?: unknown[]
  style?: unknown
}

// What a shop page shows: the public storefront route and the start page's
// preview of an automatic build both answer with this shape.
export function publicShopView(seller: any) {
  const storefront = (seller.metadata?.vitrinaki_storefront || {}) as PublicStorefront
  return {
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
      style: normalizeStyle(storefront.style),
    },
    // Whitelisted public answers of the Studio store profile. Private legal and
    // owner details live in a separate table and are never read here.
    profile: seller.metadata?.vitrinaki_profile ? publicProfileView(seller.metadata.vitrinaki_profile) : null,
  }
}
