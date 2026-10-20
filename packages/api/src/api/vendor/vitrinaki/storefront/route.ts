import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"
import { randomBytes } from "node:crypto"

import { availablePlanIntervals } from "../../../../lib/vitrinaki-plans"

type SellerRequest = AuthenticatedMedusaRequest & {
  seller_context?: { seller_id?: string }
}
type SectionBlock = {
  id: string
  type: "text" | "image" | "feature"
  title: string
  body: string
  imageUrl: string | null
}
const sectionTypes = new Set(["text", "image", "feature"])

type StorefrontForm = {
  storeName?: unknown
  tagline?: unknown
  description?: unknown
  template?: unknown
  palette?: unknown
  contactEmail?: unknown
  contactPhone?: unknown
  logoUrl?: unknown
  bannerUrl?: unknown
  sections?: unknown
  customDomain?: unknown
}
const templates = new Set(["atelier", "local", "services"])
const palettes = new Set(["forest", "terracotta", "ocean", "plum"])
const text = (value: unknown, limit: number, fallback = "") =>
  typeof value === "string" ? value.trim().slice(0, limit) : fallback

function normalizeDomain(value: unknown) {
  const domain = text(value, 253).toLowerCase().replace(/\.$/, "")
  if (!domain) return ""
  if (
    domain.includes("://") ||
    domain.includes("/") ||
    domain.includes(":") ||
    !/^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)
  ) throw new Error("Βάλε μόνο domain, π.χ. shop.example.gr, χωρίς https:// ή διαδρομή.")

  const publicUrl = process.env.VITRINAKI_STOREFRONT_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100"
  const platformHost = new URL(publicUrl).hostname.toLowerCase()
  if (domain === platformHost || domain === platformHost.replace(/^www\./, "") || domain === "localhost" || domain.endsWith(".localhost")) {
    throw new Error("Χρειάζεται domain που ανήκει στην επιχείρησή σου, όχι στο Vitrinaki ή στο localhost.")
  }
  return domain
}

function normalizeSections(value: unknown): SectionBlock[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 8).map((entry, index) => {
    const section = (entry || {}) as Record<string, unknown>
    const type = sectionTypes.has(String(section.type)) ? String(section.type) as SectionBlock["type"] : "text"
    return {
      id: text(section.id, 80, `section-${index + 1}`),
      type,
      title: text(section.title, 160),
      body: text(section.body, 1600),
      imageUrl: optionalImageUrl(section.imageUrl),
    }
  })
}

function optionalImageUrl(value: unknown): string | null {
  const raw = text(value, 2048)
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Η εικόνα πρέπει να έχει έγκυρη διεύθυνση HTTPS ή HTTP.")
    }
    return url.toString()
  } catch (error) {
    if (error instanceof Error && error.message.includes("HTTPS")) throw error
    throw new Error("Η διεύθυνση εικόνας δεν είναι έγκυρη.")
  }
}

async function getSeller(req: SellerRequest) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return null
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const result = await query.graph({
    entity: "seller",
    fields: ["id", "name", "handle", "email", "phone", "description", "logo", "banner", "metadata"],
    filters: { id: sellerId },
  })
  return result.data?.[0] as any || null
}

const defaults = (seller: any) => ({
  storeName: seller.name || "Η επιχείρησή μου",
  tagline: "Καλώς ήρθες στο κατάστημά μας",
  description: seller.description || "",
  template: "atelier",
  palette: "forest",
  contactEmail: seller.email || "",
  contactPhone: seller.phone || "",
  logoUrl: seller.logo || "",
  bannerUrl: seller.banner || "",
  sections: seller.description ? [{ id: "about", type: "text", title: "Σχετικά με εμάς", body: seller.description, imageUrl: null }] : [],
  customDomain: "",
  domainStatus: "not_configured",
  domainVerificationToken: "",
  isPublished: false,
  publishedAt: null,
})

