'use client';

import { useEffect, useId, useState, useTransition } from 'react';

import { Button, Card, Input } from '@/components/atoms';
import { useCartContext } from '@/components/providers';
import { BinIcon, CollapseIcon, DiscountIcon } from '@/icons';
import { applyPromotions, deletePromotionCode } from '@/lib/data/cart';
import { convertToLocale } from '@/lib/helpers/money';
import { toast } from '@/lib/helpers/toast';
import { useTranslator } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';

type Adjustment = { code?: string | null; amount?: number | null };

// What each applied code takes off, before tax, formatted like the cart
// summary's «Έκπτωση» line. A shop's code only touches that shop's lines.
const discountFor = (cart: any, code: string) =>
  [
    ...(cart?.items ?? []).flatMap((item: any) => item.adjustments ?? []),
    ...(cart?.shipping_methods ?? []).flatMap((method: any) => method.adjustments ?? [])
  ]
    .filter((adjustment: Adjustment) => adjustment.code === code)
    .reduce((sum: number, adjustment: Adjustment) => sum + Number(adjustment.amount || 0), 0);

// «Κωδικός έκπτωσης»: the customer types a code a shop created in the Studio
// («Προωθήσεις»), sees what it takes off and can remove it again.
export const PromoCode = ({ cart, defaultOpen = false }: { cart: any; defaultOpen?: boolean }) => {
  const { tr } = useTranslator();
  const { refreshCart } = useCartContext();
  const applied: { id: string; code: string }[] = (cart?.promotions ?? []).filter(
    (promotion: any) => promotion?.code
  );
  const [isOpen, setIsOpen] = useState(defaultOpen || applied.length > 0);
  // A code applied from elsewhere (a loyalty reward) shows up here at once.
  useEffect(() => {
    if (applied.length > 0) setIsOpen(true);
  }, [applied.length]);
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const errorId = useId();
  const currency = cart?.currency_code || 'eur';

  const handleApplyCode = () => {
    const code = promoCode.trim();
    if (!code || isPending) return;

    if (applied.some(promotion => promotion.code.toUpperCase() === code.toUpperCase())) {
      setError(tr('Ο κωδικός έχει ήδη εφαρμοστεί'));
      return;
    }

    setError('');
    startTransition(async () => {
      const result = await applyPromotions([code]);
      await refreshCart();

      if (!result.success) {
        setError(
          result.error === 'invalid'
            ? tr('Ο κωδικός δεν είναι έγκυρος')
            : tr('Κάτι πήγε στραβά. Δοκίμασε ξανά.')
        );
        return;
      }

      if (!result.applied) {
        setError(tr('Ο κωδικός δεν ισχύει για τα προϊόντα του καλαθιού σου'));
        return;
      }

      toast.success({ title: tr('Ο κωδικός έκπτωσης εφαρμόστηκε') });
      setPromoCode('');
    });
  };

  const handleRemoveCode = (code: string) => {
    if (isPending) return;

    setError('');
    startTransition(async () => {
      const result = await deletePromotionCode(code);
      await refreshCart();
      if (result.success) {
        toast.success({ title: tr('Ο κωδικός έκπτωσης αφαιρέθηκε') });
      } else {
        toast.info({ title: tr('Δεν ήταν δυνατή η αφαίρεση του κωδικού') });
      }
    });
  };

  return (
    <Card data-testid="promo-code">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center justify-between px-2 text-left"
      >
        <span className="flex items-center gap-2">
          <DiscountIcon size={20} />
          <span className="label-md">{tr('Κωδικός έκπτωσης')}</span>
        </span>
        <CollapseIcon
          size={20}
          className={cn('transition-all duration-300', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="px-2 pt-4">
          {applied.length > 0 && (
            <ul className="mb-3 flex flex-col gap-2">
              {applied.map(promotion => {
                const amount = discountFor(cart, promotion.code);
                return (
                  <li
                    key={promotion.id}
                    data-testid="promo-code-applied"
                    className="flex items-center justify-between gap-3 rounded-sm border border-dashed px-3 py-2"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="label-md truncate">{promotion.code}</span>
                      <span className="text-sm text-secondary">
                        {amount > 0
                          ? `${tr('Έκπτωση')} −${convertToLocale({ amount, currency_code: currency })}`
                          : tr('Εφαρμόστηκε')}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCode(promotion.code)}
                      disabled={isPending}
                      aria-label={`${tr('Αφαίρεση')} ${promotion.code}`}
                      className="flex shrink-0 items-center gap-1 text-sm text-secondary transition-colors hover:text-red-600 disabled:opacity-50"
                    >
                      <BinIcon size={18} />
                      {tr('Αφαίρεση')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <form
            onSubmit={e => {
              e.preventDefault();
              handleApplyCode();
            }}
            className="flex w-full items-start gap-3 [&>div]:flex-grow"
          >
            <Input
              type="text"
              value={promoCode}
              onChange={e => {
                setPromoCode(e.target.value);
                setError('');
              }}
              placeholder={tr('Γράψε τον κωδικό')}
              aria-label={tr('Κωδικός έκπτωσης')}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={64}
              error={!!error}
              className="h-12 flex-grow"
              data-testid="promo-code-input"
            />
            <Button
              type="submit"
              disabled={isPending || !promoCode.trim()}
              loading={isPending}
              size="large"
              className="mt-2 h-12"
              variant="filled"
            >
              {tr('Εφαρμογή')}
            </Button>
          </form>
          {error && (
            <p
              id={errorId}
              role="alert"
              className="mt-2 text-sm text-red-600"
              data-testid="promo-code-error"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
