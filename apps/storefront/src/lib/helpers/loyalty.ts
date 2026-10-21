import type { LoyaltyReward } from '@/lib/data/loyalty';

import { convertToLocale } from './money';

// Shared by the cart's points box and «Οι πόντοι μου».
type Tr = (greek: string) => string;

export const pointsText = (tr: Tr, n: number, locale = 'el-GR') =>
  n === 1 ? tr('1 πόντος') : tr('{n} πόντοι').replace('{n}', n.toLocaleString(locale));

// «Σου λείπουν 30 πόντοι για: …» (singular: «Σου λείπει 1 πόντος για: …»).
export const missingText = (tr: Tr, missing: number, reward: LoyaltyReward, locale: string) =>
  (missing === 1 ? tr('Σου λείπει 1 πόντος για: {reward}') : tr('Σου λείπουν {n} για: {reward}'))
    .replace('{n}', pointsText(tr, missing, locale))
    .replace('{reward}', rewardText(tr, reward, locale));

export const rewardText =(tr: Tr, reward: LoyaltyReward, locale: string) =>
  reward.type === 'free_shipping'
    ? tr('Δωρεάν μεταφορικά')
    : tr('{amount} έκπτωση').replace(
        '{amount}',
        convertToLocale({ amount: reward.amount, currency_code: 'eur', locale })
      );
