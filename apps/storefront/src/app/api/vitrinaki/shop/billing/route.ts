import { NextRequest, NextResponse } from "next/server"

import { callAs, relay, withSession } from "@/lib/data/vitrinaki-shop"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Subscription and publish state for the «Ενεργοποίηση & δημοσίευση» step.
export async function GET(request: NextRequest) {
  return withSession(request, async (session, tr) => {
    const [billing, storefront] = await Promise.all([
      callAs(session, "/vendor/vitrinaki/billing"),
      callAs(session, "/vendor/vitrinaki/storefront"),
    ])
    if (!billing.ok) return relay(billing, tr)
    if (!storefront.ok) return relay(storefront, tr)
    return NextResponse.json({
      subscription: billing.body.subscription || null,
      billingConfigured: Boolean(billing.body.billingConfigured),
      isPublished: Boolean(storefront.body.storefront?.isPublished),
      handle: storefront.body.seller?.handle || session.handle,
    })
  })
}
