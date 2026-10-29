import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import { playerDataResetCopy } from "@game/data/src/PlayerDataResetCopy"
import type { PlayerDataResetReview as PlayerDataResetReviewState } from "@game/machines/src/PlayerDataReset"
import type { WayvmImportPreview } from "@game/machines/src/WayvmImportPreview"
import LocaleProvider from "@game/utils/src/LocaleContext"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import DataManagement from "@/components/DataManagement"
import { WAYVM_IMPORT_FILE_ACCEPT } from "@/lib/PlayerDataFiles"

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

function renderDataManagement(
  overrides: Partial<Parameters<typeof DataManagement>[0]> = {},
  locale: "en" | "es-MX" = "en",
) {
  const props = {
    activity: null,
    customValueCount: 0,
    issue: null,
    notice: null,
    preview: null,
    resetReview: null,
    onCancelImport: vi.fn(),
    onCancelReset: vi.fn(),
    onClose: vi.fn(),
    onConfirmImport: vi.fn(),
    onConfirmReset: vi.fn(),
    onExport: vi.fn(),
    onImportFile: vi.fn(),
    onOpenMenu: vi.fn(),
    onRequestReset: vi.fn(),
    ...overrides,
  } satisfies Parameters<typeof DataManagement>[0]

  render(
    <LocaleProvider locale={locale}>
      <DataManagement {...props} />
    </LocaleProvider>,
  )
  return props
}

