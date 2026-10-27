"use client"

import {
  resolveLocale,
  type SupportedLocale,
} from "@game/data/src/LocaleRegistry"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { inspectBattleProfileStore } from "@game/machines/src/BattleProfileHydration"
import type { DurableStoreAdapter } from "@game/machines/src/DurableStoreAdapter"
import { prepareWayvmDownload } from "@game/machines/src/PlayerDataPortabilityActors"
import LocaleProvider from "@game/utils/src/LocaleContext"
import { useCallback, useEffect, useState } from "react"
import PlayerDataLoading from "@/components/PlayerDataLoading"
import WebWriterConflict from "@/components/WebWriterConflict"
import { downloadPlayerDataFile } from "@/lib/PlayerDataFiles"
import packageMetadata from "@/package.json"

const SOURCE_APP_VERSION = packageMetadata.version
const SOURCE_BUILD =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "development"

export default function ReadOnlyGameClient({
  durableStore,
  routeLocale,
}: {
  readonly durableStore: DurableStoreAdapter
  readonly routeLocale?: SupportedLocale
}) {
  const [locale, setLocale] = useState<SupportedLocale | null>(null)
  useEffect(() => {
    let isCurrent = true
    const fallback = resolveLocale({
      routeLocale,
      preferredLanguages: navigator.languages,
    })
    void inspectBattleProfileStore({
      store: durableStore,
      appVersion: SOURCE_APP_VERSION,
    })
      .then((inspection) => {
        if (isCurrent)
          setLocale(
            inspection.status === "ready"
              ? inspection.state.head.playerData.settings.locale
              : fallback,
          )
      })
      .catch(() => {
        if (isCurrent) setLocale(fallback)
      })
    return () => {
      isCurrent = false
    }
  }, [durableStore, routeLocale])

  if (locale === null) return <PlayerDataLoading />
  return (
    <LocaleProvider locale={locale}>
      <div lang={getLocaleCatalog(locale).metadata.languageTag}>
        <ReadOnlyRecovery durableStore={durableStore} />
      </div>
    </LocaleProvider>
  )
}

function ReadOnlyRecovery({
  durableStore,
}: {
  readonly durableStore: DurableStoreAdapter
}) {
  const localizedCopy = useLocaleCatalog()
  const playerDataPortabilityCopy = localizedCopy.interfaceCopy.portability

  const [isExportPending, setIsExportPending] = useState(false)
  const [issue, setIssue] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const handleExportThisTab = useCallback(async () => {
    setIsExportPending(true)
    setIssue(null)
    setNotice(null)

    try {
      const inspection = await inspectBattleProfileStore({
        store: durableStore,
        appVersion: SOURCE_APP_VERSION,
      })
      if (inspection.status !== "ready") {
        setIssue(playerDataPortabilityCopy.exportFailure)
        return
      }

      const preparedDownload = await prepareWayvmDownload({
        exportedAt: new Date().toISOString(),
        sourceAppVersion: SOURCE_APP_VERSION,
        sourceBuild: SOURCE_BUILD,
        playerData: inspection.state.head.playerData,
      })
      downloadPlayerDataFile(preparedDownload)
      setNotice(playerDataPortabilityCopy.exportSuccess)
    } catch {
      setIssue(playerDataPortabilityCopy.exportFailure)
    } finally {
      setIsExportPending(false)
    }
  }, [
    durableStore,
    playerDataPortabilityCopy.exportFailure,
    playerDataPortabilityCopy.exportSuccess,
  ])

  return (
    <WebWriterConflict
      isExportPending={isExportPending}
      issue={issue}
      notice={notice}
      onExportThisTab={() => void handleExportThisTab()}
      onLoadLatest={() => window.location.reload()}
    />
  )
}
