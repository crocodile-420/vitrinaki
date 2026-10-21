import { Module } from "@medusajs/framework/utils"

import VitrinakiPrivateModuleService from "./service"

export const VITRINAKI_PRIVATE_MODULE = "vitrinakiPrivate"

export default Module(VITRINAKI_PRIVATE_MODULE, {
  service: VitrinakiPrivateModuleService,
})
