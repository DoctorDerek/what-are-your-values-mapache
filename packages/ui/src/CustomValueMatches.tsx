"use client"

import {
  createSeethingSwarmAnimalPresentationGeometry,
  resolveValueAnimalPresentation,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
  type ActiveValueDefinition,
} from "@game/data/src/Value"
import { getWrappableValueDisplayName } from "@game/data/src/ValueNameTypography"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { findRankedValueNameMatches } from "@game/data/src/ValueSearch"
import type { CustomValueInvitationParts } from "@game/ui/src/CustomValueInvitationParts"
import { cx } from "classix"
import { useState } from "react"

type MatchingParts<PlatformAsset> = Pick<
  CustomValueInvitationParts<PlatformAsset>,
  | "MatchingValues"
  | "MatchingAnimal"
  | "Heading"
  | "DraftList"
  | "Draft"
  | "DraftTitle"
  | "DraftDefinition"
  | "ActionRow"
>

function MatchingValue<PlatformAsset>({
  definition,
  runtimeClipCatalog,
  shouldReduceMotion,
  parts,
}: {
  definition: ActiveValueDefinition
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<PlatformAsset>
  shouldReduceMotion: boolean
  parts: MatchingParts<PlatformAsset>
}) {
  const localization = useLocaleCatalog()
  const [failedPath, setFailedPath] = useState<string | null>(null)
  const presentation = resolveValueAnimalPresentation(
    definition,
    runtimeClipCatalog,
  )
  const { Draft, DraftTitle, DraftDefinition, ActionRow, MatchingAnimal } =
    parts
  return (
    <Draft className="min-w-0 border-t border-black/20 py-3">
      <ActionRow className="flex min-w-0 flex-row flex-wrap items-center gap-x-3 gap-y-1">
        {presentation.kind === "animal" && (
          <ActionRow
            className={cx(
              "shrink-0",
              failedPath === presentation.clip.relativePath && "opacity-0",
            )}
          >
            <MatchingAnimal
              clip={presentation.clip}
              geometry={createSeethingSwarmAnimalPresentationGeometry(
                presentation.animal.referencePose,
                [presentation.clip],
              )}
              playbackMode="static"
              shouldReduceMotion={shouldReduceMotion}
              onLoadError={() => setFailedPath(presentation.clip.relativePath)}
            />
          </ActionRow>
        )}
        <DraftTitle
          accessibilityLabel={getValueDisplayName(
            definition,
            localization.values,
          )}
          className="text-mapache-vivid-dark min-w-0 grow basis-32 text-base leading-snug font-black wrap-anywhere hyphens-manual"
        >
          {getWrappableValueDisplayName(
            definition,
            localization.values,
            localization.metadata.languageTag,
          )}
        </DraftTitle>
      </ActionRow>
      <DraftDefinition className="text-mapache-vivid-dark mt-1 text-base leading-relaxed wrap-anywhere">
        “{getValueDisplayDefinition(definition, localization.values)}”
      </DraftDefinition>
    </Draft>
  )
}

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
  const { MatchingValues, Heading, DraftList } = parts
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
        {matches.map(({ definition }) => (
          <MatchingValue
            key={definition.id}
            definition={definition}
            runtimeClipCatalog={runtimeClipCatalog}
            shouldReduceMotion={shouldReduceMotion}
            parts={parts}
          />
        ))}
      </DraftList>
    </MatchingValues>
  )
}
