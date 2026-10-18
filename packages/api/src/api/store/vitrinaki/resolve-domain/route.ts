import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const domain = String(req.query.domain || "").trim().toLowerCase().replace(/\.$/, "")
  if (
    !domain ||
    domain.length > 253 ||
    domain.includes("/") ||
    domain.includes(":") ||
    !/^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)
  ) return res.status(400).json({ message: "Invalid domain." })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "seller",
    fields: ["id", "handle", "metadata"],
    filters: {},
    pagination: { take: 1000 },
  })

  const seller = (data || []).find((candidate: any) => {
    const storefront = candidate.metadata?.vitrinaki_storefront
    const subscription = candidate.metadata?.vitrinaki_subscription
    return (
      storefront?.isPublished === true &&
      storefront?.domainStatus === "verified" &&
      String(storefront?.customDomain || "").toLowerCase() === domain &&
      ["active", "trialing"].includes(String(subscription?.status || ""))
    )
  }) as any

  if (!seller) return res.status(404).json({ message: "No active Vitrinaki storefront is connected to this domain." })
  return res.json({ handle: seller.handle, locale: process.env.VITRINAKI_DEFAULT_LOCALE || "gr" })
}
