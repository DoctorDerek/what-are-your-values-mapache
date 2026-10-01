import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import useAnimalAttentionInput from "@/lib/useAnimalAttentionInput"

function AttentionRow() {
  const { isAttended, attentionHandlers } = useAnimalAttentionInput()
  return (
    <section {...attentionHandlers} aria-label="Animal row">
      <output>{isAttended ? "Attended" : "Calm"}</output>
      <button>First action</button>
      <button>Second action</button>
    </section>
  )
}

describe("Shared animal attention input", () => {
  it("combines pointer and focus within without restarting on child traversal", () => {
    render(<AttentionRow />)
    const row = screen.getByRole("region", { name: "Animal row" })
    const first = screen.getByRole("button", { name: "First action" })
    const second = screen.getByRole("button", { name: "Second action" })
    expect(screen.getByRole("status")).toHaveTextContent("Calm")
    fireEvent.pointerEnter(row, { pointerType: "mouse" })
    expect(screen.getByRole("status")).toHaveTextContent("Attended")
    fireEvent.focus(first)
    fireEvent.pointerLeave(row)
    expect(screen.getByRole("status")).toHaveTextContent("Attended")
    fireEvent.blur(first, { relatedTarget: second })
    expect(screen.getByRole("status")).toHaveTextContent("Attended")
    fireEvent.blur(second, { relatedTarget: null })
    expect(screen.getByRole("status")).toHaveTextContent("Calm")
    fireEvent.pointerEnter(row, { pointerType: "pen" })
    fireEvent.pointerCancel(row)
    expect(screen.getByRole("status")).toHaveTextContent("Calm")
  })

  it("does not require or manufacture hover for touch input", () => {
    render(<AttentionRow />)
    fireEvent.pointerEnter(screen.getByRole("region"), { pointerType: "touch" })
    expect(screen.getByRole("status")).toHaveTextContent("Calm")
  })
})
