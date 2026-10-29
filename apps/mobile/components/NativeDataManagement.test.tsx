import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import type { PlayerDataResetReview } from "@game/machines/src/PlayerDataReset"
import type { WayvmImportPreview } from "@game/machines/src/WayvmImportPreview"
import LocaleProvider from "@game/utils/src/LocaleContext"
import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, userEvent } from "@testing-library/react-native"
import NativeDataManagement from "@/components/NativeDataManagement"
import NativePlayerDataImportPreview from "@/components/NativePlayerDataImportPreview"

const preview = Object.freeze({
  exportedAt: "2026-08-06T12:34:56.000Z",
  sourceAppVersion: "0.1.0",
  sourceBuild: "abc123",
  saveSchemaVersion: 1,
  canonicalCatalogVersion: "pvcs-2011-100-v1",
  totalComparisons: 42,
  currentCycle: 3,
  customValueCount: 2,
  customValueNames: Object.freeze(["Ingenuity", "Meaning"]),
  activeValueCount: 102,
  activePairCycleSize: 5_151,
  deckRevision: 2,
  progressGeneration: 1,
  unlockedAchievementCount: 4,
  achievementProgressGeneration: 1,
  locale: "en",
  replacesCurrentLocalData: true,
}) satisfies WayvmImportPreview

const resetReview = Object.freeze({
  resetKind: "reset-achievements",
  confirmationId: "reset-achievements-review",
}) satisfies PlayerDataResetReview

function createCallbacks() {
  return {
    onCancelImport: jest.fn(),
    onCancelReset: jest.fn(),
    onChooseBackup: jest.fn(),
    onClose: jest.fn(),
    onConfirmImport: jest.fn(),
    onConfirmReset: jest.fn(),
    onExport: jest.fn(),
    onOpenMenu: jest.fn(),
    onRequestReset: jest.fn(),
  }
}

async function renderDataManagement(
  overrides: Partial<Parameters<typeof NativeDataManagement>[0]> = {},
  locale: "en" | "es-MX" = "en",
) {
  const callbacks = createCallbacks()
  const props = {
    activity: null,
    customValueCount: 0,
    isNavigationPending: false,
    issue: null,
    notice: null,
    preview: null,
    resetReview: null,
    ...callbacks,
    ...overrides,
  } satisfies Parameters<typeof NativeDataManagement>[0]

  await render(<LocaleProvider locale={locale}><NativeDataManagement {...props} /></LocaleProvider>)
  return { callbacks, props }
}

async function expectNavigationIsInert({
  onClose,
  onOpenMenu,
}: ReturnType<typeof createCallbacks>) {
  const user = userEvent.setup()
  const menu = screen.getByRole("button", { name: "Menu" })
  const close = screen.getByRole("button", { name: "Back" })
  expect(menu).toBeDisabled()
  expect(close).toBeDisabled()

  await user.press(menu)
  await user.press(close)

  expect(onOpenMenu).not.toHaveBeenCalled()
  expect(onClose).not.toHaveBeenCalled()
}

describe("NativeDataManagement", () => {
  it("keeps Spanish import actions accessible while retaining the warning and expandable details", async () => {
    const callbacks = createCallbacks()
    const user = userEvent.setup()
    const copy = getLocaleCatalog("es-MX").interfaceCopy.portability
    await render(
      <LocaleProvider locale="es-MX">
        <NativePlayerDataImportPreview
          preview={preview}
          isBusy={false}
          onCancel={callbacks.onCancelImport}
          onConfirm={callbacks.onConfirmImport}
        />
      </LocaleProvider>,
    )
    expect(screen.getByText(copy.importPreviewWarning)).toBeOnTheScreen()
    expect(screen.queryByText(copy.preview.sourceBuild)).not.toBeOnTheScreen()
    await user.press(
      screen.getByRole("button", { name: copy.technicalDetails }),
    )
    expect(screen.getByText(copy.preview.sourceBuild)).toBeOnTheScreen()
    await user.press(
      screen.getByRole("button", { name: copy.importReplaceAction }),
    )
    await user.press(
      screen.getByRole("button", { name: copy.importCancelAction }),
    )
    expect(callbacks.onConfirmImport).toHaveBeenCalledTimes(1)
    expect(callbacks.onCancelImport).toHaveBeenCalledTimes(1)
  })
  it.each(["en", "es-MX"] as const)("routes action-led backup sections and navigation in %s", async (locale) => {
    const { callbacks } = await renderDataManagement({}, locale)
    const copy = getLocaleCatalog(locale).interfaceCopy
    const user = userEvent.setup()
    const menu = screen.getByRole("button", { name: copy.menu.openAction })
    const close = screen.getByRole("button", { name: copy.controlActions.back })
    expect(menu).toBeEnabled()
    expect(close).toBeEnabled()
    expect(screen.getByText(copy.portability.exportDescription)).toBeOnTheScreen()
    expect(screen.getAllByText(copy.portability.exportAction)).toHaveLength(1)

    await user.press(screen.getByRole("button", { name: copy.portability.exportAction }))
    await user.press(screen.getByRole("button", { name: copy.portability.chooseBackupAction }))
    await user.press(menu)
    await user.press(close)

    expect(callbacks.onExport).toHaveBeenCalledTimes(1)
    expect(callbacks.onChooseBackup).toHaveBeenCalledTimes(1)
    expect(callbacks.onOpenMenu).toHaveBeenCalledTimes(1)
    expect(callbacks.onClose).toHaveBeenCalledTimes(1)
  })

  it("blocks navigation during export work", async () => {
    const { callbacks } = await renderDataManagement({
      activity: "Creating backup…",
    })
    await expectNavigationIsInert(callbacks)
  })

  it("blocks navigation during background checkpointing", async () => {
    const { callbacks } = await renderDataManagement({
      isNavigationPending: true,
    })
    await expectNavigationIsInert(callbacks)
  })

  it("keeps reviewed imports inside Import & Export until resolved", async () => {
    const { callbacks } = await renderDataManagement({ preview })
    const user = userEvent.setup()
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeOnTheScreen()
    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeOnTheScreen()

    await user.press(screen.getByRole("button", { name: "Import & Replace" }))
    await user.press(screen.getByRole("button", { name: "Cancel" }))

    expect(callbacks.onConfirmImport).toHaveBeenCalledTimes(1)
    expect(callbacks.onCancelImport).toHaveBeenCalledTimes(1)
  })

  it("keeps reviewed resets inside Import & Export while preserving backup", async () => {
    const { callbacks } = await renderDataManagement({ resetReview })
    const user = userEvent.setup()
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeOnTheScreen()
    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeOnTheScreen()

    const exportAction = screen.getByRole("button", { name: "Export Data" })
    expect(exportAction).toBeEnabled()
    await user.press(exportAction)
    await user.press(screen.getByRole("button", { name: "Cancel" }))
    await user.press(screen.getByRole("button", { name: "Reset Achievements" }))

    expect(callbacks.onExport).toHaveBeenCalledTimes(1)
    expect(callbacks.onCancelReset).toHaveBeenCalledTimes(1)
    expect(callbacks.onConfirmReset).toHaveBeenCalledWith(resetReview)
  })
})
