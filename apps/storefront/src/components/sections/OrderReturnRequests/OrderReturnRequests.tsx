import { getTranslator } from "@/lib/i18n/server"
import { OrdersPagination } from "@/components/organisms/OrdersPagination/OrdersPagination"
import { SingleOrderReturn } from "@/components/organisms/SingleOrderReturn/SingleOrderReturn"
import { Heading } from "@medusajs/ui"
import { isEmpty } from "lodash"

const LIMIT = 10

export const OrderReturnRequests = async ({
  returns = [],
  user,
  page,
  currentReturn,
  returnReasons,
}: {
  returns: any[]
  user: any
  page: string
  currentReturn: string
  returnReasons: any[]
}) => {
  const { tr } = await getTranslator()
  const pages = Math.ceil(returns.length / LIMIT)
  const currentPage = +page || 1
  const offset = (+currentPage - 1) * LIMIT

  const processedReturns = returns.slice(offset, offset + LIMIT)

  if (isEmpty(processedReturns)) {
    return (
      <div className="mt-8" data-testid="order-return-requests-empty-state">
        <Heading level="h2" className="uppercase text-center heading-lg" data-testid="no-returns-heading">
          {tr("Δεν υπάρχουν επιστροφές")}
        </Heading>
        <p className="text-center text-secondary w-96 mt-8 mx-auto" data-testid="no-returns-description">
          {
            tr("Δεν έχεις ζητήσει ακόμη καμία επιστροφή. Μόλις ζητήσεις, θα εμφανιστεί εδώ.")
          }
        </p>
      </div>
    )
  }

  return (
    <div>
      {processedReturns.map((item) => (
        <SingleOrderReturn
          key={item.id}
          item={item}
          user={user}
          defaultOpen={currentReturn === item.id}
          returnReason={returnReasons}
          priceTestId={`return-${item.id}-price`}
          testIdPrefix={`return-${item.id}`}
        />
      ))}
      <div className="mt-8 flex justify-center">
        <OrdersPagination pages={pages} />
      </div>
    </div>
  )
}
