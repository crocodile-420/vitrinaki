"use client"

import { loadStripe, type Stripe } from "@stripe/stripe-js"
import React from "react"
import { HttpTypes } from "@medusajs/types"
import { isStripe } from "@/lib/constants"
import StripeWrapper from "./StripeWrapper"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY

// Card payments are direct charges on the shop's own Stripe account, so
// Stripe.js must run as that account (`stripeAccount`); the backend puts it in
// the payment session data. One Stripe.js instance per account.
const stripeByAccount = new Map<string, Promise<Stripe | null>>()
export const stripeForAccount = (account: string) => {
  if (!stripeKey) return null
  let promise = stripeByAccount.get(account)
  if (!promise) {
    promise = loadStripe(stripeKey, { stripeAccount: account })
    stripeByAccount.set(account, promise)
  }
  return promise
}

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const stripeAccount = paymentSession?.data?.stripe_account
  const stripePromise =
    typeof stripeAccount === "string" && stripeAccount.startsWith("acct_")
      ? stripeForAccount(stripeAccount)
      : null

  if (
    isStripe(paymentSession?.provider_id) &&
    paymentSession &&
    stripePromise
  ) {
    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  return <div>{children}</div>
}

export default PaymentWrapper
