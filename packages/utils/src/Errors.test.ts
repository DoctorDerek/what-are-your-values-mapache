import { describe, expect, it } from "vitest"
import { getErrorMessage } from "./Errors"

describe("getErrorMessage", () => {
  it("extracts message from Error objects", () => {
    expect(getErrorMessage(new Error("test error"))).toBe("test error")
  })

  it("extracts message from plain objects with message property", () => {
    expect(getErrorMessage({ message: "custom error" })).toBe("custom error")
  })

  it("converts string throws to message", () => {
    expect(getErrorMessage("string error")).toBe('"string error"')
  })

  it("converts number throws to message", () => {
    expect(getErrorMessage(42)).toBe("42")
  })

  it("converts null to message", () => {
    expect(getErrorMessage(null)).toBe("null")
  })

  it.each([undefined, new Error(), { message: "   " }])(
    "provides a meaningful fallback for an empty failure: %s",
    (error) => {
      expect(getErrorMessage(error)).toBe("Unknown error")
    },
  )

  it("handles objects without message property", () => {
    const result = getErrorMessage({ code: 404 })
    expect(typeof result).toBe("string")
    expect(result).toContain("404")
  })

  it.each([null, 42, false])(
    "serializes objects whose message is not a string: %s",
    (message) => {
      expect(getErrorMessage({ message })).toBe(JSON.stringify({ message }))
    },
  )
})
