import { MedusaService } from "@medusajs/framework/utils"

import SellerPrivate from "./models/seller-private"

class VitrinakiPrivateModuleService extends MedusaService({ SellerPrivate }) {}

export default VitrinakiPrivateModuleService
