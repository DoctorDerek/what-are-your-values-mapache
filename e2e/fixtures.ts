import { test as base } from "@playwright/test"
import {
  createPreviewIdentityResolver,
  type PreviewIdentityResolver,
} from "./preview-authentication"

interface PreviewWorkerFixtures {
  isProtectedVercelPreview: boolean
  resolvePreviewIdentity: PreviewIdentityResolver | null
}

export const test = base.extend<Record<never, never>, PreviewWorkerFixtures>({
  isProtectedVercelPreview: [
    process.env.PLAYWRIGHT_VERCEL_TRUSTED_OIDC === "true",
    { scope: "worker", option: true },
  ],
  resolvePreviewIdentity: [
    async ({ isProtectedVercelPreview }, use) => {
      if (!isProtectedVercelPreview) {
        await use(null)
        return
      }
      const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL
      const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
      if (!requestUrl || !requestToken)
        throw new Error("Protected previews require GitHub OIDC request credentials")
      await use(createPreviewIdentityResolver({ requestUrl, requestToken }))
    },
    { scope: "worker" },
  ],
  extraHTTPHeaders: async (
    { baseURL, extraHTTPHeaders, resolvePreviewIdentity },
    use,
    testInfo,
  ) => {
    if (!resolvePreviewIdentity) {
      await use(extraHTTPHeaders)
      return
    }
    const deployment = baseURL ? new URL(baseURL) : null
    if (
      deployment?.protocol !== "https:" ||
      !deployment.hostname.endsWith(".vercel.app")
    )
      throw new Error("Protected-preview identity requires an HTTPS Vercel deployment")

    const identity = await resolvePreviewIdentity(testInfo.timeout)
    if (identity.wasRenewed) {
      if (process.env.GITHUB_ACTIONS === "true")
        process.stdout.write(`::add-mask::${identity.token}\n`)
      testInfo.annotations.push({
        type: "preview-identity-renewed",
        description: `Valid until ${new Date(identity.expiresAt).toISOString()}`,
      })
    }
    await use({
      ...extraHTTPHeaders,
      "x-vercel-trusted-oidc-idp-token": identity.token,
    })
  },
})
