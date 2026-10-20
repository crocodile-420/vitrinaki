import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { normalizeReferralCode } from "../../../../lib/vitrinaki-referral"
import { findSellerByReferralCode } from "../../../../lib/vitrinaki-referral-rewards"

// Sign-up helper: does a referral code exist? Answers the referring shop's
// public name only, so the form can say who sent you.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const code = normalizeReferralCode(req.query.code)
  const seller = code ? await findSellerByReferralCode(req.scope, code) : null
  return res.json(seller ? { valid: true, code, shopName: seller.name || "" } : { valid: false })
}