export async function GET(req: SellerRequest, res: MedusaResponse) {
  const seller = await getSeller(req)
  if (!seller) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })

  const storefront = seller.metadata?.vitrinaki_storefront || defaults(seller)
  const subscription = seller.metadata?.vitrinaki_subscription || null
  return res.json({
    seller: { id: seller.id, name: seller.name, handle: seller.handle, email: seller.email, logo: seller.logo, banner: seller.banner },
    storefront,
    subscription: subscription ? {
      planId: subscription.planId || subscription.plan_id,
      interval: subscription.interval || subscription.billing_interval,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd || subscription.current_period_end,
      cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd || subscription.cancel_at_period_end),
    } : null,
    billingConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    availablePlans: availablePlanIntervals(),
    setupServicesConfigured: Boolean(process.env.STRIPE_PRICE_SETUP_ASSISTED && process.env.STRIPE_PRICE_SETUP_DONE_FOR_YOU),
  })
}

export async function POST(req: SellerRequest, res: MedusaResponse) {
  const seller = await getSeller(req)
  if (!seller) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })

  const body = (req.body || {}) as { action?: string; storefront?: StorefrontForm }
  const action = body.action || "save"
  const current = seller.metadata?.vitrinaki_storefront || defaults(seller)
  if (!["save", "publish", "unpublish"].includes(action)) {
    return res.status(400).json({ message: "Άγνωστη ενέργεια." })
  }
  if (action !== "unpublish" && (!body.storefront || typeof body.storefront !== "object")) {
    return res.status(400).json({ message: "Συμπλήρωσε πρώτα τις ρυθμίσεις του website." })
  }

  const subscription = seller.metadata?.vitrinaki_subscription
  const paidStatus = ["active", "trialing"].includes(String(subscription?.status || ""))
  if (action === "publish" && !paidStatus) {
    return res.status(402).json({ message: "Για δημοσίευση χρειάζεται ενεργή συνδρομή. Άνοιξε την ενότητα Συνδρομή για να συνεχίσεις." })
  }

  const input = body.storefront || current
  let customDomain = ""
  try {
    customDomain = normalizeDomain(input.customDomain ?? current.customDomain)
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : "Το domain δεν είναι έγκυρο." })
  }
  const domainChanged = customDomain !== String(current.customDomain || "")
  const config = {
    storeName: text(input.storeName, 100, seller.name || "Η επιχείρησή μου"),
    tagline: text(input.tagline, 160, "Καλώς ήρθες στο κατάστημά μας"),
    description: text(input.description, 1800),
    template: templates.has(String(input.template)) ? String(input.template) : String(current.template || "atelier"),
    palette: palettes.has(String(input.palette)) ? String(input.palette) : String(current.palette || "forest"),
    contactEmail: text(input.contactEmail, 254),
    contactPhone: text(input.contactPhone, 50),
    logoUrl: optionalImageUrl(input.logoUrl),
    bannerUrl: optionalImageUrl(input.bannerUrl),
    sections: normalizeSections(input.sections ?? current.sections),
    customDomain,
    domainStatus: customDomain ? (domainChanged ? "pending" : current.domainStatus || "pending") : "not_configured",
    domainVerificationToken: customDomain ? (domainChanged ? randomBytes(18).toString("hex") : current.domainVerificationToken || "") : "",
    domainVerifiedAt: customDomain && !domainChanged ? current.domainVerifiedAt || null : null,
    isPublished: action === "publish" ? true : action === "unpublish" ? false : Boolean(current.isPublished && paidStatus),
    publishedAt: action === "publish" ? current.publishedAt || new Date().toISOString() : action === "unpublish" ? null : current.publishedAt || null,
    updatedAt: new Date().toISOString(),
  }

  const metadata = { ...(seller.metadata || {}), vitrinaki_storefront: config }
  const baseUrl = (process.env.VITRINAKI_STOREFRONT_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100").replace(/\/+$/, "")
  const locale = process.env.VITRINAKI_DEFAULT_LOCALE || "gr"
  if (config.isPublished && paidStatus) {
    metadata.storefront_url = config.customDomain && config.domainStatus === "verified"
      ? `https://${config.customDomain}`
      : `${baseUrl}/${locale}/store/${seller.handle}`
  } else {
    const existingUrl = metadata.storefront_url
    if (
      typeof existingUrl === "string" &&
      (existingUrl.includes(`/store/${seller.handle}`) ||
        (current.customDomain && existingUrl === `https://${current.customDomain}`))
    ) delete metadata.storefront_url
  }

  await updateSellersWorkflow(req.scope).run({
    input: {
      selector: { id: seller.id },
      update: { metadata, logo: config.logoUrl, banner: config.bannerUrl },
    },
  })
  return res.json({ storefront: config, subscription: subscription || null })
}
