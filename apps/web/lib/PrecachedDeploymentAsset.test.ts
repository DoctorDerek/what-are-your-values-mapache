import { describe, expect, it } from "vitest"
import { getPrecachedDeploymentAsset } from "./PrecachedDeploymentAsset"

describe("precached deployment-tagged files", () => {
  it("looks up the same static file without the deployment parameter and keeps other selectors", () => {
    const url = new URL(
      "/_next/static/chunks/shell.abc.js?view=full&dpl=release",
      location.href,
    )
    const [cached] = getPrecachedDeploymentAsset({ url })
    expect(cached!.pathname).toBe(url.pathname)
    expect(cached!.search).toBe("?view=full")
    expect(url.searchParams.get("dpl")).toBe("release")
  })

  it.each([
    "/_next/static/chunks/shell.abc.js",
    "/profile?dpl=release",
    "https://other.example/_next/static/chunks/shell.abc.js?dpl=release",
  ])("keeps the ordinary lookup for %s", (entry) => {
    expect(
      getPrecachedDeploymentAsset({ url: new URL(entry, location.href) }),
    ).toEqual([])
  })
})
