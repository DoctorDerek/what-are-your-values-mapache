const IDENTITY_CLOCK_SKEW_ALLOWANCE_MS = 30_000
const IDENTITY_REQUEST_TIMEOUT_MS = 10_000

interface PreviewIdentity {
  token: string
  expiresAt: number
}

interface PreviewIdentityResolution extends PreviewIdentity {
  wasRenewed: boolean
}

export type PreviewIdentityResolver = (
  requiredValidityMs: number,
) => Promise<PreviewIdentityResolution>

function readPreviewIdentity(payload: unknown): PreviewIdentity {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("value" in payload) ||
    typeof payload.value !== "string"
  )
    throw new Error("GitHub OIDC returned an invalid identity response")

  const token = payload.value
  const segments = token.split(".")
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))
    throw new Error("GitHub OIDC returned an invalid identity token")

  let claims: unknown
  try {
    claims = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"))
  } catch {
    throw new Error("GitHub OIDC returned unreadable identity claims")
  }
  if (
    typeof claims !== "object" ||
    claims === null ||
    !("exp" in claims) ||
    typeof claims.exp !== "number" ||
    !Number.isSafeInteger(claims.exp) ||
    !Number.isSafeInteger(claims.exp * 1000)
  )
    throw new Error("GitHub OIDC returned an invalid identity expiry")

  return { token, expiresAt: claims.exp * 1000 }
}

export function createPreviewIdentityResolver({
  requestUrl,
  requestToken,
  request = fetch,
  now = Date.now,
}: {
  requestUrl: string
  requestToken: string
  request?: typeof fetch
  now?: () => number
}): PreviewIdentityResolver {
  if (new URL(requestUrl).protocol !== "https:")
    throw new Error("GitHub OIDC identity requests require HTTPS")
  let identity: PreviewIdentity | null = null

  return async (requiredValidityMs) => {
    if (!Number.isFinite(requiredValidityMs) || requiredValidityMs <= 0)
      throw new Error(
        "Protected-preview tests require a finite positive timeout",
      )

    const requiredRemainingMs =
      requiredValidityMs + IDENTITY_CLOCK_SKEW_ALLOWANCE_MS
    if (identity && identity.expiresAt > now() + requiredRemainingMs)
      return { ...identity, wasRenewed: false }

    let response: Response
    try {
      response = await request(requestUrl, {
        headers: { Authorization: `Bearer ${requestToken}` },
        redirect: "error",
        signal: AbortSignal.timeout(IDENTITY_REQUEST_TIMEOUT_MS),
      })
    } catch {
      throw new Error("Could not request a fresh GitHub OIDC identity")
    }
    if (!response.ok)
      throw new Error(
        `GitHub OIDC identity request failed (HTTP ${response.status})`,
      )

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new Error("GitHub OIDC returned an unreadable identity response")
    }
    const nextIdentity = readPreviewIdentity(payload)
    if (nextIdentity.expiresAt <= now() + requiredRemainingMs)
      throw new Error(
        "GitHub OIDC identity expires before this test can finish",
      )

    identity = nextIdentity
    return { ...identity, wasRenewed: true }
  }
}
