import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, userEvent } from "@testing-library/react-native"
import NativeBattleActionBar from "@/components/NativeBattleActionBar"

describe("NativeBattleActionBar", () => {
  it("orders history before speed and Stop without shrinking accessible labels", async () => {
    await render(
      <NativeBattleActionBar
        animationSpeed="1x"
        canChangeAnimationSpeed
        onAnimationSpeedChange={jest.fn()}
        canOpenMenu
        canRedo
        canStop
        canUndo
        onOpenMenu={jest.fn()}
        onRedo={jest.fn()}
        onStop={jest.fn()}
        onUndo={jest.fn()}
      />,
    )

    expect(
      screen
        .getAllByRole("button")
        .map((action) => action.props.accessibilityLabel),
    ).toEqual([
      "Menu",
      "Redo",
      "Undo",
      "Battle animation speed 1×",
      "Battle animation speed 2×",
      "Battle animation speed 3×",
      "Skip battle animations",
      "Stop",
    ])
    for (const actionName of ["Menu", "Undo", "Redo", "Stop"]) {
      const label = screen.getByText(actionName)

      expect(label.props.adjustsFontSizeToFit).toBeUndefined()
      expect(label.props.minimumFontScale).toBeUndefined()
      expect(label.props.numberOfLines).toBeUndefined()
    }
  })

  it("exposes capability state and invokes only enabled battle actions", async () => {
    const onUndo = jest.fn()
    const onRedo = jest.fn()
    const onStop = jest.fn()
    const onOpenMenu = jest.fn()
    const user = userEvent.setup()
    const { rerender } = await render(
      <NativeBattleActionBar
        animationSpeed="1x"
        canChangeAnimationSpeed
        onAnimationSpeedChange={jest.fn()}
        canOpenMenu
        canRedo
        canStop
        canUndo={false}
        onOpenMenu={onOpenMenu}
        onRedo={onRedo}
        onStop={onStop}
        onUndo={onUndo}
      />,
    )

    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Redo" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Stop" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Menu" })).toBeEnabled()

    await user.press(screen.getByRole("button", { name: "Undo" }))
    await user.press(screen.getByRole("button", { name: "Redo" }))
    await user.press(screen.getByRole("button", { name: "Stop" }))
    await user.press(screen.getByRole("button", { name: "Menu" }))

    expect(onUndo).not.toHaveBeenCalled()
    expect(onRedo).toHaveBeenCalledTimes(1)
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(onOpenMenu).toHaveBeenCalledTimes(1)

    await rerender(
      <NativeBattleActionBar
        animationSpeed="1x"
        canChangeAnimationSpeed
        onAnimationSpeedChange={jest.fn()}
        canOpenMenu={false}
        canRedo={false}
        canStop={false}
        canUndo
        onOpenMenu={onOpenMenu}
        onRedo={onRedo}
        onStop={onStop}
        onUndo={onUndo}
      />,
    )

    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Menu" })).toBeDisabled()

    await user.press(screen.getByRole("button", { name: "Undo" }))
    await user.press(screen.getByRole("button", { name: "Redo" }))
    await user.press(screen.getByRole("button", { name: "Stop" }))
    await user.press(screen.getByRole("button", { name: "Menu" }))

    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onRedo).toHaveBeenCalledTimes(1)
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(onOpenMenu).toHaveBeenCalledTimes(1)
  })
})
