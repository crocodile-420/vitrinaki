import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  cardPaymentsConfigured,
  connectStateFromAccount,
  STRIPE_CONNECT_METADATA_KEY,
  stripeRequest,
} from "../../../../lib/stripe-connect"
import { connectView, loadSeller, saveConnectState } from "../../../../lib/stripe-connect-seller"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

// The shop's card-payment status. ?refresh=1 (used when the seller comes back
// from Stripe's onboarding) re-reads the account from Stripe instead of
// waiting for the account.updated webhook.
export async function GET(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  const seller = await loadSeller(req.scope, sellerId)
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })

  let stored = seller.metadata?.[STRIPE_CONNECT_METADATA_KEY] || null
  const refresh = String((req.query as Record<string, unknown>)?.refresh || "") === "1"
  if (refresh && cardPaymentsConfigured() && stored?.accountId) {
    try {
      const account = await stripeRequest("GET", `/accounts/${encodeURIComponent(stored.accountId)}`)
      stored = await saveConnectState(req.scope, seller, connectStateFromAccount(account))
    } catch (error) {
      return res.status(502).json({ message: error instanceof Error ? error.message : "Δεν ήταν δυνατή η ενημέρωση από το Stripe." })
    }
  }
  return res.json({ payments: connectView(stored) })
}
