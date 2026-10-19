// Where professionals sign up and manage their shop.
const backend = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9100").replace(/\/+$/, "")

// The Studio (vendor panel) where a seller manages their shop.
export const studioUrl = (process.env.NEXT_PUBLIC_VENDOR_URL || `${backend}/seller`).replace(/\/+$/, "")
export const studioLoginUrl = `${studioUrl}/login`

// Sign-up + product page on this site: /<locale>/start. The Studio's own
// /register redirects here too (apps/vendor/src/main.tsx).
export const startPath = "/start"
export const startHref = (locale: string) => `/${locale}${startPath}`

// Legal pages linked from the sign-up terms checkbox. Not built yet: until the
// env vars are set the checkbox shows the names without links.
export const termsUrl = process.env.NEXT_PUBLIC_TERMS_URL || ""
export const privacyUrl = process.env.NEXT_PUBLIC_PRIVACY_URL || ""
