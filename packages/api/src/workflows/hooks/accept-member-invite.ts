import { MedusaError } from "@medusajs/framework/utils"
import { acceptMemberInviteWorkflow } from "@mercurjs/core/workflows"

import { memberLimitMessage } from "../../lib/vitrinaki-plans"
import { teamSeats } from "../../lib/vitrinaki-team-limit"

// Invites count against the plan's team size when they are sent (see the
// enforceTeamLimit middleware). This catches the case where the plan shrank
// after the invite went out: accepting must not push the team past the limit.
acceptMemberInviteWorkflow.hooks.validate(async ({ invite }, { container }) => {
  const sellerId = (invite as any)?.seller_id
  if (!sellerId) return
  const seats = await teamSeats(container, sellerId)
  if (seats && seats.members + 1 > seats.limit) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, memberLimitMessage(seats.limit))
  }
})
