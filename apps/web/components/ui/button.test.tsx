import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Button } from "@/components/ui/button"

describe("Button Primitive Integration", () => {
  it("renders an accessible Vivid action with its default semantic contract", () => {
    const onClick = vi.fn()

    render(<Button onClick={onClick}>Battle</Button>)

    const button = screen.getByRole("button", { name: "Battle" })
    expect(button).toHaveAttribute("data-slot", "button")
    expect(button).toHaveAttribute("data-variant", "default")
    expect(button).toHaveClass("min-h-11", "border-4", "bg-primary")

    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("preserves disabled native-button behavior", () => {
    const onClick = vi.fn()

    render(
      <Button disabled onClick={onClick}>
        Saving…
      </Button>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Saving…" }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it("supports sentence-case labels without changing other buttons", () => {
    const onClick = vi.fn()
    render(
      <>
        <Button textCase="normal-case" onClick={onClick}>
          Add value
        </Button>
        <Button>Battle</Button>
      </>,
    )
    const add = screen.getByRole("button", { name: "Add value" })
    expect(add).toHaveClass("normal-case")
    expect(add).not.toHaveClass("uppercase")
    expect(screen.getByRole("button", { name: "Battle" })).toHaveClass(
      "uppercase",
    )
    fireEvent.click(add)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("composes the same styles onto a semantic link when requested", () => {
    render(
      <Button asChild variant="secondary">
        <a href="/values">Browse Values</a>
      </Button>,
    )

    const link = screen.getByRole("link", { name: "Browse Values" })
    expect(link).toHaveAttribute("href", "/values")
    expect(link).toHaveAttribute("data-slot", "button")
    expect(link).toHaveClass("bg-secondary")
  })
})
