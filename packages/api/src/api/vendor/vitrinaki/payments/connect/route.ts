import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  cardPaymentsConfigured,
  STRIPE_CONNECT_METADATA_KEY,
  stripeRequest,
} from "../../../../../lib/stripe-connect"
import { loadSeller, saveConnectState } from "../../../../../lib/stripe-connect-seller"

type SellerRequest = AuthenticatedMedusaRequest & { seller_context?: { seller_id?: string } }

// Connect the shop's own Stripe account: create a Standard connected account
// (once) and return a Stripe-hosted onboarding link. Shops that already use
// Stripe sign in with their Stripe login during onboarding.
export async function POST(req: SellerRequest, res: MedusaResponse) {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) return res.status(401).json({ message: "Συνδέσου στον λογαριασμό της επιχείρησής σου." })
  if (!cardPaymentsConfigured()) {
    return res.status(503).json({ message: "Οι πληρωμές με κάρτα δεν έχουν ρυθμιστεί ακόμη στο Vitrinaki." })
  }
  const seller = await loadSeller(req.scope, sellerId)
  if (!seller) return res.status(404).json({ message: "Δεν βρέθηκε η επιχείρηση." })

  try {
    let accountId: string | undefined = seller.metadata?.[STRIPE_CONNECT_METADATA_KEY]?.accountId || undefined
    if (!accountId) {
      const storefrontUrl = typeof seller.metadata?.storefront_url === "string" ? seller.metadata.storefront_url : undefined
      const account = await stripeRequest<{ id: string }>(
        "POST",
        "/accounts",
        {
          type: "standard",
          country: "GR",
          email: seller.email || undefined,
          "business_profile[name]": seller.name || undefined,
          "business_profile[url]": storefrontUrl && /^https:\/\//.test(storefrontUrl) ? storefrontUrl : undefined,
          "metadata[seller_id]": sellerId,
          "metadata[seller_handle]": seller.handle || undefined,
        },
        // A double click must not create two accounts.
        { idempotencyKey: `vitrinaki-connect-account-${sellerId}` }
      )
      accountId = account.id
      await saveConnectState(req.scope, seller, {
        accountId,
        status: "pending",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        requirementsDue: [],
        disabledReason: null,
      })
    }

    const studioUrl = (process.env.VITRINAKI_STUDIO_URL || "http://localhost:7001").replace(/\/+$/, "")
    const link = await stripeRequest<{ url: string }>("POST", "/account_links", {
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${studioUrl}/vitrinaki-payments?stripe=refresh`,
      return_url: `${studioUrl}/vitrinaki-payments?stripe=return`,
    })
    return res.json({ url: link.url })
  } catch (error) {
    return res.status(502).json({ message: error instanceof Error ? error.message : "Δεν ήταν δυνατή η σύνδεση με το Stripe." })
  }
}
