import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import Page from "@/components/WebPublicPage"

vi.mock("@/components/GameIsland", () => ({
  default: function GameIsland() {
    return <section aria-label="Game island">Game island</section>
  },
}))

describe("web page", () => {
  it("composes the static English article after the client-only game island", () => {
    render(<Page />)

    const gameIsland = screen.getByRole("region", { name: "Game island" })
    const editorialArticle = screen.getByRole("article", {
      name: "What Are Your Values, Mapache? information",
    })
    const editorialQueries = within(editorialArticle)

    expect(gameIsland.compareDocumentPosition(editorialArticle)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(
      editorialQueries.getByRole("link", { name: "Start or Continue Game" }),
    ).toHaveAttribute("href", "#game")
    expect(
      editorialQueries.getByRole("heading", {
        level: 2,
        name: "Introduction",
      }),
    ).toBeVisible()
    expect(editorialQueries.getAllByRole("term")).toHaveLength(103)
    expect(
      editorialQueries.getByRole("link", { name: "Report a Problem" }),
    ).toHaveAttribute("href", "mailto:derekraustin+wayvm@gmail.com")
  })

  it("publishes all 103 Spanish meanings and language links without private player data", () => {
    render(<Page locale="es-MX" />)
    const article = screen.getByRole("article")
    const content = within(article)
    expect(content.getAllByRole("term")).toHaveLength(103)
    expect(content.getByText("Ingenio", { exact: true })).toBeVisible()
    expect(
      content.getByText(
        "resolver problemas de formas originales, prácticas y con los recursos disponibles",
        { exact: true },
      ),
    ).toBeVisible()
    expect(
      content.queryByText("Ingenuity", { exact: true }),
    ).not.toBeInTheDocument()
    expect(
      content.getByRole("link", { name: "Español (México)" }),
    ).toHaveAttribute("aria-current", "page")
    expect(content.getByRole("link", { name: "English (US)" })).toHaveAttribute(
      "href",
      "/",
    )
    expect(
      content.getByRole("link", { name: "Español (México)" }),
    ).toHaveAttribute("href", "/que-valoras-en-la-vida")
  })
})
