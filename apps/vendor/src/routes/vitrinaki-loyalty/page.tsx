import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Badge, Button, Container, Heading, Input, Label, Select, Switch, Text, toast } from "@medusajs/ui"
import type { RouteConfig } from "@mercurjs/dashboard-sdk"
import { getAuthHeaders } from "@mercurjs/vendor"

// «Πόντοι πελατών»: the shop's loyalty programme. Customers with an account
// earn points on every order in this shop and trade them for a discount or
// free shipping, here only. Rules are saved through /vendor/vitrinaki/loyalty
// (seller.metadata.vitrinaki_loyalty); balances live in the backend module.

export const config: RouteConfig = {
  label: "vitrinakiLoyalty.nav",
  translationNs: "translation",
  rank: 47,
}

declare const __BACKEND_URL__: string
const backend = () => __BACKEND_URL__.replace(/\/+$/, "")

type RewardType = "amount_off" | "free_shipping"
type RewardDraft = { id?: string; points: string; type: RewardType; amount: string }
type Stats = { members: number; pointsIssued: number; pointsRedeemed: number; pointsOutstanding: number; rewardsRedeemed: number }
type Loyalty = {
  enabled: boolean
  pointsPerEuro: number
  rewards: Array<{ id: string; points: number; type: RewardType; amount?: number }>
}

const MAX_REWARDS = 6

const toNumber = (value: string) => {
  const n = Number(value.replace(",", ".").trim())
  return value.trim() && Number.isFinite(n) ? n : NaN
}
const decimal = (n: number, locale: string) => new Intl.NumberFormat(locale === "en" ? "en-IE" : "el-GR", { maximumFractionDigits: 2 }).format(n)
const whole = (n: number, locale: string) => new Intl.NumberFormat(locale === "en" ? "en-IE" : "el-GR").format(n)

