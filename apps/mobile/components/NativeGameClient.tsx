import {
  INFORMATION_PANELS,
  type InformationPanelId,
} from "@game/data/src/InformationPanels"
import {
  PRODUCT_MENU_COPY,
  type ProductMenuDestination,
  type ProductMenuRouteDestination,
} from "@game/data/src/ProductMenu"
import type { CustomValueId, ValueId } from "@game/data/src/Value"
import { rankValues } from "@game/data/src/ValueRanking"
import { createValuesCardModel, type ValuesCardModel } from "@game/data/src/ValuesCard"
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
import {
  DELETE_ALL_DATA_ACKNOWLEDGMENT,
  type PlayerDataResetKind,
  type PlayerDataResetReview,
} from "@game/machines/src/PlayerDataReset"
import {
  PLAYER_SETTINGS_COPY,
  resolveShouldReduceMotion,
} from "@game/machines/src/PlayerSettingsPresentation"
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
  const systemShouldReduceMotion = useReducedMotion()
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false)
  const [isControlsOpen, setIsControlsOpen] = useState(false)
  const [activeInformationPanelId, setActiveInformationPanelId] =
    useState<InformationPanelId | null>(null)
  const [pendingAllValuesValueId, setPendingAllValuesValueId] =
    useState<ValueId | null>(null)
  const [shouldOpenCustomValueBuilder, setShouldOpenCustomValueBuilder] =
    useState(false)
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
            achievementState: playerData.achievements,
            battleProfile: playerData.profile,
          })
        : [],
    [playerData],
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
  const [sharedCard, setSharedCard] = useState<ValuesCardModel<number> | null>(null)
  const [isAllValuesNavigationBlocked, setIsAllValuesNavigationBlocked] =
    useState(false)
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
        if (isAllValuesNavigationBlocked || isReadingImportFile) return true
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
    !isControlsOpen
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
    ({
      valueId = null,
      openCustomValueBuilder = false,
    }: {
      readonly valueId?: ValueId | null
      readonly openCustomValueBuilder?: boolean
    }) => {
      setPendingAllValuesValueId(valueId)
      setShouldOpenCustomValueBuilder(openCustomValueBuilder)
      if (openCustomValueBuilder)
        setCustomValueBuilderRequestId((requestId) => requestId + 1)
      send({ type: "ALL_VALUES.OPEN_REQUESTED" })
    },
    [send],
  )
  const handleAddCustomValue = useCallback(
    (name: string, definition: string) => {
      setShouldOpenCustomValueBuilder(false)
      send({ type: "ALL_VALUES.ADD_REQUESTED", name, definition })
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
        "custom-values": () => openAllValues({ openCustomValueBuilder: true }),
        achievements: () => send({ type: "ACHIEVEMENTS.OPEN_REQUESTED" }),
        "import-export": () => send({ type: "DATA_MANAGEMENT.OPEN_REQUESTED" }),
      } satisfies Record<
        Exclude<ProductMenuRouteDestination["id"], "controls" | "settings">,
        () => void
      >

      destinationActions[destination.id]()
    },
    [openAllValues, send, state],
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
        ? "Checking backup…"
        : state.matches({ PersistenceFailure: "ExportingCurrentData" })
          ? "Creating backup…"
          : state.matches({ PersistenceFailure: "ExportingEvidence" })
            ? "Creating diagnostic file…"
            : state.matches({ PersistenceFailure: "ReplacingPlayerData" })
              ? "Restoring backup…"
              : state.matches({ PersistenceFailure: "DeletingAllData" })
                ? "Deleting data…"
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
        onShare={(appearance) => setSharedCard(createValuesCardModel(rankedValues, appearance, SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG))}
      />
      {sharedCard && <NativeValuesCardShare model={sharedCard} shouldReduceMotion={shouldReduceMotion} onClose={() => setSharedCard(null)} />}
      </>
    )
  }

  if (isHubSurface)
    return (
      <View className="flex-1">
        <NativeHub
          appearance={playerData.appearance}
          onShare={() => setSharedCard(createValuesCardModel(rankedValues, playerData.appearance, SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG))}
          onCustomize={() => send({ type: "AVATAR.OPEN_REQUESTED" })}
          rankedValues={rankedValues}
          runtimeClipCatalog={SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG}
          dataNotice={state.context.portabilityNotice}
          shouldReduceMotion={shouldReduceMotion}
          onAddCustomValue={() =>
            openAllValues({ openCustomValueBuilder: true })
          }
          onBrowseAllValues={() => openAllValues({})}
          onOpenMenu={() => setIsProductMenuOpen(true)}
          isBattlePending={isBattleRequested}
          onStartBattle={handleStartBattle}
        />
        {sharedCard && <NativeValuesCardShare model={sharedCard} shouldReduceMotion={shouldReduceMotion} onClose={() => setSharedCard(null)} />}
        <NativeProductMenu
          contextActionLabel={PRODUCT_MENU_COPY.closeAction}
          open={isProductMenuOpen}
          onDestinationSelect={handleProductMenuDestinationSelect}
          onOpenChange={setIsProductMenuOpen}
        />
        {reopenedInformationPanel}
        {controls}
        {achievementBanner}
      </View>
    )

  if (isAchievementsSurface)
    return (
      <View className="flex-1">
        <NativeAchievements
          achievements={achievementPresentations}
          canOpenMenu={state.matches("Achievements")}
          onClose={() => send({ type: "ACHIEVEMENTS.CLOSE_REQUESTED" })}
          onOpenMenu={() => setIsProductMenuOpen(true)}
        />
        <NativeProductMenu
          contextActionLabel={PRODUCT_MENU_COPY.closeAction}
          open={isProductMenuOpen}
          onDestinationSelect={handleProductMenuDestinationSelect}
          onOpenChange={setIsProductMenuOpen}
        />
        {reopenedInformationPanel}
        {controls}
        {achievementBanner}
      </View>
    )

  if (isResultsSurface && results)
    return (
      <View className="flex-1">
        <NativeResults
          openedAt={state.context.resultsOpenedAt}
          results={results}
          runtimeClipCatalog={SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG}
          shouldReduceMotion={shouldReduceMotion}
          isMenuOpen={isProductOverlayOpen}
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
        {achievementBanner}
      </View>
    )

  if (isSettingsSurface) {
    const activity =
      state.matches({ Settings: "Persisting" }) || isBackgroundCheckpointing
        ? PLAYER_SETTINGS_COPY.savingStatus
        : state.matches({ Settings: "ExportingResetBackup" })
          ? "Creating backup…"
          : state.matches({ Settings: "ApplyingScopedReset" })
            ? "Applying reset…"
            : state.matches({ Settings: "DeletingAllData" })
              ? "Deleting data…"
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
        ? "Checking backup…"
        : state.matches({ DataManagement: "Exporting" }) ||
            state.matches({ DataManagement: "ExportingResetBackup" })
          ? "Creating backup…"
          : state.matches({ DataManagement: "CreatingPreImportBackup" })
            ? "Creating safety backup…"
            : state.matches({ DataManagement: "ReplacingImport" })
              ? "Restoring backup…"
              : state.matches({ DataManagement: "ApplyingScopedReset" })
                ? "Applying reset…"
                : state.matches({ DataManagement: "DeletingAllData" })
                  ? "Deleting data…"
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
          key={`${battleProfile.scheduler.deckRevision}:${customValueBuilderRequestId}`}
          initialValueId={pendingAllValuesValueId}
          isPersistencePending={
            isBackgroundCheckpointing ||
            state.matches({ AllValues: "Persisting" })
          }
          openCustomValueBuilder={shouldOpenCustomValueBuilder}
          persistenceIssue={state.context.persistenceIssue}
          rankedValues={rankedValues}
          onAddCustomValue={handleAddCustomValue}
          onClose={() => send({ type: "ALL_VALUES.CLOSE_REQUESTED" })}
          onNavigationBlockedChange={setIsAllValuesNavigationBlocked}
          onDeleteCustomValue={(valueId) =>
            send({ type: "ALL_VALUES.DELETE_REQUESTED", valueId })
          }
          onOpenMenu={() => setIsProductMenuOpen(true)}
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
