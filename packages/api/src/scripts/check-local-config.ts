import fs from "fs"
import path from "path"

const root = path.resolve(process.cwd(), "../..")
const apiEnvFiles = ["packages/api/.env"]
const storefrontEnvFiles = [
  "apps/storefront/.env",
  "apps/storefront/.env.local",
  "apps/storefront/.env.development",
  "apps/storefront/.env.development.local",
]

const parse = (file: string) => {
  if (!fs.existsSync(file)) return new Map<string, string>()
  return new Map(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=")
        return index < 0
          ? [line.trim(), ""]
          : [line.slice(0, index).trim(), line.slice(index + 1).trim()]
      }),
  )
}

const resolved = new Map<string, { file: string; value: string }>()
const duplicateKeys = new Map<string, string[]>()

for (const relative of [...apiEnvFiles, ...storefrontEnvFiles]) {
  const file = path.join(root, relative)
  const values = parse(file)

  for (const [key, value] of values) {
    if (resolved.has(key)) {
      const existing = duplicateKeys.get(key) ?? [resolved.get(key)!.file]
      duplicateKeys.set(key, [...existing, relative])
    }
    resolved.set(key, { file: relative, value })
  }
}

const requiredApi = [
  "DATABASE_URL",
  "STORE_CORS",
  "ADMIN_CORS",
  "VENDOR_CORS",
  "AUTH_CORS",
  "JWT_SECRET",
  "COOKIE_SECRET",
]

const missingApi = requiredApi.filter((key) => !parse(path.join(root, apiEnvFiles[0])).get(key))
const storefrontResolved = new Map<string, { file: string; value: string }>()
for (const relative of storefrontEnvFiles) {
  for (const [key, value] of parse(path.join(root, relative))) {
    storefrontResolved.set(key, { file: relative, value })
  }
}

const backendUrl = storefrontResolved.get("MEDUSA_BACKEND_URL")?.value
const key = storefrontResolved.get("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY")?.value

const errors: string[] = []
if (missingApi.length) errors.push(`Missing required API variables: ${missingApi.join(", ")}`)
if (!backendUrl) errors.push("Missing storefront MEDUSA_BACKEND_URL.")
if (backendUrl && backendUrl !== "http://localhost:9100") {
  errors.push(`Storefront MEDUSA_BACKEND_URL resolves to ${backendUrl}, expected http://localhost:9100.`)
}
if (!key) errors.push("No NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is visible to the local env resolution.")
if (key === "undefined" || key === "null") errors.push("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY contains an invalid placeholder value.")

const duplicateMessage = [...duplicateKeys.entries()]
  .filter(([key]) => ["NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY", "MEDUSA_BACKEND_URL"].includes(key))
  .map(([key, files]) => `${key}: ${files.join(", ")}`)
if (duplicateMessage.length) {
  errors.push(`Duplicate env definitions across local env files may cause precedence surprises: ${duplicateMessage.join(" | ")}`)
}

if (errors.length) {
  console.error("Local Vitrinaki configuration check failed:")
  errors.forEach((error) => console.error(`- ${error}`))
  process.exitCode = 1
} else {
  console.log("Local Vitrinaki configuration check passed.")
  console.log(`- Backend: ${backendUrl}`)
  console.log("- Publishable key: present (value not printed)")
}
