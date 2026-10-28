import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

import {
  TEMPLATE_FOR_TYPE,
  completionPercent,
  emptyPrivateProfile,
  isEmail,
  isGreekPhone,
  isHttpUrl,
  normalizePrivateProfile,
  normalizePublicProfile,
  profileChecklist,
  type FieldErrors,
  type PrivateProfile,
} from "../../../../lib/vitrinaki-profile"
import { VITRINAKI_PRIVATE_MODULE } from "../../../../modules/vitrinaki-private"
import type VitrinakiPrivateModuleService from "../../../../modules/vitrinaki-private/service"

// Studio "store profile" wizard. GET returns everything the wizard edits
// (public profile + basics + the seller's own private details); POST validates
// and saves it. Public answers go to seller.metadata.vitrinaki_profile (and the
// shared basics into metadata.vitrinaki_storefront + seller logo/banner);
// private answers go to the unlinked vitrinaki_seller_private table.

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

const palettes = new Set(["forest", "terracotta", "ocean", "plum", "indigo", "sage", "graphite"])
const text = (value: unknown, limit: number) => (typeof value === "string" ? value.trim().slice(0, limit) : "")

async function loadSeller(req: SellerRequest) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return null
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "handle", "email", "phone", "description", "logo", "banner", "website_url", "metadata"],
    filters: { id: sellerId },
  })
  return (data?.[0] as any) || null
}

async function loadPrivate(req: SellerRequest, sellerId: string) {
  const service = req.scope.resolve<VitrinakiPrivateModuleService>(VITRINAKI_PRIVATE_MODULE)
  const [row] = await service.listSellerPrivates({ seller_id: sellerId })
  return { service, row }
}

const toPrivate = (row: any): PrivateProfile | null => {
  if (!row) return null
  const base = emptyPrivateProfile()
  return {
    legal: { ...base.legal, ...(row.legal || {}), registeredAddress: { ...base.legal.registeredAddress, ...(row.legal?.registeredAddress || {}) } },
    owner: { ...base.owner, ...(row.owner || {}) },
  }
}

function basicsOf(seller: any) {
  const sf = seller.metadata?.vitrinaki_storefront || {}
  return {
    storeName: sf.storeName || seller.name || "",
    tagline: sf.tagline || "",
    description: sf.description || seller.description || "",
    palette: sf.palette || "forest",
    logoUrl: sf.logoUrl || seller.logo || "",
    bannerUrl: sf.bannerUrl || seller.banner || "",
    contactEmail: sf.contactEmail ?? seller.email ?? "",
    contactPhone: sf.contactPhone ?? seller.phone ?? "",
  }
}

