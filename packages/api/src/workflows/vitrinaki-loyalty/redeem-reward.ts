import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createSellerPromotionsWorkflow } from "@mercurjs/core/workflows"

import { rewardPromotion, type LoyaltyReward } from "../../lib/vitrinaki-loyalty"
import { VITRINAKI_LOYALTY_MODULE } from "../../modules/vitrinaki-loyalty"
import type VitrinakiLoyaltyModuleService from "../../modules/vitrinaki-loyalty/service"

type RedeemInput = {
  seller_id: string
  customer_id: string
  reward: LoyaltyReward
  code: string
}

// Deducts the points first (one conditional UPDATE: fails when the balance is
// short, including when two redeems race). Undone if a later step fails.
const spendPointsStep = createStep(
  "vitrinaki-loyalty-spend-points",
  async (input: RedeemInput, { container }) => {
    const loyalty = container.resolve<VitrinakiLoyaltyModuleService>(VITRINAKI_LOYALTY_MODULE)
    const spent = await loyalty.spendPoints({
      seller_id: input.seller_id,
      customer_id: input.customer_id,
      points: input.reward.points,
      code: input.code,
      reward: input.reward,
    })
    return new StepResponse(spent, spent.entry_id)
  },
  async (entryId, { container }) => {
    if (!entryId) return
    const loyalty = container.resolve<VitrinakiLoyaltyModuleService>(VITRINAKI_LOYALTY_MODULE)
    await loyalty.refundSpend(entryId)
  }
)

const recordPromotionStep = createStep(
  "vitrinaki-loyalty-record-promotion",
  async (input: { entry_id: string; promotion_id: string }, { container }) => {
    const loyalty = container.resolve<VitrinakiLoyaltyModuleService>(VITRINAKI_LOYALTY_MODULE)
    await loyalty.updateLoyaltyEntries({ id: input.entry_id, promotion_id: input.promotion_id })
    return new StepResponse(undefined)
  }
)

// A customer trades points for a reward: the points come off their balance in
// that shop and they get a single-use promotion code, scoped to that shop
// (Mercur's seller link) and to them (customer rule).
export const redeemLoyaltyRewardWorkflow = createWorkflow(
  "vitrinaki-loyalty-redeem-reward",
  (input: RedeemInput) => {
    const spent = spendPointsStep(input)

    const promotions = transform({ input }, ({ input }) => [
      rewardPromotion(input.reward, input.code, input.customer_id) as any,
    ])
    const created = createSellerPromotionsWorkflow.runAsStep({
      input: { seller_id: input.seller_id, promotions },
    })

    const record = transform({ spent, created }, ({ spent, created }) => ({
      entry_id: spent.entry_id,
      promotion_id: created[0].id,
    }))
    recordPromotionStep(record)

    const result = transform({ spent, created, input }, ({ spent, created, input }) => ({
      code: input.code,
      promotion_id: created[0].id,
      balance: spent.balance,
    }))
    return new WorkflowResponse(result)
  }
)
