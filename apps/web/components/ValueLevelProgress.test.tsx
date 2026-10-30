import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import ValueLevelProgress from "@/components/ValueLevelProgress"

describe("ValueLevelProgress Component Integration", () => {
  it("presents the current level and exact progress toward the next one", () => {
    render(<ValueLevelProgress totalXp={4} />)

    expect(
      screen.getByLabelText("Level 3: 0 of 2 XP toward Level 4"),
    ).toBeVisible()
    const progress = screen.getByRole("progressbar", {
      name: "XP toward Level 4",
    })
    expect(progress).toHaveAttribute("data-slot", "progress")
    expect(progress).toHaveAttribute("aria-valuenow", "0")
    expect(progress).toHaveAttribute("aria-valuemax", "2")
    expect(screen.getByText("0/2 XP")).toBeVisible()
  })

  it("shows a new profile at the beginning of Level 1", () => {
    render(<ValueLevelProgress totalXp={0} />)

    const progress = screen.getByLabelText("Level 1: 0 of 2 XP toward Level 2")

    expect(progress).toBeVisible()
    const level = screen.getByText("Level 1")
    const bar = screen.getByRole("progressbar", { name: "XP toward Level 2" })
    const fraction = screen.getByText("0/2 XP")
    expect(
      level.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      bar.compareDocumentPosition(fraction) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(bar).toHaveAttribute("aria-valuenow", "0")
    expect(bar).toHaveAttribute("aria-valuemax", "2")
  })
})
