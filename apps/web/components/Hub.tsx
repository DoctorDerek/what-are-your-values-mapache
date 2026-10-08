"use client"

import type { CustomValueDraft } from "@game/data/src/CustomValueDraft"
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
      className="flex min-w-0 flex-col items-center gap-5 [overflow-wrap:anywhere]"
    >
      <header className="flex w-full max-w-7xl justify-end">
        <Button
          id={HUB_MENU_BUTTON_ID}
          variant="secondary"
          onClick={onOpenMenu}
          disabled={isNavigationBlocked}
        >
          {PRODUCT_MENU_COPY.openAction}
        </Button>
      </header>
      {dataNotice && (
        <p
          role="status"
          className="bg-mapache-vivid-secondary-green w-full max-w-7xl border-4 border-black p-4 font-bold text-white"
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
        appearance={appearance}
        rankedValues={rankedValues}
        catalog={runtimeClipCatalog}
        shouldReduceMotion={shouldReduceMotion}
        inert={isNavigationBlocked}
      />
      <nav
        aria-label={PERSONAL_HUB_COPY.actions}
        className="grid w-full max-w-7xl grid-cols-6 gap-4 [&_button]:min-w-0"
      >
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
          size="sm"
          typographyClassName="text-2xl xl:text-3xl"
          wrap
          className="relative col-span-6 xl:col-span-2"
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
        <Button
          id="hub-customize-button"
          className="col-span-3 xl:col-span-2"
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
          className="col-span-3 xl:col-span-2"
          variant="secondary"
          size="sm"
          typographyClassName="text-base xl:text-lg"
          wrap
          disabled={isNavigationBlocked}
          onClick={onShare}
        >
          {VALUES_CARD_COPY.title}
        </Button>
        <Button
          className="col-span-3"
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
        <Button
          disabled={customValueInvitation?.isSaving}
          className="col-span-3"
          id="hub-add-custom-value-button"
          variant="outline"
          size="sm"
          typographyClassName="text-base xl:text-lg"
          wrap
          onClick={(event) => onAddCustomValue(event.currentTarget.id)}
        >
          {PERSONAL_HUB_COPY.add}
        </Button>
      </nav>
    </MapacheScreen>
  )
}
