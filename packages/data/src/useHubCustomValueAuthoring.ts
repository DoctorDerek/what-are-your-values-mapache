import type { CustomValueAuthoringOptions } from "@game/data/src/useCustomValueAuthoring"
import type { ValueId } from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { useCallback, useState } from "react"

export type HubCustomValueInvitation = Omit<
  CustomValueAuthoringOptions,
  "existingCustomValues" | "onExit" | "menuRequestId"
> & {
  saveIssue: string | null
  onClosed: () => void
  onOpenMatchingValue: (valueId: ValueId) => void
}

export default function useHubCustomValueAuthoring({
  invitation,
  rankedValues,
  onOpenMenu,
}: {
  invitation: HubCustomValueInvitation | undefined
  rankedValues: readonly RankedValue[]
  onOpenMenu: () => void
}): {
  isDraftActive: boolean
  isNavigationBlocked: boolean
  onMenu: () => void
  invitationProps:
    (CustomValueAuthoringOptions & { saveIssue: string | null }) | undefined
} {
  const [isDraftActive, setIsDraftActive] = useState(false)
  const [menuRequestId, setMenuRequestId] = useState(0)
  const onNavigationBlockedChange = invitation?.onNavigationBlockedChange
  const handleNavigationBlockedChange = useCallback(
    (blocked: boolean) => {
      setIsDraftActive(blocked)
      onNavigationBlockedChange?.(blocked)
    },
    [onNavigationBlockedChange],
  )
  return {
    isDraftActive,
    isNavigationBlocked: isDraftActive || invitation?.isSaving === true,
    onMenu: () => {
      if (isDraftActive) setMenuRequestId((request) => request + 1)
      else onOpenMenu()
    },
    invitationProps: invitation
      ? {
          ...invitation,
          menuRequestId,
          existingCustomValues: rankedValues.flatMap(({ definition }) =>
            definition.kind === "custom" ? [definition] : [],
          ),
          onNavigationBlockedChange: handleNavigationBlockedChange,
          onExit: (target) => {
            invitation.onClosed()
            if (target === "menu") onOpenMenu()
            else if (typeof target === "object")
              invitation.onOpenMatchingValue(target.valueId)
          },
        }
      : undefined,
  }
}
