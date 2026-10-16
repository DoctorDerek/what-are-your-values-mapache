"use client"

import type { CustomValueDraft } from "@game/data/src/CustomValueDraft"
import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import { introductionCopy } from "@game/data/src/IntroductionCopy"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { RankedValue } from "@game/data/src/ValueRanking"
import type { StaticImageData } from "next/image"
import { useCallback, useEffect, useRef, useState, type Ref } from "react"
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
  shouldReduceMotion: boolean
  onBrowseAllValues: (focusTargetId: string) => void
  onAddCustomValue: (focusTargetId: string) => void
  onOpenMenu: () => void
  onStartBattle: () => void
  onCustomize: () => void
  onShare: () => void
}) {
  const localizedCopy = useLocaleCatalog()
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
      spacing="standard-xl"
      viewport="scrollable"
      className="flex h-[100dvh] min-w-0 flex-col items-center gap-4"
    >
      <header className="flex w-full max-w-7xl shrink-0 items-center justify-between gap-3 text-white">
        <div className="@container min-w-0 flex-1">
          <h1 className="text-[min(5.25cqw,1.5rem)] leading-tight font-bold tracking-tight whitespace-nowrap">
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
      <PersonalValuesCard
        rosterRef={rosterRef}
        appearance={appearance}
        rankedValues={rankedValues}
        catalog={runtimeClipCatalog}
        shouldReduceMotion={shouldReduceMotion}
        inert={isNavigationBlocked}
      />
      <nav
        aria-label={PERSONAL_HUB_COPY.actions}
        className="grid w-full max-w-7xl shrink-0 gap-4 pb-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] [&_button]:min-w-0"
      >
        <div className="flex flex-wrap gap-4 xl:col-span-2">
          <Button
            disabled={customValueInvitation?.isSaving}
            id="hub-add-custom-value-button"
            variant="outline"
            size="sm"
            textCase="normal-case"
            typographyClassName="text-base xl:text-lg"
            className="flex-[1_1_6rem]"
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
            className="relative flex-[1.35_1_8rem]"
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
        <div className="flex flex-wrap gap-4">
          <Button
            id="hub-customize-button"
            textCase="normal-case"
            variant="secondary"
            size="sm"
            typographyClassName="text-base xl:text-lg"
            className="flex-[1_1_7rem]"
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
            className="flex-[1_1_7rem]"
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
          wrap
          onClick={(event) => onBrowseAllValues(event.currentTarget.id)}
        >
          {PERSONAL_HUB_COPY.browse}
        </Button>
      </nav>
    </MapacheScreen>
  )
}
