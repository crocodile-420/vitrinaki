'use client';

import { Button } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { CartEmpty, CartItems, CartSummary } from '@/components/organisms';
import { LoyaltyBox } from '@/components/organisms/LoyaltyBox/LoyaltyBox';
import { OtherShopCarts } from '@/components/organisms/OtherShopCarts/OtherShopCarts';
import { PromoCode } from '@/components/organisms/PromoCode/PromoCode';
import { useCartContext } from '@/components/providers';
import { useTranslator } from '@/lib/i18n/client';

export const Cart = () => {
  const { cart } = useCartContext();
  const { tr } = useTranslator()

  if (!cart || !cart.items?.length) {
    return (
      <>
        <OtherShopCarts />
        <CartEmpty />
      </>
    );
  }

  return (
    <>
      <OtherShopCarts />
      <div className="col-span-12 lg:col-span-6">
        <CartItems cart={cart} />
      </div>
      <div className="lg:col-span-2"></div>
      <div className="col-span-12 lg:col-span-4">
        <div className="mb-4">
          <PromoCode cart={cart} />
        </div>
        <div className="mb-4">
          <LoyaltyBox cart={cart} />
        </div>
        <div className="h-fit rounded-sm border p-4">
          <CartSummary
            item_total={cart?.item_subtotal || 0}
            shipping_total={cart?.shipping_subtotal || 0}
            total={cart?.total || 0}
            currency_code={cart?.currency_code || ''}
            tax={cart?.tax_total || 0}
            discount_total={cart?.discount_subtotal || 0}
          />
          <LocalizedClientLink href="/checkout?step=address">
            <Button className="flex w-full items-center justify-center py-3">{tr("Ολοκλήρωση παραγγελίας")}</Button>
          </LocalizedClientLink>
        </div>
      </div>
    </>
  );
};
