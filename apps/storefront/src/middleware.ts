import { HttpTypes } from '@medusajs/types';
import { NextRequest, NextResponse } from 'next/server';

import { PROTECTED_ROUTES } from './lib/constants';
import { isTokenExpired } from './lib/helpers/token';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL;
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'gr';

function normalizePlatformHost(value: string): string {
  const raw = value.trim().toLowerCase()
  if (!raw) return ""
  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) return new URL(raw).hostname.toLowerCase()
  } catch {
    return ""
  }
  return raw.split("/")[0].split(":")[0]
}

const configuredPlatformHosts = [
  process.env.NEXT_PUBLIC_BASE_URL || "",
  ...(process.env.VITRINAKI_PLATFORM_HOSTS || "").split(","),
  process.env.VERCEL_URL || "",
].flatMap((value) => {
  const host = normalizePlatformHost(value)
  if (!host) return []
  return [host, host.startsWith("www.") ? host.slice(4) : host]
})

const isPlatformHost = (host: string) =>
  configuredPlatformHosts.includes(host) ||
  host === "localhost" ||
  host === "127.0.0.1" ||
  host.endsWith(".vercel.app") ||
  host.endsWith(".pages.dev")

async function resolveCustomDomain(host: string) {
  if (!BACKEND_URL) return null
  try {
    const backend = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL
    const url = new URL(`${backend}/store/vitrinaki/resolve-domain`)
    url.searchParams.set("domain", host)
    const headers: Record<string, string> = {}
    if (PUBLISHABLE_API_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_API_KEY
    const response = await fetch(url, { headers, cache: "no-store" })
    if (!response.ok) return null
    const data = await response.json() as { handle?: string; locale?: string }
    if (!data.handle || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(data.handle)) return null
    const locale = data.locale && /^[a-z]{2}$/i.test(data.locale) ? data.locale : DEFAULT_REGION
    return { handle: data.handle, locale }
  } catch {
    return null
  }
}

const makeAuthRedirect = (
  req: NextRequest,
  locale: string,
  reason: 'sessionRequired' | 'sessionExpired'
) => {
  const redirectUrl = new URL(`/${locale}/login`, req.url);

  redirectUrl.searchParams.set(reason, 'true');

  const response = NextResponse.redirect(redirectUrl);

  if (reason === 'sessionExpired') {
    response.cookies.delete('_medusa_jwt');
  }

  return response;
};

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now()
};

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache;

  if (!BACKEND_URL) {
    throw new Error(
      'Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL.'
    );
  }

  if (!regionMap.keys().next().value || regionMapUpdated < Date.now() - 3600 * 1000) {
    // We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_API_KEY!
      },
      next: {
        revalidate: 3600,
        tags: [`regions-${cacheId}`]
      },
      cache: 'force-cache'
    }).then(async response => {
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message);
      }

      return json;
    });

    if (!regions?.length) {
      throw new Error('No regions found. Please set up regions in your Medusa Admin.');
    }

    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach(c => {
        regionMapCache.regionMap.set(c.iso_2 ?? '', region);
      });
    });

    regionMapCache.regionMapUpdated = Date.now();
  }

  return regionMapCache.regionMap;
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode;

    const vercelCountryCode = request.headers.get('x-vercel-ip-country')?.toLowerCase();

    const urlCountryCode = request.nextUrl.pathname.split('/')[1]?.toLowerCase();

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode;
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode;
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION;
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value;
    }

    return countryCode;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        'Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL.'
      );
    }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  const rawHost = request.headers.get('host') || '';
  const host = rawHost.toLowerCase().split(':')[0];
  if (host && !isPlatformHost(host)) {
    const resolved = await resolveCustomDomain(host);
    if (!resolved) {
      return new NextResponse('This domain is not connected to an active Vitrinaki shop.', { status: 404 });
    }
    const target = request.nextUrl.clone();
    const suffix = pathname === '/' ? '' : pathname;
    target.pathname = `/${resolved.locale}/store/${resolved.handle}${suffix}`;
    return NextResponse.rewrite(target);
  }
  const cacheIdCookie = request.cookies.get('_medusa_cache_id');
  const cacheId = cacheIdCookie?.value || crypto.randomUUID();

  const urlSegment = pathname.split('/')[1];
  const looksLikeLocale = /^[a-z]{2}$/i.test(urlSegment || '');

  const pathnameWithoutLocale = looksLikeLocale ? pathname.replace(/^\/[^/]+/, '') : pathname;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathnameWithoutLocale.startsWith(route));

  if (isProtectedRoute) {
    const jwtCookie = request.cookies.get('_medusa_jwt');
    const token = jwtCookie?.value;

    const locale = looksLikeLocale ? urlSegment : DEFAULT_REGION;

    if (!jwtCookie) {
      return makeAuthRedirect(request, locale, 'sessionRequired');
    }

    if (token && isTokenExpired(token)) {
      return makeAuthRedirect(request, locale, 'sessionExpired');
    }
  }

  if (looksLikeLocale && cacheIdCookie) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  if (!cacheIdCookie) {
    response.cookies.set('_medusa_cache_id', cacheId, {
      maxAge: 60 * 60 * 24
    });
  }

  const regionMap = await getRegionMap(cacheId);
  const countryCode = regionMap && (await getCountryCode(request, regionMap));
  const urlHasCountryCode = countryCode && pathname.split('/')[1].includes(countryCode);

  if (!urlHasCountryCode && countryCode) {
    const redirectPath = pathname === '/' ? '' : pathname;
    const queryString = request.nextUrl.search ? request.nextUrl.search : '';
    const redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`;
    return NextResponse.redirect(redirectUrl, 307);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)'
  ]
};
