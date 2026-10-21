import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { claimRefusal, CLAIM_MESSAGES, normalizeReferralCode } from "../../../../../lib/vitrinaki-referral"
import { findSellerByReferralCode, loadSeller, recordReferralClaim } from "../../../../../lib/vitrinaki-referral-rewards"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

// Called by the public sign-up right after the shop is created: records who
// referred it. One referrer per shop, never itself, only before the shop has
// paid through Stripe. A refusal is a friendly 400 and never blocks sign-up.
export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  const seller = await loadSeller(req.scope, sellerId)
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })

  const code = normalizeReferralCode((req.body as { code?: unknown } | undefined)?.code)
  const referrer = code ? await findSellerByReferralCode(req.scope, code) : null
  const refusal = claimRefusal(seller, referrer)
  if (refusal || !referrer) {
    const reason = refusal || "unknown"
    return res.status(400).json({ code: reason, message: CLAIM_MESSAGES[reason] })
  }
  await recordReferralClaim(req.scope, seller, referrer, code)
  return res.json({ applied: true, referrer: { name: referrer.name || "" } })
}
