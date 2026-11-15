"use client"

import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { findRankedValueNameMatches } from "@game/data/src/ValueSearch"
import type { CustomValueInvitationParts } from "@game/ui/src/CustomValueInvitationParts"

type MatchingParts<PlatformAsset> = Pick<
  CustomValueInvitationParts<PlatformAsset>,
  "MatchingValues" | "MatchingRow" | "Heading" | "DraftList"
>

export default function CustomValueMatches<PlatformAsset>({
  rankedValues,
  name,
  runtimeClipCatalog,
  shouldReduceMotion,
  parts,
}: {
  rankedValues: readonly RankedValue[]
  name: string
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<PlatformAsset>
  shouldReduceMotion: boolean
  parts: MatchingParts<PlatformAsset>
}) {
  const localization = useLocaleCatalog()
  const matches = findRankedValueNameMatches(
    rankedValues,
    name,
    localization.values,
  )
  const { MatchingValues, MatchingRow, Heading, DraftList } = parts
  if (matches.length === 0) return null
  return (
    <MatchingValues
      label={localization.interfaceCopy.screen.matchingValues}
      className="mt-3 min-w-0"
    >
      <Heading className="text-mapache-vivid-dark mb-2 text-base font-black">
        {localization.interfaceCopy.screen.matchingValues}
      </Heading>
      <DraftList className="flex min-w-0 flex-col">
        {matches.map((value) => (
          <MatchingRow
            key={value.definition.id}
            value={value}
            runtimeClipCatalog={runtimeClipCatalog}
            shouldReduceMotion={shouldReduceMotion}
          />
        ))}
      </DraftList>
    </MatchingValues>
  )
}