async function callAPI(path: string, init?: RequestInit) {
  const response = await fetch(`${backend()}${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    credentials: "omit",
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(json.message || `${response.status}`)
  return json
}

const toDrafts = (loyalty: Loyalty): RewardDraft[] =>
  loyalty.rewards.map((r) => ({ id: r.id, points: String(r.points), type: r.type, amount: r.amount != null ? String(r.amount).replace(".", ",") : "" }))

export default function VitrinakiLoyaltyPage() {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [pointsPerEuro, setPointsPerEuro] = useState("1")
  const [rewards, setRewards] = useState<RewardDraft[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const apply = (data: { loyalty: Loyalty; stats: Stats }) => {
    setEnabled(data.loyalty.enabled)
    setPointsPerEuro(String(data.loyalty.pointsPerEuro).replace(".", ","))
    setRewards(toDrafts(data.loyalty))
    setStats(data.stats)
  }

  const load = async () => {
    setLoading(true)
    setLoadError("")
    try {
      apply(await callAPI("/vendor/vitrinaki/loyalty"))
    } catch (cause) {
      setLoadError(cause instanceof Error && cause.message ? cause.message : t("vitrinakiLoyalty.loadError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateReward = (index: number, patch: Partial<RewardDraft>) =>
    setRewards((list) => list.map((r, i) => (i === index ? { ...r, ...patch } : r)))

  const addReward = () =>
    setRewards((list) => [...list, list.length === 0 ? { points: "100", type: "amount_off", amount: "5" } : { points: "", type: "amount_off", amount: "" }])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    const ppe = toNumber(pointsPerEuro)
    if (Number.isNaN(ppe) || ppe < 0.1 || ppe > 100) next.pointsPerEuro = t("vitrinakiLoyalty.errors.pointsPerEuro")
    rewards.forEach((r, i) => {
      const points = toNumber(r.points)
      if (!Number.isInteger(points) || points < 1) next[`points-${i}`] = t("vitrinakiLoyalty.errors.points")
      if (r.type === "amount_off") {
        const amount = toNumber(r.amount)
        if (Number.isNaN(amount) || amount <= 0 || amount > 1000) next[`amount-${i}`] = t("vitrinakiLoyalty.errors.amount")
      }
    })
    if (enabled && rewards.length === 0) next.rewards = t("vitrinakiLoyalty.errors.noRewards")
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      const data = await callAPI("/vendor/vitrinaki/loyalty", {
        method: "POST",
        body: JSON.stringify({
          loyalty: {
            enabled,
            pointsPerEuro: ppe,
            rewards: rewards.map((r) => ({
              ...(r.id ? { id: r.id } : {}),
              points: toNumber(r.points),
              type: r.type,
              ...(r.type === "amount_off" ? { amount: toNumber(r.amount) } : {}),
            })),
          },
        }),
      })
      apply(data)
      toast.success(t("vitrinakiLoyalty.saved"))
    } catch (cause) {
      toast.error(cause instanceof Error && cause.message ? cause.message : t("vitrinakiLoyalty.saveError"))
    } finally {
      setSaving(false)
    }
  }

  const statItems: Array<[string, number]> = stats
    ? [
        ["members", stats.members],
        ["issued", stats.pointsIssued],
        ["redeemed", stats.pointsRedeemed],
        ["rewards", stats.rewardsRedeemed],
      ]
    : []

  return (
    <div className="flex flex-col gap-y-3" data-testid="vitrinaki-loyalty">
      <Container className="divide-y p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
          <div>
            <Heading>{t("vitrinakiLoyalty.title")}</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">{t("vitrinakiLoyalty.subtitle")}</Text>
          </div>
          {!loading && !loadError ? (
            <Badge size="2xsmall" color={enabled ? "green" : "grey"}>
              {enabled ? t("vitrinakiLoyalty.on") : t("vitrinakiLoyalty.off")}
            </Badge>
          ) : null}
        </div>

        {loading ? (
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-subtle">{t("vitrinakiLoyalty.loading")}</Text>
          </div>
        ) : loadError ? (
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <Text size="small" className="text-ui-fg-error">{loadError}</Text>
            <Button size="small" variant="secondary" onClick={() => void load()}>{t("vitrinakiLoyalty.retry")}</Button>
          </div>
        ) : (
          // The panel's Tailwind build only carries classes it uses itself, so
          // the grid and the form spacing are inline.
          <div
            className="bg-ui-border-base"
            style={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
            data-testid="loyalty-stats"
          >
            {statItems.map(([key, value]) => (
              <div key={key} className="bg-ui-bg-base px-6 py-4">
                <Text size="xsmall" className="text-ui-fg-subtle">{t(`vitrinakiLoyalty.stats.${key}`)}</Text>
                <Text size="xlarge" weight="plus" className="mt-1">{whole(value, i18n.language)}</Text>
              </div>
            ))}
          </div>
        )}
      </Container>

      {!loading && !loadError ? (
        <Container className="p-0">
          <form onSubmit={save} className="flex flex-col gap-y-6 px-6" style={{ paddingTop: 20, paddingBottom: 20 }} noValidate>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="loyalty-enabled" size="small" weight="plus">{t("vitrinakiLoyalty.form.enabled")}</Label>
                <Text size="xsmall" className="text-ui-fg-subtle mt-1">{t("vitrinakiLoyalty.form.enabledHint")}</Text>
              </div>
              <Switch id="loyalty-enabled" className="shrink-0" checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="flex flex-col gap-y-2" style={{ maxWidth: 260 }}>
              <Label htmlFor="loyalty-ppe" size="small" weight="plus">{t("vitrinakiLoyalty.form.pointsPerEuro")}</Label>
              <Input id="loyalty-ppe" inputMode="decimal" value={pointsPerEuro} onChange={(e) => setPointsPerEuro(e.target.value)} aria-invalid={!!errors.pointsPerEuro} />
              <Text size="xsmall" className="text-ui-fg-subtle">{t("vitrinakiLoyalty.form.pointsPerEuroHint")}</Text>
              {errors.pointsPerEuro ? <Text size="xsmall" className="text-ui-fg-error">{errors.pointsPerEuro}</Text> : null}
            </div>

            <div className="flex flex-col gap-y-3">
              <div>
                <Heading level="h2">{t("vitrinakiLoyalty.form.rewards")}</Heading>
                <Text size="small" className="text-ui-fg-subtle mt-1">{t("vitrinakiLoyalty.form.rewardsHint")}</Text>
              </div>

              {rewards.length === 0 ? (
                <Text size="small" className="text-ui-fg-subtle">{t("vitrinakiLoyalty.form.noRewards")}</Text>
              ) : (
                rewards.map((reward, index) => (
                  <div key={reward.id ?? `new-${index}`} className="bg-ui-bg-subtle flex flex-wrap items-end gap-3 rounded-lg border px-4 py-3" data-testid="loyalty-reward-row">
                    <div className="flex flex-col gap-y-1" style={{ width: 120 }}>
                      <Label htmlFor={`reward-points-${index}`} size="xsmall" weight="plus">{t("vitrinakiLoyalty.form.points")}</Label>
                      <Input id={`reward-points-${index}`} size="small" inputMode="numeric" value={reward.points} onChange={(e) => updateReward(index, { points: e.target.value })} aria-invalid={!!errors[`points-${index}`]} />
                    </div>
                    <Text size="small" className="text-ui-fg-subtle pb-1.5">→</Text>
                    <div className="flex flex-col gap-y-1" style={{ minWidth: 190 }}>
                      <Label size="xsmall" weight="plus">{t("vitrinakiLoyalty.form.reward")}</Label>
                      <Select size="small" value={reward.type} onValueChange={(value) => updateReward(index, { type: value as RewardType })}>
                        <Select.Trigger><Select.Value /></Select.Trigger>
                        <Select.Content>
                          <Select.Item value="amount_off">{t("vitrinakiLoyalty.form.amountOff")}</Select.Item>
                          <Select.Item value="free_shipping">{t("vitrinakiLoyalty.form.freeShipping")}</Select.Item>
                        </Select.Content>
                      </Select>
                    </div>
                    {reward.type === "amount_off" ? (
                      <div className="flex flex-col gap-y-1" style={{ width: 110 }}>
                        <Label htmlFor={`reward-amount-${index}`} size="xsmall" weight="plus">{t("vitrinakiLoyalty.form.amount")}</Label>
                        <Input id={`reward-amount-${index}`} size="small" inputMode="decimal" value={reward.amount} onChange={(e) => updateReward(index, { amount: e.target.value })} aria-invalid={!!errors[`amount-${index}`]} />
                      </div>
                    ) : null}
                    <Button type="button" size="small" variant="transparent" className="ml-auto" onClick={() => setRewards((list) => list.filter((_, i) => i !== index))}>
                      {t("vitrinakiLoyalty.form.remove")}
                    </Button>
                    {errors[`points-${index}`] || errors[`amount-${index}`] ? (
                      <Text size="xsmall" className="text-ui-fg-error w-full">{errors[`points-${index}`] || errors[`amount-${index}`]}</Text>
                    ) : null}
                    {toNumber(reward.points) > 0 && (reward.type === "free_shipping" || toNumber(reward.amount) > 0) ? (
                      <Text size="xsmall" className="text-ui-fg-subtle w-full">
                        {reward.type === "free_shipping"
                          ? t("vitrinakiLoyalty.form.previewShipping", { points: whole(toNumber(reward.points), i18n.language) })
                          : t("vitrinakiLoyalty.form.previewAmount", {
                              points: whole(toNumber(reward.points), i18n.language),
                              amount: decimal(toNumber(reward.amount), i18n.language),
                              spend: decimal(toNumber(reward.points) / (toNumber(pointsPerEuro) || 1), i18n.language),
                            })}
                      </Text>
                    ) : null}
                  </div>
                ))
              )}
              {errors.rewards ? <Text size="xsmall" className="text-ui-fg-error">{errors.rewards}</Text> : null}
              {rewards.length < MAX_REWARDS ? (
                <Button type="button" size="small" variant="secondary" className="self-start" onClick={addReward}>
                  {t("vitrinakiLoyalty.form.add")}
                </Button>
              ) : null}
            </div>

            <div className="bg-ui-bg-subtle rounded-lg border px-4 py-3">
              <Text size="small" weight="plus">{t("vitrinakiLoyalty.how.title")}</Text>
              <ul className="text-ui-fg-subtle txt-compact-xsmall mt-1 flex list-disc flex-col gap-y-1 pl-4">
                <li>{t("vitrinakiLoyalty.how.earn")}</li>
                <li>{t("vitrinakiLoyalty.how.redeem")}</li>
                <li>{t("vitrinakiLoyalty.how.cancel")}</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="small" isLoading={saving}>{t("vitrinakiLoyalty.form.save")}</Button>
            </div>
          </form>
        </Container>
      ) : null}
    </div>
  )
}
