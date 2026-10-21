import { Module } from "@medusajs/framework/utils"

import VitrinakiBookingsModuleService from "./service"

export const VITRINAKI_BOOKINGS_MODULE = "vitrinakiBookings"

export default Module(VITRINAKI_BOOKINGS_MODULE, {
  service: VitrinakiBookingsModuleService,
})
