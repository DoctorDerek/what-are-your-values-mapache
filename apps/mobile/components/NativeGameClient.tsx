import { type InformationPanelId } from "@game/data/src/InformationPanels"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import {
  type ProductMenuDestination,
  type ProductMenuRouteDestination,
} from "@game/data/src/ProductMenu"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { CustomValueId, ValueId } from "@game/data/src/Value"
import { rankValues } from "@game/data/src/ValueRanking"
import {
  createValuesCardModel,
  type ValuesCardModel,
} from "@game/data/src/ValuesCard"
import {
  getPendingAchievementPresentations,
  projectAchievementCatalog,
  type AchievementPresentation,
} from "@game/machines/src/AchievementPresentation"
import { createBattleExitResults } from "@game/machines/src/BattleExitResults"
import { BATTLE_PROFILE_PRE_IMPORT_BACKUP_KEY } from "@game/machines/src/BattleProfileStore"
import {
  projectBattlePair,
  type BattleSchedulerRestorePoint,
} from "@game/machines/src/BattleScheduler"
import { prepareWayvmDownload } from "@game/machines/src/PlayerDataPortabilityActors"
import {
  DELETE_ALL_DATA_ACKNOWLEDGMENT,
  type PlayerDataResetKind,
  type PlayerDataResetReview,
} from "@game/machines/src/PlayerDataReset"
import { resolveShouldReduceMotion } from "@game/machines/src/PlayerSettingsPresentation"
import { projectRootBackDisposition } from "@game/machines/src/RootNavigation"
import type { RootActor } from "@game/machines/src/RuntimeRecovery"
import { getHubPreparationClips } from "@game/machines/src/SeethingSwarmAssetPreparation"
import RenderRecoveryBoundary from "@game/utils/src/RenderRecoveryBoundary"
import useRecoverableActorSnapshot from "@game/utils/src/useRecoverableActorSnapshot"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AppState, BackHandler, View } from "react-native"
import { useReducedMotion } from "react-native-reanimated"
import NativeAchievementBanner from "@/components/NativeAchievementBanner"
import NativeAchievements from "@/components/NativeAchievements"
import NativeAllValues from "@/components/NativeAllValues"
import NativeControls from "@/components/NativeControls"
import NativeCrucible from "@/components/NativeCrucible"
import NativeDataManagement, {
  type NativeDataManagementActivity,
} from "@/components/NativeDataManagement"
import NativeDressingRoom from "@/components/NativeDressingRoom"
import NativeGameSession from "@/components/NativeGameSession"
import NativeHub from "@/components/NativeHub"
import { ReopenedNativeInformationPanel } from "@/components/NativeInformationPanel"
import NativeInformationPanelContent from "@/components/NativeInformationPanelContent"
import NativeIntroduction from "@/components/NativeIntroduction"
import NativePersistenceFailure, {
  type NativePlayerDataRecoveryActivity,
} from "@/components/NativePersistenceFailure"
import NativePlayerDataLoading from "@/components/NativePlayerDataLoading"
import NativeProductMenu from "@/components/NativeProductMenu"
import NativeResults from "@/components/NativeResults"
import NativeRuntimeRecovery from "@/components/NativeRuntimeRecovery"
import NativeSeethingSwarmAssetPreparation, {
  usePreparedNativeSeethingSwarmBattle,
  usePreparedNativeSeethingSwarmClips,
} from "@/components/NativeSeethingSwarmAssetPreparation"
import NativeSettings from "@/components/NativeSettings"
import NativeValuesCardShare from "@/components/NativeValuesCardShare"
import useNativePlayerDataFiles from "@/components/useNativePlayerDataFiles"
import { SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG } from "@/generated/seethingswarm/SeethingSwarmRuntimeClipCatalog"
import { expoPlayerDataFileAdapter } from "@/lib/ExpoPlayerDataFiles"
import { createNativeAppLifecycleEvent } from "@/lib/NativeAppLifecycleEvents"

export default function NativeGameClient() {
  const [sessionRevision, setSessionRevision] = useState(0)
  return (
    <RenderRecoveryBoundary
      fallback={(retry) => <NativeRuntimeRecovery onRetry={retry} />}
    >
      <NativeGameSession
        key={sessionRevision}
        onReopen={() => setSessionRevision((revision) => revision + 1)}
      >
        {(gameActor) => (
          <NativeSeethingSwarmAssetPreparation>
            <NativeGameClientContent gameActor={gameActor} />
          </NativeSeethingSwarmAssetPreparation>
        )}
      </NativeGameSession>
    </RenderRecoveryBoundary>
  )
}

