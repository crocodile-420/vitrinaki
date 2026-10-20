import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { extensionDaysFor, readReferral, referralShareUrl, referralSummary, referrerPercent, rewardPercent } from "../../../../lib/vitrinaki-referral"
import { ensureReferralCode, loadSeller } from "../../../../lib/vitrinaki-referral-rewards"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

// «Σύστασε έναν συνάδελφο» in the Studio: the shop's code (made on first
// visit), its share link and the discounts it has earned.
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
      // What referring earns now (each earned reward keeps its own percent).
      referrerPercent: referrerPercent(),
      referrerExtensionDays: extensionDaysFor(referrerPercent()),
      referrals: (state.referrals || []).slice(-50).reverse().map((entry) => {
        const reward = (state.rewards || []).find((r) => r.role === "referrer" && r.otherSellerId === entry.sellerId)
        return { name: entry.name || "", at: entry.at, qualified: Boolean(entry.qualifiedAt), percent: reward && reward.status !== "capped" ? rewardPercent(reward) : null }
      }),
      rewards: (state.rewards || []).slice(-50).reverse().map((reward) => ({
        role: reward.role,
        otherName: reward.otherName || "",
        earnedAt: reward.earnedAt,
        status: reward.status,
        percent: rewardPercent(reward),
        method: reward.method || null,
        amount: reward.amount ?? null,
        currency: reward.currency || null,
        newPeriodEnd: reward.newPeriodEnd || null,
      })),
    },
  })
}
