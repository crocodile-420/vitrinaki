import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

import {
  BUSINESS_TYPES,
  TEMPLATE_FOR_TYPE,
  isEmail,
  isGreekPhone,
  isHttpUrl,
  normalizePublicProfile,
  type FieldErrors,
} from "../../../../lib/vitrinaki-profile"
import { MAX_PHOTOS } from "../../../../lib/vitrinaki-autobuild"

// The optional «first steps» right after sign-up on the public start page.
// Each call saves one small step into the SAME fields the Studio store-profile
// wizard edits (seller.metadata.vitrinaki_profile / vitrinaki_storefront and
// seller.logo), so the wizard later opens already filled in. Unlike the
// wizard's own route it never touches the private details table.

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }
type Patch = Partial<{
  step: string
  businessType: string
  businessTypeOther: string
  palette: string
  logoUrl: string
  tagline: string
  story: string
  area: string
  city: string
  postalCode: string
  contactPhone: string
  contactEmail: string
  whatsapp: string
  viberSameAsWhatsapp: boolean
  instagram: string
  facebook: string
  photos: string[]
}>

const STEPS: Record<string, string> = { type: "type", look: "look", photos: "look", story: "basics", location: "location", contact: "contact" }
const PALETTES = new Set(["forest", "terracotta", "ocean"])
const has = (body: Patch, key: keyof Patch) => Object.prototype.hasOwnProperty.call(body, key)
const text = (value: unknown, limit: number) => (typeof value === "string" ? value.trim().slice(0, limit) : "")

export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "handle", "email", "logo", "metadata"],
    filters: { id: sellerId },
  })
  const seller = data?.[0] as any
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε το κατάστημα." })

  const body = (req.body || {}) as Patch
  const errors: FieldErrors = {}
  const metadata = seller.metadata || {}
  const prevProfile = metadata.vitrinaki_profile || {}
  const prevStorefront = metadata.vitrinaki_storefront || {}

  // ---- public profile (wizard fields) ----
  const merged: Record<string, any> = { ...prevProfile }
  if (has(body, "businessType")) {
    const type = text(body.businessType, 20)
    if (type && !BUSINESS_TYPES.includes(type as any)) errors.businessType = "Διάλεξε ένα από τα είδη."
    merged.businessType = type
    merged.businessTypeOther = type === "other" ? text(body.businessTypeOther, 80) : ""
  }
  if (has(body, "story")) merged.story = text(body.story, 4000)
  if (has(body, "area") || has(body, "city") || has(body, "postalCode")) {
    const postalCode = text(body.postalCode, 10).replace(/\s+/g, "")
    merged.address = {
      ...(prevProfile.address || {}),
      area: text(body.area, 120),
      city: text(body.city, 120),
      postalCode: postalCode ? `${postalCode.slice(0, 3)} ${postalCode.slice(3)}`.trim() : "",
    }
  }
  if (has(body, "whatsapp")) {
    const whatsapp = text(body.whatsapp, 30)
    merged.whatsapp = whatsapp
    merged.viber = body.viberSameAsWhatsapp && whatsapp ? whatsapp : ""
  }
  if (has(body, "instagram") || has(body, "facebook")) {
    merged.socials = { ...(prevProfile.socials || {}), instagram: text(body.instagram, 300), facebook: text(body.facebook, 300) }
  }
  const step = STEPS[String(body.step || "")]
  const completed = new Set<string>(Array.isArray(prevProfile.completedSteps) ? prevProfile.completedSteps : [])
  if (step) completed.add(step)
  merged.completedSteps = [...completed]

  const profileErrors: FieldErrors = {}
  const profile = normalizePublicProfile(merged, profileErrors)
  const errorKey: Record<string, string> = {
    "profile.whatsapp": "whatsapp",
    "profile.viber": "whatsapp",
    "profile.address.postalCode": "postalCode",
    "profile.socials.instagram": "instagram",
    "profile.socials.facebook": "facebook",
  }
  for (const [key, message] of Object.entries(profileErrors)) {
    if (errorKey[key]) errors[errorKey[key]] = message
  }

  // ---- storefront basics ----
  const storefront: Record<string, any> = {
    customDomain: "",
    domainStatus: "not_configured",
    domainVerificationToken: "",
    sections: [],
    isPublished: false,
    publishedAt: null,
    storeName: seller.name,
    contactEmail: seller.email || "",
    palette: "forest",
    ...prevStorefront,
  }
  if (has(body, "palette")) {
    const palette = text(body.palette, 20)
    if (!PALETTES.has(palette)) errors.palette = "Διάλεξε ένα από τα χρώματα."
    else storefront.palette = palette
  }
  let logo: string | null | undefined
  if (has(body, "logoUrl")) {
    const logoUrl = text(body.logoUrl, 2048)
    if (logoUrl && !isHttpUrl(logoUrl)) errors.logoUrl = "Δεν ανέβηκε σωστά η εικόνα. Δοκίμασε ξανά."
    storefront.logoUrl = logoUrl || null
    logo = logoUrl || null
  }
  if (has(body, "photos")) {
    const photos = (Array.isArray(body.photos) ? body.photos : []).map((url) => text(url, 2048)).filter(Boolean)
    if (photos.length > MAX_PHOTOS) errors.photos = `Έως ${MAX_PHOTOS} φωτογραφίες.`
    else if (photos.some((url) => !isHttpUrl(url))) errors.photos = "Δεν ανέβηκε σωστά μια φωτογραφία. Δοκίμασε ξανά."
    else storefront.gallery = photos
  }
  if (has(body, "tagline")) storefront.tagline = text(body.tagline, 160)
  if (has(body, "contactPhone")) {
    const phone = text(body.contactPhone, 30)
    if (phone && !isGreekPhone(phone)) errors.contactPhone = "Γράψε ένα ελληνικό τηλέφωνο, π.χ. 2101234567 ή 69XXXXXXXX."
    storefront.contactPhone = phone
  }
  if (has(body, "contactEmail")) {
    const email = text(body.contactEmail, 254).toLowerCase()
    if (email && !isEmail(email)) errors.contactEmail = "Αυτό το email δεν μοιάζει σωστό."
    storefront.contactEmail = email
  }
  if (profile.businessType) storefront.template = TEMPLATE_FOR_TYPE[profile.businessType]

  if (Object.keys(errors).length) return res.status(400).json({ message: "Έλεγξε τα πεδία με κόκκινο.", errors })

  const now = new Date().toISOString()
  storefront.updatedAt = now
  await updateSellersWorkflow(req.scope).run({
    input: {
      selector: { id: seller.id },
      update: {
        ...(logo !== undefined ? { logo } : {}),
        metadata: {
          ...metadata,
          vitrinaki_storefront: storefront,
          vitrinaki_profile: { ...profile, updatedAt: now },
        },
      },
    },
  })

  return res.json({
    ok: true,
    storefront: { storeName: storefront.storeName, tagline: storefront.tagline || "", palette: storefront.palette, template: storefront.template || "atelier", logoUrl: storefront.logoUrl || null },
    businessType: profile.businessType,
  })
}
