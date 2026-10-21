"use client"

import type { CustomValueDraft } from "@game/data/src/CustomValueDraft"
import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { RankedValue } from "@game/data/src/ValueRanking"
import type { StaticImageData } from "next/image"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react"
import CustomValueInvitation from "@/components/CustomValueInvitation"
import MapacheScreen from "@/components/MapacheScreen"
import PersonalValuesCard from "@/components/PersonalValuesCard"
import { Button } from "@/components/ui/button"

export const HUB_MENU_BUTTON_ID = "hub-menu-button"

export default function Hub({
  customValueInvitation,
  isBattlePending = false,
  appearance,
  rankedValues,
  runtimeClipCatalog,
  browseAllValuesButtonRef,
  rosterRef,
  dataNotice,
  notifications,
  shouldReduceMotion,
  onBrowseAllValues,
  onAddCustomValue,
  onOpenMenu,
  onStartBattle,
  onCustomize,
  onShare,
}: {
  customValueInvitation?: {
    editorRequestId?: number
    initialName?: string
    deckRevision: number
    isSaving: boolean
    saveIssue: string | null
    onApply: (drafts: readonly CustomValueDraft[]) => void
    onExport: () => Promise<void>
    onNavigationBlockedChange: (blocked: boolean) => void
  }
  isBattlePending?: boolean
  appearance: Heroes99Appearance
  rankedValues: readonly RankedValue[]
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  browseAllValuesButtonRef?: Ref<HTMLButtonElement>
  rosterRef?: Ref<HTMLDivElement>
  dataNotice: string | null
  notifications?: ReactNode
  shouldReduceMotion: boolean
  onBrowseAllValues: (focusTargetId: string) => void
  onAddCustomValue: (focusTargetId: string) => void
  onOpenMenu: () => void
  onStartBattle: () => void
  onCustomize: () => void
  onShare: () => void
}) {
  const localizedCopy = useLocaleCatalog()
  const introductionCopy = localizedCopy.introduction
  const DRESSING_ROOM_COPY = localizedCopy.interfaceCopy.dressingRoom
  const PERSONAL_HUB_COPY = localizedCopy.hub
  const presentationLoadingCopy = localizedCopy.interfaceCopy.loading
  const PRODUCT_MENU_COPY = localizedCopy.interfaceCopy.menu
  const VALUES_CARD_COPY = localizedCopy.card

  const [isDraftNavigationBlocked, setIsDraftNavigationBlocked] =
    useState(false)
  const isNavigationBlocked =
    isDraftNavigationBlocked || customValueInvitation?.isSaving === true
  const onNavigationBlockedChange =
    customValueInvitation?.onNavigationBlockedChange
  const handleDraftNavigationBlockedChange = useCallback(
    (blocked: boolean) => {
      setIsDraftNavigationBlocked(blocked)
      onNavigationBlockedChange?.(blocked)
    },
    [onNavigationBlockedChange],
  )
  const previousDeckRevision = useRef(customValueInvitation?.deckRevision)
  useEffect(() => {
    if (previousDeckRevision.current !== customValueInvitation?.deckRevision) {
      previousDeckRevision.current = customValueInvitation?.deckRevision
      document.getElementById("hub-add-custom-value-button")?.focus()
    }
  }, [customValueInvitation?.deckRevision])

  return (
    <MapacheScreen
      spacing="readable-xl"
      viewport="scrollable"
      className="flex h-[100dvh] min-w-0 flex-col items-center gap-[16px] xl:gap-4"
    >
      <header className="flex w-full max-w-7xl shrink-0 flex-wrap items-center justify-between gap-[12px] text-white xl:flex-nowrap xl:gap-3">
        <div className="@container min-w-0 flex-[1_1_10rem] xl:flex-1">
          <h1 className="text-[clamp(0.625rem,5.25cqw,1.5rem)] leading-tight font-bold tracking-tight text-balance xl:text-[min(5.25cqw,1.5rem)] xl:whitespace-nowrap">
            {introductionCopy.title}
          </h1>
        </div>
        <Button
          id={HUB_MENU_BUTTON_ID}
          variant="secondary"
          size="sm"
          textCase="normal-case"
          onClick={onOpenMenu}
          disabled={isNavigationBlocked}
          className="ml-auto max-xl:px-[12px] max-xl:py-[8px]"
        >
          {PRODUCT_MENU_COPY.openAction}
        </Button>
      </header>
      {dataNotice && (
        <p
          role="status"
          className="bg-mapache-vivid-secondary-green w-full max-w-7xl shrink-0 border-4 border-black p-4 font-bold text-white"
        >
          {dataNotice}
        </p>
      )}
      {customValueInvitation && (
        <CustomValueInvitation
          key={customValueInvitation.deckRevision}
          editorRequestId={customValueInvitation.editorRequestId}
          initialName={customValueInvitation.initialName}
          existingCustomValues={rankedValues.flatMap(({ definition }) =>
            definition.kind === "custom" ? [definition] : [],
          )}
          isSaving={customValueInvitation.isSaving}
          saveIssue={customValueInvitation.saveIssue}
          onApply={customValueInvitation.onApply}
          onExport={customValueInvitation.onExport}
          onNavigationBlockedChange={handleDraftNavigationBlockedChange}
        />
      )}
      <div className="relative isolate flex min-h-min w-full max-w-7xl min-w-0 flex-1 flex-col overflow-hidden">
        <PersonalValuesCard
          rosterRef={rosterRef}
          appearance={appearance}
          rankedValues={rankedValues}
          catalog={runtimeClipCatalog}
          shouldReduceMotion={shouldReduceMotion}
          inert={isNavigationBlocked}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 max-h-full overflow-y-auto overscroll-contain p-2">
          {notifications}
        </div>
      </div>
      <nav
        aria-label={PERSONAL_HUB_COPY.actions}
        className="grid w-full max-w-7xl shrink-0 grid-cols-1 gap-[16px] pb-[12px] xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-4 xl:pb-3 [&_button]:max-w-full [&_button]:min-w-0"
      >
        <div className="flex min-w-0 flex-wrap gap-[16px] xl:col-span-2 xl:gap-4">
          <Button
            disabled={customValueInvitation?.isSaving}
            id="hub-add-custom-value-button"
            variant="outline"
            size="sm"
            textCase="normal-case"
            typographyClassName="text-base xl:text-lg"
            className="flex-[1_1_6rem] max-xl:px-[12px] max-xl:py-[8px]"
            wrap
            onClick={(event) => onAddCustomValue(event.currentTarget.id)}
          >
            {PERSONAL_HUB_COPY.add}
          </Button>
          <Button
            disabled={isNavigationBlocked}
            onClick={onStartBattle}
            aria-busy={isBattlePending}
            aria-label={
              isBattlePending
                ? presentationLoadingCopy.cancelBattlePreparation
                : undefined
            }
            variant="battle"
            size="tall"
            textCase="normal-case"
            typographyClassName="text-2xl xl:text-3xl"
            wrap
            className="relative flex-[1.35_1_8rem] max-xl:px-[20px] max-xl:py-[12px]"
          >
            <span className={isBattlePending ? "invisible" : undefined}>
              {PERSONAL_HUB_COPY.battle}
            </span>
            {isBattlePending && (
              <span className="absolute inset-0 flex items-center justify-center text-lg">
                {presentationLoadingCopy.preparing}
              </span>
            )}
          </Button>
        </div>
        <div className="flex min-w-0 flex-wrap gap-[16px] xl:gap-4">
          <Button
            id="hub-customize-button"
            textCase="normal-case"
            variant="secondary"
            size="sm"
            typographyClassName="text-base xl:text-lg"
            className="flex-[1_1_7rem] max-xl:px-[12px] max-xl:py-[8px]"
            wrap
            disabled={isNavigationBlocked}
            onClick={onCustomize}
          >
            {DRESSING_ROOM_COPY.customize}
          </Button>
          <Button
            id="hub-share-button"
            textCase="normal-case"
            variant="secondary"
            size="sm"
            typographyClassName="text-base xl:text-lg"
            className="flex-[1_1_7rem] max-xl:px-[12px] max-xl:py-[8px]"
            wrap
            disabled={isNavigationBlocked}
            onClick={onShare}
          >
            {VALUES_CARD_COPY.title}
          </Button>
        </div>
        <Button
          disabled={isNavigationBlocked}
          ref={browseAllValuesButtonRef}
          id="hub-browse-all-values-button"
          textCase="normal-case"
          variant="outline"
          size="sm"
          typographyClassName="text-base xl:text-lg"
          className="max-xl:px-[12px] max-xl:py-[8px]"
          wrap
          onClick={(event) => onBrowseAllValues(event.currentTarget.id)}
        >
          {PERSONAL_HUB_COPY.browse}
        </Button>
      </nav>
    </MapacheScreen>
  )
}
