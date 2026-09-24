import {
  CREDITS_PRIVACY_INFORMATION_PANEL,
  FREE_RESOURCES_INFORMATION_PANEL,
  HOW_IT_WORKS_INFORMATION_PANEL,
  WHY_I_MADE_THIS_GAME_INFORMATION_PANEL,
} from "@game/data/src/InformationPanels"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import InformationPanelContent from "@/components/InformationPanelContent"

describe("InformationPanelContent", () => {
  it("discloses website analytics while retaining the private gameplay boundary", () => {
    render(
      <InformationPanelContent
        informationPanel={CREDITS_PRIVACY_INFORMATION_PANEL}
      />,
    )

    expect(
      screen.getByText(
        /production website uses cookieless Vercel Web Analytics/,
      ),
    ).toBeVisible()
    expect(
      screen.getByText(/native apps do not load this analytics service/),
    ).toBeVisible()
    expect(
      screen.getByText(
        /does not send your comparisons, canonical or Custom Values/,
      ),
    ).toBeVisible()
  })

  it("renders approved sections and creator attribution semantically", () => {
    const { rerender } = render(
      <InformationPanelContent
        informationPanel={HOW_IT_WORKS_INFORMATION_PANEL}
      />,
    )

    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(9)
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Treat the Result as a Reflection, Not a Verdict",
      }),
    ).toBeInTheDocument()

    rerender(
      <InformationPanelContent
        informationPanel={WHY_I_MADE_THIS_GAME_INFORMATION_PANEL}
      />,
    )
    expect(screen.getByText("—Dr. Derek Austin")).toHaveClass("text-right")
  })

  it("renders exactly seven explicit isolated external resource actions", () => {
    render(
      <InformationPanelContent
        informationPanel={FREE_RESOURCES_INFORMATION_PANEL}
      />,
    )

    const resourceLinks = screen.getAllByRole("link")
    expect(resourceLinks).toHaveLength(7)

    for (const resourceLink of resourceLinks) {
      expect(resourceLink).toHaveAttribute(
        "href",
        expect.stringMatching(/^https:\/\//),
      )
      expect(resourceLink).toHaveAttribute("target", "_blank")
      expect(resourceLink).toHaveAttribute("rel", "noopener noreferrer")
    }

    expect(
      screen.getByText(
        "External links require internet access and are governed by each destination’s privacy and accessibility practices.",
      ),
    ).toBeInTheDocument()
  })
})
