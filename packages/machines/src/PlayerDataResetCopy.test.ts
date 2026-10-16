import {
  playerDataResetBackupReadyNotice,
  playerDataResetCopy,
} from "@game/data/src/PlayerDataResetCopy"
import { describe, expect, it } from "vitest"

describe("Player Data Reset Copy", () => {
  it("defines one exact scope-specific contract for every destructive action", () => {
    expect(Object.keys(playerDataResetCopy)).toEqual([
      "delete-all-custom-values",
      "reset-levels-and-experience",
      "reset-achievements",
      "delete-all-data",
    ])
    expect(
      playerDataResetCopy["delete-all-custom-values"].confirmationBody,
    ).toContain(
      "This cannot be undone after you confirm. Export your data first if you may want it later.",
    )
    expect(
      playerDataResetCopy["reset-levels-and-experience"].confirmationBody,
    ).toContain("Your value ranking starts over with all values tied.")
    expect(
      playerDataResetCopy["reset-achievements"].confirmationBody,
    ).toContain(
      "After reset, achievements require new qualifying progress. A milestone you already reached does not unlock again just because you reset achievements. Use Reset Levels & Experience too if you want to earn level milestones again from the beginning.",
    )
    expect(playerDataResetCopy["delete-all-data"].confirmationBody).toContain(
      "You will return to Introduction. This does not uninstall the app or remove the offline program files needed to open it. This cannot be undone. Export your data first if you may want it later.",
    )
    expect(playerDataResetBackupReadyNotice).toBe(
      "Your private backup is ready. Review the reset when you are ready.",
    )
  })
})