function storefrontUrl(seller: any) {
  const base = (process.env.VITRINAKI_STOREFRONT_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100").replace(/\/+$/, "")
  const locale = process.env.VITRINAKI_DEFAULT_LOCALE || "gr"
  return `${base}/${locale}/store/${seller.handle}`
}

export async function GET(req: SellerRequest, res: MedusaResponse) {
  const seller = await loadSeller(req)
  if (!seller) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  const { row } = await loadPrivate(req, seller.id)
  const profile = normalizePublicProfile(seller.metadata?.vitrinaki_profile)
  const privateProfile = toPrivate(row) || emptyPrivateProfile()
  if (!row) {
    // Helpful defaults for a first visit: the account's own email.
    privateProfile.owner.email = seller.email || ""
    privateProfile.legal.invoiceEmail = seller.email || ""
  }
  const basics = basicsOf(seller)
  const checklist = profileChecklist(profile, basics, toPrivate(row))
  return res.json({
    seller: { id: seller.id, handle: seller.handle, name: seller.name, email: seller.email },
    profile: { ...profile, updatedAt: seller.metadata?.vitrinaki_profile?.updatedAt || null },
    basics,
    private: privateProfile,
    checklist,
    completion: completionPercent(checklist),
    isPublished: Boolean(seller.metadata?.vitrinaki_storefront?.isPublished),
    storefrontUrl: storefrontUrl(seller),
  })
}

export async function POST(req: SellerRequest, res: MedusaResponse) {
  const seller = await loadSeller(req)
  if (!seller) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })

  const body = (req.body || {}) as { profile?: unknown; basics?: Record<string, unknown>; private?: unknown }
  const errors: FieldErrors = {}
  const previousProfile = seller.metadata?.vitrinaki_profile || {}
  const profile = normalizePublicProfile(body.profile ?? previousProfile, errors)

  const current = basicsOf(seller)
  const rawBasics = body.basics || {}
  const basics = {
    storeName: text(rawBasics.storeName ?? current.storeName, 100) || seller.name,
    tagline: text(rawBasics.tagline ?? current.tagline, 160),
    description: text(rawBasics.description ?? current.description, 1800),
    palette: palettes.has(String(rawBasics.palette)) ? String(rawBasics.palette) : current.palette,
    logoUrl: text(rawBasics.logoUrl ?? current.logoUrl, 2048),
    bannerUrl: text(rawBasics.bannerUrl ?? current.bannerUrl, 2048),
    contactEmail: text(rawBasics.contactEmail ?? current.contactEmail, 254).toLowerCase(),
    contactPhone: text(rawBasics.contactPhone ?? current.contactPhone, 30),
  }
  if (basics.logoUrl && !isHttpUrl(basics.logoUrl)) errors["basics.logoUrl"] = "Μη έγκυρη διεύθυνση εικόνας (https://…)."
  if (basics.bannerUrl && !isHttpUrl(basics.bannerUrl)) errors["basics.bannerUrl"] = "Μη έγκυρη διεύθυνση εικόνας (https://…)."
  if (basics.contactEmail && !isEmail(basics.contactEmail)) errors["basics.contactEmail"] = "Μη έγκυρο email."
  if (basics.contactPhone && !isGreekPhone(basics.contactPhone)) errors["basics.contactPhone"] = "Μη έγκυρο τηλέφωνο (π.χ. 2101234567 ή 69XXXXXXXX)."

  const { service, row } = await loadPrivate(req, seller.id)
  const previousPrivate = toPrivate(row)
  const privateProfile = body.private === undefined ? previousPrivate : normalizePrivateProfile(body.private, previousPrivate, errors)

  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Έλεγξε τα πεδία με κόκκινο.", errors })
  }

  const now = new Date().toISOString()
  const storefront = seller.metadata?.vitrinaki_storefront || {}
  const nextStorefront = {
    // Keep publish/domain state and any page sections the seller already set.
    customDomain: "",
    domainStatus: "not_configured",
    domainVerificationToken: "",
    sections: [],
    isPublished: false,
    publishedAt: null,
    ...storefront,
    storeName: basics.storeName,
    tagline: basics.tagline || storefront.tagline || "",
    description: basics.description,
    palette: basics.palette,
    logoUrl: basics.logoUrl || null,
    bannerUrl: basics.bannerUrl || null,
    contactEmail: basics.contactEmail,
    contactPhone: basics.contactPhone,
    // The business type picks the hero style automatically.
    template: profile.businessType ? TEMPLATE_FOR_TYPE[profile.businessType] : storefront.template || "atelier",
    updatedAt: now,
  }

  await updateSellersWorkflow(req.scope).run({
    input: {
      selector: { id: seller.id },
      update: {
        logo: basics.logoUrl || null,
        banner: basics.bannerUrl || null,
        ...(profile.socials.website ? { website_url: profile.socials.website } : {}),
        metadata: {
          ...(seller.metadata || {}),
          vitrinaki_storefront: nextStorefront,
          vitrinaki_profile: { ...profile, updatedAt: now },
        },
      },
    },
  })

  if (privateProfile && body.private !== undefined) {
    if (row) await service.updateSellerPrivates({ id: row.id, legal: privateProfile.legal, owner: privateProfile.owner })
    else await service.createSellerPrivates({ seller_id: seller.id, legal: privateProfile.legal, owner: privateProfile.owner })
  }

  const checklist = profileChecklist(profile, basics, privateProfile)
  return res.json({
    profile: { ...profile, updatedAt: now },
    basics,
    private: privateProfile || emptyPrivateProfile(),
    checklist,
    completion: completionPercent(checklist),
    isPublished: Boolean(nextStorefront.isPublished),
    storefrontUrl: storefrontUrl(seller),
  })
}
