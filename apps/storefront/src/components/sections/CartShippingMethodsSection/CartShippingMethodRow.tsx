"use client"

import { useTranslator } from "@/lib/i18n/client"
import { Button } from "@/components/atoms"
import { BinIcon } from "@/icons"

import { convertToLocale } from "@/lib/helpers/money"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import { CourierBadge } from "./CourierBadge"

export const CartShippingMethodRow = ({
  method,
  sellerName,
  courier,
  currency_code,
  onRemoveShippingMethod,
}: {
  method: HttpTypes.StoreCartShippingMethod
  sellerName?: string
  courier?: string | null
  currency_code: string
  onRemoveShippingMethod: (methodId: string) => void
}) => {
  const { tr } = useTranslator()
  return (
    <div className="mb-4 border rounded-md p-4 flex items-center justify-between">
      <div>
        <Text className="txt-medium-plus text-ui-fg-base mb-1">
          {sellerName ?? tr("Τρόπος αποστολής")}
        </Text>
        <Text className="txt-medium text-ui-fg-subtle flex flex-wrap items-center">
          <CourierBadge name={courier} />
          {method?.name}{" "}
          {Number(method?.amount) === 0
            ? tr("Δωρεάν")
            : convertToLocale({
                amount: method?.amount!,
                currency_code: currency_code,
              })}
        </Text>
      </div>

      <Button
        variant="tonal"
        size="small"
        className="p-2"
        onClick={() => onRemoveShippingMethod(method.id)}
      >
        <BinIcon size={16} />
      </Button>
    </div>
  )
}
