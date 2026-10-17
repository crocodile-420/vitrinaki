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
| Business-owned websites | Each business's customers | Independent branded storefront, eventually with business-specific domain/subdomain | Not yet implemented as a first-class Vitrinaki feature |

The local ports are for development. Production can use domains/subdomains or other routing, once host routing and domain management exist.

## Current implementation vs. target

### Existing infrastructure

- Medusa provides commerce primitives such as products, carts, orders, regions and API infrastructure.
- MercurJS provides seller, offer and vendor-panel capabilities on top of Medusa.
- The current data model has a shared master product catalog plus seller offers. Seller-specific price/inventory and ownership context are represented through offers.
- The storefront has product/category routes and seller profile pages.

### Foundation added by this change

- The Vitrinaki homepage can show current published offers from the backend rather than relying only on visual examples.
- A promoted offer links to a seller's own shop if the seller metadata includes an absolute `storefront_url` using `https://` or `http://`.
- If no published external shop URL exists, the promoted offer falls back to the existing internal seller profile page. This is a compatibility fallback, not a claim that the seller already has an independent website.
- The homepage presents both product discovery and the path for a business to create its own web presence.

### Still missing / not claimed as complete

- A first-class Business/Storefront domain model, business onboarding workflow and dedicated website builder.
- Independent rendering/routing for each business's storefront and automated custom-domain/subdomain setup.
- A business-facing control for editing and verifying `storefront_url`.
- Subscription billing, recurring payment events, plans/entitlements, grace periods, cancellation and publishing-state enforcement.
- Formal access-control/integration tests proving tenant isolation for every business operation.
- Production-readiness validation and automated CI.

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
