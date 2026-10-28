import { planFeaturesFor } from "./vitrinaki-plans"

// Products the Vitrinaki team promotes on the homepage marketplace. The list
// lives on the seller (metadata.vitrinaki_promoted: product ids, in order) and
// only the admin writes it: it is a server-owned key (server-metadata.ts), so a
// shop cannot promote itself.
export const PROMOTED_KEY = "vitrinaki_promoted"
export const MAX_PROMOTED_PER_SHOP = 12

export function promotedIds(metadata: Record<string, any> | null | undefined): string[] {
  const value = metadata?.[PROMOTED_KEY]
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string").slice(0, MAX_PROMOTED_PER_SHOP) : []
}

// Homepage promotion is part of the Pro plan and up; Επιχείρηση shops come first.
export function promotionTier(seller: any, now = Date.now()) {
  return planFeaturesFor(seller?.metadata?.vitrinaki_subscription, now).promoted
}

// Same rule as the public storefront routes: published, with an active or
// trialing subscription whose promo period has not run out.
export function isStorefrontVisible(seller: any, now = Date.now()) {
  const storefront = seller?.metadata?.vitrinaki_storefront
  const subscription = seller?.metadata?.vitrinaki_subscription
  if (!storefront?.isPublished || !subscription) return false
  if (!["active", "trialing"].includes(String(subscription.status))) return false
  const promoExpired =
    subscription.source === "promo" &&
    Boolean(subscription.currentPeriodEnd) &&
    new Date(String(subscription.currentPeriodEnd)).getTime() < now
  return !promoExpired
}
