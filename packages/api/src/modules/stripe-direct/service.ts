// Medusa's Stripe payment provider, changed for direct charges: every Stripe
// call runs on the shop's connected account (the SDK's `stripeAccount`
// request option, i.e. the Stripe-Account header). The shop is the merchant
// of record; Vitrinaki never holds the money.
//
// The account comes from the payment session's `data.stripe_account`, which
// only the backend sets (see guardCardPaymentSession in src/api/middlewares.ts).
// It is copied into every `data` this provider returns, so the payment, its
// captures and refunds (also Mercur's per-order split payments, which copy
// `data`) keep pointing at the same account.
import StripeModule from "@medusajs/medusa/payment-stripe"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  CreateAccountHolderOutput,
  DeleteAccountHolderOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ListPaymentMethodsOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  SavePaymentMethodOutput,
  UpdateAccountHolderOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { isPresent, MedusaError, PaymentActions, PaymentSessionStatus } from "@medusajs/framework/utils"

import {
  applicationFeeAmount,
  applicationFeePercent,
  fromMinorUnit,
  SELLER_DATA_KEY,
  STRIPE_ACCOUNT_DATA_KEY,
  toMinorUnit,
} from "../../lib/stripe-connect"

export type StripeDirectOptions = {
  apiKey: string
  webhookSecret: string
  capture?: boolean
  paymentDescription?: string
  applicationFeePercent?: string | number
}

type StatusResult = { status: PaymentSessionStatus; data: Record<string, unknown> }

// The parts of Medusa's StripeBase this class relies on. The base class is
// only reachable at runtime through the module's `services` list, since the
// package exports no class type.
interface StripeBaseInstance {
  stripe_: any
  options_: StripeDirectOptions
  executeWithRetry<T>(call: () => Promise<T>): Promise<any>
  getStatus(intent: any): StatusResult
  normalizePaymentIntentParameters(extra?: Record<string, unknown>): Record<string, unknown>
  constructWebhookEvent(payload: ProviderWebhookPayload["payload"]): any
  buildError(message: string, error: Error): Error
  getWebhookActionAndData(payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult>
  authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput>
  deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput>
}
type StripeBaseCtor = new (cradle: Record<string, unknown>, options: StripeDirectOptions) => StripeBaseInstance

const services = ((StripeModule as unknown as { services?: any[] }).services || []) as any[]
const StripeProviderService = services.find((service) => service?.identifier === "stripe") as StripeBaseCtor | undefined
if (!StripeProviderService) throw new Error("@medusajs/medusa/payment-stripe no longer exposes the Stripe provider service.")

const accountOf = (data: unknown): string | undefined => {
  const value = (data as Record<string, unknown> | undefined)?.[STRIPE_ACCOUNT_DATA_KEY]
  return typeof value === "string" && value.startsWith("acct_") ? value : undefined
}

export default class StripeDirectChargesService extends StripeProviderService {
  static identifier = "stripe"

  constructor(cradle: Record<string, unknown>, options: StripeDirectOptions) {
    super(cradle, options)
  }

  // Card only («Πληρωμές με κάρτα»); Apple Pay / Google Pay are cards too.
  get paymentIntentOptions() {
    return { payment_method_types: ["card"] }
  }

  private feePercent() {
    return applicationFeePercent(this.options_.applicationFeePercent)
  }

  private requireAccount(data: unknown, action: string): string {
    const account = accountOf(data)
    if (!account) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Card payment ${action}: the shop's Stripe account is missing.`)
    }
    return account
  }

  private withAccount(result: StatusResult, account: string, extra: Record<string, unknown> = {}) {
    return { status: result.status, data: { ...(result.data || {}), ...extra, [STRIPE_ACCOUNT_DATA_KEY]: account } }
  }

  async initiatePayment({ currency_code, amount, data, context }: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const account = this.requireAccount(data, "cannot start")
    const sellerId = typeof data?.[SELLER_DATA_KEY] === "string" ? (data[SELLER_DATA_KEY] as string) : undefined
    const amountMinor = toMinorUnit(amount, currency_code)
    // Client-supplied session data is not passed on: only the session id and
    // what the backend added.
    const request: Record<string, unknown> = {
      amount: amountMinor,
      currency: currency_code,
      metadata: { session_id: data?.session_id, ...(sellerId ? { vitrinaki_seller_id: sellerId } : {}) },
      ...this.normalizePaymentIntentParameters({}),
      expand: ["payment_method"],
    }
    const fee = applicationFeeAmount(amountMinor, this.feePercent())
    if (fee > 0) request.application_fee_amount = fee
    // No `customer`: platform customers do not exist on the shop's account.
    const intent = await this.executeWithRetry(() =>
      this.stripe_.paymentIntents.create(request, { idempotencyKey: context?.idempotency_key, stripeAccount: account })
    )
    const isIntent = intent && typeof intent === "object" && "id" in intent
    const result = this.withAccount(this.getStatus(intent), account, sellerId ? { [SELLER_DATA_KEY]: sellerId } : {})
    return { id: isIntent ? intent.id : (data?.session_id as string), ...result }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const id = input?.data?.id as string | undefined
    if (!id) throw this.buildError("No payment intent ID provided while getting payment status", new Error("No payment intent ID provided"))
    const account = this.requireAccount(input.data, "status")
    const intent = await this.stripe_.paymentIntents.retrieve(id, { expand: ["payment_method"] }, { stripeAccount: account })
    return this.withAccount(this.getStatus(intent), account, this.keep(input.data))
  }

