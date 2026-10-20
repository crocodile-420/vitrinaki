// seller.metadata keys that only the backend writes: the subscription
// (billing webhook, checkout, promo codes), the shop's Stripe Connect account
// and the referral programme. Mercur's vendor seller routes accept any
// metadata, so the client's copy of these keys is replaced by the stored one.
export const SERVER_OWNED_SELLER_METADATA_KEYS = ["vitrinaki_subscription", "vitrinaki_stripe_connect", "vitrinaki_referral"] as const

// The incoming metadata with every server-owned key set to its stored value,
// or removed when nothing is stored.
export function keepServerOwnedMetadata(
  incoming: Record<string, unknown>,
  stored: Record<string, unknown> | null | undefined,
  keys: readonly string[] = SERVER_OWNED_SELLER_METADATA_KEYS
): Record<string, unknown> {
  const metadata = { ...incoming }
  for (const key of keys) {
    const value = stored?.[key]
    if (value !== undefined && value !== null) metadata[key] = value
    else delete metadata[key]
  }
  return metadata
}
