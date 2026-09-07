import { describe, expect, it, vi } from "vitest"
import { createPreviewIdentityResolver } from "./preview-authentication"

const requestUrl = "https://oidc.example.test/identity?api-version=2.0"
const requestToken = "synthetic-request-credential"
const initialTime = Date.UTC(2026, 8, 7, 4, 27, 22)
const tokenLifetimeMs = 300_000

function identityResponse(expiresAt: number) {
  const claims = Buffer.from(
    JSON.stringify({ exp: expiresAt / 1000 }),
  ).toString("base64url")
  return Response.json({ value: `e30.${claims}.synthetic-signature` })
}

describe("protected-preview identity lifecycle", () => {
  it("reuses a sufficient identity and renews before the next test crosses expiry", async () => {
    let currentTime = initialTime
    const request = vi.fn<typeof fetch>(async () =>
      identityResponse(currentTime + tokenLifetimeMs),
    )
    const resolveIdentity = createPreviewIdentityResolver({
      requestUrl,
      requestToken,
      request,
      now: () => currentTime,
    })

    const first = await resolveIdentity(30_000)
    expect(first.wasRenewed).toBe(true)
    expect(first.expiresAt).toBe(initialTime + tokenLifetimeMs)
    currentTime += 239_000
    expect(await resolveIdentity(30_000)).toEqual({
      ...first,
      wasRenewed: false,
    })
    expect(request).toHaveBeenCalledTimes(1)

    currentTime += 1000
    const renewed = await resolveIdentity(30_000)
    expect(renewed.wasRenewed).toBe(true)
    expect(renewed.token).not.toBe(first.token)
    expect(renewed.expiresAt).toBe(currentTime + tokenLifetimeMs)
    expect(request).toHaveBeenCalledTimes(2)

    currentTime = first.expiresAt + 30_000
    expect(await resolveIdentity(30_000)).toEqual({
      ...renewed,
      wasRenewed: false,
    })
    expect(request).toHaveBeenCalledTimes(2)
    expect(request).toHaveBeenCalledWith(requestUrl, {
      headers: { Authorization: `Bearer ${requestToken}` },
      redirect: "error",
      signal: expect.any(AbortSignal),
    })
  })

  it("keeps later tests authenticated across multiple identity lifetimes", async () => {
    let currentTime = initialTime
    const request = vi.fn<typeof fetch>(async () =>
      identityResponse(currentTime + tokenLifetimeMs),
    )
    const resolveIdentity = createPreviewIdentityResolver({
      requestUrl,
      requestToken,
      request,
      now: () => currentTime,
    })
    for (let elapsedMs = 0; elapsedMs <= 720_000; elapsedMs += 120_000) {
      currentTime = initialTime + elapsedMs
      const identity = await resolveIdentity(30_000)
      expect(identity.expiresAt).toBeGreaterThan(currentTime + 60_000)
    }
    expect(request).toHaveBeenCalledTimes(4)
  })

  it("fails instead of reusing an expired identity when renewal fails", async () => {
    let currentTime = initialTime
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(identityResponse(initialTime + tokenLifetimeMs))
      .mockRejectedValueOnce(new Error(`request failed: ${requestToken}`))
      .mockResolvedValueOnce(
        identityResponse(initialTime + tokenLifetimeMs * 2),
      )
    const resolveIdentity = createPreviewIdentityResolver({
      requestUrl,
      requestToken,
      request,
      now: () => currentTime,
    })
    await resolveIdentity(30_000)
    currentTime += tokenLifetimeMs
    await expect(resolveIdentity(30_000)).rejects.toThrow(
      "Could not request a fresh GitHub OIDC identity",
    )
    expect((await resolveIdentity(30_000)).wasRenewed).toBe(true)
    expect(request).toHaveBeenCalledTimes(3)
  })

  it("reports rejected authentication without returning the provider body", async () => {
    const resolveIdentity = createPreviewIdentityResolver({
      requestUrl,
      requestToken,
      request: vi.fn<typeof fetch>(async () =>
        Response.json({ detail: requestToken }, { status: 401 }),
      ),
      now: () => initialTime,
    })
    await expect(resolveIdentity(30_000)).rejects.toThrow(
      "GitHub OIDC identity request failed (HTTP 401)",
    )
  })

  it("rejects identity requests that could expose credentials over HTTP", () => {
    expect(() =>
      createPreviewIdentityResolver({
        requestUrl: "http://oidc.example.test/identity",
        requestToken,
      }),
    ).toThrow("GitHub OIDC identity requests require HTTPS")
  })

  it.each([0, -1, Number.POSITIVE_INFINITY, Number.NaN])(
    "rejects unbounded or invalid test duration %s before requesting identity",
    async (duration) => {
      const request = vi.fn<typeof fetch>()
      const resolveIdentity = createPreviewIdentityResolver({
        requestUrl,
        requestToken,
        request,
      })
      await expect(resolveIdentity(duration)).rejects.toThrow(
        "Protected-preview tests require a finite positive timeout",
      )
      expect(request).not.toHaveBeenCalled()
    },
  )

  it("rejects a newly issued identity that cannot cover the current test", async () => {
    const resolveIdentity = createPreviewIdentityResolver({
      requestUrl,
      requestToken,
      request: vi.fn<typeof fetch>(async () =>
        identityResponse(initialTime + 60_000),
      ),
      now: () => initialTime,
    })
    await expect(resolveIdentity(30_000)).rejects.toThrow(
      "GitHub OIDC identity expires before this test can finish",
    )
  })

  it.each([
    null,
    { value: 1 },
    { value: "not-a-token" },
    { value: "e30.eyJleHAiOiJub3QtYS1udW1iZXIifQ.signature" },
    { value: "e30.e30.signature" },
    { value: "e30.invalid.signature" },
    { value: "e30.e30.signature\n::warning::untrusted-command" },
  ])(
    "rejects malformed provider data without exposing its content",
    async (body) => {
      const resolveIdentity = createPreviewIdentityResolver({
        requestUrl,
        requestToken,
        request: vi.fn<typeof fetch>(async () => Response.json(body)),
        now: () => initialTime,
      })
      await expect(resolveIdentity(30_000)).rejects.toThrow(
        /^GitHub OIDC returned /,
      )
    },
  )

  it("rejects a non-JSON identity response with a sanitized message", async () => {
    const resolveIdentity = createPreviewIdentityResolver({
      requestUrl,
      requestToken,
      request: vi.fn<typeof fetch>(async () => new Response(requestToken)),
      now: () => initialTime,
    })
    await expect(resolveIdentity(30_000)).rejects.toThrow(
      "GitHub OIDC returned an unreadable identity response",
    )
  })
})
