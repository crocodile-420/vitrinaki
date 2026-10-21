import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Sign-up helper for the public «Άνοιξε τη βιτρίνα σου» page: is a shop name /
// shop address (handle) still free? Seller name, handle and email are unique,
// so the page checks them before it creates the login, which would otherwise
// be left without a shop. Answers only booleans (plus a free handle to suggest).

const HANDLE_RE = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/
// Addresses that would be confusing or collide with site paths.
const RESERVED = new Set([
  "admin", "api", "app", "auth", "account", "cart", "checkout", "dashboard", "help", "login", "logout",
  "register", "seller", "sellers", "shop", "start", "static", "store", "stores", "studio", "support",
  "user", "vendor", "vitrinaki", "www", "mail", "info", "about", "terms", "privacy",
])

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`)

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const name = String(req.query.name || "").trim().slice(0, 100)
  const handle = String(req.query.handle || "").trim().toLowerCase().slice(0, 48)
  const email = String(req.query.email || "").trim().toLowerCase().slice(0, 254)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const exists = async (filters: Record<string, unknown>) => {
    const { data } = await query.graph({ entity: "seller", fields: ["id"], filters, pagination: { take: 1 } })
    return Boolean(data?.length)
  }

  const result: {
    name?: { available: boolean }
    handle?: { valid: boolean; available: boolean; suggestion?: string }
    email?: { available: boolean }
  } = {}

  if (name) result.name = { available: !(await exists({ name: { $ilike: escapeLike(name) } })) }

  if (handle) {
    const valid = HANDLE_RE.test(handle) && !handle.includes("--")
    const taken = (h: string) => RESERVED.has(h) || exists({ handle: h })
    const available = valid && !(await taken(handle))
    result.handle = { valid, available }
    if (valid && !available) {
      const base = handle.replace(/-\d+$/, "").slice(0, 44)
      for (let i = 2; i < 10; i++) {
        const candidate = `${base}-${i}`
        if (!(await taken(candidate))) {
          result.handle.suggestion = candidate
          break
        }
      }
    }
  }

  if (email) result.email = { available: !(await exists({ email })) }

  res.setHeader("Cache-Control", "no-store")
  return res.json(result)
}
