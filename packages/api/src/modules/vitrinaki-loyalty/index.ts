import { Module } from "@medusajs/framework/utils"

import VitrinakiLoyaltyModuleService from "./service"

export const VITRINAKI_LOYALTY_MODULE = "vitrinakiLoyalty"

export default Module(VITRINAKI_LOYALTY_MODULE, {
  service: VitrinakiLoyaltyModuleService,
})
