import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import BattleSpeedControl from "@/components/BattleSpeedControl"

describe("Battle speed control", () => {
  it("keeps control keys from selecting a winner while preserving Menu shortcuts", () => {
    const onBattleKeyDown = vi.fn()
    render(
      <div onKeyDown={onBattleKeyDown}>
        <BattleSpeedControl speed="1x" disabled={false} onChange={vi.fn()} />
      </div>,
    )
    const choice = screen.getByRole("button", {
      name: "Battle animation speed 2×",
    })
    for (const key of [
      " ",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "1",
      "2",
    ])
      fireEvent.keyDown(choice, { key })
    expect(onBattleKeyDown).not.toHaveBeenCalled()
    fireEvent.keyDown(choice, { key: "Escape" })
    expect(onBattleKeyDown).toHaveBeenCalledOnce()
  })

  it("exposes all direct modes with one selected, including persistent Skip", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <BattleSpeedControl speed="1x" disabled={false} onChange={onChange} />,
    )
    const group = screen.getByRole("group", { name: "Battle animation speed" })
    expect(within(group).getAllByRole("button")).toHaveLength(4)
    expect(
      screen.getByRole("button", { name: "Battle animation speed 1×" }),
    ).toHaveAttribute("aria-pressed", "true")
    for (const [name, mode] of [
      ["Battle animation speed 2×", "2x"],
      ["Battle animation speed 3×", "3x"],
      ["Skip battle animations", "skip"],
    ]) {
      fireEvent.click(screen.getByRole("button", { name }))
      expect(onChange).toHaveBeenLastCalledWith(mode)
    }
    rerender(
      <BattleSpeedControl speed="skip" disabled={false} onChange={onChange} />,
    )
    expect(
      within(group).getAllByRole("button", { pressed: true }),
    ).toHaveLength(1)
    expect(
      screen.getByRole("button", { name: "Skip battle animations" }),
    ).toHaveAttribute("aria-pressed", "true")
    rerender(<BattleSpeedControl speed="skip" disabled onChange={onChange} />)
    expect(
      within(group)
        .getAllByRole("button")
        .every((button) => button.hasAttribute("disabled")),
    ).toBe(true)
  })
})
