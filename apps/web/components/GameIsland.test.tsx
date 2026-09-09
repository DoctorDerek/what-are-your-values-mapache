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
  it("uses the same accessible loading surface before the client is available", () => {
    render(<GameIsland />)

    expect(
      screen.getByRole("region", {
        name: `Play ${introductionCopy.title}`,
      }),
    ).toHaveClass("min-h-[100dvh]")
    expect(
      screen.getByRole("main", { name: "Loading your values…" }),
    ).toHaveAttribute("aria-busy", "true")
    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
    expect(screen.queryByText(introductionCopy.tagline)).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Loading your values…")
    expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true")
  })

  it("loads the canonical game client through the isolated boundary", async () => {
    await expect(dynamicGameClientLoader()).resolves.toHaveProperty("default")
  })
})
