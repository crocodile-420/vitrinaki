'use client';

import { useEffect, useState, useTransition } from 'react';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { useCartContext } from '@/components/providers';
import { type CartLoyalty, getCartLoyalty, type LoyaltyReward, redeemLoyaltyReward } from '@/lib/data/loyalty';
import { missingText, pointsText, rewardText } from '@/lib/helpers/loyalty';
import { toast } from '@/lib/helpers/toast';
import { useTranslator } from '@/lib/i18n/client';

// The cart page's points box for a single-shop cart. The shop decides in the
// Studio whether it gives points, how many per € and what they buy.
export const LoyaltyBox = ({ cart }: { cart: any }) => {
  const { lang, tr } = useTranslator();
  const { refreshCart } = useCartContext();
  const [loyalty, setLoyalty] = useState<CartLoyalty>({ enabled: false });
  const [isPending, startTransition] = useTransition();
  const [busyReward, setBusyReward] = useState<string | null>(null);
  const locale = lang === 'el' ? 'el-GR' : 'en-US';

  // Re-read when the cart changes: what this order earns follows its total.
  const itemTotal = cart?.item_total;
  const promoKey = (cart?.promotions ?? []).map((p: any) => p?.code).join(',');
  useEffect(() => {
    let cancelled = false;
    getCartLoyalty(cart?.id)
      .then(result => {
        if (!cancelled) setLoyalty(result);
      })
      .catch(() => {
        if (!cancelled) setLoyalty({ enabled: false });
      });
    return () => {
      cancelled = true;
    };
  }, [cart?.id, itemTotal, promoKey]);

  if (!loyalty.enabled) return null;

  const earnLine =
    loyalty.earn > 0
      ? (loyalty.earn === 1
          ? tr('Με αυτή την παραγγελία θα κερδίσεις 1 πόντο.')
          : tr('Με αυτή την παραγγελία θα κερδίσεις {n} πόντους.').replace('{n}', loyalty.earn.toLocaleString(locale)))
      : null;

  if (!loyalty.logged_in) {
    return (
      <section className="rounded-sm border border-[#2E4A37]/20 bg-[#F7F2E8] p-4" data-testid="loyalty-box">
        <h2 className="label-md text-[#1F3628]">{tr('Πόντοι σε αυτό το κατάστημα')}</h2>
        <p className="mt-1 text-md text-secondary">
          {loyalty.earn > 0
            ? (loyalty.earn === 1
                ? tr('Συνδέσου για να κερδίσεις 1 πόντο με αυτή την παραγγελία.')
                : tr('Συνδέσου για να κερδίσεις {n} πόντους με αυτή την παραγγελία.').replace('{n}', loyalty.earn.toLocaleString(locale)))
            : tr('Συνδέσου για να μαζεύεις πόντους με τις αγορές σου.')}
        </p>
        <LocalizedClientLink
          href="/login"
          className="mt-3 inline-block text-md font-medium text-[#265E8E] underline-offset-2 hover:underline"
          data-testid="loyalty-login"
        >
          {tr('Σύνδεση ή εγγραφή')}
        </LocalizedClientLink>
      </section>
    );
  }

  const points = loyalty.points ?? 0;
  const affordable = loyalty.rewards.filter(r => loyalty.affordable.includes(r.id));
  const next = loyalty.rewards
    .filter(r => r.points > points)
    .sort((a, b) => a.points - b.points)[0];

  const redeem = (reward: LoyaltyReward) => {
    if (isPending) return;
    setBusyReward(reward.id);
    startTransition(async () => {
      const result = await redeemLoyaltyReward(reward.id);
      await refreshCart();
      setLoyalty(await getCartLoyalty(cart?.id));
      setBusyReward(null);
      if (!result.ok) {
        toast.error({ title: tr(result.message) });
        return;
      }
      if (result.applied) toast.success({ title: tr('Η ανταμοιβή εφαρμόστηκε στο καλάθι σου') });
      else if (result.pending) toast.success({ title: tr('Τα δωρεάν μεταφορικά θα εφαρμοστούν στο ταμείο') });
      else toast.info({ title: tr('Ο κωδικός σου: {code}').replace('{code}', result.code) });
    });
  };

  return (
    <section className="rounded-sm border border-[#2E4A37]/20 bg-[#F7F2E8] p-4" data-testid="loyalty-box">
      <h2 className="label-md text-[#1F3628]" data-testid="loyalty-balance">
        {points === 1
          ? tr('Έχεις 1 πόντο σε αυτό το κατάστημα')
          : tr('Έχεις {n} πόντους σε αυτό το κατάστημα').replace('{n}', points.toLocaleString(locale))}
      </h2>
      {earnLine ? <p className="mt-1 text-md text-secondary" data-testid="loyalty-earn">{earnLine}</p> : null}

      {affordable.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {affordable.map(reward => (
            <li
              key={reward.id}
              className="flex items-center justify-between gap-3 rounded-sm border bg-white px-3 py-2"
              data-testid="loyalty-reward"
            >
              <span className="min-w-0">
                <span className="block font-medium text-primary">{rewardText(tr, reward, locale)}</span>
                <span className="block text-sm text-secondary">{pointsText(tr, reward.points, locale)}</span>
              </span>
              <button
                type="button"
                onClick={() => redeem(reward)}
                disabled={isPending}
                className="shrink-0 rounded-sm bg-[#2E4A37] px-3 py-2 text-md font-medium text-white hover:bg-[#1F3628] disabled:opacity-60"
              >
                {busyReward === reward.id ? tr('Φόρτωση…') : tr('Εξαργύρωση')}
              </button>
            </li>
          ))}
        </ul>
      ) : next ? (
        <p className="mt-3 text-md text-secondary" data-testid="loyalty-next">
          {missingText(tr, next.points - points, next, locale)}
        </p>
      ) : null}

      {loyalty.pending_codes.length > 0 ? (
        <p className="mt-3 rounded-sm border border-dashed border-[#2E4A37]/40 bg-white px-3 py-2 text-sm text-[#1F3628]" data-testid="loyalty-pending">
          {tr('Τα δωρεάν μεταφορικά θα εφαρμοστούν όταν διαλέξεις τρόπο αποστολής στο ταμείο.')}
        </p>
      ) : null}
    </section>
  );
};
