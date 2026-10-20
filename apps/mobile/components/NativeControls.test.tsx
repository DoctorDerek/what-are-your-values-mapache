import { describe, expect, it, jest } from "@jest/globals"
import LocaleProvider from "@game/utils/src/LocaleContext"
import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native"
import NativeControls from "@/components/NativeControls"

describe("NativeControls", () => {
  it("pairs touch inputs with their actions without desktop-only instructions", async () => {
    await render(<NativeControls open onOpenChange={() => undefined} />)

    expect(screen.getByLabelText("Controls")).toBeOnTheScreen()
    expect(screen.queryByRole("heading", { name: "Actions" })).toBeNull()
    expect(screen.queryByRole("heading", { name: "Available Controls" })).toBeNull()
    expect(screen.getByRole("heading", { name: "Touch" })).toBeOnTheScreen()
    expect(screen.getByText("Tap the first value card")).toBeOnTheScreen()
    expect(screen.getByText("Tap the second value card")).toBeOnTheScreen()
    expect(screen.getByText("Tap Undo")).toBeOnTheScreen()
    expect(screen.getByText("Tap Redo")).toBeOnTheScreen()
    expect(screen.getAllByText("Select First Value")).toHaveLength(1)
    expect(screen.getAllByText("Undo")).toHaveLength(1)
    expect(
      screen.getByText(
        "Stop battling. If your progress changed, review your results before returning home.",
      ),
    ).toBeOnTheScreen()
    expect(screen.queryByText("Keyboard")).toBeNull()
    expect(screen.queryByText(/controller|remap/i)).toBeNull()
  })

  it("dismisses through either Close action and platform Back", async () => {
    const onOpenChange = jest.fn()
    const user = userEvent.setup()
    const { container } = await render(
      <NativeControls open onOpenChange={onOpenChange} />,
    )

    const closeActions = screen.getAllByRole("button", { name: "Close" })
    expect(closeActions).toHaveLength(2)
    await user.press(closeActions[0])
    await user.press(closeActions[1])

    const [modal] = container.queryAll(({ type }) => type === "Modal")
    expect(modal).toBeDefined()
    await fireEvent(modal, "requestClose")

    expect(onOpenChange).toHaveBeenCalledTimes(3)
    expect(onOpenChange).toHaveBeenNthCalledWith(1, false)
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false)
    expect(onOpenChange).toHaveBeenNthCalledWith(3, false)
  })

  it("uses the same touch-only reference in Mexican Spanish", async () => {
    await render(
      <LocaleProvider locale="es-MX">
        <NativeControls open onOpenChange={() => undefined} />
      </LocaleProvider>,
    )
    expect(screen.getByLabelText("Controles")).toBeOnTheScreen()
    expect(screen.getByText("Elegir el primer valor")).toBeOnTheScreen()
    expect(screen.getByText("Toca la primera tarjeta de valor")).toBeOnTheScreen()
    expect(screen.getAllByRole("button", { name: "Cerrar" })).toHaveLength(2)
    expect(screen.queryByText("Teclado")).toBeNull()
  })
})
