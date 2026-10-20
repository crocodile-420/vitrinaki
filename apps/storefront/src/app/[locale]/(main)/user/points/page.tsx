import { LoginForm, UserNavigation } from "@/components/molecules"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { retrieveCustomer } from "@/lib/data/customer"
import { getMyPoints } from "@/lib/data/loyalty"
import { missingText, pointsText, rewardText } from "@/lib/helpers/loyalty"
import { getTranslator } from "@/lib/i18n/server"

// «Οι πόντοι μου»: the customer's points in each shop. Points are spent from
// the cart of the shop that gave them.
export default async function PointsPage() {
  const user = await retrieveCustomer()
  const { lang, tr } = await getTranslator()

  if (!user) return <LoginForm />

  const shops = (await getMyPoints()) ?? []
  const locale = lang === "el" ? "el-GR" : "en-US"

  return (
    <main className="container" data-testid="loyalty-page">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3">
          <h1 className="heading-md uppercase">{tr("Οι πόντοι μου")}</h1>
          <p className="mt-2 text-md text-secondary">
            {tr("Κάθε κατάστημα έχει τους δικούς του πόντους. Τους εξαργυρώνεις από το καλάθι σου, όταν ψωνίζεις από το ίδιο κατάστημα.")}
          </p>

          {shops.length === 0 ? (
            <div className="mt-6 rounded-sm border border-[#2E4A37]/20 bg-[#F7F2E8] p-5" data-testid="loyalty-empty">
              <p className="label-md text-[#1F3628]">{tr("Δεν έχεις ακόμα πόντους")}</p>
              <p className="mt-1 text-md text-secondary">
                {tr("Όσα καταστήματα δίνουν πόντους σού τους προσθέτουν με κάθε παραγγελία. Θα τους βλέπεις εδώ.")}
              </p>
            </div>
          ) : (
            <ul className="mt-6 flex flex-col gap-4">
              {shops.map((shop) => {
                const next = shop.rewards
                  .filter((r) => r.points > shop.points)
                  .sort((a, b) => a.points - b.points)[0]
                return (
                  <li
                    key={shop.seller.id}
                    className="rounded-sm border border-[#2E4A37]/20 bg-[#F7F2E8] p-5"
                    data-testid="loyalty-shop"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <LocalizedClientLink
                        href={`/store/${shop.seller.handle}`}
                        className="label-lg text-[#1F3628] underline-offset-2 hover:underline"
                      >
                        {shop.seller.name}
                      </LocalizedClientLink>
                      <span className="heading-sm text-[#2E4A37]">{pointsText(tr, shop.points, locale)}</span>
                    </div>

                    {!shop.enabled ? (
                      <p className="mt-2 text-md text-secondary">
                        {tr("Το κατάστημα δεν δίνει πόντους αυτή τη στιγμή. Κρατάς όσους έχεις μαζέψει.")}
                      </p>
                    ) : shop.rewards.length > 0 ? (
                      <ul className="mt-3 flex flex-col gap-2">
                        {shop.rewards.map((reward) => {
                          const canTake = shop.affordable.includes(reward.id)
                          return (
                            <li
                              key={reward.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-sm border bg-white px-3 py-2"
                            >
                              <span className="font-medium text-primary">{rewardText(tr, reward, locale)}</span>
                              <span className={canTake ? "text-md text-[#2E4A37]" : "text-md text-secondary"}>
                                {pointsText(tr, reward.points, locale)}
                                {canTake ? ` · ${tr("Μπορείς να την πάρεις")}` : ""}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}

                    {shop.enabled && next ? (
                      <p className="mt-3 text-md text-secondary">
                        {missingText(tr, next.points - shop.points, next, locale)}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
