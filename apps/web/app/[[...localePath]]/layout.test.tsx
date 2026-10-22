import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createWebMetadata } from "@/lib/WebMetadata"
import RootLayout, {
  generateMetadata,
  generateStaticParams,
  viewport,
} from "./layout"

const { serwistProviderSpy, websiteAnalyticsSpy } = vi.hoisted(() => ({
  serwistProviderSpy: vi.fn(),
  websiteAnalyticsSpy: vi.fn(() => null),
}))

vi.mock("@/components/WebsiteAnalytics", () => ({
  default: websiteAnalyticsSpy,
}))

vi.mock("@serwist/turbopack/react", () => ({
  SerwistProvider: ({
    children,
    ...registration
  }: {
    children?: ReactNode
    swUrl: string
    disable?: boolean
    cacheOnNavigation?: boolean
    reloadOnOnline?: boolean
  }) => {
    serwistProviderSpy(registration)
    return <>{children}</>
  },
}))

afterEach(() => {
  vi.unstubAllEnvs()
  serwistProviderSpy.mockClear()
  websiteAnalyticsSpy.mockClear()
})

describe("Root layout", () => {
  it.each([
    ["production", true],
    ["preview", false],
    ["development", false],
    ["staging", false],
    [undefined, false],
  ] as const)(
    "mounts audience analytics only for the production deployment: %s",
    async (vercelEnvironment, analyticsIsExpected) => {
      vi.stubEnv("NODE_ENV", "production")
      vi.stubEnv("VERCEL_ENV", vercelEnvironment)

      render(
        await RootLayout({
          params: Promise.resolve({}),
          children: <p>Private values game</p>,
        }),
      )

      expect(screen.getByText("Private values game")).toBeVisible()
      expect(websiteAnalyticsSpy).toHaveBeenCalledTimes(
        analyticsIsExpected ? 1 : 0,
      )
    },
  )

  it("exposes safe-area and keyboard resizing without restricting user zoom", () => {
    expect(viewport).toEqual({ viewportFit: "cover", interactiveWidget: "resizes-content" })
  })

  it("exposes the product metadata and accessible document language", async () => {
    const params = Promise.resolve({})
    render(await RootLayout({ params, children: <p>Values client</p> }))
    const metadata = await generateMetadata({ params })

    expect(metadata).toMatchObject({
      title:
        "What Are Your Values, Mapache? A Free Game To Find What You Value in Life",
      description:
        "What Are Your Values, Mapache? is a fast-paced, value-sorting autobattler to help you find out what you value in life.",
    })
    expect(metadata).toEqual(createWebMetadata(process.env.VERCEL_ENV))
    expect(document.documentElement).toHaveAttribute("lang", "en-US")
    expect(screen.getByText("Values client")).toBeVisible()
    expect(serwistProviderSpy).toHaveBeenCalledWith({
      swUrl: "/sw.js",
      disable: true,
      cacheOnNavigation: false,
      reloadOnOnline: false,
    })
  })

  it("enables offline registration for production releases", async () => {
    vi.stubEnv("NODE_ENV", "production")

    render(
      await RootLayout({
        params: Promise.resolve({}),
        children: <p>Production values client</p>,
      }),
    )

    expect(screen.getByText("Production values client")).toBeVisible()
    expect(serwistProviderSpy).toHaveBeenCalledWith({
      swUrl: "/sw.js",
      disable: false,
      cacheOnNavigation: false,
      reloadOnOnline: false,
    })
  })

  it("disables offline registration on protected Vercel Previews", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("VERCEL_ENV", "preview")

    render(
      await RootLayout({
        params: Promise.resolve({}),
        children: <p>Preview values client</p>,
      }),
    )

    expect(screen.getByText("Preview values client")).toBeVisible()
    expect(serwistProviderSpy).toHaveBeenCalledWith({
      swUrl: "/sw.js",
      disable: true,
      cacheOnNavigation: false,
      reloadOnOnline: false,
    })
  })

  it("prebuilds the Spanish document with its own language and canonical metadata", async () => {
    const params = Promise.resolve({ localePath: ["que-valoras-en-la-vida"] })
    render(await RootLayout({ params, children: <p>Juego de valores</p> }))
    expect(document.documentElement).toHaveAttribute("lang", "es-MX")
    expect(await generateMetadata({ params })).toEqual(
      createWebMetadata(process.env.VERCEL_ENV, "es-MX"),
    )
    expect(generateStaticParams()).toEqual([
      { localePath: [] },
      { localePath: ["que-valoras-en-la-vida"] },
    ])
  })
})
