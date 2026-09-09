import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import PlayerDataLoading from "@/components/PlayerDataLoading"

describe("Player Data Loading", () => {
  it("announces hydration without exposing an ambiguous machine state", () => {
    render(<PlayerDataLoading />)

    expect(screen.getByRole("main")).toHaveAttribute(
      "data-slot",
      "mapache-screen",
    )
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true")
    expect(screen.getByRole("main")).toHaveAccessibleName(
      "Loading your values…",
    )
    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Loading your values…")
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite")
    expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true")
    expect(screen.queryByText(/Booting Machine/)).not.toBeInTheDocument()
  })
})
