import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

import { LOYALTY_METADATA_KEY, readLoyaltySettings, validateLoyaltySettings } from "../../../../lib/vitrinaki-loyalty"
import { loadSeller } from "../../../../lib/stripe-connect-seller"
import { LOYALTY_PLAN_MESSAGE, planFeaturesFor } from "../../../../lib/vitrinaki-plans"
import { VITRINAKI_LOYALTY_MODULE } from "../../../../modules/vitrinaki-loyalty"
import type VitrinakiLoyaltyModuleService from "../../../../modules/vitrinaki-loyalty/service"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

const stats = (req: SellerRequest, sellerId: string) =>
  req.scope.resolve<VitrinakiLoyaltyModuleService>(VITRINAKI_LOYALTY_MODULE).sellerStats(sellerId)

// «Πόντοι πελατών» in the Studio: the shop's rules and its numbers.
export async function GET(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  const seller = await loadSeller(req.scope, sellerId)
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })
  const planAllows = planFeaturesFor(seller.metadata?.vitrinaki_subscription).loyalty
  return res.json({ loyalty: readLoyaltySettings(seller.metadata), planAllows, stats: await stats(req, sellerId) })
}

// Saves the rules into seller.metadata.vitrinaki_loyalty, keeping the rest
// of the metadata as it is. Points already earned are not touched.
export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  const result = validateLoyaltySettings((req.body as Record<string, unknown>)?.loyalty ?? req.body)
  if ("error" in result) return res.status(400).json({ message: result.error })

  const seller = await loadSeller(req.scope, sellerId)
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })
  const planAllows = planFeaturesFor(seller.metadata?.vitrinaki_subscription).loyalty
  if (result.settings.enabled && !planAllows) return res.status(403).json({ message: LOYALTY_PLAN_MESSAGE })
  const metadata = {
    ...(seller.metadata || {}),
    [LOYALTY_METADATA_KEY]: { ...result.settings, updatedAt: new Date().toISOString() },
  }
  await updateSellersWorkflow(req.scope).run({ input: { selector: { id: sellerId }, update: { metadata } } })
  return res.json({ loyalty: result.settings, planAllows, stats: await stats(req, sellerId) })
}
