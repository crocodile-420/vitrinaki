import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Badge, Button, Container, Heading, Input, Label, RadioGroup, Select, Text, toast } from "@medusajs/ui"
import type { RouteConfig } from "@mercurjs/dashboard-sdk"

import { client } from "../../lib/client"
import {
  COURIER_METADATA_KEY,
  FREE_OVER_METADATA_KEY,
  GREEK_COURIERS,
  findCourier,
  type CourierCode,
} from "../../lib/greek-couriers"

// Courier shipping options (ACS, ΕΛΤΑ Courier, Γενική Ταχυδρομική, DHL,
// Box Now). Each one is a normal shipping option on the manual provider,
// created through the standard /vendor/shipping-options API with the courier
// in metadata, so Mercur's seller scoping and permissions apply as usual and
// the option can still be edited under Settings → Locations.

export const config: RouteConfig = {
  label: "vitrinakiCouriers.nav",
  translationNs: "translation",
  rank: 46,
}

const CURRENCY = "eur"

type Zone = { id: string; name: string; locationName: string }
type Profile = { id: string; name: string }
type CourierOption = {
  id: string
  name: string
  courier: NonNullable<ReturnType<typeof findCourier>>
  amount: number | null
  freeOver: number | null
  zoneName: string
}

const toNumber = (value: string) => {
  const n = Number(value.replace(",", ".").trim())
  return Number.isFinite(n) ? n : NaN
}

const money = (amount: number | null, locale: string) =>
  amount == null
    ? "—"
    : new Intl.NumberFormat(locale === "en" ? "en-IE" : "el-GR", { style: "currency", currency: "EUR" }).format(amount)

