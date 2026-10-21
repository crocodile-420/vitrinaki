'use server';

import { HttpTypes } from '@medusajs/types';

import { SellerDTO } from '@mercurjs/types';

import { sdk } from '../client';
import medusaError from '../helpers/medusa-error';
import { getAuthHeaders, getCacheOptions } from './cookies';

// TODO: legacy returns endpoints — migrate when the returns module lands
type LooseRoute = {
  query: <T = unknown>(i?: never) => Promise<T>;
  mutate: <T = unknown>(i?: never) => Promise<T>;
  delete: <T = unknown>(i?: never) => Promise<T>;
} & { [k: string]: LooseRoute };
const storeLoose = sdk.store as unknown as LooseRoute;

// Mercur's default order-group fields include orders.items.variant.product.*,
// which is deeper than the 3 relations the store API allows, so the request
// 400s without an explicit field list. Same fields minus those two (the order
// page does not use them).
const ORDER_GROUP_FIELDS = [
  'id', 'display_id', 'customer_id', 'seller_count', 'total', 'created_at', 'updated_at',
  'orders.id', 'orders.display_id', 'orders.status', 'orders.fulfillment_status',
  'orders.payment_status', 'orders.currency_code', 'orders.total', 'orders.subtotal',
  'orders.item_total', 'orders.shipping_total', 'orders.tax_total', 'orders.seller_id',
  'orders.shipping_address', 'orders.seller.id', 'orders.seller.name', 'orders.seller.handle',
  'orders.seller.logo', 'orders.items.id', 'orders.items.title', 'orders.items.subtitle',
  'orders.items.thumbnail', 'orders.items.product_title', 'orders.items.variant_title',
  'orders.items.quantity', 'orders.items.unit_price', 'orders.items.total', 'orders.items.variant_id'
].join(',');

export const retrieveOrderGroup = async (id: string) => {
  return (
    sdk.store.orderGroups.$id.query({
      $id: id,
      fields: ORDER_GROUP_FIELDS,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'no-cache'
      }
    } as never) as unknown as Promise<{ order_group: Record<string, unknown> }>
  )
    .then(({ order_group }) => order_group)
    .catch(err => medusaError(err));
};

export const retrieveOrder = async (id: string) => {
  const next = {
    ...(await getCacheOptions('orders'))
  };

  return (
    sdk.store.orders.$id.query({
      $id: id,
      fields:
        '*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product,*seller,*order_group',
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        next,
        cache: 'force-cache'
      }
    } as never) as unknown as Promise<
      HttpTypes.StoreOrderResponse & { seller: SellerDTO }
    >
  )
    .then(({ order }) => order)
    .catch(err => medusaError(err));
};

export type OrderShipmentTracking = {
  fulfillment_id: string
  courier: { metadata?: unknown }
  shipped_at: string | null
  labels: { tracking_number: string; tracking_url: string | null }[]
}

/**
 * Shipments of one order with their tracking numbers and links (the order
 * group endpoint does not carry fulfillments). The store API hides fulfillment
 * labels, so the backend copies tracking numbers/links of courier shipments to
 * `fulfillment.metadata.tracking` (packages/api/src/workflows/hooks/
 * courier-tracking.ts). Returns [] on any error so the order page still renders.
 */
export const retrieveOrderTracking = async (
  orderId: string
): Promise<OrderShipmentTracking[]> => {
  return (
    storeLoose.orders.$id.query({
      $id: orderId,
      fields: 'id,*fulfillments',
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'no-cache'
      }
    } as never) as Promise<{
      order: {
        fulfillments?: Array<{
          id: string
          shipped_at?: string | null
          canceled_at?: string | null
          metadata?: Record<string, unknown> | null
        }>
      }
    }>
  )
    .then(({ order }) =>
      (order?.fulfillments ?? [])
        .filter(f => !f.canceled_at && f.shipped_at)
        .map(f => {
          const tracking = Array.isArray(f.metadata?.tracking)
            ? (f.metadata!.tracking as Array<{ number?: unknown; url?: unknown }>)
            : []
          return {
            fulfillment_id: f.id,
            courier: { metadata: f.metadata },
            shipped_at: f.shipped_at ?? null,
            labels: tracking
              .filter(t => typeof t?.number === 'string' && t.number)
              .map(t => ({
                tracking_number: String(t.number),
                tracking_url: typeof t.url === 'string' ? t.url : null
              }))
          }
        })
        .filter(f => f.labels.length > 0)
    )
    .catch(() => []);
};

