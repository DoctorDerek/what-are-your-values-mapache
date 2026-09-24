import { assign, setup } from "xstate"
import type { AchievementId } from "./AchievementCatalog"
import type { AchievementPresentation } from "./AchievementPresentation"

export const ACHIEVEMENT_NOTIFICATION_DURATION_MILLISECONDS = 8_000
export const ACHIEVEMENT_NOTIFICATION_VISIBLE_LIMIT = 2

type NotificationInteraction = Readonly<{
  achievementId: AchievementId
  kind: "hover" | "focus" | "touch"
}>

type NotificationInput = Readonly<{
  achievements: readonly AchievementPresentation[]
  onPresented: (achievementId: AchievementId) => void
}>

type NotificationContext = NotificationInput & {
  visible: readonly AchievementPresentation[]
  requestedIds: readonly AchievementId[]
  interactions: readonly NotificationInteraction[]
  isAppActive: boolean
}

type NotificationEvent =
  | {
      type: "NOTIFICATION.SYNC"
      achievements: readonly AchievementPresentation[]
    }
  | { type: "NOTIFICATION.APP_ACTIVITY"; isActive: boolean }
  | {
      type: "NOTIFICATION.INTERACTION"
      interaction: NotificationInteraction
      isActive: boolean
    }
  | { type: "NOTIFICATION.DISMISS"; achievementId: AchievementId }

function reconcileNotifications(
  context: NotificationContext,
): NotificationContext {
  const pendingIds = new Set(context.achievements.map(({ id }) => id))
  const visible = context.visible.filter(({ id }) => pendingIds.has(id))
  const interactions = context.interactions.filter(({ achievementId }) =>
    pendingIds.has(achievementId),
  )
  const requestedIds = context.requestedIds.filter((id) => pendingIds.has(id))
  if (interactions.length > 0 || !context.isAppActive)
    return { ...context, visible, interactions, requestedIds }

  const visibleIds = new Set(visible.map(({ id }) => id))
  const admitted = context.achievements
    .filter(({ id }) => !visibleIds.has(id))
    .slice(0, ACHIEVEMENT_NOTIFICATION_VISIBLE_LIMIT - visible.length)

  return {
    ...context,
    visible: [...admitted.reverse(), ...visible],
    interactions,
    requestedIds,
  }
}

export const achievementNotificationMachine = setup({
  types: {
    context: {} as NotificationContext,
    input: {} as NotificationInput,
    events: {} as NotificationEvent,
  },
}).createMachine({
  id: "achievementNotifications",
  context: ({ input }) =>
    reconcileNotifications({
      ...input,
      visible: [],
      requestedIds: [],
      interactions: [],
      isAppActive: true,
    }),
  on: {
    "NOTIFICATION.SYNC": {
      actions: assign(({ context, event }) =>
        reconcileNotifications({
          ...context,
          achievements: event.achievements,
        }),
      ),
    },
    "NOTIFICATION.APP_ACTIVITY": {
      actions: assign(({ context, event }) =>
        reconcileNotifications({ ...context, isAppActive: event.isActive }),
      ),
    },
    "NOTIFICATION.INTERACTION": {
      actions: assign(({ context, event }) => {
        const interactions = context.interactions.filter(
          (interaction) =>
            interaction.achievementId !== event.interaction.achievementId ||
            interaction.kind !== event.interaction.kind,
        )
        return reconcileNotifications({
          ...context,
          interactions: event.isActive
            ? [...interactions, event.interaction]
            : interactions,
        })
      }),
    },
    "NOTIFICATION.DISMISS": {
      guard: ({ context, event }) =>
        context.visible.some(({ id }) => id === event.achievementId) &&
        !context.requestedIds.includes(event.achievementId),
      actions: [
        assign(({ context, event }) => ({
          requestedIds: [...context.requestedIds, event.achievementId],
          interactions: context.interactions.filter(
            ({ achievementId }) => achievementId !== event.achievementId,
          ),
        })),
        ({ context, event }) => context.onPresented(event.achievementId),
      ],
    },
  },
})
