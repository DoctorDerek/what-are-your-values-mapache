"use client"

import type { CustomValueDraft } from "@game/data/src/CustomValueDraft"
import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import type { ImportConfirmation } from "@game/data/src/ImportConfirmation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { ValueId } from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { cx } from "classix"
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
  importConfirmation = null,
  notifications,
  shouldReduceMotion,
  onBrowseAllValues,
  onOpenAchievements,
  onAddCustomValue,
  onOpenMenu,
  onStartBattle,
  onCustomize,
  onShare,
}: {
  customValueInvitation?: {
    editorRequestId?: number
    backRequestId?: number
    initialName?: string
    deckRevision: number
    isSaving: boolean
    saveIssue: string | null
    onApply: (drafts: readonly CustomValueDraft[]) => void
    onExport: () => Promise<void>
    onNavigationBlockedChange: (blocked: boolean) => void
    onClosed: () => void
    onOpenMatchingValue: (valueId: ValueId) => void
  }
  isBattlePending?: boolean
  appearance: Heroes99Appearance
  rankedValues: readonly RankedValue[]
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  browseAllValuesButtonRef?: Ref<HTMLButtonElement>
  rosterRef?: Ref<HTMLDivElement>
  dataNotice: string | null
  importConfirmation?: ImportConfirmation | null
  notifications?: ReactNode
  shouldReduceMotion: boolean
  onBrowseAllValues: (focusTargetId: string) => void
  onOpenAchievements: (focusTargetId: string) => void
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
  const [menuRequestId, setMenuRequestId] = useState(0)
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
  const wasDraftActive = useRef(false)
  useEffect(() => {
    if (wasDraftActive.current && !isDraftNavigationBlocked) {
      document.getElementById("hub-add-custom-value-button")?.focus()
    }
    wasDraftActive.current = isDraftNavigationBlocked
  }, [isDraftNavigationBlocked])

  const header = (
    <>
      <header className="flex w-full max-w-7xl shrink-0 flex-wrap items-center justify-between gap-3 text-white xl:flex-nowrap">
        <div className="@container grid min-w-0 flex-[1_1_10rem] items-center xl:flex-1">
          <h1
            className={cx(
              "font-home-title col-start-1 row-start-1 text-[clamp(0.85rem,6.9cqw,2rem)] leading-[1.2] font-normal tracking-normal text-balance",
              importConfirmation && "opacity-0",
            )}
          >
            {introductionCopy.title}
          </h1>
          <p
            role="status"
            aria-hidden={!importConfirmation}
            className={cx(
              "col-start-1 row-start-1 text-sm leading-tight font-bold xl:text-2xl",
              !importConfirmation && "opacity-0",
            )}
          >
            <span aria-hidden="true">
              <span className="text-green-300">✓</span>{" "}
              {importConfirmation?.summary ??
                localizedCopy.interfaceCopy.portability.importSuccessSummary}
            </span>
            <span className="sr-only">{importConfirmation?.message}</span>
          </p>
        </div>
        <Button
          id={HUB_MENU_BUTTON_ID}
          controllerAction="menu"
          variant="secondary"
          size="sm"
          textCase="normal-case"
          onClick={() =>
            isDraftNavigationBlocked
              ? setMenuRequestId((id) => id + 1)
              : onOpenMenu()
          }
          disabled={customValueInvitation?.isSaving}
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
    </>
  )

  return (
    <MapacheScreen
      spacing={isDraftNavigationBlocked ? "authoring" : "readable-xl"}
      viewport="fixed"
      className="flex h-[100dvh] min-w-0 flex-col items-center gap-[16px] xl:gap-4"
    >
      <div
        data-controller-scroll={isDraftNavigationBlocked ? undefined : true}
        tabIndex={isDraftNavigationBlocked ? undefined : 0}
        className={
          isDraftNavigationBlocked
            ? "contents"
            : "-mt-2 -mr-2 flex min-h-[min(16rem,50%)] w-[calc(100%+0.5rem)] max-w-[calc(80rem+0.5rem)] flex-[1_0_min(16rem,50%)] flex-col items-center gap-[16px] overflow-x-hidden overflow-y-auto overscroll-contain pt-2 pr-2 focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-white xl:gap-4"
        }
      >
        {!isDraftNavigationBlocked && header}
        {customValueInvitation && (
          <CustomValueInvitation
            header={header}
            rankedValues={rankedValues}
            deckRevision={customValueInvitation.deckRevision}
            editorRequestId={customValueInvitation.editorRequestId}
            backRequestId={customValueInvitation.backRequestId}
            menuRequestId={menuRequestId}
            initialName={customValueInvitation.initialName}
            existingCustomValues={rankedValues.flatMap(({ definition }) =>
              definition.kind === "custom" ? [definition] : [],
            )}
            isSaving={customValueInvitation.isSaving}
            saveIssue={customValueInvitation.saveIssue}
            onApply={customValueInvitation.onApply}
            onExport={customValueInvitation.onExport}
            onNavigationBlockedChange={handleDraftNavigationBlockedChange}
            onExit={(target) => {
              customValueInvitation.onClosed()
              if (target === "menu") onOpenMenu()
              else if (typeof target === "object")
                customValueInvitation.onOpenMatchingValue(target.valueId)
            }}
          />
        )}
        {!isDraftNavigationBlocked && (
          <div className="relative isolate flex min-h-min w-full max-w-7xl min-w-0 flex-1 flex-col">
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
        )}
      </div>
      {!isDraftNavigationBlocked && (
        <nav
          aria-label={PERSONAL_HUB_COPY.actions}
          className="grid max-h-[60%] min-h-0 w-full max-w-7xl shrink auto-rows-min grid-cols-1 gap-[16px] overflow-y-auto overscroll-contain pr-2 pb-[12px] xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-4 xl:pb-3 [&_button]:max-w-full [&_button]:min-w-0"
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
              className="relative flex-[1.35_1_8rem] max-xl:px-[8px] max-xl:py-[12px]"
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
              className="flex-[1_1_7rem] max-xl:px-[6px] max-xl:py-[8px]"
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
              className="flex-[1_1_7rem] max-xl:px-[8px] max-xl:py-[8px]"
              wrap
              disabled={isNavigationBlocked}
              onClick={onShare}
            >
              {VALUES_CARD_COPY.title}
            </Button>
          </div>
          <div className="flex min-w-0 flex-wrap gap-4">
          <Button
            disabled={isNavigationBlocked}
            ref={browseAllValuesButtonRef}
            id="hub-browse-all-values-button"
            textCase="normal-case"
            variant="outline"
            size="sm"
            typographyClassName="text-base xl:text-lg"
            className="flex-[1.4_1_5rem] max-xl:px-3 max-xl:py-2"
            wrap
            onClick={(event) => onBrowseAllValues(event.currentTarget.id)}
          >
            {PERSONAL_HUB_COPY.browse}
          </Button>
          <Button
            disabled={isNavigationBlocked}
            id="hub-achievements-button"
            textCase="normal-case"
            variant="outline"
            size="sm"
            typographyClassName="text-base xl:text-lg"
            className="flex-[1_1_auto] max-xl:px-3 max-xl:py-2"
            wrap
            onClick={(event) => onOpenAchievements(event.currentTarget.id)}
          >
            {localizedCopy.interfaceCopy.screen.achievements}
          </Button>
          </div>
        </nav>
      )}
    </MapacheScreen>
  )
}
