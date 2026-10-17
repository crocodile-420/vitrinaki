import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"
import { resolveCname, resolveTxt } from "node:dns/promises"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })

  const target = (process.env.VITRINAKI_CUSTOM_DOMAIN_TARGET || "").toLowerCase().replace(/\.$/, "")
  if (!target) return res.status(503).json({ message: "Η σύνδεση custom domain δεν έχει ενεργοποιηθεί στο hosting." })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const result = await query.graph({ entity: "seller", fields: ["id", "metadata"], filters: { id: sellerId } })
  const seller = result.data?.[0] as any
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })

  const metadata = { ...(seller.metadata || {}) }
  const storefront = { ...(metadata.vitrinaki_storefront || {}) }
  const domain = String(storefront.customDomain || "")
  const token = String(storefront.domainVerificationToken || "")
  if (!domain || !token) return res.status(400).json({ message: "Πρόσθεσε και αποθήκευσε πρώτα το domain." })
  if (storefront.domainStatus === "verified") return res.json({ verified: true, domain })

  const [txtOk, cnameOk] = await Promise.all([
    resolveTxt(`_vitrinaki-verification.${domain}`).then(records =>
      records.flat().some(record => record.trim() === `vitrinaki-verification=${token}`)
    ).catch(() => false),
    resolveCname(domain).then(records =>
      records.some(record => record.toLowerCase().replace(/\.$/, "") === target)
    ).catch(() => false),
  ])
  if (!txtOk || !cnameOk) {
    return res.status(400).json({
      verified: false,
      message: "Δεν επιβεβαιώθηκαν ακόμη οι εγγραφές DNS. Έλεγξε TXT και CNAME και ξαναδοκίμασε.",
      requiredRecords: [
        { type: "TXT", host: `_vitrinaki-verification.${domain}`, value: `vitrinaki-verification=${token}` },
        { type: "CNAME", host: domain, value: target },
      ],
    })
  }

  storefront.domainStatus = "verified"
  storefront.domainVerifiedAt = new Date().toISOString()
  metadata.vitrinaki_storefront = storefront
  const subscription = metadata.vitrinaki_subscription
  if (storefront.isPublished && ["active", "trialing"].includes(String(subscription?.status || ""))) {
    metadata.storefront_url = `https://${domain}`
  }
  await updateSellersWorkflow(req.scope).run({ input: { selector: { id: sellerId }, update: { metadata } } })
  return res.json({ verified: true, domain, message: "Το DNS επιβεβαιώθηκε. Το hosting πρέπει επίσης να δρομολογεί το domain στο Vitrinaki και να παρέχει TLS/HTTPS." })
}
