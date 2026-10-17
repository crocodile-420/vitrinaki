import fs from "fs"
import path from "path"
import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"

export const writePublishableKey = (
  envPath: string,
  token: string,
): void => {
  const line = `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${token}`
  const current = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8")
    : ""

  // Remove every existing definition so a stale duplicate cannot override the
  // generated value within the same file.
  const withoutExistingKeys = current
    .replace(/^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd()

  const next = withoutExistingKeys
    ? `${withoutExistingKeys}\n${line}\n`
    : `${line}\n`

  fs.writeFileSync(envPath, next)
}

// Writes the active publishable API key into .env.local because Next.js gives
// .env.local higher precedence than .env/.env.development during local dev.
// The script also repairs the key's sales-channel scope when re-run.
export default async function storefrontKey({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)

  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id", "token", "revoked_at"],
    filters: { type: "publishable" },
  })

  const publishableApiKey = data.find((key) => !key.revoked_at)

  if (!publishableApiKey?.token) {
    logger.error("No active publishable API key found. Run `bun run seed` first.")
    return
  }

  const defaultSalesChannels =
    await salesChannelModuleService.listSalesChannels({
      name: "Default Sales Channel",
    })

  const defaultSalesChannel = defaultSalesChannels[0]
  if (!defaultSalesChannel) {
    logger.error(
      'No "Default Sales Channel" exists. Run `bun run seed` first.',
    )
    return
  }

  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishableApiKey.id,
        add: [defaultSalesChannel.id],
      },
    })
    logger.info("Verified publishable API key sales-channel scope.")
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("already")) {
      logger.info("Publishable API key is already linked to the default sales channel.")
    } else {
      throw error
    }
  }

  const envPath = path.resolve(process.cwd(), "../../apps/storefront/.env.local")
  writePublishableKey(envPath, publishableApiKey.token)

  logger.info(`Publishable key written to ${envPath}`)
}
