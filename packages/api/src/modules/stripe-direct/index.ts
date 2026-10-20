import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import StripeDirectChargesService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [StripeDirectChargesService],
})
