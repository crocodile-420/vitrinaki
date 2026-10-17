# Vitrinaki

Ελληνική πλατφόρμα όπου ένας μικρός επαγγελματίας απαντά σε λίγες ερωτήσεις και παίρνει έτοιμο online κατάστημα, που εμφανίζεται και στο κοινό marketplace του vitrinaki.gr.

Χτισμένο πάνω στο [Mercur](https://github.com/mercurjs/mercur) (marketplace σε [Medusa](https://medusajs.com) v2, MIT).

## Δομή

- `packages/api`: backend (Medusa + Mercur), Postgres και Redis
- `apps/storefront`: Next.js, marketplace και sites πωλητών
- `apps/vendor`: πάνελ πωλητή
- `apps/admin`: πάνελ διαχείρισης

## Τοπική εκτέλεση

Χρειάζονται Node 20+, Bun, PostgreSQL 13+ και Redis.

```bash
bun install
cd packages/api
cp .env.template .env      # βάλε το DATABASE_URL
bunx medusa db:migrate
bun run seed               # δοκιμαστικά δεδομένα
bun run storefront-key     # γράφει το κλειδί στο apps/storefront/.env
cd ../.. && bun dev
```

- Backend: http://localhost:9100
- Admin: http://localhost:9100/dashboard
- Πάνελ πωλητή: http://localhost:9100/seller

## Product architecture

Vitrinaki is designed as both a public discovery platform for Greek businesses and a SaaS platform for independent business websites. See [the product architecture and rollout plan](docs/VITRINAKI_PRODUCT_ARCHITECTURE.md) for the distinction between current infrastructure and planned features.