export default function VitrinakiCouriersPage() {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [saving, setSaving] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [options, setOptions] = useState<CourierOption[]>([])

  const [courier, setCourier] = useState<CourierCode>("acs")
  const [name, setName] = useState(GREEK_COURIERS[0].defaultOptionName)
  const [nameEdited, setNameEdited] = useState(false)
  const [price, setPrice] = useState("")
  const [freeOver, setFreeOver] = useState("")
  const [zoneId, setZoneId] = useState("")
  const [profileId, setProfileId] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const refresh = async () => {
    setLoading(true)
    setLoadError("")
    try {
      const [locationsRes, profilesRes, optionsRes, offersRes] = await Promise.all([
        client.vendor.stockLocations.query({
          fields: "id,name,*fulfillment_sets,*fulfillment_sets.service_zones",
          limit: 100,
        } as never) as Promise<any>,
        client.vendor.shippingProfiles.query({ limit: 100 } as never) as Promise<any>,
        client.vendor.shippingOptions.query({
          fields: "id,name,metadata,shipping_profile_id,*prices,*prices.price_rules,*service_zone",
          limit: 200,
        } as never) as Promise<any>,
        // An option only ships items of its own shipping profile; checkout
        // fails otherwise. Default to the profile the shop's offers use.
        (client.vendor.offers.query({ fields: "id,shipping_profile_id", limit: 100 } as never) as Promise<any>)
          .catch(() => null),
      ])

      const nextZones: Zone[] = []
      for (const location of locationsRes?.stock_locations ?? []) {
        for (const set of location.fulfillment_sets ?? []) {
          if (set.type && set.type !== "shipping") continue
          for (const zone of set.service_zones ?? []) {
            nextZones.push({ id: zone.id, name: zone.name, locationName: location.name })
          }
        }
      }
      const nextProfiles: Profile[] = (profilesRes?.shipping_profiles ?? [])
        .map((p: any) => ({
          id: p.shipping_profile?.id ?? p.id,
          name: String(p.shipping_profile?.name ?? p.name ?? ""),
        }))
        .filter((p: Profile) => !!p.id)
      const zoneNames = new Map(nextZones.map((z) => [z.id, z.name]))
      const nextOptions: CourierOption[] = (optionsRes?.shipping_options ?? []).flatMap((o: any) => {
        const found = findCourier(o.metadata?.[COURIER_METADATA_KEY])
        if (!found) return []
        const prices: any[] = o.prices ?? []
        const base = prices.find((p) => p.currency_code === CURRENCY && !(p.price_rules ?? []).length)
        const free = prices.find((p) =>
          (p.price_rules ?? []).some((r: any) => r.attribute === "item_total")
        )
        const freeRule = free?.price_rules?.find((r: any) => r.attribute === "item_total")
        const metaFree = Number(o.metadata?.[FREE_OVER_METADATA_KEY])
        return [{
          id: o.id,
          name: o.name,
          courier: found,
          amount: base ? Number(base.amount) : null,
          freeOver: freeRule ? Number(freeRule.value) : Number.isFinite(metaFree) && metaFree > 0 ? metaFree : null,
          zoneName: o.service_zone?.name ?? zoneNames.get(o.service_zone_id) ?? "",
        }]
      })

      setZones(nextZones)
      setProfiles(nextProfiles)
      setOptions(nextOptions)
      const usage = new Map<string, number>()
      const count = (id: unknown) => {
        if (typeof id === "string" && nextProfiles.some((p) => p.id === id)) usage.set(id, (usage.get(id) ?? 0) + 1)
      }
      ;(offersRes?.offers ?? []).forEach((o: any) => count(o.shipping_profile_id))
      if (!usage.size) (optionsRes?.shipping_options ?? []).forEach((o: any) => count(o.shipping_profile_id))
      const preferredProfile = [...usage.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

      setZoneId((current) => current || nextZones[0]?.id || "")
      setProfileId((current) => current || preferredProfile || nextProfiles[0]?.id || "")
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : t("vitrinakiCouriers.loadError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pickCourier = (code: string) => {
    const next = findCourier(code)
    if (!next) return
    setCourier(next.code)
    if (!nameEdited) setName(next.defaultOptionName)
  }

  const selected = useMemo(() => findCourier(courier)!, [courier])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    const amount = toNumber(price)
    const threshold = freeOver.trim() ? toNumber(freeOver) : null
    if (!name.trim()) nextErrors.name = t("vitrinakiCouriers.errors.name")
    if (!price.trim() || Number.isNaN(amount) || amount < 0) nextErrors.price = t("vitrinakiCouriers.errors.price")
    if (threshold !== null && (Number.isNaN(threshold) || threshold <= 0)) nextErrors.freeOver = t("vitrinakiCouriers.errors.freeOver")
    if (!zoneId) nextErrors.zone = t("vitrinakiCouriers.errors.zone")
    if (!profileId) nextErrors.profile = t("vitrinakiCouriers.errors.profile")
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    try {
      const prices: Array<Record<string, unknown>> = [{ currency_code: CURRENCY, amount }]
      if (threshold !== null && amount > 0) {
        // Medusa's conditional shipping price: 0 € once the cart's item total
        // reaches the threshold.
        prices.push({
          currency_code: CURRENCY,
          amount: 0,
          rules: [{ attribute: "item_total", operator: "gte", value: threshold }],
        })
      }
      await client.vendor.shippingOptions.mutate({
        name: name.trim(),
        service_zone_id: zoneId,
        shipping_profile_id: profileId,
        provider_id: "manual_manual",
        price_type: "flat",
        prices,
        rules: [
          { attribute: "enabled_in_store", operator: "eq", value: "true" },
          { attribute: "is_return", operator: "eq", value: "false" },
        ],
        type: {
          label: selected.name,
          code: `courier-${selected.code}`,
          description: name.trim(),
        },
        metadata: {
          [COURIER_METADATA_KEY]: selected.code,
          ...(threshold !== null && amount > 0 ? { [FREE_OVER_METADATA_KEY]: threshold } : {}),
        },
      } as never)
      toast.success(t("vitrinakiCouriers.created", { name: name.trim() }))
      setPrice("")
      setFreeOver("")
      setNameEdited(false)
      setName(selected.defaultOptionName)
      await refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("vitrinakiCouriers.saveError"))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (option: CourierOption) => {
    if (!window.confirm(t("vitrinakiCouriers.confirmDelete", { name: option.name }))) return
    try {
      await client.vendor.shippingOptions.$id.delete({ $id: option.id } as never)
      toast.success(t("vitrinakiCouriers.deleted"))
      await refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("vitrinakiCouriers.saveError"))
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading>{t("vitrinakiCouriers.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {t("vitrinakiCouriers.subtitle")}
          </Text>
        </div>

        {loading ? (
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-subtle">{t("vitrinakiCouriers.loading")}</Text>
          </div>
        ) : loadError ? (
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <Text size="small" className="text-ui-fg-error">{loadError}</Text>
            <Button size="small" variant="secondary" onClick={() => void refresh()}>
              {t("vitrinakiCouriers.retry")}
            </Button>
          </div>
        ) : options.length === 0 ? (
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-subtle">{t("vitrinakiCouriers.empty")}</Text>
          </div>
        ) : (
          options.map((option) => (
            <div key={option.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4" data-testid="courier-option-row">
              <div className="flex min-w-0 flex-col gap-y-1">
                <div className="flex items-center gap-x-2">
                  <Badge size="2xsmall" color="blue">{option.courier.name}</Badge>
                  <Text size="small" weight="plus" className="truncate">{option.name}</Text>
                </div>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {money(option.amount, i18n.language)}
                  {option.freeOver != null
                    ? ` · ${t("vitrinakiCouriers.freeOverShort", { amount: money(option.freeOver, i18n.language) })}`
                    : ""}
                  {option.zoneName ? ` · ${option.zoneName}` : ""}
                </Text>
              </div>
              <Button size="small" variant="secondary" onClick={() => void remove(option)}>
                {t("vitrinakiCouriers.delete")}
              </Button>
            </div>
          ))
        )}
      </Container>

      <Container className="p-0">
        <form onSubmit={submit} className="flex flex-col gap-y-6 px-6 py-5" noValidate>
          <div>
            <Heading level="h2">{t("vitrinakiCouriers.form.title")}</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">{t("vitrinakiCouriers.form.hint")}</Text>
          </div>

          {!loading && zones.length === 0 ? (
            <div className="bg-ui-bg-subtle rounded-lg border px-4 py-3">
              <Text size="small" weight="plus">{t("vitrinakiCouriers.noZone.title")}</Text>
              <Text size="small" className="text-ui-fg-subtle mt-1">{t("vitrinakiCouriers.noZone.body")}</Text>
              <Link to="/settings/locations" className="text-ui-fg-interactive txt-compact-small-plus mt-2 inline-block">
                {t("vitrinakiCouriers.noZone.link")}
              </Link>
            </div>
          ) : null}

          <div className="flex flex-col gap-y-2">
            <Label size="small" weight="plus">{t("vitrinakiCouriers.form.courier")}</Label>
            <RadioGroup value={courier} onValueChange={pickCourier} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {GREEK_COURIERS.map((c) => (
                <RadioGroup.ChoiceBox
                  key={c.code}
                  value={c.code}
                  label={c.name}
                  description={c.trackingLink ? t("vitrinakiCouriers.form.trackingLink") : t("vitrinakiCouriers.form.trackingNumberOnly")}
                />
              ))}
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="courier-name" size="small" weight="plus">{t("vitrinakiCouriers.form.name")}</Label>
            <Input
              id="courier-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameEdited(true) }}
              aria-invalid={!!errors.name}
              maxLength={120}
            />
            <Text size="xsmall" className="text-ui-fg-subtle">{t("vitrinakiCouriers.form.nameHint")}</Text>
            {errors.name ? <Text size="xsmall" className="text-ui-fg-error">{errors.name}</Text> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="courier-price" size="small" weight="plus">{t("vitrinakiCouriers.form.price")}</Label>
              <Input
                id="courier-price"
                inputMode="decimal"
                placeholder="3,50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-invalid={!!errors.price}
              />
              {errors.price ? <Text size="xsmall" className="text-ui-fg-error">{errors.price}</Text> : null}
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="courier-free" size="small" weight="plus">{t("vitrinakiCouriers.form.freeOver")}</Label>
              <Input
                id="courier-free"
                inputMode="decimal"
                placeholder="50"
                value={freeOver}
                onChange={(e) => setFreeOver(e.target.value)}
                aria-invalid={!!errors.freeOver}
              />
              <Text size="xsmall" className="text-ui-fg-subtle">{t("vitrinakiCouriers.form.freeOverHint")}</Text>
              {errors.freeOver ? <Text size="xsmall" className="text-ui-fg-error">{errors.freeOver}</Text> : null}
            </div>
          </div>

          {zones.length > 1 || profiles.length > 1 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {zones.length > 1 ? (
                <div className="flex flex-col gap-y-2">
                  <Label size="small" weight="plus">{t("vitrinakiCouriers.form.zone")}</Label>
                  <Select value={zoneId} onValueChange={setZoneId}>
                    <Select.Trigger><Select.Value /></Select.Trigger>
                    <Select.Content>
                      {zones.map((z) => (
                        <Select.Item key={z.id} value={z.id}>{`${z.name} · ${z.locationName}`}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                  {errors.zone ? <Text size="xsmall" className="text-ui-fg-error">{errors.zone}</Text> : null}
                </div>
              ) : null}
              {profiles.length > 1 ? (
                <div className="flex flex-col gap-y-2">
                  <Label size="small" weight="plus">{t("vitrinakiCouriers.form.profile")}</Label>
                  <Select value={profileId} onValueChange={setProfileId}>
                    <Select.Trigger><Select.Value /></Select.Trigger>
                    <Select.Content>
                      {profiles.map((p) => (
                        <Select.Item key={p.id} value={p.id}>{p.name}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                  {errors.profile ? <Text size="xsmall" className="text-ui-fg-error">{errors.profile}</Text> : null}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {errors.zone && zones.length > 0 ? <Text size="xsmall" className="text-ui-fg-error">{errors.zone}</Text> : null}
              {errors.profile ? <Text size="xsmall" className="text-ui-fg-error">{errors.profile}</Text> : null}
            </>
          )}

          <div className="bg-ui-bg-subtle rounded-lg border px-4 py-3">
            <div className="flex items-center gap-x-2">
              <Badge size="2xsmall" color="grey">{t("vitrinakiCouriers.soon.badge")}</Badge>
              <Text size="small" weight="plus">{t("vitrinakiCouriers.soon.title")}</Text>
            </div>
            <Text size="xsmall" className="text-ui-fg-subtle mt-1">{t("vitrinakiCouriers.soon.body")}</Text>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="small" isLoading={saving} disabled={loading || zones.length === 0}>
              {t("vitrinakiCouriers.form.save")}
            </Button>
          </div>
        </form>
      </Container>
    </div>
  )
}
