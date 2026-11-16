import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import useBattleEntryRequest, {
  type BattleEntryRequestOptions,
} from "@game/data/src/useBattleEntryRequest"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import HubActions from "@/components/HubActions"

const preparationActionName =
  getLocaleCatalog().interfaceCopy.loading.cancelBattlePreparation

function HomeActions({ options }: { options: BattleEntryRequestOptions }) {
  const { isBattleRequested, requestBattle } = useBattleEntryRequest(options)
  return (
    <HubActions
      isSaving={false}
      isNavigationBlocked={false}
      isBattlePending={isBattleRequested}
      onStartBattle={requestBattle}
      onAddCustomValue={vi.fn()}
      onBrowseAllValues={vi.fn()}
      onOpenAchievements={vi.fn()}
      onCustomize={vi.fn()}
      onShare={vi.fn()}
    />
  )
}

function createRequestOptions() {
  return {
    isHubReady: true,
    isShareOpen: false,
    isCustomValueDraftActive: false,
    isProductMenuOpen: false,
    isInformationPanelOpen: false,
    isControlsOpen: false,
    isBattlePrepared: false,
    send: vi.fn<BattleEntryRequestOptions["send"]>(),
  }
}

describe("Battle entry through shared Home controls", () => {
  it("enters an already prepared battle with one canonical event", () => {
    const options = { ...createRequestOptions(), isBattlePrepared: true }
    render(<HomeActions options={options} />)
    fireEvent.click(screen.getByRole("button", { name: "Battle" }))
    expect(options.send).toHaveBeenCalledExactlyOnceWith({
      type: "BATTLE.START_REQUESTED",
    })
  })

  it("keeps a cancelled request cancelled when preparation later completes", () => {
    const options = createRequestOptions()
    const { rerender } = render(<HomeActions options={options} />)
    fireEvent.click(screen.getByRole("button", { name: "Battle" }))
    fireEvent.click(screen.getByRole("button", { name: preparationActionName }))
    rerender(<HomeActions options={{ ...options, isBattlePrepared: true }} />)
    expect(screen.getByRole("button", { name: "Battle" })).toHaveAttribute(
      "aria-busy",
      "false",
    )
    expect(options.send).not.toHaveBeenCalled()
  })

  it("enters once when the requested battle becomes prepared", () => {
    const options = createRequestOptions()
    const { rerender } = render(<HomeActions options={options} />)
    fireEvent.click(screen.getByRole("button", { name: "Battle" }))
    expect(
      screen.getByRole("button", { name: preparationActionName }),
    ).toHaveAttribute("aria-busy", "true")
    expect(options.send).not.toHaveBeenCalled()
    rerender(<HomeActions options={{ ...options, isBattlePrepared: true }} />)
    rerender(<HomeActions options={{ ...options, isBattlePrepared: true }} />)
    expect(options.send).toHaveBeenCalledExactlyOnceWith({
      type: "BATTLE.START_REQUESTED",
    })
  })

  it.each([
    ["leaving Home", { isHubReady: false }],
    ["sharing", { isShareOpen: true }],
    ["authoring a value", { isCustomValueDraftActive: true }],
    ["opening Menu", { isProductMenuOpen: true }],
    ["opening information", { isInformationPanelOpen: true }],
    ["opening Controls", { isControlsOpen: true }],
  ] as const)(
    "clears the pending request on %s before later preparation can start play",
    (_name, blocker) => {
      const options = createRequestOptions()
      const { rerender } = render(<HomeActions options={options} />)
      fireEvent.click(screen.getByRole("button", { name: "Battle" }))
      rerender(<HomeActions options={{ ...options, ...blocker }} />)
      rerender(<HomeActions options={{ ...options, isBattlePrepared: true }} />)
      expect(options.send).not.toHaveBeenCalled()
      expect(screen.getByRole("button", { name: "Battle" })).toHaveAttribute(
        "aria-busy",
        "false",
      )
    },
  )
})
