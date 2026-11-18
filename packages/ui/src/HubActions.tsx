import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { ComponentType, ReactNode } from "react"

export const hubActionIds = Object.freeze({
  addCustomValue: "hub-add-custom-value-button",
  customize: "hub-customize-button",
  share: "hub-share-button",
  browseAllValues: "hub-browse-all-values-button",
  achievements: "hub-achievements-button",
})

export type HubActionControlProps = {
  id?: string
  label: string
  pendingLabel?: string
  accessibilityLabel?: string
  isPending?: boolean
  disabled: boolean
  onActivate: () => void
  variant: "outline" | "secondary" | "battle"
  className: string
  textClassName: string
}

export type HubActionGroupProps = {
  children: ReactNode
  className: string
}

export type HubActionsProps = {
  isSaving: boolean
  isNavigationBlocked: boolean
  isBattlePending: boolean
  onAddCustomValue: (focusTargetId: string) => void
  onBrowseAllValues: (focusTargetId: string) => void
  onOpenAchievements: (focusTargetId: string) => void
  onStartBattle: () => void
  onCustomize: () => void
  onShare: () => void
}

export default function HubActions({
  Group,
  renderAction,
  isSaving,
  isNavigationBlocked,
  isBattlePending,
  onAddCustomValue,
  onBrowseAllValues,
  onOpenAchievements,
  onStartBattle,
  onCustomize,
  onShare,
}: HubActionsProps & {
  Group: ComponentType<HubActionGroupProps>
  renderAction: (props: HubActionControlProps) => ReactNode
}) {
  const catalog = useLocaleCatalog()
  const secondaryTextClassName = "text-base font-black xl:text-lg"

  return (
    <Group className="flex w-full max-w-7xl min-w-0 flex-col gap-4">
      <Group className="flex min-w-0 flex-row flex-wrap gap-4">
        {renderAction({
          id: hubActionIds.addCustomValue,
          label: catalog.hub.add,
          disabled: isSaving,
          onActivate: () => onAddCustomValue(hubActionIds.addCustomValue),
          variant: "outline",
          className: "basis-readable-action max-w-full min-w-0 shrink grow",
          textClassName: secondaryTextClassName,
        })}
        {renderAction({
          label: catalog.hub.battle,
          pendingLabel: catalog.interfaceCopy.loading.preparing,
          accessibilityLabel: isBattlePending
            ? catalog.interfaceCopy.loading.cancelBattlePreparation
            : undefined,
          isPending: isBattlePending,
          disabled: isNavigationBlocked,
          onActivate: onStartBattle,
          variant: "battle",
          className:
            "basis-readable-action relative max-w-full min-w-0 shrink grow-[1.35]",
          textClassName: "text-2xl font-black xl:text-3xl",
        })}
      </Group>
      <Group className="flex min-w-0 flex-col gap-4 xl:flex-row">
        <Group className="flex min-w-0 flex-row flex-wrap gap-4 xl:flex-[2]">
          {renderAction({
            id: hubActionIds.customize,
            label: catalog.interfaceCopy.dressingRoom.customize,
            disabled: isNavigationBlocked,
            onActivate: onCustomize,
            variant: "secondary",
            className: "basis-readable-action max-w-full min-w-0 shrink grow",
            textClassName: secondaryTextClassName,
          })}
          {renderAction({
            id: hubActionIds.share,
            label: catalog.card.title,
            disabled: isNavigationBlocked,
            onActivate: onShare,
            variant: "secondary",
            className: "basis-readable-action max-w-full min-w-0 shrink grow",
            textClassName: secondaryTextClassName,
          })}
        </Group>
        <Group className="flex min-w-0 flex-row flex-wrap gap-4 xl:flex-1">
          {renderAction({
            id: hubActionIds.browseAllValues,
            label: catalog.hub.browse,
            disabled: isNavigationBlocked,
            onActivate: () => onBrowseAllValues(hubActionIds.browseAllValues),
            variant: "outline",
            className: "max-w-full min-w-0 flex-[1.4_1_5rem] hyphens-auto",
            textClassName: secondaryTextClassName,
          })}
          {renderAction({
            id: hubActionIds.achievements,
            label: catalog.interfaceCopy.screen.achievements,
            disabled: isNavigationBlocked,
            onActivate: () => onOpenAchievements(hubActionIds.achievements),
            variant: "outline",
            className: "max-w-full min-w-0 flex-[1_1_auto] hyphens-auto",
            textClassName: secondaryTextClassName,
          })}
        </Group>
      </Group>
    </Group>
  )
}
