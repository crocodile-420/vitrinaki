import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

import { BOOKINGS_METADATA_KEY, readBookingSettings, suggestedSettings, validateBookingSettings } from "../../../../../lib/vitrinaki-bookings"
import { loadSeller } from "../../../../../lib/stripe-connect-seller"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

// «Κρατήσεις» settings in the Studio. Until the shop saves once, the page
// starts from its profile (services, opening hours) with bookings off.
export async function GET(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  const seller = await loadSeller(req.scope, sellerId)
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })
  const stored = readBookingSettings(seller.metadata)
  return res.json({
    settings: stored ?? suggestedSettings(seller.metadata?.vitrinaki_profile),
    saved: Boolean(stored),
    handle: seller.handle,
  })
}

// Saves into seller.metadata.vitrinaki_bookings, keeping the rest of the
// metadata. Existing bookings are not touched by a change of rules.
export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  const result = validateBookingSettings((req.body as Record<string, unknown>)?.settings ?? req.body)
  if ("error" in result) return res.status(400).json({ message: result.error })

  const seller = await loadSeller(req.scope, sellerId)
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })
  const metadata = {
    ...(seller.metadata || {}),
    [BOOKINGS_METADATA_KEY]: { ...result.settings, updatedAt: new Date().toISOString() },
  }
  await updateSellersWorkflow(req.scope).run({ input: { selector: { id: sellerId }, update: { metadata } } })
  return res.json({ settings: result.settings, saved: true, handle: seller.handle })
}
