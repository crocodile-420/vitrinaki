'use server';

import { revalidateTag } from 'next/cache';

import { getAuthHeaders, getCacheTag, getCartId } from './cookies';

// Loyalty points per shop (backend: /store/vitrinaki/loyalty). Points earned
// in a shop are spent only in that shop.

export type LoyaltyReward =
  | { id: string; points: number; type: 'amount_off'; amount: number }
  | { id: string; points: number; type: 'free_shipping' };

export type LoyaltySeller = { id: string; name: string; handle: string };

export type CartLoyalty =
  | { enabled: false }
  | {
      enabled: true;
      seller: LoyaltySeller;
      pointsPerEuro: number;
      rewards: LoyaltyReward[];
      logged_in: boolean;
      points: number | null;
      earn: number;
      affordable: string[];
      pending_codes: string[];
    };

export type ShopPoints = {
  seller: LoyaltySeller;
  enabled: boolean;
  pointsPerEuro: number;
  rewards: LoyaltyReward[];
  points: number;
  affordable: string[];
};

export type RedeemResult =
  | { ok: true; code: string; applied: boolean; pending: boolean; points: number; reward: LoyaltyReward }
  | { ok: false; message: string };

const backend = () => (process.env.MEDUSA_BACKEND_URL || 'http://localhost:9100').replace(/\/+$/, '');

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<{ ok: boolean; status: number; body: T }> {
  const response = await fetch(`${backend()}${path}`, {
    method: init?.method || 'GET',
    cache: 'no-store',
    headers: {
      'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(await getAuthHeaders())
    },
    body: init?.body ? JSON.stringify(init.body) : undefined
  });
  const body = (await response.json().catch(() => ({}))) as T;
  return { ok: response.ok, status: response.status, body };
}

// The cart page's points box. `enabled: false` when the cart's shop gives no points.
export async function getCartLoyalty(cartId?: string): Promise<CartLoyalty> {
  const id = cartId || (await getCartId());
  if (!id) return { enabled: false };
  try {
    const result = await call<CartLoyalty>(`/store/vitrinaki/loyalty/carts/${encodeURIComponent(id)}`);
    return result.ok && result.body?.enabled ? result.body : { enabled: false };
  } catch {
    return { enabled: false };
  }
}

// «Οι πόντοι μου»: the customer's points in every shop. null when logged out.
export async function getMyPoints(): Promise<ShopPoints[] | null> {
  try {
    const result = await call<{ shops?: ShopPoints[] }>('/store/vitrinaki/loyalty');
    if (result.status === 401) return null;
    return result.ok ? result.body.shops || [] : [];
  } catch {
    return [];
  }
}

// Trades points for a reward and applies the code to the current cart.
export async function redeemLoyaltyReward(rewardId: string): Promise<RedeemResult> {
  const cartId = await getCartId();
  if (!cartId) return { ok: false, message: 'Δεν βρέθηκε το καλάθι σου. Ανανέωσε τη σελίδα και δοκίμασε ξανά.' };
  try {
    const result = await call<any>('/store/vitrinaki/loyalty/redeem', {
      method: 'POST',
      body: { cart_id: cartId, reward_id: rewardId }
    });
    if (!result.ok) return { ok: false, message: String(result.body?.message || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.') };
    return { ok: true, ...result.body };
  } catch {
    return { ok: false, message: 'Κάτι πήγε στραβά. Δοκίμασε ξανά.' };
  } finally {
    revalidateTag(await getCacheTag('carts'));
  }
}

// A free-shipping code taken in the cart waits until there is a shipping
// method to discount. Called right after one is chosen at checkout.
export async function applyPendingLoyaltyCodes(cartId: string): Promise<void> {
  const loyalty = await getCartLoyalty(cartId);
  if (!loyalty.enabled || !loyalty.pending_codes.length) return;
  try {
    await call(`/store/carts/${encodeURIComponent(cartId)}/promotions`, {
      method: 'POST',
      body: { promo_codes: loyalty.pending_codes }
    });
  } catch (error: any) {
    console.error('Failed to apply loyalty codes', error?.message || error);
  }
}
