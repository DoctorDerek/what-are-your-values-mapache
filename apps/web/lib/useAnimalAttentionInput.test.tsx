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

  it("acknowledges completed touch taps but not drag, focus or cancelled scrolling", () => {
    render(<AttentionRow />)
    const row = screen.getByRole("region")
    const touch = {
      pointerType: "touch",
      pointerId: 1,
      clientX: 10,
      clientY: 10,
    }
    fireEvent.pointerDown(row, touch)
    fireEvent.focus(screen.getByRole("button", { name: "First action" }))
    expect(screen.getByRole("status")).toHaveTextContent("Calm")
    fireEvent.pointerUp(row, touch)
    expect(screen.getByRole("status")).toHaveTextContent("Attended")
    fireEvent.pointerDown(row, touch)
    expect(screen.getByRole("status")).toHaveTextContent("Calm")
    fireEvent.pointerMove(row, { ...touch, clientY: 30 })
    fireEvent.pointerUp(row, touch)
    expect(screen.getByRole("status")).toHaveTextContent("Calm")
    fireEvent.pointerDown(row, touch)
    fireEvent.pointerCancel(row)
    fireEvent.pointerUp(row, touch)
    expect(screen.getByRole("status")).toHaveTextContent("Calm")
    fireEvent.pointerDown(row, touch)
    fireEvent.pointerUp(row, { ...touch, clientY: 30 })
    expect(screen.getByRole("status")).toHaveTextContent("Calm")
    fireEvent.pointerDown(row, touch)
    fireEvent.pointerUp(row, touch)
    expect(screen.getByRole("status")).toHaveTextContent("Attended")
  })
})
