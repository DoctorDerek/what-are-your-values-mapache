import { describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"
import { ACHIEVEMENT_CATALOG } from "./AchievementCatalog"
import { achievementNotificationMachine } from "./AchievementNotificationMachine"
import {
  getAchievementEnglishCopy,
  type AchievementPresentation,
} from "./AchievementPresentation"

const achievements = ACHIEVEMENT_CATALOG.slice(0, 4).map(
  (achievement) =>
    ({
      id: achievement.id,
      ...getAchievementEnglishCopy(achievement),
      status: "unlocked",
      progress: null,
      unlockedAt: "2026-09-24T12:00:00.000Z",
      unlockedDate: "Sep 24, 2026",
    }) satisfies AchievementPresentation,
)

function createNotifications(pending = achievements) {
  const onPresented = vi.fn()
  const actor = createActor(achievementNotificationMachine, {
    input: { achievements: pending, onPresented },
  }).start()
  const visibleIds = () =>
    actor.getSnapshot().context.visible.map(({ id }) => id)
  return { actor, onPresented, visibleIds }
}

describe("Achievement notification admission", () => {
  it("admits the oldest two pending unlocks and places the newer one on top", () => {
    const { actor, visibleIds, onPresented } = createNotifications()
    expect(visibleIds()).toEqual([achievements[1].id, achievements[0].id])
    expect(onPresented).not.toHaveBeenCalled()
    actor.stop()
  })

  it("admits overflow only after durable acknowledgement without dropping unseen cards", () => {
    const { actor, visibleIds, onPresented } = createNotifications()
    actor.send({
      type: "NOTIFICATION.DISMISS",
      achievementId: achievements[1].id,
    })
    actor.send({
      type: "NOTIFICATION.DISMISS",
      achievementId: achievements[1].id,
    })
    actor.send({
      type: "NOTIFICATION.DISMISS",
      achievementId: achievements[3].id,
    })
    expect(onPresented).toHaveBeenCalledExactlyOnceWith(achievements[1].id)
    expect(visibleIds()).toEqual([achievements[1].id, achievements[0].id])
    actor.send({
      type: "NOTIFICATION.SYNC",
      achievements: achievements.filter(({ id }) => id !== achievements[1].id),
    })
    expect(visibleIds()).toEqual([achievements[2].id, achievements[0].id])
    actor.stop()
  })

  it.each(["hover", "focus", "touch"] as const)(
    "keeps an interaction target stable during %s",
    (kind) => {
      const { actor, visibleIds } = createNotifications(
        achievements.slice(0, 1),
      )
      const interaction = { achievementId: achievements[0].id, kind }
      actor.send({
        type: "NOTIFICATION.INTERACTION",
        interaction,
        isActive: true,
      })
      actor.send({ type: "NOTIFICATION.SYNC", achievements })
      expect(visibleIds()).toEqual([achievements[0].id])
      actor.send({
        type: "NOTIFICATION.INTERACTION",
        interaction,
        isActive: false,
      })
      expect(visibleIds()).toEqual([achievements[1].id, achievements[0].id])
      actor.stop()
    },
  )

  it("requires every active interaction to finish before admitting another card", () => {
    const { actor, visibleIds } = createNotifications(achievements.slice(0, 1))
    for (const kind of ["hover", "focus"] as const)
      actor.send({
        type: "NOTIFICATION.INTERACTION",
        interaction: { achievementId: achievements[0].id, kind },
        isActive: true,
      })
    actor.send({ type: "NOTIFICATION.SYNC", achievements })
    actor.send({
      type: "NOTIFICATION.INTERACTION",
      interaction: { achievementId: achievements[0].id, kind: "hover" },
      isActive: false,
    })
    expect(visibleIds()).toEqual([achievements[0].id])
    actor.send({
      type: "NOTIFICATION.DISMISS",
      achievementId: achievements[0].id,
    })
    actor.send({
      type: "NOTIFICATION.SYNC",
      achievements: achievements.slice(1),
    })
    expect(visibleIds()).toEqual([achievements[2].id, achievements[1].id])
    actor.stop()
  })

  it("does not admit new cards in an inactive app and clears removed/reset unlocks", () => {
    const { actor, visibleIds } = createNotifications([])
    actor.send({ type: "NOTIFICATION.APP_ACTIVITY", isActive: false })
    actor.send({ type: "NOTIFICATION.SYNC", achievements })
    expect(visibleIds()).toEqual([])
    actor.send({ type: "NOTIFICATION.APP_ACTIVITY", isActive: true })
    expect(visibleIds()).toEqual([achievements[1].id, achievements[0].id])
    actor.send({ type: "NOTIFICATION.SYNC", achievements: [] })
    expect(visibleIds()).toEqual([])
    expect(actor.getSnapshot().context.requestedIds).toEqual([])
    actor.stop()
  })
})
