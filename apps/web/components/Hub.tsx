"use client"

import type { CustomValueDraft } from "@game/data/src/CustomValueDraft"
import { introductionCopy } from "@game/data/src/IntroductionCopy"
import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import { DRESSING_ROOM_COPY } from "@game/data/src/Heroes99DressingRoom"
import { PERSONAL_HUB_COPY } from "@game/data/src/PersonalHubCopy"
import { presentationLoadingCopy } from "@game/data/src/PresentationLoadingCopy"
import { PRODUCT_MENU_COPY } from "@game/data/src/ProductMenu"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { VALUES_CARD_COPY } from "@game/data/src/ValuesCard"
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
  dataNotice: string | null
  shouldReduceMotion: boolean
  onBrowseAllValues: (focusTargetId: string) => void
  onAddCustomValue: (focusTargetId: string) => void
  onOpenMenu: () => void
  onStartBattle: () => void
  onCustomize: () => void
  onShare: () => void
}) {
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
      <header className="w-full max-w-7xl shrink-0 text-white">
        <h1 className="text-[clamp(1rem,5.25vw,1.5rem)] leading-tight font-bold whitespace-nowrap">
          {introductionCopy.title}
        </h1>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm xl:text-base">{PERSONAL_HUB_COPY.screenTitle}</p>
          <Button
            id={HUB_MENU_BUTTON_ID}
            variant="secondary"
            size="sm"
            onClick={onOpenMenu}
            disabled={isNavigationBlocked}
          >
            {PRODUCT_MENU_COPY.openAction}
          </Button>
        </div>
      </header>
      {dataNotice && (
        <p role="status" className="bg-mapache-vivid-secondary-green w-full max-w-7xl shrink-0 border-4 border-black p-4 font-bold text-white">
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
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-4 xl:col-span-2">
          <Button
            disabled={customValueInvitation?.isSaving}
            id="hub-add-custom-value-button"
            variant="outline"
            size="tall"
            wrap
            onClick={(event) => onAddCustomValue(event.currentTarget.id)}
          >
            {PERSONAL_HUB_COPY.add}
          </Button>
          <Button
            disabled={isNavigationBlocked}
            onClick={onStartBattle}
            aria-busy={isBattlePending}
            aria-label={isBattlePending ? presentationLoadingCopy.cancelBattlePreparation : undefined}
            variant="battle"
            size="tall"
            typographyClassName="text-2xl xl:text-3xl"
            wrap
            className="relative"
          >
            <span className={isBattlePending ? "invisible" : undefined}>{PERSONAL_HUB_COPY.battle}</span>
            {isBattlePending && (
              <span className="absolute inset-0 flex items-center justify-center text-lg">
                {presentationLoadingCopy.preparing}
              </span>
            )}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button
            id="hub-customize-button"
            variant="secondary"
            size="sm"
            typographyClassName="text-base xl:text-lg"
            wrap
            disabled={isNavigationBlocked}
            onClick={onCustomize}
          >
            {DRESSING_ROOM_COPY.customize}
          </Button>
          <Button
            id="hub-share-button"
            variant="secondary"
            size="sm"
            typographyClassName="text-base xl:text-lg"
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
