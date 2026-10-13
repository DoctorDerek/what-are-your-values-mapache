import { describe, expect, it, jest } from "@jest/globals"
import { fireEvent, render, screen } from "@testing-library/react-native"
import NativeLanguageSelector from "@/components/NativeLanguageSelector"

describe("native language selection", () => {
  it("selects a supported language and closes the selection", async () => {
    const onLocaleChange = jest.fn()
    await render(
      <NativeLanguageSelector locale="en" onLocaleChange={onLocaleChange} />,
    )
    await fireEvent.press(screen.getByRole("button", { name: "Language" }))
    const english = screen.getByRole("radio", { name: "English (US)" })
    expect(english).toBeChecked()
    await fireEvent.press(english)
    expect(onLocaleChange).toHaveBeenCalledWith("en")
    expect(screen.queryByRole("radio")).toBeNull()
  })

  it("dismisses without a write and cannot open during a pending save", async () => {
    const onLocaleChange = jest.fn()
    const { container, rerender } = await render(
      <NativeLanguageSelector locale="en" onLocaleChange={onLocaleChange} />,
    )
    await fireEvent.press(screen.getByRole("button", { name: "Language" }))
    await fireEvent.press(screen.getByRole("button", { name: "Back" }))
    expect(screen.queryByRole("radio")).toBeNull()
    await fireEvent.press(screen.getByRole("button", { name: "Language" }))
    const [modal] = container.queryAll(({ type }) => type === "Modal")
    await fireEvent(modal, "requestClose")
    expect(screen.queryByRole("radio")).toBeNull()
    expect(onLocaleChange).not.toHaveBeenCalled()
    await rerender(
      <NativeLanguageSelector
        locale="en"
        disabled
        onLocaleChange={onLocaleChange}
      />,
    )
    expect(screen.getByRole("button", { name: "Language" })).toBeDisabled()
  })
})
