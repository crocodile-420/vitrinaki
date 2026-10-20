import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { readReferral, referralShareUrl, referralSummary } from "../../../../lib/vitrinaki-referral"
import { ensureReferralCode, loadSeller } from "../../../../lib/vitrinaki-referral-rewards"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

// «Σύστασε έναν συνάδελφο» in the Studio: the shop's code (made on first
// visit), its share link and how many free months it has earned.
export async function GET(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  const seller = await loadSeller(req.scope, sellerId)
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })

  await ensureReferralCode(req.scope, seller)
  const state = readReferral((await loadSeller(req.scope, sellerId))?.metadata)
  const code = state.code || ""
  return res.json({
    referral: {
      code,
      url: referralShareUrl(code),
      ...referralSummary(state),
      referrals: (state.referrals || []).slice(-50).reverse().map((entry) => ({ name: entry.name || "", at: entry.at, qualified: Boolean(entry.qualifiedAt) })),
      rewards: (state.rewards || []).slice(-50).reverse().map((reward) => ({
        role: reward.role,
        otherName: reward.otherName || "",
        earnedAt: reward.earnedAt,
        status: reward.status,
        method: reward.method || null,
        amount: reward.amount ?? null,
        currency: reward.currency || null,
        newPeriodEnd: reward.newPeriodEnd || null,
      })),
    },
  })
}
