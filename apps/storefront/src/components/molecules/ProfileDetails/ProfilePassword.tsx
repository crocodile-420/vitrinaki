"use client"

import { useTranslator } from "@/lib/i18n/client"
import { Button } from "@/components/atoms"
import { Card } from "@/components/atoms/Card/Card"
import { InfoIcon } from "@/icons"
import { Divider, Heading } from "@medusajs/ui"
import { useState } from "react"
import { Modal } from "../Modal/Modal"
import { HttpTypes } from "@medusajs/types"
import { sendResetPasswordEmail } from "@/lib/data/customer"

export const ProfilePassword = ({
  user,
}: {
  user: HttpTypes.StoreCustomer
}) => {
  const { tr } = useTranslator()
  const [showForm, setShowForm] = useState(false)

  const handleSendResetPasswordEmail = async () => {
    const res = await sendResetPasswordEmail(user.email)
    if (res.success) {
      setShowForm(false)
    }
  }

  return (
    <>
      <Card className="bg-secondary p-4 flex justify-between items-center mt-8">
        <Heading level="h2" className="heading-sm uppercase">
          {tr("Κωδικός")}
        </Heading>
        <Button
          variant="tonal"
          className="uppercase flex items-center gap-2 font-semibold"
          onClick={() => setShowForm(true)}
        >
          {tr("Αλλαγή κωδικού")}
        </Button>
      </Card>
      <Card className="p-0">
        <div className="p-4">
          <p className="label-md text-secondary">{tr("Τρέχων κωδικός")}</p>
          <p className="label-lg text-primary">****************</p>
        </div>
        <Divider />
        <div className="p-4">
          <p className="label-md text-secondary flex items-center gap-4">
            <InfoIcon size={18} className="text-secondary" />
            {tr("Διάλεγε πάντα έναν μοναδικό κωδικό για να προστατεύεις τον λογαριασμό σου.")}
          </p>
        </div>
      </Card>
      {showForm && (
        <Modal heading={tr("Αλλαγή κωδικού")} onClose={() => setShowForm(false)}>
          <div className="flex p-4 justify-center">
            <Button
              className="uppercase py-3 px-6 !font-semibold"
              onClick={handleSendResetPasswordEmail}
            >
              {tr("Στείλε μου email για αλλαγή κωδικού")}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
