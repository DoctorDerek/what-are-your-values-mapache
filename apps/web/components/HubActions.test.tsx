import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import LocaleProvider from "@game/utils/src/LocaleContext"
import { fireEvent, render, screen } from "@testing-library/react"
import { createRef } from "react"
import { describe, expect, it, vi } from "vitest"
import HubActions from "@/components/HubActions"

describe("Shared Hub actions through browser controls", () => {
  it.each(["en", "es-MX"] as const)(
    "keeps the %s Battle preparation control focused and cancellable until saving blocks navigation",
    (locale) => {
      const catalog = getLocaleCatalog(locale)
      const onStartBattle = vi.fn()
      const onAddCustomValue = vi.fn()
      const props = {
        isSaving: false,
        isNavigationBlocked: false,
        isBattlePending: false,
        onStartBattle,
        onAddCustomValue,
        onBrowseAllValues: vi.fn(),
        onOpenAchievements: vi.fn(),
        onCustomize: vi.fn(),
        onShare: vi.fn(),
      }
      const { rerender } = render(
        <LocaleProvider locale={locale}>
          <HubActions {...props} />
        </LocaleProvider>,
      )
      const battle = screen.getByRole("button", {
        name: catalog.hub.battle,
      })
      battle.focus()

      rerender(
        <LocaleProvider locale={locale}>
          <HubActions {...props} isBattlePending />
        </LocaleProvider>,
      )
      const cancel = screen.getByRole("button", {
        name: catalog.interfaceCopy.loading.cancelBattlePreparation,
      })
      expect(cancel).toBe(battle)
      expect(cancel).toHaveFocus()
      expect(cancel).toHaveAttribute("aria-busy", "true")
      expect(cancel).toBeEnabled()
      expect(cancel).toHaveTextContent(catalog.interfaceCopy.loading.preparing)
      fireEvent.click(cancel)
      expect(onStartBattle).toHaveBeenCalledOnce()

      rerender(
        <LocaleProvider locale={locale}>
          <HubActions {...props} isSaving isNavigationBlocked isBattlePending />
        </LocaleProvider>,
      )
      for (const control of screen.getAllByRole("button")) {
        expect(control).toBeDisabled()
        fireEvent.click(control)
      }
      expect(onStartBattle).toHaveBeenCalledOnce()
      expect(onAddCustomValue).not.toHaveBeenCalled()
    },
  )

  it("retains browser focus handles and passes the real invoking IDs to navigation", () => {
    const browseRef = createRef<HTMLButtonElement>()
    const onBrowseAllValues = vi.fn()
    const onOpenAchievements = vi.fn()
    const onAddCustomValue = vi.fn()
    render(
      <HubActions
        isSaving={false}
        isNavigationBlocked={false}
        isBattlePending={false}
        browseAllValuesButtonRef={browseRef}
        onBrowseAllValues={onBrowseAllValues}
        onOpenAchievements={onOpenAchievements}
        onAddCustomValue={onAddCustomValue}
        onStartBattle={vi.fn()}
        onCustomize={vi.fn()}
        onShare={vi.fn()}
      />,
    )

    const browse = screen.getByRole("button", { name: "Browse All Values" })
    const achievements = screen.getByRole("button", { name: "Achievements" })
    const add = screen.getByRole("button", { name: "Add value" })
    expect(browseRef.current).toBe(browse)
    fireEvent.click(browse)
    fireEvent.click(achievements)
    fireEvent.click(add)
    expect(onBrowseAllValues).toHaveBeenCalledWith(browse.id)
    expect(onOpenAchievements).toHaveBeenCalledWith(achievements.id)
    expect(onAddCustomValue).toHaveBeenCalledWith(add.id)
  })
})
