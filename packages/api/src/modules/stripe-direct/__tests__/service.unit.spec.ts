import StripeDirectChargesService from "../service"

// The Stripe SDK client is replaced by a mock: each test checks the request
// options carry the shop's account (the Stripe-Account header).
const ACCOUNT = "acct_shop123"

function makeProvider(options: Record<string, unknown> = {}) {
  const provider = new StripeDirectChargesService({}, { apiKey: "sk_test_dummy", webhookSecret: "whsec_dummy", capture: true, ...options } as any)
  const stripe = {
    paymentIntents: {
      create: jest.fn(async (params: any, _options?: any) => ({ id: "pi_1", status: "requires_payment_method", client_secret: "pi_1_secret", amount: params.amount, currency: params.currency })),
      retrieve: jest.fn(async (id: string) => ({ id, status: "succeeded", amount: 4999, currency: "eur" })),
      update: jest.fn(async (id: string, params: any) => ({ id, status: "requires_payment_method", amount: params.amount })),
      cancel: jest.fn(async (id: string) => ({ id, status: "canceled" })),
      capture: jest.fn(async (id: string) => ({ id, status: "succeeded" })),
    },
    refunds: { create: jest.fn(async (_params: any, _options?: any) => ({ id: "re_1" })) },
    paymentMethods: { retrieve: jest.fn() },
    customers: { create: jest.fn() },
    webhooks: (provider as any).stripe_.webhooks,
  }
  ;(provider as any).stripe_ = stripe
  return { provider, stripe }
}