export const createReturnRequest = async (data: Record<string, unknown>) => {
  const response = await storeLoose.returnRequest
    .mutate<{ order_return_request: { id: string } }>({
      ...data,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    } as never)
    .catch(err => medusaError(err));

  return response;
};

export const getReturns = async () => {
  return storeLoose.returnRequest
    .query<{
      order_return_requests: Array<
        { line_items: Array<{ created_at: string; reason_id?: string }> } & Record<
          string,
          unknown
        >
      >;
    }>({
      fields: '*line_items.reason_id',
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'force-cache'
      }
    } as never)
    .then(res => res)
    .catch(err => medusaError(err));
};

export const retriveReturnMethods = async (order_id: string) => {
  return storeLoose.shippingOptions.return
    .query<{ shipping_options: Array<Record<string, unknown>> }>({
      order_id,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'no-cache'
      }
    } as never)
    .then(({ shipping_options }) => shipping_options)
    .catch(() => []);
};

export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, unknown>
) => {
  const next = {
    ...(await getCacheOptions('orders'))
  };

  return (
    sdk.store.orders.query({
      limit,
      offset,
      order: '-created_at',
      fields:
        '*items,+items.metadata,*items.variant,*items.product,*seller,*order_group,shipping_total,total,created_at',
      ...filters,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        next,
        cache: 'no-cache'
      }
    } as never) as unknown as Promise<{
      orders: Array<
        HttpTypes.StoreOrder & {
          seller: { id: string; name: string };
          order_group: { id: string };
        }
      >;
    }>
  )
    .then(({ orders }) => orders.filter(order => order.order_group))
    .catch(err => medusaError(err));
};

export const createTransferRequest = async (
  state: {
    success: boolean;
    error: string | null;
    order: HttpTypes.StoreOrder | null;
  },
  formData: FormData
): Promise<{
  success: boolean;
  error: string | null;
  order: HttpTypes.StoreOrder | null;
}> => {
  const id = formData.get('order_id') as string;

  if (!id) {
    return { success: false, error: 'Order ID is required', order: null };
  }

  const headers = { ...(await getAuthHeaders()) };

  return await (
    sdk.store.orders.$id.transfer.request.mutate({
      $id: id,
      fetchOptions: { headers }
    } as never) as unknown as Promise<{ order: HttpTypes.StoreOrder }>
  )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch(err => ({ success: false, error: err.message, order: null }));
};

export const acceptTransferRequest = async (id: string, token: string) => {
  const headers = { ...(await getAuthHeaders()) };

  return await (
    sdk.store.orders.$id.transfer.accept.mutate({
      $id: id,
      token,
      fetchOptions: { headers }
    } as never) as unknown as Promise<{ order: HttpTypes.StoreOrder }>
  )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch(err => ({ success: false, error: err.message, order: null }));
};

export const declineTransferRequest = async (id: string, token: string) => {
  const headers = { ...(await getAuthHeaders()) };

  return await (
    sdk.store.orders.$id.transfer.decline.mutate({
      $id: id,
      token,
      fetchOptions: { headers }
    } as never) as unknown as Promise<{ order: HttpTypes.StoreOrder }>
  )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch(err => ({ success: false, error: err.message, order: null }));
};

export const retrieveReturnReasons = async () => {
  return (
    sdk.store.returnReasons.query({
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'force-cache'
      }
    } as never) as unknown as Promise<{
      return_reasons: Array<HttpTypes.StoreReturnReason>;
    }>
  )
    .then(({ return_reasons }) => return_reasons)
    .catch(err => medusaError(err));
};
