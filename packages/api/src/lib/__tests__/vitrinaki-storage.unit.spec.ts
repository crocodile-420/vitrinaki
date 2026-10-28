jest.mock("@mercurjs/core/workflows", () => ({ updateSellersWorkflow: jest.fn() }))

import { storageLimitBytes, storageUsedBytes, wouldExceedStorage } from "../vitrinaki-storage"

describe("vitrinaki storage", () => {
  const GB = 1024 ** 3

  it("reads the stored usage, zero when missing or broken", () => {
    expect(storageUsedBytes({ vitrinaki_storage: { usedBytes: 2048 } })).toBe(2048)
    expect(storageUsedBytes({ vitrinaki_storage: { usedBytes: "x" } })).toBe(0)
    expect(storageUsedBytes(null)).toBe(0)
  })

  it("gives each plan its space", () => {
    expect(storageLimitBytes(null)).toBe(2 * GB)
    expect(storageLimitBytes({ status: "active", planId: "business" })).toBe(100 * GB)
  })

  it("refuses an upload that would go over the limit", () => {
    expect(wouldExceedStorage(GB, GB, 2 * GB)).toBe(false)
    expect(wouldExceedStorage(GB, GB + 1, 2 * GB)).toBe(true)
  })
})
