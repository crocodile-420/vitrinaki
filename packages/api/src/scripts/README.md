# Custom CLI Script

A custom CLI script is a function to execute through Medusa's CLI tool. This is useful when creating custom Medusa tooling to run as a CLI tool.

> Learn more about custom CLI scripts in [this documentation](https://docs.medusajs.com/learn/fundamentals/custom-cli-scripts).

## How to Create a Custom CLI Script?

To create a custom CLI script, create a TypeScript or JavaScript file under the `src/scripts` directory. The file must default export a function.

For example, create the file `src/scripts/my-script.ts` with the following content:

```ts title="src/scripts/my-script.ts"
import { 
  ExecArgs,
} from "@medusajs/framework/types"

export default async function myScript ({
  container
}: ExecArgs) {
  const productModuleService = container.resolve("product")

  const [, count] = await productModuleService.listAndCountProducts()

  console.log(`You have ${count} product(s)`)
}
```

The function receives as a parameter an object having a `container` property, which is an instance of the Medusa Container. Use it to resolve resources in your Medusa application.

---

## How to Run Custom CLI Script?

To run the custom CLI script, run the `exec` command:

```bash
npx medusa exec ./src/scripts/my-script.ts
```

---

## Custom CLI Script Arguments

Your script can accept arguments from the command line. Arguments are passed to the function's object parameter in the `args` property.

For example:

```ts
import { ExecArgs } from "@medusajs/framework/types"

export default async function myScript ({
  args
}: ExecArgs) {
  console.log(`The arguments you passed: ${args}`)
}
```

Then, pass the arguments in the `exec` command after the file path:

```bash
npx medusa exec ./src/scripts/my-script.ts arg1 arg2
```
## Vitrinaki demo stores (`seed-demo-profiles.ts`)

Creates one clearly labelled DEMO store per business type (`demo-trofima`,
`demo-xeiropoiita`, `demo-katastima`, `demo-omorfia`, `demo-ypiresies`,
`demo-portfolio`), filled through the same store-profile fields as the Studio
wizard. Additive and idempotent: an existing handle is skipped, nothing is
deleted. Needs the `vitrinaki_seller_private` table, so run the migration first.

```bash
npx medusa db:migrate --skip-links          # adds the vitrinaki_seller_private table
VITRINAKI_STOREFRONT_URL=https://vitrinaki.gr npm run seed:demo-profiles
# hide them again (unpublish, keeps the data):
DEMO_PROFILES_ACTION=unpublish npm run seed:demo-profiles
```

Demo images point to the storefront's own `/home/*.webp` files under
`VITRINAKI_STOREFRONT_URL`. Demo logins: `<handle>@vitrinaki.gr`, password from
`DEMO_SELLER_PASSWORD` (default `supersecret`). To delete a demo store for
good, use the admin panel.
