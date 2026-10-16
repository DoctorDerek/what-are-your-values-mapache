import {
  getLocaleCatalog,
  type LocalizationCatalog,
} from "@game/data/src/LocalizationCatalog"
import { getErrorMessage } from "@game/utils/src/Errors"
import { BATTLE_PROFILE_CHECKPOINT_SCHEMA_VERSION } from "./BattleProfileCheckpoint"
import { WAYVM_EXPORT_FORMAT_VERSION } from "./WayvmExport"

const unsupportedVersionPattern =
  /^Unsupported (export format|save schema) version: (\d+)$/u

function isUnsafeImportIssue(issue: string) {
  return (
    issue.startsWith("Persisted JSON exceeds") ||
    issue === "Persisted JSON contains an unsafe number"
  )
}

export function getWayvmImportValidationIssue(
  error: unknown,
  localization: LocalizationCatalog = getLocaleCatalog(),
) {
  const playerDataPortabilityCopy = localization.interfaceCopy.portability
  const issue = getErrorMessage(error)
  const unsupportedVersion = unsupportedVersionPattern.exec(issue)

  if (unsupportedVersion) {
    const candidateVersion = Number(unsupportedVersion[2])
    const supportedVersion =
      unsupportedVersion[1] === "export format"
        ? WAYVM_EXPORT_FORMAT_VERSION
        : BATTLE_PROFILE_CHECKPOINT_SCHEMA_VERSION

    return candidateVersion > supportedVersion
      ? playerDataPortabilityCopy.importNewer
      : playerDataPortabilityCopy.importUnsupported
  }

  if (issue.startsWith("Unsupported"))
    return playerDataPortabilityCopy.importUnsupported

  if (isUnsafeImportIssue(issue)) return playerDataPortabilityCopy.importUnsafe

  return playerDataPortabilityCopy.importInvalid
}
