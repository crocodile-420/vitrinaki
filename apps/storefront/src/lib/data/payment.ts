'use server';

import { HttpTypes } from '@medusajs/types';

import { sdk } from '../client';
import { getAuthHeaders, getCacheOptions } from './cookies';

export const listCartPaymentMethods = async (regionId: string) => {
  const next = {
    ...(await getCacheOptions('payment_providers'))
  };

  return (sdk.store.paymentProviders
    .query({
      region_id: regionId,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        next,
        cache: 'force-cache'
      }
    } as never) as unknown as Promise<HttpTypes.StorePaymentProviderListResponse>)
    .then(({ payment_providers }) =>
      payment_providers.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      })
    )
    .catch(() => {
      return null;
    });
};

export type CardPaymentAvailability = {
  available: boolean;
  reason: 'not_configured' | 'empty_cart' | 'mixed_shops' | 'not_connected' | null;
};

// Card payments are charged on the shop's own Stripe account, so the backend
// offers them only for a cart from one shop whose Stripe account is active.
export const getCartCardPayment = async (cartId: string): Promise<CardPaymentAvailability> => {
  const backend = (process.env.MEDUSA_BACKEND_URL || 'http://localhost:9100').replace(/\/+$/, '');
  try {
    const response = await fetch(`${backend}/store/vitrinaki/carts/${encodeURIComponent(cartId)}/card-payment`, {
      cache: 'no-store',
      headers: { 'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '' }
    });
    if (!response.ok) return { available: false, reason: null };
    const body = (await response.json()) as Partial<CardPaymentAvailability>;
    return { available: body.available === true, reason: body.reason ?? null };
  } catch {
    return { available: false, reason: null };
  }
};
