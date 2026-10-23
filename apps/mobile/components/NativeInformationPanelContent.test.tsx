import {
  FREE_RESOURCES_INFORMATION_PANEL,
  HOW_IT_WORKS_INFORMATION_PANEL,
  WHY_I_MADE_THIS_GAME_INFORMATION_PANEL,
} from "@game/data/src/InformationPanels"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import LocaleProvider from "@game/utils/src/LocaleContext"
import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, userEvent } from "@testing-library/react-native"
import { Alert, Linking } from "react-native"
import { ReopenedNativeInformationPanel } from "@/components/NativeInformationPanel"
import NativeInformationPanelContent from "@/components/NativeInformationPanelContent"

describe("NativeInformationPanelContent", () => {
  it("renders every approved text-block kind from shared definitions", async () => {
    const { rerender } = await render(
      <NativeInformationPanelContent
        informationPanel={HOW_IT_WORKS_INFORMATION_PANEL}
      />,
    )

    expect(
      screen.getByText(
        "WAYVM turns values clarification into a simple game: choose which of two values matters more to you right now.",
      ),
    ).toBeOnTheScreen()
    expect(
      screen.getByText("Start With 103 Values—or Add Your Own"),
    ).toBeOnTheScreen()
    expect(
      screen.getByText(
        "There is no correct ranking. Your values belong to you.",
      ),
    ).toBeOnTheScreen()

    await rerender(
      <NativeInformationPanelContent
        informationPanel={WHY_I_MADE_THIS_GAME_INFORMATION_PANEL}
      />,
    )

    expect(screen.getByText("—Dr. Derek Austin")).toBeOnTheScreen()
  })

  it("opens only the explicitly selected canonical external resource", async () => {
    const openUrl = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)
    const user = userEvent.setup()
    await render(
      <NativeInformationPanelContent
        informationPanel={FREE_RESOURCES_INFORMATION_PANEL}
      />,
    )

    const resourceActions = screen.getAllByRole("link")
    expect(resourceActions).toHaveLength(7)
    expect(openUrl).not.toHaveBeenCalled()

    await user.press(screen.getByRole("link", { name: "Open WHO Resource" }))

    expect(openUrl).toHaveBeenCalledTimes(1)
    expect(openUrl).toHaveBeenCalledWith(
      "https://www.who.int/europe/publications/i/item/9789240003910",
    )
  })

  it.each(["en", "es-MX"] as const)(
    "keeps the %s information panel usable after a rejected resource open and permits retry",
    async (locale) => {
      const catalog = getLocaleCatalog(locale)
      const panel = catalog.interfaceCopy.information["free-resources"]
      const resource = panel.blocks.find((block) => block.kind === "resource")
      if (!resource) throw new Error("The resource fixture is missing")
      const openUrl = jest
        .spyOn(Linking, "openURL")
        .mockRejectedValueOnce(new Error("No browser available"))
        .mockResolvedValue(undefined)
      const alert = jest.spyOn(Alert, "alert")
      const onClose = jest.fn()
      const user = userEvent.setup()
      await render(
        <LocaleProvider locale={locale}>
          <ReopenedNativeInformationPanel
            title={panel.title}
            primaryActionLabel={panel.primaryActionLabel}
            accessibleCloseLabel={panel.accessibleCloseLabel}
            open
            onOpenChange={jest.fn()}
            onPrimaryAction={onClose}
          >
            <NativeInformationPanelContent informationPanel={panel} />
          </ReopenedNativeInformationPanel>
        </LocaleProvider>,
      )

      const resourceLink = screen.getByRole("link", {
        name: resource.actionLabel,
      })
      await user.press(resourceLink)
      expect(alert).toHaveBeenCalledWith(
        catalog.firstArrival.websiteErrorTitle,
        catalog.firstArrival.websiteErrorMessage,
      )
      expect(onClose).not.toHaveBeenCalled()
      expect(screen.getByLabelText(panel.title)).toBeOnTheScreen()
      await user.press(resourceLink)
      expect(openUrl).toHaveBeenCalledTimes(2)
      expect(openUrl).toHaveBeenLastCalledWith(resource.url)
      expect(alert).toHaveBeenCalledTimes(1)
      await user.press(
        screen.getByRole("button", { name: panel.primaryActionLabel }),
      )
      expect(onClose).toHaveBeenCalledTimes(1)
    },
  )
})
