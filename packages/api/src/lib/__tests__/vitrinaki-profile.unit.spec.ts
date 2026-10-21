import { scrubNested } from "../public-seller-scrub"
import {
  emptyPrivateProfile,
  isGreekMobile,
  isGreekPhone,
  isValidAfm,
  normalizePrivateProfile,
  normalizePublicProfile,
  publicProfileView,
} from "../vitrinaki-profile"

describe("ΑΦΜ validation", () => {
  it("accepts checksum-valid numbers", () => {
    expect(isValidAfm("094014201")).toBe(true) // published public-sector ΑΦΜ (ΑΑΔΕ)
    expect(isValidAfm("090000045")).toBe(true) // ΔΕΗ
  })
  it("rejects wrong checksum, length and zeros", () => {
    expect(isValidAfm("094014202")).toBe(false)
    expect(isValidAfm("12345678")).toBe(false)
    expect(isValidAfm("000000000")).toBe(false)
    expect(isValidAfm("09401420a")).toBe(false)
  })
})

describe("Greek phones", () => {
  it("validates landlines and mobiles", () => {
    expect(isGreekPhone("210 123 4567")).toBe(true)
    expect(isGreekPhone("+30 6912345678")).toBe(true)
    expect(isGreekPhone("12345")).toBe(false)
    expect(isGreekMobile("2101234567")).toBe(false)
    expect(isGreekMobile("0030 691 234 5678")).toBe(true)
  })
})

describe("profile normalisation", () => {
  it("reports field errors", () => {
    const errors: Record<string, string> = {}
    normalizePublicProfile({ whatsapp: "abc", socials: { website: "not a url" } }, errors)
    expect(errors["profile.whatsapp"]).toBeDefined()
    normalizePrivateProfile({ legal: { afm: "123456789", invoiceEmail: "x" }, owner: { mobile: "2101234567" } }, null, errors)
    expect(errors["private.legal.afm"]).toBeDefined()
    expect(errors["private.legal.invoiceEmail"]).toBeDefined()
    expect(errors["private.owner.mobile"]).toBeDefined()
  })
  it("stamps GDPR consent once", () => {
    const first = normalizePrivateProfile({ owner: { gdprConsent: true } }, null)
    expect(first.owner.gdprConsentAt).toBeTruthy()
    const again = normalizePrivateProfile({ owner: { gdprConsent: true } }, first)
    expect(again.owner.gdprConsentAt).toBe(first.owner.gdprConsentAt)
    expect(normalizePrivateProfile({ owner: { gdprConsent: false } }, first).owner.gdprConsentAt).toBeNull()
  })
})

describe("public projection never leaks private data", () => {
  const priv = { ...emptyPrivateProfile(), legal: { ...emptyPrivateProfile().legal, afm: "094014201", legalName: "SECRET LEGAL" } }
  it("drops unknown/private keys even if they end up in the public metadata", () => {
    const view = publicProfileView({ businessType: "food", story: "hi", legal: priv.legal, owner: { mobile: "6900000000" }, afm: "094014201" })
    const json = JSON.stringify(view)
    expect(json).not.toContain("094014201")
    expect(json).not.toContain("SECRET LEGAL")
    expect(json).not.toContain("6900000000")
    expect(view.story).toBe("hi")
  })
  it("hides the street when the seller asked to", () => {
    const view = publicProfileView({ address: { street: "Οδός 1", city: "Αθήνα", hideStreet: true } })
    expect(view.address.street).toBe("")
    expect(view.address.city).toBe("Αθήνα")
  })
  it("scrubs embedded sellers in store responses", () => {
    const body = {
      offers: [{ seller: { id: "s", email: "shop@x.gr", members: [{ email: "owner@x.gr" }], professional_details: { tax_id: "094014201" }, metadata: { vitrinaki_subscription: { status: "active" }, vitrinaki_profile: { story: "ok" } } } }],
    }
    scrubNested(body)
    const json = JSON.stringify(body)
    expect(json).not.toContain("owner@x.gr")
    expect(json).not.toContain("094014201")
    expect(json).not.toContain("vitrinaki_subscription")
    expect(json).toContain("vitrinaki_profile")
  })
})

describe("opening hours", () => {
  it("keeps default hours for days the seller never edited", () => {
    const p = normalizePublicProfile({ hoursEnabled: true })
    expect(p.hours.mon.open).toBe("09:00")
    expect(p.hours.sun.closed).toBe(true)
    expect(publicProfileView({ hoursEnabled: true }).hours).not.toBeNull()
  })
})
