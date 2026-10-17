import fs from "fs"
import path from "path"

const root = path.resolve(process.cwd(), "../..")
const apiEnvFiles = ["packages/api/.env"]

// Ordered from lowest to highest file precedence for Next.js development mode.
// Existing values in the Next.js process.env take precedence over all files.
const storefrontEnvFiles = [
  "apps/storefront/.env",
  "apps/storefront/.env.development",
  "apps/storefront/.env.local",
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

const duplicateKeys = new Map<string, string[]>()

for (const relative of [...apiEnvFiles, ...storefrontEnvFiles]) {
  const file = path.join(root, relative)
  const values = parse(file)
  for (const key of values.keys()) {
    const existing = duplicateKeys.get(key)
    if (existing) {
      existing.push(relative)
    } else {
      // Record the first file defining this key; later definitions are overrides.
      duplicateKeys.set(key, [relative])
    }
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

const apiValues = parse(path.join(root, apiEnvFiles[0]))
const missingApi = requiredApi.filter((key) => !apiValues.get(key))

// Resolve files from lowest to highest priority, so the last definition wins.
const storefrontResolved = new Map<string, { file: string; value: string }>()
for (const relative of storefrontEnvFiles) {
  for (const [key, value] of parse(path.join(root, relative))) {
    storefrontResolved.set(key, { file: relative, value })
  }
}

const backend = storefrontResolved.get("MEDUSA_BACKEND_URL")
const publishableKey = storefrontResolved.get("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY")

const errors: string[] = []
if (missingApi.length) errors.push(`Missing required API variables: ${missingApi.join(", ")}`)
if (!backend?.value) errors.push("Missing storefront MEDUSA_BACKEND_URL.")
if (backend?.value && backend.value !== "http://localhost:9100") {
  errors.push(`Storefront MEDUSA_BACKEND_URL resolves to ${backend.value}, expected http://localhost:9100.`)
}
if (!publishableKey?.value) errors.push("No NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is visible in the storefront env files.")
if (publishableKey?.value === "undefined" || publishableKey?.value === "null") {
  errors.push("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY contains an invalid placeholder value.")
}

// Overrides are not inherently erroneous: .env.local is expected to override
// .env, for example. Report which files define a variable, but do not fail solely
// because a known lower-priority file also defines it.
const overrideMessages = [...duplicateKeys.entries()]
  .filter(([key, files]) =>
    files.length > 1 &&
    ["NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY", "MEDUSA_BACKEND_URL"].includes(key)
  )
  .map(([key, files]) => `${key} is defined in: ${files.join(", ")}`)

if (errors.length) {
  console.error("Local Vitrinaki configuration check failed:")
  errors.forEach((error) => console.error(`- ${error}`))
  process.exitCode = 1
} else {
  console.log("Local Vitrinaki configuration file check passed.")
  console.log(`- Backend: ${backend?.value}`)
  console.log(`- Publishable key: present in ${publishableKey?.file} (value not printed)`)
}

if (overrideMessages.length) {
  console.warn("Environment overrides found (higher-precedence files win):")
  overrideMessages.forEach((message) => console.warn(`- ${message}`))
}

console.log("Note: this check inspects env files only; it cannot inspect the environment of an already-running Next.js process.")
