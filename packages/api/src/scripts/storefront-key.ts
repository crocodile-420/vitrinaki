import fs from "fs"
import path from "path"
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Writes the publishable API key created by the seed into the storefront's
// .env, so setup works without querying the database by hand.
export default async function storefrontKey({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "api_key",
    fields: ["token"],
    filters: { type: "publishable" },
  })
  const token = data[0]?.token
  if (!token) {
    logger.error("No publishable API key found. Run `bun run seed` first.")
    return
  }

  const envPath = path.resolve(process.cwd(), "../../apps/storefront/.env")
  const line = `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${token}`
  const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : ""
  const next = /^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*$/m.test(current)
    ? current.replace(/^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*$/m, line)
    : `${current.trimEnd()}\n${line}\n`
  fs.writeFileSync(envPath, next)

  logger.info(`Publishable key written to ${envPath}`)
}
