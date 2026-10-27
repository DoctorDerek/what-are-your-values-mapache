import type {
  PlayerDataResetKind,
  PlayerDataResetReview,
} from "@game/machines/src/PlayerDataReset"
import {
  createInitialPlayerSettings,
  type PlayerSettings,
} from "@game/machines/src/PlayerSettings"
import LocaleProvider from "@game/utils/src/LocaleContext"
import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, userEvent } from "@testing-library/react-native"
import { useState } from "react"
import NativeSettings from "@/components/NativeSettings"

async function renderSettings(
  overrides: Partial<Parameters<typeof NativeSettings>[0]> = {},
) {
  const props = {
    activity: null,
    customValueCount: 2,
    isNavigationPending: false,
    issue: null,
    notice: null,
    resetReview: null,
    settings: createInitialPlayerSettings(),
    onCancelReset: jest.fn(),
    onClose: jest.fn(),
    onConfirmReset: jest.fn(),
    onExport: jest.fn(),
    onOpenMenu: jest.fn(),
    onRequestReset: jest.fn(),
    onUpdateSettings: jest.fn(),
    ...overrides,
  } satisfies Parameters<typeof NativeSettings>[0]

  await render(
    <LocaleProvider locale={props.settings.locale}>
      <NativeSettings {...props} />
    </LocaleProvider>,
  )
  return props
}

describe("NativeSettings", () => {
  it("preserves Spanish names, checked state and language selection with the compact presentation", async () => {
    const props = await renderSettings({
      settings: { ...createInitialPlayerSettings(), locale: "es-MX" },
    })
    const user = userEvent.setup()
    expect(
      screen.getByRole("heading", { name: "Configuración" }),
    ).toBeOnTheScreen()
    expect(
      screen.getByRole("header", { name: "Reducir movimiento" }),
    ).toBeOnTheScreen()
    expect(
      screen.getByRole("radio", { name: "Seguir al sistema" }),
    ).toBeChecked()
    await user.press(screen.getByRole("radio", { name: "Desactivado" }))
    expect(props.onUpdateSettings).toHaveBeenLastCalledWith({
      ...props.settings,
      reducedMotion: "off",
    })
    const language = screen.getByRole("button", { name: "Idioma" })
    expect(language).toHaveAccessibilityValue({ text: "Español (México)" })
    await user.press(language)
    await user.press(screen.getByRole("radio", { name: "English (US)" }))
    expect(props.onUpdateSettings).toHaveBeenLastCalledWith({
      ...props.settings,
      locale: "en",
    })
  })

  it("shows truthful language status and sends complete settings through touch-native radios", async () => {
    const props = await renderSettings()
    const user = userEvent.setup()
    const followSystem = screen.getByRole("radio", {
      name: "Follow System",
    })
    const reduceMotion = screen.getByRole("radio", {
      name: "On",
    })
    const alwaysShowHints = screen.getByRole("radio", {
      name: "Always",
    })

    expect(screen.getByText("English (US) ▾")).toBeOnTheScreen()
    expect(
      screen.getByRole("header", { name: "Reduced Motion" }),
    ).toBeOnTheScreen()
    expect(
      screen.getByRole("header", { name: "Control Hints" }),
    ).toBeOnTheScreen()
    expect(followSystem).toBeChecked()
    expect(reduceMotion).not.toBeChecked()
    expect(screen.getByRole("radio", { name: "Auto" })).toBeChecked()

    await user.press(reduceMotion)
    await user.press(alwaysShowHints)
    expect(props.onUpdateSettings).toHaveBeenNthCalledWith(1, {
      ...props.settings,
      reducedMotion: "on",
    } satisfies PlayerSettings)
    expect(props.onUpdateSettings).toHaveBeenNthCalledWith(2, {
      ...props.settings,
      controlHints: "always",
    } satisfies PlayerSettings)

    await user.press(screen.getByRole("button", { name: "Menu" }))
    await user.press(screen.getByRole("button", { name: "Back" }))
    expect(props.onOpenMenu).toHaveBeenCalledTimes(1)
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it("announces durable activity and disables every competing action", async () => {
    const props = await renderSettings({
      activity: "Saving setting…",
      issue: "The setting could not be saved. Try again.",
      notice: "Achievements were reset.",
    })
    const user = userEvent.setup()

    expect(screen.getByText("Saving setting…")).toBeOnTheScreen()
    expect(screen.getByText("Achievements were reset.")).toBeOnTheScreen()
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The setting could not be saved. Try again.",
    )
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled()
    }
    for (const label of [
      "Menu",
      "Back",
      "Reset Levels & Experience",
      "Reset Achievements",
      "Delete All Data",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeDisabled()
    }

    await user.press(screen.getByRole("radio", { name: "On" }))
    await user.press(screen.getByRole("button", { name: "Menu" }))
    expect(props.onUpdateSettings).not.toHaveBeenCalled()
    expect(props.onOpenMenu).not.toHaveBeenCalled()
  })

  it("blocks all Settings input during background checkpoint navigation", async () => {
    const props = await renderSettings({ isNavigationPending: true })
    const user = userEvent.setup()

    expect(screen.getByRole("button", { name: "Menu" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled()
    expect(screen.getByRole("radio", { name: "On" })).toBeDisabled()
    await user.press(screen.getByRole("radio", { name: "On" }))
    expect(props.onUpdateSettings).not.toHaveBeenCalled()
  })

  it("offers the exact reset subset and reuses review export cancellation and confirmation", async () => {
    const onConfirmReset = jest.fn()
    const onExport = jest.fn()
    const user = userEvent.setup()

    function ResetReviewHarness() {
      const [resetReview, setResetReview] =
        useState<PlayerDataResetReview | null>(null)

      const openReview = (resetKind: PlayerDataResetKind) =>
        setResetReview({
          resetKind,
          confirmationId: `${resetKind}-native-settings-review`,
        })

      return (
        <NativeSettings
          activity={null}
          customValueCount={2}
          isNavigationPending={false}
          issue={null}
          notice={null}
          resetReview={resetReview}
          settings={createInitialPlayerSettings()}
          onCancelReset={() => setResetReview(null)}
          onClose={jest.fn()}
          onConfirmReset={(review) => {
            onConfirmReset(review)
            setResetReview(null)
          }}
          onExport={onExport}
          onOpenMenu={jest.fn()}
          onRequestReset={openReview}
          onUpdateSettings={jest.fn()}
        />
      )
    }

    await render(<ResetReviewHarness />)
    expect(
      screen.queryByRole("button", { name: "Delete All Custom Values" }),
    ).not.toBeOnTheScreen()
    await user.press(screen.getByRole("button", { name: "Reset Achievements" }))
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeOnTheScreen()
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeOnTheScreen()

    await user.press(screen.getByRole("button", { name: "Export Data" }))
    expect(onExport).toHaveBeenCalledTimes(1)
    await user.press(screen.getByRole("button", { name: "Cancel" }))
    expect(
      screen.getByRole("button", { name: "Reset Achievements" }),
    ).toBeEnabled()

    await user.press(screen.getByRole("button", { name: "Reset Achievements" }))
    await user.press(screen.getByRole("button", { name: "Reset Achievements" }))
    expect(onConfirmReset).toHaveBeenCalledWith({
      resetKind: "reset-achievements",
      confirmationId: "reset-achievements-native-settings-review",
    })
  })
})