describe("Data Management", () => {
  it("offers exact private export and bounded local import actions", async () => {
    const props = renderDataManagement()
    const file = new File(['["wayvm-export"]'], "wayvm-backup.json", {
      type: "application/json",
    })

    expect(screen.getByRole("main")).toHaveAttribute(
      "data-slot",
      "mapache-screen",
    )
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Import & Export", level: 1 }),
      ).toHaveFocus(),
    )
    expect(
      screen.getByText(/Export a JSON backup to keep a portable copy/),
    ).toBeVisible()
    expect(
      screen.getByText(/Exporting does not upload your data to us\./),
    ).toBeVisible()
    expect(
      screen.getByText(/show you a preview before replacing data/),
    ).toBeVisible()
    const exportSection = screen.getByRole("region", { name: "Export Data" })
    expect(
      within(exportSection).getByRole("button", { name: "Export Data" }),
    ).toHaveAccessibleDescription(/Exporting does not upload your data to us/)
    expect(
      screen.queryByRole("heading", { name: "Export Data" }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Export Data" }))
    const importInput = screen.getByLabelText("Choose WAYVM JSON backup")
    const inputClick = vi.spyOn(importInput, "click")
    expect(importInput).toHaveAttribute("accept", WAYVM_IMPORT_FILE_ACCEPT)
    fireEvent.click(screen.getByRole("button", { name: "Choose Backup" }))
    fireEvent.change(importInput, { target: { files: [file] } })
    fireEvent.click(screen.getByRole("button", { name: "Back" }))

    expect(props.onExport).toHaveBeenCalledOnce()
    expect(inputClick).toHaveBeenCalledOnce()
    expect(props.onImportFile).toHaveBeenCalledWith(file)
    expect(props.onClose).toHaveBeenCalledOnce()
    expect(
      screen.getByRole("button", { name: "Reset Achievements" }),
    ).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Delete All Custom Values" }),
    ).toBeDisabled()
  })

  it.each(["en", "es-MX"] as const)(
    "uses localized action-led sections and navigation in %s",
    (locale) => {
      const props = renderDataManagement({}, locale)
      const copy = getLocaleCatalog(locale).interfaceCopy
      expect(
        screen.getByRole("region", { name: copy.portability.screenTitle }),
      ).toContainElement(
        screen.getByRole("heading", { name: copy.portability.screenTitle }),
      )
      fireEvent.click(
        screen.getByRole("button", { name: copy.portability.exportAction }),
      )
      fireEvent.click(
        screen.getByRole("button", { name: copy.menu.openAction }),
      )
      fireEvent.click(
        screen.getByRole("button", { name: copy.controlActions.back }),
      )
      expect(props.onExport).toHaveBeenCalledOnce()
      expect(props.onOpenMenu).toHaveBeenCalledOnce()
      expect(props.onClose).toHaveBeenCalledOnce()
    },
  )

  it("returns focus to backup selection after cancelling a reviewed import", async () => {
    function CancellationHarness() {
      const [candidatePreview, setCandidatePreview] =
        useState<WayvmImportPreview | null>(preview)

      return (
        <DataManagement
          activity={null}
          customValueCount={0}
          issue={null}
          notice={
            candidatePreview
              ? null
              : "Import cancelled. Your data was not changed."
          }
          preview={candidatePreview}
          resetReview={null}
          onCancelImport={() => setCandidatePreview(null)}
          onCancelReset={vi.fn()}
          onClose={vi.fn()}
          onConfirmImport={vi.fn()}
          onConfirmReset={vi.fn()}
          onExport={vi.fn()}
          onImportFile={vi.fn()}
          onOpenMenu={vi.fn()}
          onRequestReset={vi.fn()}
        />
      )
    }

    render(<CancellationHarness />)
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }))

    expect(
      await screen.findByText("Import cancelled. Your data was not changed."),
    ).toBeVisible()
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Choose Backup" }),
      ).toHaveFocus(),
    )
  })

  it("focuses recoverable issues and disables every action while busy", async () => {
    renderDataManagement({
      activity: "Checking backup…",
      issue:
        "This file is not a valid WAYVM backup. Your data was not changed.",
    })

    const issue = screen.getByRole("alert")
    await waitFor(() => expect(issue).toHaveFocus())
    expect(screen.getByRole("status")).toHaveTextContent("Checking backup…")
    expect(screen.getByRole("button", { name: "Export Data" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Choose Backup" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Menu" })).toBeDisabled()
  })

  it("shows the reviewed backup without leaving import and export scope", () => {
    const props = renderDataManagement({ preview })

    expect(screen.getByRole("heading", { name: "Review Import" })).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "Menu" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Import & Replace" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(props.onConfirmImport).toHaveBeenCalledOnce()
    expect(props.onCancelImport).toHaveBeenCalledOnce()
    expect(
      screen.queryByRole("heading", { name: "Reset or Delete" }),
    ).not.toBeInTheDocument()
  })

  it("restores the initiating reset action after cancellation and scoped completion", async () => {
    function ResetHarness() {
      const [resetReview, setResetReview] =
        useState<PlayerDataResetReviewState | null>(null)
      const [notice, setNotice] = useState<string | null>(null)

      return (
        <DataManagement
          activity={null}
          customValueCount={1}
          issue={null}
          notice={notice}
          preview={null}
          resetReview={resetReview}
          onCancelImport={vi.fn()}
          onCancelReset={() => setResetReview(null)}
          onClose={vi.fn()}
          onConfirmImport={vi.fn()}
          onConfirmReset={(review) => {
            setNotice(playerDataResetCopy[review.resetKind].successAnnouncement)
            setResetReview(null)
          }}
          onExport={vi.fn()}
          onImportFile={vi.fn()}
          onOpenMenu={vi.fn()}
          onRequestReset={(resetKind) => {
            setNotice(null)
            setResetReview({
              resetKind,
              confirmationId: `${resetKind}-review`,
            })
          }}
        />
      )
    }

    render(<ResetHarness />)
    const achievementsAction = screen.getByRole("button", {
      name: "Reset Achievements",
    })
    fireEvent.click(achievementsAction)
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Reset Achievements?" }),
      ).toHaveFocus(),
    )
    expect(
      screen.queryByRole("button", { name: "Menu" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Reset Achievements" }),
      ).toHaveFocus(),
    )

    fireEvent.click(
      screen.getByRole("button", { name: "Reset Levels & Experience" }),
    )
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Reset Levels & Experience",
      }),
    )
    expect(
      await screen.findByText(
        playerDataResetCopy["reset-levels-and-experience"].successAnnouncement,
      ),
    ).toBeVisible()
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Reset Levels & Experience" }),
      ).toHaveFocus(),
    )
  })
})
