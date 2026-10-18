// Where professionals sign up and manage their shop (the Vitrinaki Studio vendor panel).
const backend = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9100").replace(/\/+$/, "")

export const studioUrl = (process.env.NEXT_PUBLIC_VENDOR_URL || `${backend}/seller`).replace(/\/+$/, "")
export const studioRegisterUrl = `${studioUrl}/register`
export const studioLoginUrl = `${studioUrl}/login`
