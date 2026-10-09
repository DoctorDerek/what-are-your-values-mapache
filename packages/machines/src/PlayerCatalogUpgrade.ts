import { CANONICAL_CATALOG_VERSION } from "@game/data/src/Value"
import { applyDeckRevision } from "./BattleProfile"
import { createDeckRevisionEvent } from "./BattleProfileEvent"
import { applyBattleProfileEventToPlayerData } from "./BattleProfileJournal"
import type { PlayerData } from "./PlayerData"

export function getPlayerCatalogUpgradeEvent(playerData: PlayerData) {
  const { profile } = playerData
  if (profile.activeDeck.catalogVersion === CANONICAL_CATALOG_VERSION)
    return null

  return createDeckRevisionEvent(
    applyDeckRevision({
      profile,
      revisedCustomValues: profile.activeDeck.customValues,
      catalogVersion: CANONICAL_CATALOG_VERSION,
    }),
  )
}

export function upgradePlayerDataCatalog({
  playerData,
  upgradedAt,
}: {
  readonly playerData: PlayerData
  readonly upgradedAt: string
}): PlayerData {
  const event = getPlayerCatalogUpgradeEvent(playerData)
  return event
    ? applyBattleProfileEventToPlayerData({
        playerData,
        event,
        occurredAt: upgradedAt,
      })
    : playerData
}
