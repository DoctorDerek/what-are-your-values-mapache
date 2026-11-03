import { introductionCopy } from "@game/data/src/IntroductionCopy"
import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"
import GameIsland from "@/components/GameIsland"

const { dynamicGameClientLoader } = vi.hoisted(() => ({
  dynamicGameClientLoader: vi.fn<() => Promise<unknown>>(),
}))

vi.mock("@/components/GameClient", () => ({
  default: () => null,
}))

vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<unknown>,
    { loading: Loading }: { readonly loading: () => ReactNode },
  ) => {
    dynamicGameClientLoader.mockImplementation(loader)
    return Loading
  },
}))

describe("GameIsland", () => {
  it("renders the actual introduction before gameplay can accept input", () => {
    render(<GameIsland />)

    expect(
      screen.getByRole("region", {
        name: `Play ${introductionCopy.title}`,
      }),
    ).toHaveClass("min-h-[100dvh]")
    expect(
      screen.getByRole("heading", { name: introductionCopy.title }),
    ).toBeVisible()
    expect(screen.getByText(introductionCopy.tagline)).toBeVisible()
    expect(screen.queryByRole("button", { name: "Start" })).toBeNull()
    expect(screen.getByRole("link", { name: "DoctorDerek.com" })).toBeVisible()
  })

  it("loads the canonical game client through the isolated boundary", async () => {
    await expect(dynamicGameClientLoader()).resolves.toHaveProperty("default")
  })
})
