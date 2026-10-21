import { model } from "@medusajs/framework/utils"

// Private business and owner details of a Vitrinaki store (legal/invoicing
// and the responsible person). Kept in its own table, deliberately NOT linked
// to the seller entity, so no store-facing query.graph (e.g. Mercur's
// /store/sellers?fields=...) can ever traverse to it. Only the authenticated
// /vendor/vitrinaki/profile route and the operator read it.
const SellerPrivate = model.define("vitrinaki_seller_private", {
  id: model.id({ prefix: "vksp" }).primaryKey(),
  seller_id: model.text().unique(),
  legal: model.json().nullable(),
  owner: model.json().nullable(),
})

export default SellerPrivate