  async cancelPayment({ data, context }: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const id = data?.id as string | undefined
    const account = accountOf(data)
    if (!id || !account) return { data }
    try {
      const intent = await this.stripe_.paymentIntents.cancel(id, {}, { idempotencyKey: context?.idempotency_key, stripeAccount: account })
      return { data: { ...intent, ...this.keep(data), [STRIPE_ACCOUNT_DATA_KEY]: account } }
    } catch (error: any) {
      if (error?.payment_intent?.status === "canceled") {
        return { data: { ...error.payment_intent, ...this.keep(data), [STRIPE_ACCOUNT_DATA_KEY]: account } }
      }
      throw this.buildError("An error occurred in cancelPayment", error)
    }
  }

  async capturePayment({ data, context }: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const id = data?.id as string
    const account = this.requireAccount(data, "capture")
    try {
      const intent = await this.stripe_.paymentIntents.capture(id, {}, { idempotencyKey: context?.idempotency_key, stripeAccount: account })
      return { data: { ...intent, ...this.keep(data), [STRIPE_ACCOUNT_DATA_KEY]: account } }
    } catch (error: any) {
      if (error?.code === "payment_intent_unexpected_state" && error?.payment_intent?.status === "succeeded") {
        return { data: { ...error.payment_intent, ...this.keep(data), [STRIPE_ACCOUNT_DATA_KEY]: account } }
      }
      throw this.buildError("An error occurred in capturePayment", error)
    }
  }

  // Refunds (from the Studio's order page) come out of the shop's balance.
  async refundPayment({ amount, data, context }: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const id = data?.id as string | undefined
    if (!id) throw this.buildError("No payment intent ID provided while refunding payment", new Error("No payment intent ID provided"))
    const account = this.requireAccount(data, "refund")
    const request: Record<string, unknown> = { amount: toMinorUnit(amount, String(data?.currency || "eur")), payment_intent: id }
    if (this.feePercent() > 0) request.refund_application_fee = true
    try {
      await this.stripe_.refunds.create(request, { idempotencyKey: context?.idempotency_key, stripeAccount: account })
    } catch (error: any) {
      if (error?.code !== "charge_already_refunded") throw this.buildError("An error occurred in refundPayment", error)
    }
    return { data }
  }

  async retrievePayment({ data }: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const account = this.requireAccount(data, "retrieve")
    try {
      const intent = await this.stripe_.paymentIntents.retrieve(data?.id as string, {}, { stripeAccount: account })
      intent.amount = fromMinorUnit(intent.amount, intent.currency)
      return { data: { ...intent, ...this.keep(data), [STRIPE_ACCOUNT_DATA_KEY]: account } }
    } catch (error: any) {
      throw this.buildError("An error occurred in retrievePayment", error)
    }
  }

  async updatePayment({ data, currency_code, amount, context }: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const account = this.requireAccount(data, "update")
    const amountMinor = toMinorUnit(amount, currency_code)
    if (isPresent(amount) && data?.amount === amountMinor) return this.withAccount(this.getStatus(data), account, this.keep(data))
    const request: Record<string, unknown> = { amount: amountMinor, expand: ["payment_method"] }
    const fee = applicationFeeAmount(amountMinor, this.feePercent())
    if (fee > 0) request.application_fee_amount = fee
    try {
      const intent = await this.stripe_.paymentIntents.update(data?.id as string, request, {
        idempotencyKey: context?.idempotency_key,
        stripeAccount: account,
      })
      return this.withAccount(this.getStatus(intent), account, this.keep(data))
    } catch (error: any) {
      throw this.buildError("An error occurred in updatePayment", error)
    }
  }

  // Saved cards / Stripe customers would live on the platform account and
  // cannot be used for a charge on the shop's account, so they are disabled.
  async createAccountHolder(_input?: unknown): Promise<CreateAccountHolderOutput> {
    return {} as CreateAccountHolderOutput
  }
  async updateAccountHolder(_input?: unknown): Promise<UpdateAccountHolderOutput> {
    return {}
  }
  async deleteAccountHolder(_input?: unknown): Promise<DeleteAccountHolderOutput> {
    return {}
  }
  async listPaymentMethods(_input?: unknown): Promise<ListPaymentMethodsOutput> {
    return []
  }
  async savePaymentMethod(_input?: unknown): Promise<SavePaymentMethodOutput> {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Saving cards is not supported for shop card payments.")
  }

  // Events arrive from the shops' accounts through the Connect webhook. The
  // base class would look up the payment method on the platform account for
  // created/processing events, which fails for a connected account; those
  // events only mean "pending", so answer them here.
  async getWebhookActionAndData(payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    const event = this.constructWebhookEvent(payload)
    const intent = event?.data?.object || {}
    if ((event?.type === "payment_intent.created" || event?.type === "payment_intent.processing") && intent.metadata?.session_id) {
      return {
        action: PaymentActions.PENDING,
        data: { session_id: intent.metadata.session_id, amount: fromMinorUnit(intent.amount, intent.currency) },
      }
    }
    return super.getWebhookActionAndData(payload)
  }

  private keep(data: Record<string, unknown> | undefined) {
    const sellerId = data?.[SELLER_DATA_KEY]
    return typeof sellerId === "string" ? { [SELLER_DATA_KEY]: sellerId } : {}
  }
}
