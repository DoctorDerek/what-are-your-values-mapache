"use client"

import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import type { ImportConfirmation } from "@game/data/src/ImportConfirmation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useHubCustomValueAuthoring, {
  type HubCustomValueInvitation,
} from "@game/data/src/useHubCustomValueAuthoring"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { hubActionIds } from "@game/ui/src/HubActions"
import { cx } from "classix"
import type { StaticImageData } from "next/image"
import { useEffect, useRef, type ReactNode, type Ref } from "react"
import CustomValueInvitation from "@/components/CustomValueInvitation"
import HubActions from "@/components/HubActions"
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
  customValueInvitation?: HubCustomValueInvitation
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
  const PERSONAL_HUB_COPY = localizedCopy.hub
  const PRODUCT_MENU_COPY = localizedCopy.interfaceCopy.menu

  const {
    isDraftActive: isDraftNavigationBlocked,
    isNavigationBlocked,
    invitationProps,
    onMenu,
  } = useHubCustomValueAuthoring({
    invitation: customValueInvitation,
    rankedValues,
    onOpenMenu,
  })
  const wasDraftActive = useRef(false)
  useEffect(() => {
    if (wasDraftActive.current && !isDraftNavigationBlocked) {
      document.getElementById(hubActionIds.addCustomValue)?.focus()
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
          onClick={onMenu}
          disabled={customValueInvitation?.isSaving}
          className="ml-auto"
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
      className="flex h-[100dvh] min-w-0 flex-col items-center gap-4 max-xl:gap-[clamp(0rem,calc(100vw_-_10rem),1rem)] max-xl:[--mapache-screen-spacing:var(--spacing-reflow-inset)]"
    >
      <div
        data-controller-scroll={isDraftNavigationBlocked ? undefined : true}
        tabIndex={isDraftNavigationBlocked ? undefined : 0}
        className={
          isDraftNavigationBlocked
            ? "contents"
            : "-mt-(--mapache-screen-spacing) -mr-(--mapache-screen-spacing) flex min-h-(--hub-composition-minimum) w-[calc(100%+var(--mapache-screen-spacing))] max-w-[calc(80rem+var(--mapache-screen-spacing))] flex-[1_0_var(--hub-composition-minimum)] flex-col items-center gap-4 overflow-x-hidden overflow-y-auto overscroll-contain pt-(--mapache-screen-spacing) pr-(--mapache-screen-spacing) [--hub-composition-minimum:min(calc(16rem+var(--mapache-screen-spacing)),calc(50%+var(--mapache-screen-spacing)))] focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-white"
        }
      >
        {!isDraftNavigationBlocked && header}
        {invitationProps && (
          <CustomValueInvitation
            {...invitationProps}
            runtimeClipCatalog={runtimeClipCatalog}
            shouldReduceMotion={shouldReduceMotion}
            header={header}
            rankedValues={rankedValues}
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
            {notifications}
          </div>
        )}
      </div>
      {!isDraftNavigationBlocked && (
        <nav
          aria-label={PERSONAL_HUB_COPY.actions}
          className="max-h-[60%] min-h-0 w-full max-w-7xl shrink overflow-y-auto overscroll-contain pr-2 pb-3 [@media(hover:hover)]:pt-1"
        >
          <HubActions
            browseAllValuesButtonRef={browseAllValuesButtonRef}
            isSaving={customValueInvitation?.isSaving === true}
            isNavigationBlocked={isNavigationBlocked}
            isBattlePending={isBattlePending}
            onAddCustomValue={onAddCustomValue}
            onBrowseAllValues={onBrowseAllValues}
            onOpenAchievements={onOpenAchievements}
            onStartBattle={onStartBattle}
            onCustomize={onCustomize}
            onShare={onShare}
          />
        </nav>
      )}
    </MapacheScreen>
  )
}
