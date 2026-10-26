import type { ProductMenuDestination } from "@game/data/src/ProductMenu"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import ProductMenu from "@/components/ProductMenu"

function ProductMenuHarness({
  contextActionLabel,
  onDestinationSelect = () => undefined,
}: {
  contextActionLabel: "Close Menu" | "Resume Battle"
  onDestinationSelect?: (destination: ProductMenuDestination) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <ProductMenu
      contextActionLabel={contextActionLabel}
      open={open}
      onDestinationSelect={onDestinationSelect}
      onOpenChange={setOpen}
    />
  )
}

describe("Product Menu", () => {
  it("keeps every shipped destination in canonical order with Close Menu in the lower action row", () => {
    render(<ProductMenuHarness contextActionLabel="Close Menu" />)

    const dialog = screen.getByRole("dialog", { name: "Menu" })
    const actionLabels = within(dialog)
      .getAllByRole("button")
      .map((button) => button.textContent)

    expect(actionLabels).toEqual([
      "Browse All Values",
      "Custom Values",
      "Achievements",
      "Settings",
      "Controls",
      "Import & Export",
      "Introduction",
      "How It Works",
      "Why Values Matter",
      "Why I Made This Game",
      "Free Resources",
      "Credits & Privacy",
      "Close Menu",
    ])
  })

  it("keeps Resume Battle below the destinations and reports the exact selected destination", () => {
    const onDestinationSelect = vi.fn()
    render(
      <ProductMenuHarness
        contextActionLabel="Resume Battle"
        onDestinationSelect={onDestinationSelect}
      />,
    )

    const dialog = screen.getByRole("dialog", { name: "Menu" })
    expect(within(dialog).getAllByRole("button").at(-1)).toHaveTextContent(
      "Resume Battle",
    )

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Custom Values" }),
    )
    expect(onDestinationSelect).toHaveBeenCalledExactlyOnceWith({
      kind: "route",
      id: "custom-values",
      label: "Custom Values",
    })
  })

  it("dismisses through the platform-standard Escape interaction", () => {
    render(<ProductMenuHarness contextActionLabel="Close Menu" />)

    fireEvent.keyDown(document, { key: "Escape" })

    expect(
      screen.queryByRole("dialog", { name: "Menu" }),
    ).not.toBeInTheDocument()
  })
})
