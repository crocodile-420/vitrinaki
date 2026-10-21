'use server';

import { getAuthHeaders } from './cookies';

// Online bookings on the shop page (backend: /store/vitrinaki/bookings). The
// shop decides in the Studio what can be booked and when; the backend checks
// every booking again, so nothing here is trusted.

export type BookingService = { id: string; name: string; durationMinutes: number; price: string; description: string };

export type ShopBookings =
  | { enabled: false }
  | { enabled: true; services: BookingService[]; maxDaysAhead: number; cancelHours: number; autoConfirm: boolean; note: string };

export type BookingDay = { date: string; slots: string[] };

export type CustomerBooking = {
  shop: { id: string; name: string; handle: string };
  service_name: string;
  duration_minutes: number;
  price: string;
  start_at: string;
  date: string;
  time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed' | 'no_show';
  customer_name: string;
  can_cancel: boolean;
};

export type BookingContact = { name: string; phone: string; email: string; note: string };

const backend = () => (process.env.MEDUSA_BACKEND_URL || 'http://localhost:9100').replace(/\/+$/, '');
const failed = 'Κάτι πήγε στραβά. Δοκίμασε ξανά.';

async function call<T>(path: string, init?: { method?: string; body?: unknown; auth?: boolean }) {
  const response = await fetch(`${backend()}${path}`, {
    method: init?.method || 'GET',
    cache: 'no-store',
    headers: {
      'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(init?.auth ? await getAuthHeaders() : {})
    },
    body: init?.body ? JSON.stringify(init.body) : undefined
  });
  const body = (await response.json().catch(() => ({}))) as T & { message?: string };
  return { ok: response.ok, status: response.status, body };
}

// Is the shop taking bookings, and for what. `enabled: false` on any error.
export async function getShopBookings(sellerId: string): Promise<ShopBookings> {
  try {
    const result = await call<{ bookings?: ShopBookings }>(`/store/vitrinaki/bookings/shops/${encodeURIComponent(sellerId)}`);
    return result.ok && result.body.bookings?.enabled ? result.body.bookings : { enabled: false };
  } catch {
    return { enabled: false };
  }
}

// Free start times of one service, day by day from `from`.
export async function getBookingDays(
  sellerId: string,
  serviceId: string,
  from?: string,
  days = 7
): Promise<{ ok: true; days: BookingDay[]; hasMore: boolean } | { ok: false; message: string }> {
  const params = new URLSearchParams({ service: serviceId, days: String(days) });
  if (from) params.set('from', from);
  try {
    const result = await call<{ days?: BookingDay[]; has_more?: boolean }>(
      `/store/vitrinaki/bookings/shops/${encodeURIComponent(sellerId)}?${params}`
    );
    if (!result.ok) return { ok: false, message: String(result.body.message || failed) };
    return { ok: true, days: result.body.days || [], hasMore: Boolean(result.body.has_more) };
  } catch {
    return { ok: false, message: failed };
  }
}

export async function createBooking(input: {
  sellerId: string;
  serviceId: string;
  date: string;
  time: string;
  contact: BookingContact;
  consent: boolean;
  website?: string;
}): Promise<{ ok: true; booking: CustomerBooking; token: string } | { ok: false; message: string; taken?: boolean }> {
  try {
    const result = await call<{ booking: CustomerBooking; token: string }>(
      `/store/vitrinaki/bookings/shops/${encodeURIComponent(input.sellerId)}`,
      {
        method: 'POST',
        auth: true,
        body: {
          service_id: input.serviceId,
          date: input.date,
          time: input.time,
          contact: input.contact,
          consent: input.consent,
          website: input.website || ''
        }
      }
    );
    if (!result.ok) return { ok: false, message: String(result.body.message || failed), taken: result.status === 409 };
    return { ok: true, booking: result.body.booking, token: result.body.token };
  } catch {
    return { ok: false, message: failed };
  }
}

// «Το ραντεβού μου», by the secret link the customer got when booking.
export async function getBookingByToken(token: string): Promise<CustomerBooking | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  try {
    const result = await call<{ booking?: CustomerBooking }>(`/store/vitrinaki/bookings/manage/${encodeURIComponent(token)}`);
    return result.ok && result.body.booking ? result.body.booking : null;
  } catch {
    return null;
  }
}

export async function cancelBookingByToken(token: string): Promise<{ ok: true; booking: CustomerBooking } | { ok: false; message: string }> {
  try {
    const result = await call<{ booking: CustomerBooking }>(`/store/vitrinaki/bookings/manage/${encodeURIComponent(token)}`, {
      method: 'POST',
      body: { action: 'cancel' }
    });
    return result.ok ? { ok: true, booking: result.body.booking } : { ok: false, message: String(result.body.message || failed) };
  } catch {
    return { ok: false, message: failed };
  }
}