function NativeGameClientContent({
  gameActor,
}: {
  readonly gameActor: RootActor
}) {
  const localizedCopy = useLocaleCatalog()
  const INFORMATION_PANELS = localizedCopy.interfaceCopy.information
  const PRODUCT_MENU_COPY = localizedCopy.interfaceCopy.menu
  const PLAYER_SETTINGS_COPY = localizedCopy.interfaceCopy.settings

  const systemShouldReduceMotion = useReducedMotion()
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false)
  const [isControlsOpen, setIsControlsOpen] = useState(false)
  const [activeInformationPanelId, setActiveInformationPanelId] =
    useState<InformationPanelId | null>(null)
  const [pendingAllValuesValueId, setPendingAllValuesValueId] =
    useState<ValueId | null>(null)
  const [customValueInitialName, setCustomValueInitialName] = useState("")
  const [isCustomValueDraftActive, setIsCustomValueDraftActive] =
    useState(false)
  const [customValueBackRequestId, setCustomValueBackRequestId] = useState(0)
  const [customValueBuilderRequestId, setCustomValueBuilderRequestId] =
    useState(0)
  const state = useRecoverableActorSnapshot(gameActor)
  const send = gameActor.send
  const { isReadingImportFile, chooseBackup } = useNativePlayerDataFiles({
    state,
    send,
  })
  const playerData = state.context.playerData
  const battleProfile = playerData?.profile ?? null
  const rankedValues = useMemo(
    () =>
      battleProfile
        ? rankValues(battleProfile.activeDeck, battleProfile.progressById)
        : [],
    [battleProfile],
  )
  const achievementPresentations = useMemo(
    () =>
      playerData
        ? projectAchievementCatalog({
            localization: localizedCopy,
            achievementState: playerData.achievements,
            battleProfile: playerData.profile,
          })
        : [],
    [playerData, localizedCopy],
  )
  const pendingAchievementPresentations = useMemo(() => {
    if (!playerData) return []

    return getPendingAchievementPresentations({
      achievementState: playerData.achievements,
      achievementPresentations,
    })
  }, [achievementPresentations, playerData])
  const presentedBattle = useMemo(
    () =>
      battleProfile
        ? Object.freeze({
            pair: projectBattlePair(
              battleProfile.activeDeck,
              battleProfile.scheduler,
            ),
            scheduler: battleProfile.scheduler,
          })
        : null,
    [battleProfile],
  )
  const hasValidatedProfile =
    state.context.battleProfileStoreState !== null ||
    state.matches("Splash") ||
    state.matches("InitializingProfile")
  const isBattlePrepared = usePreparedNativeSeethingSwarmBattle(
    hasValidatedProfile ? presentedBattle : null,
    SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG,
  )
  const hubClips = useMemo(
    () =>
      getHubPreparationClips<number>(
        rankedValues,
        SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG,
      ),
    [rankedValues],
  )
  usePreparedNativeSeethingSwarmClips(hubClips)
  const [isBattleRequested, setIsBattleRequested] = useState(false)
  const [sharedCard, setSharedCard] = useState<ValuesCardModel<number> | null>(
    null,
  )
  const [isAllValuesNavigationBlocked, setIsAllValuesNavigationBlocked] =
    useState(false)
  const [allValuesBackRequestId, setAllValuesBackRequestId] = useState(0)
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (activeInformationPanelId !== null) {
          setActiveInformationPanelId(null)
          return true
        }
        if (isControlsOpen) {
          setIsControlsOpen(false)
          return true
        }
        if (isProductMenuOpen) {
          setIsProductMenuOpen(false)
          return true
        }
        if (isCustomValueDraftActive) {
          setCustomValueBackRequestId((id) => id + 1)
          return true
        }
        if (isAllValuesNavigationBlocked) {
          setAllValuesBackRequestId((id) => id + 1)
          return true
        }
        if (isReadingImportFile) return true
        const disposition = projectRootBackDisposition(state)
        if (disposition.kind === "event") send(disposition.event)
        return disposition.kind !== "root"
      },
    )
    return () => subscription.remove()
  }, [
    activeInformationPanelId,
    isControlsOpen,
    isProductMenuOpen,
    isAllValuesNavigationBlocked,
    isCustomValueDraftActive,
    isReadingImportFile,
    send,
    state,
  ])
  const isHubReady = state.matches("Hub")
  const canAwaitBattle =
    isHubReady &&
    sharedCard === null &&
    !isProductMenuOpen &&
    activeInformationPanelId === null &&
    !isControlsOpen &&
    !isCustomValueDraftActive
  if (isBattleRequested && !canAwaitBattle) setIsBattleRequested(false)
  useEffect(() => {
    if (isBattleRequested && canAwaitBattle && isBattlePrepared) {
      send({ type: "BATTLE.START_REQUESTED" })
    }
  }, [isBattleRequested, isBattlePrepared, canAwaitBattle, send])
  const handleStartBattle = () => {
    if (isBattlePrepared) send({ type: "BATTLE.START_REQUESTED" })
    else setIsBattleRequested((previous) => !previous)
  }
  const handleWinnerSelected = useCallback(
    (winnerId: ValueId, expectedScheduler: BattleSchedulerRestorePoint) => {
      send({
        type: "BATTLE.WINNER_SELECTED",
        winnerId,
        expectedScheduler,
      })
    },
    [send],
  )
  const handleAchievementPresented = useCallback(
    (achievementId: AchievementPresentation["id"]) => {
      send({ type: "ACHIEVEMENT.PRESENTED", achievementId })
    },
    [send],
  )
  const openAllValues = useCallback(
    ({ valueId = null }: { readonly valueId?: ValueId | null }) => {
      setPendingAllValuesValueId(valueId)
      send({ type: "ALL_VALUES.OPEN_REQUESTED" })
    },
    [send],
  )
  const handleAddCustomValue = useCallback(
    (name = "") => {
      setCustomValueInitialName(name)
      setCustomValueBuilderRequestId((requestId) => requestId + 1)
      send({ type: "ALL_VALUES.CLOSE_REQUESTED" })
    },
    [send],
  )
  const handleProductMenuDestinationSelect = useCallback(
    (destination: ProductMenuDestination) => {
      setIsProductMenuOpen(false)
      if (destination.kind === "information-panel") {
        setActiveInformationPanelId(destination.id)
        return
      }
      if (destination.id === "controls") {
        setIsControlsOpen(true)
        return
      }
      if (destination.id === "settings") {
        send({ type: "SETTINGS.OPEN_REQUESTED" })
        return
      }
      const settingsReturnTarget = state.matches("Settings")
        ? state.context.settingsReturnTarget
        : null
      if (state.matches("Settings")) send({ type: "SETTINGS.CLOSE_REQUESTED" })
      if (state.matches("Crucible") || settingsReturnTarget === "crucible") {
        send({ type: "BATTLE.EXIT_REQUESTED" })
        send({ type: "RESULTS.CLOSE_REQUESTED" })
      }
      if (state.matches("Results") || settingsReturnTarget === "results")
        send({ type: "RESULTS.CLOSE_REQUESTED" })
      if (
        state.matches("Achievements") ||
        settingsReturnTarget === "achievements"
      )
        send({ type: "ACHIEVEMENTS.CLOSE_REQUESTED" })
      if (state.matches("AllValues") || settingsReturnTarget === "all-values")
        send({ type: "ALL_VALUES.CLOSE_REQUESTED" })
      if (
        state.matches("DataManagement") ||
        settingsReturnTarget === "data-management"
      )
        send({ type: "DATA_MANAGEMENT.CLOSE_REQUESTED" })
      const destinationActions = {
        "browse-all-values": () => openAllValues({}),
        "custom-values": () => handleAddCustomValue(),
        achievements: () => send({ type: "ACHIEVEMENTS.OPEN_REQUESTED" }),
        "import-export": () => send({ type: "DATA_MANAGEMENT.OPEN_REQUESTED" }),
      } satisfies Record<
        Exclude<ProductMenuRouteDestination["id"], "controls" | "settings">,
        () => void
      >

      destinationActions[destination.id]()
    },
    [handleAddCustomValue, openAllValues, send, state],
  )
  const closeInformationPanel = useCallback(
    () => setActiveInformationPanelId(null),
    [],
  )
  const handleUpdateCustomValue = useCallback(
    (valueId: CustomValueId, name: string, definition: string) => {
      send({
        type: "ALL_VALUES.UPDATE_REQUESTED",
        valueId,
        name,
        definition,
      })
    },
    [send],
  )
  const handleResetRequested = useCallback(
    (resetKind: PlayerDataResetKind) => {
      if (resetKind === "delete-all-custom-values")
        return send({ type: "CUSTOM_VALUE.DELETE_ALL_REQUESTED" })
      if (resetKind === "reset-levels-and-experience")
        return send({ type: "RESET.LEVELS_AND_EXPERIENCE_REQUESTED" })
      if (resetKind === "reset-achievements")
        return send({ type: "RESET.ACHIEVEMENTS_REQUESTED" })

      return send({ type: "DELETE_ALL_DATA.REQUESTED" })
    },
    [send],
  )
  const handleResetConfirmed = useCallback(
    (review: PlayerDataResetReview) => {
      const { confirmationId, resetKind } = review
      if (resetKind === "delete-all-custom-values")
        return send({
          type: "CUSTOM_VALUE.DELETE_ALL_CONFIRMED",
          confirmationId,
        })
      if (resetKind === "reset-levels-and-experience")
        return send({
          type: "RESET.LEVELS_AND_EXPERIENCE_CONFIRMED",
          confirmationId,
        })
      if (resetKind === "reset-achievements")
        return send({
          type: "RESET.ACHIEVEMENTS_CONFIRMED",
          confirmationId,
        })

      return send({
        type: "DELETE_ALL_DATA.CONFIRMED",
        confirmationId,
        phrase: DELETE_ALL_DATA_ACKNOWLEDGMENT,
      })
    },
    [send],
  )

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (appState) => {
      const event = createNativeAppLifecycleEvent(appState)
      if (event) {
        setIsProductMenuOpen(false)
        send(event)
      }
    })

    return () => subscription.remove()
  }, [send])

  if (state.matches("Hydrating") || state.matches("LoadingProfile"))
    return <NativePlayerDataLoading />

  if (state.matches("PersistenceFailure")) {
    const recoveryActivity: NativePlayerDataRecoveryActivity | null =
      isReadingImportFile ||
      state.matches({ PersistenceFailure: "PreparingImport" })
        ? localizedCopy.interfaceCopy.portability.activity.checkingBackup
        : state.matches({ PersistenceFailure: "ExportingCurrentData" })
          ? localizedCopy.interfaceCopy.portability.activity.creatingBackup
          : state.matches({ PersistenceFailure: "ExportingEvidence" })
            ? localizedCopy.interfaceCopy.portability.activity
                .creatingDiagnostic
            : state.matches({ PersistenceFailure: "ReplacingPlayerData" })
              ? localizedCopy.interfaceCopy.portability.activity.restoringBackup
              : state.matches({ PersistenceFailure: "DeletingAllData" })
                ? localizedCopy.interfaceCopy.portability.activity.deletingData
                : null
    const issue =
      state.context.portabilityIssue ?? state.context.persistenceIssue
    const hasRecoveryEntries = state.context.recoveryEntries !== null
    const canReturnWithoutNewChanges =
      state.context.persistenceFailureOrigin === "initialization" ||
      state.context.persistenceFailureOrigin === "achievement-presentation"

    if (hasRecoveryEntries)
      return (
        <NativePersistenceFailure
          mode="unreadable-data"
          activity={recoveryActivity}
          hasLastKnownGoodSave={
            state.context.recoveryEntries?.has(
              BATTLE_PROFILE_PRE_IMPORT_BACKUP_KEY,
            ) ?? false
          }
          issue={issue}
          notice={state.context.portabilityNotice}
          pendingImportSource={state.context.pendingRecoveryImportSource}
          preview={state.context.pendingImport?.preview ?? null}
          resetReview={state.context.pendingResetReview}
          onCancelImport={() =>
            send({ type: "RECOVERY.IMPORT_CANCEL_REQUESTED" })
          }
          onCancelReset={() =>
            send({ type: "RECOVERY.DELETE_ALL_CANCEL_REQUESTED" })
          }
          onConfirmImport={() =>
            send({ type: "RECOVERY.IMPORT_CONFIRM_REQUESTED" })
          }
          onConfirmReset={(review) =>
            send({
              type: "RECOVERY.DELETE_ALL_CONFIRMED",
              confirmationId: review.confirmationId,
              phrase: DELETE_ALL_DATA_ACKNOWLEDGMENT,
            })
          }
          onDeleteAllData={() =>
            send({ type: "RECOVERY.DELETE_ALL_REQUESTED" })
          }
          onExportUnreadableData={() =>
            send({ type: "RECOVERY.EXPORT_REQUESTED" })
          }
          onImportBackup={() => void chooseBackup("recovery")}
          onRestoreLastKnownGoodSave={() =>
            send({ type: "RECOVERY.RESTORE_BACKUP_REQUESTED" })
          }
          onTryAgain={() => send({ type: "STORAGE_RECOVERY.RETRY_REQUESTED" })}
        />
      )

    const canExportCurrentData =
      state.context.playerData !== null &&
      state.context.persistenceFailureOrigin !== null &&
      state.context.persistenceFailureOrigin !== "loading"

    return (
      <NativePersistenceFailure
        mode="storage-unavailable"
        hasPendingSave={state.context.pendingBattleProfileCommit !== null}
        activity={recoveryActivity}
        canExportCurrentData={canExportCurrentData}
        canReturnWithoutNewChanges={canReturnWithoutNewChanges}
        issue={issue}
        notice={state.context.portabilityNotice}
        onExportCurrentData={() =>
          send({ type: "STORAGE_RECOVERY.EXPORT_REQUESTED" })
        }
        onTryAgain={() => send({ type: "STORAGE_RECOVERY.RETRY_REQUESTED" })}
        onReturnWithoutNewChanges={() =>
          send({ type: "STORAGE_RECOVERY.RETURN_REQUESTED" })
        }
      />
    )
  }

  if (state.matches("Splash") || state.matches("InitializingProfile"))
    return (
      <NativeIntroduction
        locale={playerData?.settings.locale}
        shouldReduceMotion={resolveShouldReduceMotion(
          playerData?.settings.reducedMotion ?? "system",
          systemShouldReduceMotion,
        )}
        onLocaleChange={(locale) =>
          send({ type: "INTRODUCTION.LOCALE_SELECTED", locale })
        }
        isPending={state.matches("InitializingProfile")}
        notice={state.context.portabilityNotice}
        onComplete={() => send({ type: "INTRODUCTION.COMPLETED" })}
      />
    )

  if (!playerData || !battleProfile || !presentedBattle)
    throw new Error("Battle profile is unavailable after hydration")

  const shouldReduceMotion = resolveShouldReduceMotion(
    playerData.settings.reducedMotion,
    systemShouldReduceMotion,
  )

  const isRecordingAchievementPresentation = state.matches(
    "RecordingAchievementPresentation",
  )
  const isBackgroundCheckpointing = state.matches("BackgroundCheckpointing")
  const achievementPresentationReturnTarget =
    state.context.achievementPresentationReturnTarget
  const backgroundCheckpointReturnTarget =
    state.context.backgroundCheckpointReturnTarget
  const isHubSurface =
    state.matches("Hub") ||
    state.matches("AddingCustomValues") ||
    (isRecordingAchievementPresentation &&
      achievementPresentationReturnTarget === "hub") ||
    (isBackgroundCheckpointing && backgroundCheckpointReturnTarget === "hub")
  const isAchievementsSurface =
    state.matches("Achievements") ||
    (isRecordingAchievementPresentation &&
      achievementPresentationReturnTarget === "achievements") ||
    (isBackgroundCheckpointing &&
      backgroundCheckpointReturnTarget === "achievements")
  const isDataManagementSurface =
    state.matches("DataManagement") ||
    (isBackgroundCheckpointing &&
      backgroundCheckpointReturnTarget === "data-management")
  const isAllValuesSurface =
    state.matches("AllValues") ||
    (isBackgroundCheckpointing &&
      backgroundCheckpointReturnTarget === "all-values")
  const isCrucibleSurface =
    state.matches("Crucible") ||
    (isRecordingAchievementPresentation &&
      achievementPresentationReturnTarget === "crucible") ||
    (isBackgroundCheckpointing &&
      backgroundCheckpointReturnTarget === "crucible")
  const isResultsSurface =
    state.matches("Results") ||
    (isRecordingAchievementPresentation &&
      achievementPresentationReturnTarget === "results") ||
    (isBackgroundCheckpointing &&
      backgroundCheckpointReturnTarget === "results")
  const results =
    isResultsSurface &&
    state.context.battleEntryProfile &&
    state.context.resultsExitProfile
      ? createBattleExitResults(
          state.context.battleEntryProfile,
          state.context.resultsExitProfile,
        )
      : null
  const isSettingsSurface =
    state.matches("Settings") ||
    (isBackgroundCheckpointing &&
      backgroundCheckpointReturnTarget === "settings")
  const achievementBanner = (
    <NativeAchievementBanner
      achievements={pendingAchievementPresentations}
      isAcknowledgementPending={isRecordingAchievementPresentation}
      shouldReduceMotion={shouldReduceMotion}
      onPresented={handleAchievementPresented}
    />
  )
  const activeInformationPanel = activeInformationPanelId
    ? INFORMATION_PANELS[activeInformationPanelId]
    : null
  const reopenedInformationPanel = activeInformationPanel ? (
    <ReopenedNativeInformationPanel
      accessibleCloseLabel={activeInformationPanel.accessibleCloseLabel}
      open
      primaryActionLabel={activeInformationPanel.primaryActionLabel}
      title={activeInformationPanel.title}
      onOpenChange={(open) => {
        if (!open) closeInformationPanel()
      }}
      onPrimaryAction={closeInformationPanel}
    >
      <NativeInformationPanelContent
        informationPanel={activeInformationPanel}
      />
    </ReopenedNativeInformationPanel>
  ) : null
  const controls = isControlsOpen ? (
    <NativeControls open onOpenChange={setIsControlsOpen} />
  ) : null
  const isProductOverlayOpen =
    isProductMenuOpen || activeInformationPanelId !== null || isControlsOpen

  if (state.matches("DressingRoom")) {
    const avatar = state.children.avatar
    if (!avatar) throw new Error("Expected the appearance editor actor")
    return (
      <>
        <NativeDressingRoom
          actor={avatar}
          shouldReduceMotion={shouldReduceMotion}
          onShare={(appearance) =>
            setSharedCard(
              createValuesCardModel(
                rankedValues,
                appearance,
                SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG,
                getLocaleCatalog(playerData.settings.locale),
              ),
            )
          }
        />
        {sharedCard && (
          <NativeValuesCardShare
            model={sharedCard}
            shouldReduceMotion={shouldReduceMotion}
            onClose={() => setSharedCard(null)}
          />
        )}
      </>
    )
  }

  if (isHubSurface)
    return (
      <View className="flex-1">
        <NativeHub
          customValueInvitation={{
            editorRequestId: customValueBuilderRequestId,
            backRequestId: customValueBackRequestId,
            initialName: customValueInitialName,
            deckRevision: battleProfile.scheduler.deckRevision,
            isSaving: state.matches("AddingCustomValues"),
            saveIssue: state.context.persistenceIssue,
            onNavigationBlockedChange: setIsCustomValueDraftActive,
            onClosed: () => setCustomValueBuilderRequestId(0),
            onOpenMatchingValue: (valueId) => openAllValues({ valueId }),
            onApply: (drafts) => {
              setCustomValueBuilderRequestId(0)
              send({ type: "HUB.CUSTOM_VALUES_APPLY_REQUESTED", drafts })
            },
            onExport: async () => {
              const prepared = await prepareWayvmDownload({
                exportedAt: new Date().toISOString(),
                sourceAppVersion: state.context.appVersion,
                sourceBuild: state.context.sourceBuild,
                playerData,
              })
              await expoPlayerDataFileAdapter.exportJson(prepared)
            },
          }}
          notifications={achievementBanner}
          appearance={playerData.appearance}
          onShare={() =>
            setSharedCard(
              createValuesCardModel(
                rankedValues,
                playerData.appearance,
                SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG,
                getLocaleCatalog(playerData.settings.locale),
              ),
            )
          }
          onCustomize={() => send({ type: "AVATAR.OPEN_REQUESTED" })}
          rankedValues={rankedValues}
          runtimeClipCatalog={SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG}
          dataNotice={state.context.portabilityNotice}
          importConfirmation={state.context.importConfirmation}
          shouldReduceMotion={shouldReduceMotion}
          onAddCustomValue={() => handleAddCustomValue()}
          onBrowseAllValues={() => openAllValues({})}
          onOpenAchievements={() =>
            send({ type: "ACHIEVEMENTS.OPEN_REQUESTED" })
          }
          onOpenMenu={() => setIsProductMenuOpen(true)}
          isBattlePending={isBattleRequested}
          onStartBattle={handleStartBattle}
        />
        {sharedCard && (
          <NativeValuesCardShare
            model={sharedCard}
            shouldReduceMotion={shouldReduceMotion}
            onClose={() => setSharedCard(null)}
          />
        )}
        <NativeProductMenu
          contextActionLabel={PRODUCT_MENU_COPY.closeAction}
          open={isProductMenuOpen}
          onDestinationSelect={handleProductMenuDestinationSelect}
          onOpenChange={setIsProductMenuOpen}
        />
        {reopenedInformationPanel}
        {controls}
      </View>
    )

  if (isAchievementsSurface)
    return (
      <View className="flex-1">
        <NativeAchievements
          achievements={achievementPresentations}
          canClose={state.matches("Achievements")}
          notifications={achievementBanner}
          onClose={() => send({ type: "ACHIEVEMENTS.CLOSE_REQUESTED" })}
        />
        <NativeProductMenu
          contextActionLabel={PRODUCT_MENU_COPY.closeAction}
          open={isProductMenuOpen}
          onDestinationSelect={handleProductMenuDestinationSelect}
          onOpenChange={setIsProductMenuOpen}
        />
        {reopenedInformationPanel}
        {controls}
      </View>
    )

  if (isResultsSurface && results)
    return (
      <View className="flex-1">
        <NativeResults
          notifications={achievementBanner}
          openedAt={state.context.resultsOpenedAt}
          areRowPositionsSettled={state.context.resultsPositionsSettled}
          isPresentationComplete={state.context.resultsPresentationComplete}
          onSettleRowPositions={() =>
            send({ type: "RESULTS.POSITIONS_SETTLED" })
          }
          onPresentationCompleted={() =>
            send({ type: "RESULTS.PRESENTATION_COMPLETED" })
          }
          results={results}
          runtimeClipCatalog={SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG}
          shouldReduceMotion={shouldReduceMotion}
          onOpenMenu={() => setIsProductMenuOpen(true)}
          onSeeValues={() => send({ type: "RESULTS.CLOSE_REQUESTED" })}
          onKeepBattling={() =>
            send({ type: "RESULTS.KEEP_BATTLING_REQUESTED" })
          }
        />
        <NativeProductMenu
          contextActionLabel={PRODUCT_MENU_COPY.closeAction}
          open={isProductMenuOpen}
          onDestinationSelect={handleProductMenuDestinationSelect}
          onOpenChange={setIsProductMenuOpen}
        />
        {reopenedInformationPanel}
        {controls}
      </View>
    )

  if (isSettingsSurface) {
    const activity =
      state.matches({ Settings: "Persisting" }) || isBackgroundCheckpointing
        ? PLAYER_SETTINGS_COPY.savingStatus
        : state.matches({ Settings: "ExportingResetBackup" })
          ? localizedCopy.interfaceCopy.portability.activity.creatingBackup
          : state.matches({ Settings: "ApplyingScopedReset" })
            ? localizedCopy.interfaceCopy.portability.activity.applyingReset
            : state.matches({ Settings: "DeletingAllData" })
              ? localizedCopy.interfaceCopy.portability.activity.deletingData
              : null

    return (
      <View className="flex-1">
        <NativeSettings
          activity={activity}
          customValueCount={battleProfile.activeDeck.customValues.length}
          isNavigationPending={isBackgroundCheckpointing}
          issue={
            state.context.portabilityIssue ?? state.context.persistenceIssue
          }
          notice={state.context.portabilityNotice}
          resetReview={state.context.pendingResetReview}
          settings={playerData.settings}
          onCancelReset={() =>
            send({ type: "DATA_MANAGEMENT.RESET_CANCEL_REQUESTED" })
          }
          onClose={() => send({ type: "SETTINGS.CLOSE_REQUESTED" })}
          onConfirmReset={handleResetConfirmed}
          onExport={() => send({ type: "DATA_MANAGEMENT.EXPORT_REQUESTED" })}
          onOpenMenu={() => setIsProductMenuOpen(true)}
          onRequestReset={handleResetRequested}
          onUpdateSettings={(settings) =>
            send({ type: "SETTINGS.UPDATE_REQUESTED", settings })
          }
        />
        <NativeProductMenu
          contextActionLabel={PRODUCT_MENU_COPY.closeAction}
          open={isProductMenuOpen}
          onDestinationSelect={handleProductMenuDestinationSelect}
          onOpenChange={setIsProductMenuOpen}
        />
        {reopenedInformationPanel}
        {controls}
      </View>
    )
  }

  if (isDataManagementSurface) {
    const activity: NativeDataManagementActivity | null =
      isReadingImportFile ||
      state.matches({ DataManagement: "PreparingImport" })
        ? localizedCopy.interfaceCopy.portability.activity.checkingBackup
        : state.matches({ DataManagement: "Exporting" }) ||
            state.matches({ DataManagement: "ExportingResetBackup" })
          ? localizedCopy.interfaceCopy.portability.activity.creatingBackup
          : state.matches({ DataManagement: "CreatingPreImportBackup" })
            ? localizedCopy.interfaceCopy.portability.activity
                .creatingSafetyBackup
            : state.matches({ DataManagement: "ReplacingImport" })
              ? localizedCopy.interfaceCopy.portability.activity.restoringBackup
              : state.matches({ DataManagement: "ApplyingScopedReset" })
                ? localizedCopy.interfaceCopy.portability.activity.applyingReset
                : state.matches({ DataManagement: "DeletingAllData" })
                  ? localizedCopy.interfaceCopy.portability.activity
                      .deletingData
                  : null

    return (
      <View className="flex-1">
        <NativeDataManagement
          activity={activity}
          customValueCount={battleProfile.activeDeck.customValues.length}
          isNavigationPending={isBackgroundCheckpointing}
          issue={state.context.portabilityIssue}
          notice={state.context.portabilityNotice}
          preview={state.context.pendingImport?.preview ?? null}
          resetReview={state.context.pendingResetReview}
          onCancelImport={() =>
            send({ type: "DATA_MANAGEMENT.IMPORT_CANCEL_REQUESTED" })
          }
          onCancelReset={() =>
            send({ type: "DATA_MANAGEMENT.RESET_CANCEL_REQUESTED" })
          }
          onChooseBackup={() => void chooseBackup("data-management")}
          onClose={() => send({ type: "DATA_MANAGEMENT.CLOSE_REQUESTED" })}
          onConfirmImport={() =>
            send({ type: "DATA_MANAGEMENT.IMPORT_CONFIRM_REQUESTED" })
          }
          onConfirmReset={handleResetConfirmed}
          onExport={() => send({ type: "DATA_MANAGEMENT.EXPORT_REQUESTED" })}
          onOpenMenu={() => setIsProductMenuOpen(true)}
          onRequestReset={handleResetRequested}
        />
        <NativeProductMenu
          contextActionLabel={PRODUCT_MENU_COPY.closeAction}
          open={isProductMenuOpen}
          onDestinationSelect={handleProductMenuDestinationSelect}
          onOpenChange={setIsProductMenuOpen}
        />
        {reopenedInformationPanel}
        {controls}
      </View>
    )
  }

  if (isAllValuesSurface)
    return (
      <View className="flex-1">
        <NativeAllValues
          runtimeClipCatalog={SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG}
          shouldReduceMotion={shouldReduceMotion}
          backRequestId={allValuesBackRequestId}
          localization={getLocaleCatalog(playerData.settings.locale)}
          key={battleProfile.scheduler.deckRevision}
          initialValueId={pendingAllValuesValueId}
          isPersistencePending={
            isBackgroundCheckpointing ||
            state.matches({ AllValues: "Persisting" })
          }
          persistenceIssue={state.context.persistenceIssue}
          rankedValues={rankedValues}
          onAddCustomValue={handleAddCustomValue}
          onClose={() => send({ type: "ALL_VALUES.CLOSE_REQUESTED" })}
          onOpenMenu={() => setIsProductMenuOpen(true)}
          onNavigationBlockedChange={setIsAllValuesNavigationBlocked}
          onDeleteCustomValue={(valueId) =>
            send({ type: "ALL_VALUES.DELETE_REQUESTED", valueId })
          }
          onUpdateCustomValue={handleUpdateCustomValue}
        />
        <NativeProductMenu
          contextActionLabel={PRODUCT_MENU_COPY.closeAction}
          open={isProductMenuOpen}
          onDestinationSelect={handleProductMenuDestinationSelect}
          onOpenChange={setIsProductMenuOpen}
        />
        {reopenedInformationPanel}
        {controls}
      </View>
    )

  if (isCrucibleSurface) {
    const isBattleReady = state.matches({ Crucible: "Ready" })

    return (
      <View className="flex-1">
        <NativeCrucible
          animationSpeed={
            state.context.pendingPlayerSettings?.battleAnimationSpeed ??
            playerData.settings.battleAnimationSpeed
          }
          onAnimationSpeedChange={(speed) =>
            send({ type: "BATTLE.SPEED_CHANGE_REQUESTED", speed })
          }
          activeDeck={battleProfile.activeDeck}
          achievements={pendingAchievementPresentations}
          battle={presentedBattle}
          runtimeClipCatalog={SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG}
          progressById={battleProfile.progressById}
          canUndo={battleProfile.history.length > 0}
          canRedo={battleProfile.redo.length > 0}
          controlHintPreference={playerData.settings.controlHints}
          isAchievementAcknowledgementPending={
            isRecordingAchievementPresentation
          }
          isMenuOpen={isProductOverlayOpen}
          isPersistencePending={!isBattleReady}
          shouldReduceMotion={shouldReduceMotion}
          onAchievementPresented={handleAchievementPresented}
          onExit={() => send({ type: "BATTLE.EXIT_REQUESTED" })}
          onOpenMenu={() => setIsProductMenuOpen(true)}
          onUndo={() => send({ type: "BATTLE.UNDO_REQUESTED" })}
          onRedo={() => send({ type: "BATTLE.REDO_REQUESTED" })}
          onWinnerSelected={handleWinnerSelected}
        />
        <NativeProductMenu
          contextActionLabel={PRODUCT_MENU_COPY.resumeBattleAction}
          open={isProductMenuOpen}
          onDestinationSelect={handleProductMenuDestinationSelect}
          onOpenChange={setIsProductMenuOpen}
        />
        {reopenedInformationPanel}
        {controls}
      </View>
    )
  }

  throw new Error(
    `Unsupported native root state: ${JSON.stringify(state.value)}`,
  )
}
