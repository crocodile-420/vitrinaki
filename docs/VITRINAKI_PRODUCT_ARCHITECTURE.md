# Vitrinaki: product architecture and rollout

## Product definition

Vitrinaki is both:

1. A public discovery platform for Greek small businesses and selected products.
2. A SaaS platform that helps each business create and operate its own independent website/storefront.

It is not intended to be only an inventory dashboard or a conventional marketplace where every shopper must check out centrally. The central Vitrinaki site should introduce businesses and promote products, with promoted items primarily linking customers to the business's own shop when a published shop URL is available.

## Product surfaces

| Surface | Audience | Responsibility | Current local address |
| --- | --- | --- | --- |
| Public Vitrinaki site | Shoppers and prospective businesses | Discover products/businesses and explain the platform | `http://localhost:3100` |
| Business Studio (currently vendor frontend) | Business owners and staff | Manage business details and, as developed, products, storefront configuration and publishing | `http://localhost:7001` |
| Platform Admin | Vitrinaki operations | Manage the platform, seller accounts, access and future subscription state | `http://localhost:7000` |
| Backend API | All frontends | Business data, catalog/offers, authentication and commerce operations | `http://localhost:9100` |
| Business-owned websites | Each business's customers | Independent branded storefront at `/{locale}/store/{handle}`, with custom-domain routing when DNS/hosting are configured | `http://localhost:3100/gr/store/{handle}` locally |

The local ports are for development. Production can use domains/subdomains or other routing, once host routing and domain management exist.

## Current implementation vs. target

### Existing infrastructure

- Medusa provides commerce primitives such as products, carts, orders, regions and API infrastructure.
- MercurJS provides seller, offer and vendor-panel capabilities on top of Medusa.
- The current data model has a shared master product catalog plus seller offers. Seller-specific price/inventory and ownership context are represented through offers.
- The storefront has product/category routes and seller profile pages.

### Implemented in the current development branch

- Public Vitrinaki discovery still uses real offer data from the existing API.
- Each business can configure its store name, tagline, description, template choice, palette, and contact details from the custom Vitrinaki Studio page.
- The settings are currently stored in the seller's `metadata.vitrinaki_storefront` object and protected by the seller-authenticated backend route.
- Public shop pages render at `/{locale}/store/{handle}`. Product cards in a shop route to its own product-detail path and reuse the existing offer/cart integration.
- Publication is blocked unless seller metadata records an `active` or `trialing` Stripe subscription. The Stripe webhook updates that subscription status and withdraws publication when a subscription is no longer active.
- Monthly/yearly Stripe Checkout, Stripe Billing Portal, optional one-time Assisted Setup and Done-for-you checkout routes are implemented, but they remain disabled until server secrets and Stripe price IDs are configured.
- Custom-domain verification checks a TXT challenge and a CNAME against `VITRINAKI_CUSTOM_DOMAIN_TARGET`; middleware resolves verified domains to their business storefront. Hosting must also accept the hostname and provide HTTPS/TLS.
- An internal read-only Vitrinaki overview is added to the platform admin.

### Known implementation boundaries — not ready to claim production-complete

- Website editing is a first version of settings/template/palette selection, not a drag-and-drop page builder or a custom content-block editor.
- Products still use the existing shared Medusa product records and seller-scoped Mercur offers. Product inventory/prices remain offer-based.
- Shop metadata, Stripe subscription state, and setup orders are stored under seller metadata for this MVP; move these to dedicated versioned modules/tables before high-volume production and add reconciliation jobs.
- A custom domain needs DNS changes, hosting-provider domain registration, and automatic certificate provisioning outside this code. DNS verification alone is not enough.
- Configure and verify real Stripe products/prices, webhook endpoint `/webhooks/stripe`, and webhook event delivery before accepting any live charges.
- Add API/UI integration tests for authentication, tenant isolation, checkout/webhook ordering, domain verification, and subscription transitions; run the full build on the target Windows setup before merging.

## Public shop URL convention

Until a dedicated storefront-domain model exists, the discovery homepage reads an optional seller metadata property:

```json
{
  "storefront_url": "https://shop.example.gr"
}
```

This must be an absolute HTTP or HTTPS URL. Unsupported protocols and malformed URLs are ignored. Do not put secrets in this metadata. A business user-facing form to manage this field is not part of the current change; add it in a later onboarding/storefront configuration milestone.

## Proposed revenue model (not implemented by this change)

The planned commercial model has two distinct charges:

- **Subscription:** recurring monthly or annual charge for platform access and the ongoing hosted website/service.
- **One-time setup service:** optional Assisted Setup or Done-for-you work where Vitrinaki staff configure a theme, branding, pages and an agreed number of products.

An upfront setup fee does not replace the recurring subscription if Vitrinaki continues hosting and operating the store. The DIY plan includes access to the website builder once it exists. Setup services charge for human work, not for access to the same feature twice.

Prices discussed during product planning are proposals only. Do not hard-code prices or present billing as available until subscription infrastructure and terms are implemented.

## Recommended milestones

1. **Stabilize the existing foundation:** API connectivity, Greek region, publishable key, admin/vendor login and reproducible local startup.
2. **Discovery MVP:** show real published offers and send shoppers to a configured business shop URL; verify the fallback to internal seller profiles.
3. **Business onboarding:** create a business identity, ownership/memberships, and storefront configuration.
4. **Independent websites:** per-business branding, themes/content, publication lifecycle and a stable route/domain strategy.
5. **Subscriptions and setup services:** payment provider integration, plan entitlements, recurring billing webhooks, failed-payment/grace-period rules and admin operations.
6. **Vitrinaki growth features:** curated promotion, attribution/analytics and optional paid visibility, with transparent business rules.

## Development rules

- Reuse existing Medusa/Mercur functionality where it fits; do not rewrite everything.
- Do not assume a mockup represents implemented functionality.
- Do not reset a database or silently delete business data during setup.
- Verify real API/build/test results before claiming a workflow is working.


## Environment needed for payments and custom domains

Set these in `packages/api/.env` (never commit secret values):

- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_STARTER_YEARLY`, `STRIPE_PRICE_GROWTH_MONTHLY`, `STRIPE_PRICE_GROWTH_YEARLY`, `STRIPE_PRICE_PRO_MONTHLY`, and `STRIPE_PRICE_PRO_YEARLY`.
- `STRIPE_PRICE_SETUP_ASSISTED` and `STRIPE_PRICE_SETUP_DONE_FOR_YOU` for optional one-time services.
- `STRIPE_PRICE_PREMIUM_MONTHLY` (recurring, monthly) and `STRIPE_PRICE_PREMIUM_ACTIVATION` (one-time) for the Premium templates add-on. Business includes premium, so neither is charged on it.
- `VITRINAKI_STOREFRONT_URL`, `VITRINAKI_STUDIO_URL`, and `VITRINAKI_DEFAULT_LOCALE`.
- `VITRINAKI_CUSTOM_DOMAIN_TARGET` with the actual CNAME target supplied by the hosting provider.
- `VITRINAKI_PLATFORM_HOSTS` as a comma-separated list of platform hostnames, including both root and `www` where applicable.

Stripe Checkout stays disabled when secrets/price IDs are absent. Use Stripe test mode until checkout, webhook signature verification, successful renewal, failed payment and cancellation have been tested end to end.
