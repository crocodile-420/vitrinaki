'use client';

import { useEffect, useState } from 'react';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { useCartContext } from '@/components/providers';
import { listOtherShopCarts, ShopCartSummary, switchShopCart } from '@/lib/data/cart';
import { convertToLocale } from '@/lib/helpers/money';
import { useTranslator } from '@/lib/i18n/client';

// Each shop has its own cart and checkout. This lists the shopper's carts in
// other shops so they can switch to one and pay for it separately.
export function OtherShopCarts() {
  const { cart, refreshCart } = useCartContext();
  const { lang, tr } = useTranslator();
  const [carts, setCarts] = useState<ShopCartSummary[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listOtherShopCarts()
      .then(result => {
        if (!cancelled) setCarts(result);
      })
      .catch(() => {
        if (!cancelled) setCarts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [cart?.id]);

  if (!carts.length) return null;

  const onSwitch = async (cartId: string) => {
    setSwitching(cartId);
    try {
      await switchShopCart(cartId);
      await refreshCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSwitching(null);
    }
  };

  return (
    <section
      className="col-span-12 mb-6 rounded-sm border border-[#2E4A37]/20 bg-[#F7F2E8] p-4"
      data-testid="other-shop-carts"
    >
      <h2 className="heading-xs text-[#1F3628]">
        {tr('Έχεις καλάθι και σε άλλα καταστήματα')}
      </h2>
      <p className="mt-1 text-md text-secondary">
        {tr('Κάθε κατάστημα έχει το δικό του καλάθι και πληρώνεται ξεχωριστά.')}
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {carts.map(other => {
          const count =
            other.itemCount === 1
              ? tr('1 προϊόν')
              : tr('{count} προϊόντα').replace('{count}', String(other.itemCount));
          return (
            <li
              key={other.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-sm border bg-white p-3"
              data-testid={`other-shop-cart-${other.seller?.handle || other.id}`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-primary">
                  {other.seller?.name || tr('Κατάστημα')}
                </p>
                <p className="text-md text-secondary">
                  {count} ·{' '}
                  {convertToLocale({
                    amount: other.total,
                    currency_code: other.currency_code,
                    locale: lang === 'el' ? 'el-GR' : 'en-US'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {other.seller?.handle ? (
                  <LocalizedClientLink
                    href={`/store/${other.seller.handle}`}
                    className="text-md text-[#265E8E] underline-offset-2 hover:underline"
                  >
                    {tr('Στο κατάστημα')}
                  </LocalizedClientLink>
                ) : null}
                <button
                  type="button"
                  onClick={() => onSwitch(other.id)}
                  disabled={switching !== null}
                  className="rounded-sm bg-[#2E4A37] px-4 py-2 text-md font-medium text-white hover:bg-[#1F3628] disabled:opacity-60"
                >
                  {switching === other.id ? tr('Φόρτωση…') : tr('Δες αυτό το καλάθι')}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
