import { useEffect, useState } from "react"

export type BattleEntryRequestOptions = {
  isHubReady: boolean
  isShareOpen: boolean
  isCustomValueDraftActive: boolean
  isProductMenuOpen: boolean
  isInformationPanelOpen: boolean
  isControlsOpen: boolean
  isBattlePrepared: boolean
  send: (event: { type: "BATTLE.START_REQUESTED" }) => void
}

export default function useBattleEntryRequest({
  isHubReady,
  isShareOpen,
  isCustomValueDraftActive,
  isProductMenuOpen,
  isInformationPanelOpen,
  isControlsOpen,
  isBattlePrepared,
  send,
}: BattleEntryRequestOptions) {
  const [isBattleRequested, setIsBattleRequested] = useState(false)
  const canAwaitBattle =
    isHubReady &&
    !isShareOpen &&
    !isCustomValueDraftActive &&
    !isProductMenuOpen &&
    !isInformationPanelOpen &&
    !isControlsOpen

  if (isBattleRequested && !canAwaitBattle) setIsBattleRequested(false)
  useEffect(() => {
    if (isBattleRequested && canAwaitBattle && isBattlePrepared) {
      send({ type: "BATTLE.START_REQUESTED" })
    }
  }, [isBattleRequested, isBattlePrepared, canAwaitBattle, send])

  return {
    isBattleRequested,
    requestBattle: () => {
      if (isBattlePrepared) send({ type: "BATTLE.START_REQUESTED" })
      else setIsBattleRequested((previous) => !previous)
    },
  }
}
