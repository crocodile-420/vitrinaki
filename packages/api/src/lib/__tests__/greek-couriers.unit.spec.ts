import {
  GREEK_COURIERS,
  courierFromMetadata,
  courierTrackingUrl,
  trackingForCustomer,
  withCourierTrackingUrls,
} from "../greek-couriers"

describe("greek couriers", () => {
  it("lists the five couriers", () => {
    expect(GREEK_COURIERS.map((c) => c.code)).toEqual(["acs", "elta_courier", "geniki", "dhl", "box_now"])
  })

  it("reads the courier off shipping option metadata", () => {
    expect(courierFromMetadata({ courier: "acs" })?.name).toBe("ACS")
    expect(courierFromMetadata({ courier: "geniki" })?.name).toBe("Γενική Ταχυδρομική")
    expect(courierFromMetadata({ courier: "speedex" })).toBeUndefined()
    expect(courierFromMetadata(null)).toBeUndefined()
    expect(courierFromMetadata("acs")).toBeUndefined()
  })

  it("builds each courier's public tracking link", () => {
    expect(courierTrackingUrl("acs", "7401234567")).toBe(
      "https://www.acscourier.net/el/myacs/anafores-apostolwn/anazitisi-apostolwn/?trackingNumber=7401234567"
    )
    expect(courierTrackingUrl("elta_courier", " PB123456789GR ")).toBe("https://www.elta-courier.gr/search?br=PB123456789GR")
    expect(courierTrackingUrl("geniki", "4359168796")).toBe("https://www.taxydromiki.com/track/4359168796")
    expect(courierTrackingUrl("dhl", "1234567890")).toBe(
      "https://www.dhl.com/global-en/home/tracking/tracking-parcel.html?submit=1&tracking-id=1234567890"
    )
  })

  it("gives no link when it cannot build a safe one", () => {
    expect(courierTrackingUrl("box_now", "1234567890")).toBeNull()
    expect(courierTrackingUrl("acs", "")).toBeNull()
    expect(courierTrackingUrl("acs", "<script>")).toBeNull()
    expect(courierTrackingUrl("acs", "javascript:alert(1)")).toBeNull()
    expect(courierTrackingUrl("unknown", "123")).toBeNull()
  })

  it("fills only labels without a link of their own", () => {
    const labels = [
      { id: "l1", tracking_number: "111", tracking_url: "", label_url: "" },
      { id: "l2", tracking_number: "222", tracking_url: "https://example.com/t/222", label_url: "" },
      { id: "l3", tracking_number: "333", tracking_url: "/", label_url: "" },
    ]
    expect(withCourierTrackingUrls("geniki", labels)).toEqual([
      { id: "l1", tracking_number: "111", tracking_url: "https://www.taxydromiki.com/track/111", label_url: "" },
      labels[1],
      { id: "l3", tracking_number: "333", tracking_url: "https://www.taxydromiki.com/track/333", label_url: "" },
    ])
  })

  it("copies tracking numbers and https links for the customer", () => {
    expect(
      trackingForCustomer([
        { id: "l1", tracking_number: " 111 ", tracking_url: "https://www.taxydromiki.com/track/111" },
        { id: "l2", tracking_number: "222", tracking_url: "javascript:alert(1)" },
        { id: "l3", tracking_number: "", tracking_url: "https://example.com" },
      ])
    ).toEqual([
      { number: "111", url: "https://www.taxydromiki.com/track/111" },
      { number: "222", url: null },
    ])
    expect(trackingForCustomer(undefined)).toEqual([])
  })

  it("reports no change when there is nothing to fill", () => {
    expect(withCourierTrackingUrls("box_now", [{ id: "l1", tracking_number: "1", tracking_url: "" }])).toBeNull()
    expect(withCourierTrackingUrls(undefined, [{ id: "l1", tracking_number: "1", tracking_url: "" }])).toBeNull()
    expect(withCourierTrackingUrls("acs", [])).toBeNull()
  })
})