describe("StripeDirectChargesService", () => {
  it("creates the PaymentIntent on the shop's account, card only, captured at once, no fee by default", async () => {
    const { provider, stripe } = makeProvider()
    const result = await provider.initiatePayment({
      amount: 49.99,
      currency_code: "eur",
      data: { session_id: "payses_1", stripe_account: ACCOUNT, vitrinaki_seller_id: "sel_1", capture_method: "manual", metadata: { evil: "x" } },
      context: { idempotency_key: "idem_1", account_holder: { data: { id: "cus_platform" } } } as any,
    })
    const [params, options] = stripe.paymentIntents.create.mock.calls[0]
    expect(options).toEqual({ idempotencyKey: "idem_1", stripeAccount: ACCOUNT })
    expect(params).toMatchObject({
      amount: 4999,
      currency: "eur",
      capture_method: "automatic",
      payment_method_types: ["card"],
      metadata: { session_id: "payses_1", vitrinaki_seller_id: "sel_1" },
    })
    expect(params.application_fee_amount).toBeUndefined()
    expect(params.customer).toBeUndefined()
    expect(params.metadata.evil).toBeUndefined()
    expect(result.id).toBe("pi_1")
    expect(result.data).toMatchObject({ client_secret: "pi_1_secret", stripe_account: ACCOUNT, vitrinaki_seller_id: "sel_1" })
  })

  it("adds the application fee when one is configured", async () => {
    const { provider, stripe } = makeProvider({ applicationFeePercent: "2" })
    await provider.initiatePayment({ amount: 100, currency_code: "eur", data: { session_id: "s", stripe_account: ACCOUNT }, context: {} as any })
    expect(stripe.paymentIntents.create.mock.calls[0][0].application_fee_amount).toBe(200)
    await provider.refundPayment({ amount: 10, data: { id: "pi_1", currency: "eur", stripe_account: ACCOUNT }, context: {} as any })
    expect(stripe.refunds.create.mock.calls[0][0]).toMatchObject({ amount: 1000, refund_application_fee: true })
  })

  it("refuses to start a card payment without a shop account", async () => {
    const { provider, stripe } = makeProvider()
    await expect(provider.initiatePayment({ amount: 10, currency_code: "eur", data: { session_id: "s" }, context: {} as any })).rejects.toThrow(/Stripe account is missing/)
    await expect(provider.initiatePayment({ amount: 10, currency_code: "eur", data: { session_id: "s", stripe_account: "cus_not_an_account" }, context: {} as any })).rejects.toThrow()
    expect(stripe.paymentIntents.create).not.toHaveBeenCalled()
  })

  it("authorizes, captures, cancels, updates and retrieves on the same account", async () => {
    const { provider, stripe } = makeProvider()
    const data = { id: "pi_1", stripe_account: ACCOUNT, vitrinaki_seller_id: "sel_1" }

    const authorized = await provider.authorizePayment({ data } as any)
    expect(stripe.paymentIntents.retrieve).toHaveBeenLastCalledWith("pi_1", { expand: ["payment_method"] }, { stripeAccount: ACCOUNT })
    expect(authorized.status).toBe("captured")
    expect(authorized.data).toMatchObject({ stripe_account: ACCOUNT, vitrinaki_seller_id: "sel_1" })

    const captured = await provider.capturePayment({ data, context: { idempotency_key: "k" } } as any)
    expect(stripe.paymentIntents.capture).toHaveBeenCalledWith("pi_1", {}, { idempotencyKey: "k", stripeAccount: ACCOUNT })
    expect(captured.data).toMatchObject({ stripe_account: ACCOUNT })

    const canceled = await provider.deletePayment({ data, context: {} } as any)
    expect(stripe.paymentIntents.cancel).toHaveBeenCalledWith("pi_1", {}, { idempotencyKey: undefined, stripeAccount: ACCOUNT })
    expect(canceled.data).toMatchObject({ status: "canceled", stripe_account: ACCOUNT })

    const updated = await provider.updatePayment({ data: { ...data, amount: 100 }, amount: 20, currency_code: "eur", context: {} } as any)
    expect(stripe.paymentIntents.update).toHaveBeenCalledWith("pi_1", { amount: 2000, expand: ["payment_method"] }, { idempotencyKey: undefined, stripeAccount: ACCOUNT })
    expect(updated.data).toMatchObject({ stripe_account: ACCOUNT })

    const retrieved = await provider.retrievePayment({ data } as any)
    expect(stripe.paymentIntents.retrieve).toHaveBeenLastCalledWith("pi_1", {}, { stripeAccount: ACCOUNT })
    expect(retrieved.data).toMatchObject({ amount: 49.99, stripe_account: ACCOUNT })
  })

  it("refunds on the shop's account (Studio refunds)", async () => {
    const { provider, stripe } = makeProvider()
    const result = await provider.refundPayment({ amount: 12.5, data: { id: "pi_1", currency: "eur", stripe_account: ACCOUNT }, context: { idempotency_key: "r1" } } as any)
    expect(stripe.refunds.create).toHaveBeenCalledWith({ amount: 1250, payment_intent: "pi_1" }, { idempotencyKey: "r1", stripeAccount: ACCOUNT })
    expect(result.data).toMatchObject({ stripe_account: ACCOUNT })
  })

  it("does not create platform customers or saved cards", async () => {
    const { provider, stripe } = makeProvider()
    expect(await provider.createAccountHolder({ context: { customer: { id: "cus_1", email: "a@b.gr" } } } as any)).toEqual({})
    expect(await provider.listPaymentMethods({ context: {} } as any)).toEqual([])
    expect(stripe.customers.create).not.toHaveBeenCalled()
  })

  it("maps signed connected-account webhooks without platform lookups", async () => {
    const { provider, stripe } = makeProvider()
    const sign = (event: object) => {
      const rawData = JSON.stringify(event)
      const header = stripe.webhooks.generateTestHeaderString({ payload: rawData, secret: "whsec_dummy" })
      return { data: event, rawData, headers: { "stripe-signature": header } } as any
    }
    const intent = { id: "pi_1", object: "payment_intent", amount: 4999, amount_received: 4999, amount_capturable: 0, currency: "eur", payment_method: "pm_1", metadata: { session_id: "payses_1" } }
    const created = await provider.getWebhookActionAndData(sign({ id: "evt_1", type: "payment_intent.created", account: ACCOUNT, data: { object: intent } }))
    expect(created).toEqual({ action: "pending", data: { session_id: "payses_1", amount: 49.99 } })
    expect(stripe.paymentMethods.retrieve).not.toHaveBeenCalled()
    const succeeded = await provider.getWebhookActionAndData(sign({ id: "evt_2", type: "payment_intent.succeeded", account: ACCOUNT, data: { object: intent } }))
    expect(succeeded).toEqual({ action: "captured", data: { session_id: "payses_1", amount: 49.99 } })
    await expect(provider.getWebhookActionAndData({ data: {}, rawData: "{}", headers: { "stripe-signature": "t=1,v1=bad" } } as any)).rejects.toThrow()
  })
})
