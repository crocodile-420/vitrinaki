"use client"

import { convertToLocale } from '@/lib/helpers/money';
import { useTranslator } from "@/lib/i18n/client"

export const CartItemsFooter = ({
  currency_code,
  price,
}: {
  currency_code: string;
  price: number;
}) => {
  const { tr } = useTranslator()
  return (
    <div className='border rounded-sm p-4 flex items-center justify-between label-md'>
      <p className='text-secondary'>{tr("Αποστολή")}</p>
      <p>
        {convertToLocale({
          amount: price / 1,
          currency_code,
        })}
      </p>
    </div>
  );
};
