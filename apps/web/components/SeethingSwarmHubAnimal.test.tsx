import { createCanonicalValueId } from "@game/data/src/Value"
import { createInitialBattleCycle } from "@game/machines/src/BattleCycle"
import { createSeethingSwarmBattleChoreography } from "@game/machines/src/SeethingSwarmBattleChoreography"
import { fireEvent, render, waitFor } from "@testing-library/react"
import { StrictMode } from "react"
import { afterEach, expect, it, vi } from "vitest"
import { createSeethingSwarmBattleStageTestCatalog } from "@/components/SeethingSwarmBattleStage.test-fixture"
import SeethingSwarmHubAnimal from "@/components/SeethingSwarmHubAnimal"

afterEach(() => vi.restoreAllMocks())

it("keeps calm while the next attention alternative loads and never advances on completion or held focus", async () => {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(false)
  const battle = {
    pair: [
      createCanonicalValueId("pvcs-2011:mastery"),
      createCanonicalValueId("pvcs-2011:courage"),
    ] as const,
    scheduler: createInitialBattleCycle("hub-variation").scheduler,
  }
  const catalog = createSeethingSwarmBattleStageTestCatalog(battle)
  const choreography = createSeethingSwarmBattleChoreography({
    battle,
    catalog,
  })
  if (choreography.mode !== "licensed")
    throw new Error("Expected licensed fixture")
  const combatant = choreography.combatants[0]
  const onLoadError = vi.fn()
  const draw = (attended: boolean, reduced = false) => (
    <StrictMode>
      <SeethingSwarmHubAnimal
        calmClip={combatant.clips.rest.clip}
        geometry={combatant.geometry}
        catalog={catalog}
        isAttended={attended}
        shouldReduceMotion={reduced}
        onLoadError={onLoadError}
      />
    </StrictMode>
  )
  const { container, rerender } = render(draw(false))
  const active = () =>
    container.querySelector('[data-hub-active-clip="true"] img')
  const clip = (name: string) =>
    container.querySelector<HTMLImageElement>(`img[src$="/${name}.png"]`)!
  const calm = clip("idle")
  fireEvent.load(calm)
  expect(clip("crouch")).toBeNull()
  rerender(draw(true))
  expect(active()).toBe(calm)
  fireEvent.load(clip("bark"))
  await waitFor(() => expect(active()).toBe(clip("bark")))
  fireEvent.animationEnd(clip("bark"))
  await waitFor(() => expect(active()).toBe(calm))
  rerender(draw(true))
  expect(active()).toBe(calm)
  rerender(draw(false))
  rerender(draw(true))
  expect(active()).toBe(calm)
  fireEvent.load(clip("crouch"))
  await waitFor(() => expect(active()).toBe(clip("crouch")))
  rerender(draw(true, true))
  rerender(draw(true))
  expect(active()).toBe(calm)
  rerender(draw(false))
  rerender(draw(true))
  fireEvent.load(clip("bark"))
  await waitFor(() => expect(active()).toBe(clip("bark")))
  fireEvent.error(clip("bark"))
  await waitFor(() => expect(active()).toBe(calm))
  expect(calm).toHaveStyle({ "--animal-animation-duration": "640ms" })
  expect(onLoadError).not.toHaveBeenCalled()
})
