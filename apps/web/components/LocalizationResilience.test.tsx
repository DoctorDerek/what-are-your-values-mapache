import {
  getLocaleCatalog,
  LOCALIZATION_CATALOG_RESOLUTIONS,
} from "@game/data/src/LocalizationCatalog"
import { createSeethingSwarmTypographyOnlyRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { rankValues } from "@game/data/src/ValueRanking"
import { projectBattlePair } from "@game/machines/src/BattleScheduler"
import { createInMemoryDurableStore } from "@game/machines/src/InMemoryDurableStore"
import type { RootActor } from "@game/machines/src/RuntimeRecovery"
import useRecoverableActorSnapshot from "@game/utils/src/useRecoverableActorSnapshot"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import AllValues from "@/components/AllValues"
import GameSession from "@/components/GameSession"
import Splash from "@/components/Splash"

vi.mock("@game/data/src/EnglishLocalizationCatalog", () => ({
  ENGLISH_LOCALIZATION_CATALOG: undefined,
}))

function RecoveredSessionView({ actor }: { readonly actor: RootActor }) {
  const snapshot = useRecoverableActorSnapshot(actor)
  const playerData = snapshot.context.playerData
  if (snapshot.matches("Splash") || snapshot.matches("InitializingProfile"))
    return (
      <Splash
        shouldReduceMotion
        isPending={snapshot.matches("InitializingProfile")}
        onLocaleChange={(locale) =>
          actor.send({ type: "INTRODUCTION.LOCALE_SELECTED", locale })
        }
        onComplete={() => actor.send({ type: "INTRODUCTION.COMPLETED" })}
      />
    )
  if (!playerData || !(snapshot.matches("Hub") || snapshot.matches("Crucible")))
    return null
  return (
    <AllValues
      rankedValues={rankValues(
        playerData.profile.activeDeck,
        playerData.profile.progressById,
      )}
      localization={getLocaleCatalog(playerData.settings.locale)}
      runtimeClipCatalog={createSeethingSwarmTypographyOnlyRuntimeClipCatalog()}
      shouldReduceMotion
      isMenuOpen={false}
      onClose={vi.fn()}
      onOpenMenu={vi.fn()}
      onAddCustomValue={vi.fn()}
      onUpdateCustomValue={vi.fn()}
      onDeleteCustomValue={vi.fn()}
    />
  )
}

describe("web localization resilience", () => {
  it("starts, accepts a battle, and reopens the saved profile with the entire English catalog missing", async () => {
    const store = createInMemoryDurableStore()
    let currentActor: RootActor | undefined
    const requireActor = () => {
      if (!currentActor) throw new Error("Session actor is unavailable")
      return currentActor
    }
    const session = () => (
      <GameSession durableStore={store} onReopen={vi.fn()}>
        {(actor) => {
          currentActor = actor
          return <RecoveredSessionView actor={actor} />
        }}
      </GameSession>
    )
    const first = render(session())
    expect(LOCALIZATION_CATALOG_RESOLUTIONS.en.issues.length).toBeGreaterThan(
      100,
    )
    expect(await screen.findByRole("button", { name: "Start" })).toBeEnabled()
    const language = screen.getByRole("combobox", { name: "Language" })
    expect(language).toHaveValue("en")
    fireEvent.change(language, { target: { value: "en" } })
    fireEvent.click(screen.getByRole("button", { name: "Start" }))
    expect(
      await screen.findByRole("heading", { name: "All Values", level: 1 }),
    ).toBeVisible()
    expect(screen.getByRole("heading", { name: "Acceptance" })).toBeVisible()
    const actor = requireActor()
    act(() =>
      actor.send({
        type: "HUB.CUSTOM_VALUES_APPLY_REQUESTED",
        drafts: [
          {
            name: "Private “Craftsmanship”",
            definition: "Mi significado privado.",
          },
        ],
      }),
    )
    await waitFor(() => expect(actor.getSnapshot().matches("Hub")).toBe(true))
    expect(
      await screen.findByRole("heading", { name: "Private “Craftsmanship”" }),
    ).toBeVisible()
    act(() => actor.send({ type: "BATTLE.START_REQUESTED" }))
    const profile = actor.getSnapshot().context.playerData?.profile
    if (!profile) throw new Error("Expected an initialized profile")
    const [winnerId] = projectBattlePair(profile.activeDeck, profile.scheduler)
    act(() =>
      actor.send({
        type: "BATTLE.WINNER_SELECTED",
        winnerId,
        expectedScheduler: profile.scheduler,
      }),
    )
    await waitFor(() =>
      expect(actor.getSnapshot().matches({ Crucible: "Ready" })).toBe(true),
    )
    const accepted = actor.getSnapshot().context.playerData
    expect(accepted?.profile.history).toHaveLength(1)
    expect(
      accepted?.profile.progressById.get(winnerId)?.totalXp,
    ).toBeGreaterThan(0)
    expect(accepted?.settings.locale).toBe("en")
    await first.unmount()
    render(session())
    expect(
      await screen.findByRole("heading", { name: "All Values", level: 1 }),
    ).toBeVisible()
    expect(requireActor().getSnapshot().context.playerData).toEqual(accepted)
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "privado" },
    })
    expect(
      screen.getByRole("heading", { name: "Private “Craftsmanship”" }),
    ).toBeVisible()
    expect(screen.getByText(/Mi significado privado/)).toBeVisible()
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled()
  })
})
