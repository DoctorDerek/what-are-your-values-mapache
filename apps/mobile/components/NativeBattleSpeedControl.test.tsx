import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, userEvent } from "@testing-library/react-native"
import NativeBattleSpeedControl from "@/components/NativeBattleSpeedControl"

describe("Native Battle speed control", () => {
  it("selects modes directly by touch and exposes selected Skip", async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()
    const { rerender } = await render(
      <NativeBattleSpeedControl
        speed="1x"
        disabled={false}
        onChange={onChange}
      />,
    )
    for (const [name, mode] of [
      ["Battle animation speed 2×", "2x"],
      ["Battle animation speed 3×", "3x"],
      ["Skip battle animations", "skip"],
    ]) {
      await user.press(screen.getByRole("button", { name }))
      expect(onChange).toHaveBeenLastCalledWith(mode)
    }
    await rerender(
      <NativeBattleSpeedControl
        speed="skip"
        disabled={false}
        onChange={onChange}
      />,
    )
    expect(
      screen.getByRole("button", {
        name: "Skip battle animations",
        selected: true,
      }),
    ).toBeOnTheScreen()
    await rerender(
      <NativeBattleSpeedControl speed="skip" disabled onChange={onChange} />,
    )
    expect(
      screen.getByRole("button", { name: "Skip battle animations" }),
    ).toBeDisabled()
  })
})
