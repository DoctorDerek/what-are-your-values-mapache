import { createInitialBattleCycle } from "@game/machines/src/BattleCycle"
import { projectScheduledPair } from "@game/machines/src/PairScheduler"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import SeethingSwarmAssetPreparation, {
  usePreparedSeethingSwarmBattle,
} from "@/components/SeethingSwarmAssetPreparation"
import SeethingSwarmBattleStage from "@/components/SeethingSwarmBattleStage"
import { createSeethingSwarmBattleStageTestCatalog } from "@/components/SeethingSwarmBattleStage.test-fixture"

const cycle = createInitialBattleCycle("prepared-before-intent")
const battle = {
  pair: projectScheduledPair(cycle.activeDeck, cycle.scheduler).pair,
  scheduler: cycle.scheduler,
}
const catalog = createSeethingSwarmBattleStageTestCatalog(battle)

beforeEach(() =>
  vi
    .spyOn(HTMLImageElement.prototype, "complete", "get")
    .mockReturnValue(false),
)
afterEach(() => vi.restoreAllMocks())

function PreparedBattleTrial() {
  const ready = usePreparedSeethingSwarmBattle(battle, catalog)
  const [requested, setRequested] = useState(false)
  return requested && ready ? (
    <SeethingSwarmBattleStage
      battle={battle}
      runtimeClipCatalog={catalog}
      isNextBattleReady={false}
      winnerId={null}
      shouldReduceMotion
      onResultAnimationComplete={() => undefined}
    >
      {({ first, second }) => (
        <>
          {first(false)}
          {second(false)}
        </>
      )}
    </SeethingSwarmBattleStage>
  ) : (
    <button onClick={() => setRequested(true)}>Battle</button>
  )
}

describe("prepared animal presentation", () => {
  it("requests selected sprites before intent and reveals decoded animals without a placeholder frame", async () => {
    const { container } = render(
      <SeethingSwarmAssetPreparation>
        <PreparedBattleTrial />
      </SeethingSwarmAssetPreparation>,
    )
    const preparedImages = [
      ...container.querySelectorAll<HTMLImageElement>("[hidden] img"),
    ]
    expect(preparedImages.length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole("button", { name: "Battle" }))
    expect(screen.getByRole("button", { name: "Battle" })).toBeVisible()
    expect(container.querySelector("[data-battle-stage-state]")).toBeNull()
    for (const image of preparedImages) {
      Object.defineProperty(image, "decode", {
        value: vi.fn(async () => undefined),
      })
      await act(async () => fireEvent.load(image))
    }
    await waitFor(() =>
      expect(
        container.querySelectorAll('[data-battle-active-clip="true"]'),
      ).toHaveLength(2),
    )
    expect(container.querySelector("[data-placeholder-playback]")).toBeNull()
    for (const animal of container.querySelectorAll(
      '[data-battle-active-clip="true"]',
    ))
      expect(animal).toBeVisible()
  })

  it("settles broken assets into the actual no-art fallback instead of waiting forever", async () => {
    const { container } = render(
      <SeethingSwarmAssetPreparation>
        <PreparedBattleTrial />
      </SeethingSwarmAssetPreparation>,
    )
    fireEvent.click(screen.getByRole("button", { name: "Battle" }))
    for (const image of container.querySelectorAll("[hidden] img"))
      await act(async () => fireEvent.error(image))
    await waitFor(() =>
      expect(
        container.querySelectorAll("[data-placeholder-playback]"),
      ).toHaveLength(2),
    )
    expect(screen.queryByRole("button", { name: "Battle" })).toBeNull()
  })
})
