import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import Splash from "@/components/Splash"

describe("Introduction Component Integration", () => {
  it("places the supported language choice outside the scroll body and preserves the creator link", () => {
    const onLocaleChange = vi.fn()
    render(
      <Splash
        onComplete={vi.fn()}
        onLocaleChange={onLocaleChange}
        shouldReduceMotion
      />,
    )
    const selector = screen.getByRole("combobox", { name: "Language" })
    expect(screen.getByTestId("information-panel-body")).not.toContainElement(
      selector,
    )
    expect(selector).toHaveDisplayValue("English (US)")
    fireEvent.change(selector, { target: { value: "en" } })
    expect(onLocaleChange).toHaveBeenCalledExactlyOnceWith("en")
    expect(
      screen.getByRole("link", { name: "DoctorDerek.com" }),
    ).toHaveAttribute("target", "_blank")
    expect(screen.queryByTestId("arrival-ice-cream")).toBeNull()
  })
  it("presents the approved first-contact truth without retired claims", () => {
    render(<Splash onComplete={vi.fn()} onLocaleChange={vi.fn()} />)

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "What Are Your Values, Mapache?",
      }),
    ).toBeVisible()
    expect(
      screen.getByText(
        "Compare 103 included values in quick one-on-one battles. If something important is missing, add private Custom Values with names and definitions you choose.",
      ),
    ).toBeVisible()
    expect(
      screen.getByText(
        "Play for a few minutes or keep going. There is no correct ranking. Start over any time by resetting your game progress.",
      ),
    ).toBeVisible()
    expect(
      screen.getByText(
        "Private. Offline. Account-free. Your choices and Custom Values stay on this device unless you choose to export them.",
      ),
    ).toBeVisible()
    expect(document.body).not.toHaveTextContent(
      /10-15|under an hour|reduce stress/i,
    )
  })

  it("starts immediately without requiring the scroll body to reach its end", () => {
    const onComplete = vi.fn()

    render(<Splash onComplete={onComplete} onLocaleChange={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Start" }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("announces completed local erasure before a fresh start", () => {
    render(
      <Splash
        onLocaleChange={vi.fn()}
        notice="All local WAYVM player data was deleted."
        onComplete={vi.fn()}
      />,
    )

    expect(screen.getByRole("status")).toHaveTextContent(
      "All local WAYVM player data was deleted.",
    )
  })
})
