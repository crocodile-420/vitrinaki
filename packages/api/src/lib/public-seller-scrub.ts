// Mercur's public /store/sellers routes return seller.metadata as is and let a
// client ask for extra relations via ?fields=. Strip everything that is not
// meant for shoppers: billing/subscription state, domain verification tokens,
// and the professional/address/payment/member relations. (Private profile data
// lives in its own unlinked table, so it can never appear here anyway.)
const PUBLIC_METADATA_KEYS = new Set(["vitrinaki_profile", "storefront_url"])
const PRIVATE_SELLER_KEYS = ["professional_details", "address", "payment_details", "members", "member_invites", "status_reason"]
export function scrubSeller(seller: any) {
  if (!seller || typeof seller !== "object") return seller
  for (const key of PRIVATE_SELLER_KEYS) delete seller[key]
  if (seller.metadata && typeof seller.metadata === "object") {
    seller.metadata = Object.fromEntries(Object.entries(seller.metadata).filter(([key]) => PUBLIC_METADATA_KEYS.has(key)))
  }
  return seller
}
// Offers and products can embed the seller too (?fields=+seller.*), so walk
// the response and scrub every "seller"/"sellers" value it contains.
export function scrubNested(value: any, depth = 0): void {
  if (!value || typeof value !== "object" || depth > 6) return
  if (Array.isArray(value)) {
    value.forEach((item) => scrubNested(item, depth + 1))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === "seller") scrubSeller(child)
    else if (key === "sellers" && Array.isArray(child)) child.forEach(scrubSeller)
    else scrubNested(child, depth + 1)
  }
}
