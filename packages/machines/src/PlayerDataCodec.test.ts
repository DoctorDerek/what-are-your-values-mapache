import { describe, expect, it } from "vitest"
import { DEFAULT_HEROES99_APPEARANCE } from "@game/data/src/Heroes99Appearance"
import { createPlayerData } from "./PlayerData"
import { createInitialPlayerData } from "./PlayerData"
import { decodePlayerData, encodePlayerData } from "./PlayerDataCodec"

describe("Player Data Codec", () => {
  it("migrates the released five-field payload without changing its legacy bytes", () => {
    const original = createInitialPlayerData({ schedulerSeed: "legacy-appearance", createdAt: "2026-07-29T00:00:00.000Z" })
    const legacy = encodePlayerData(original, 1)
    const migrated = decodePlayerData(legacy)
    expect(migrated.appearance).toEqual(DEFAULT_HEROES99_APPEARANCE)
    expect(encodePlayerData(migrated, 1)).toEqual(legacy)
    const customized = createPlayerData({ ...migrated, appearance: { ...migrated.appearance, hairStyle: null, weaponStyle: "dagger", weaponPalette: 4 } })
    expect(decodePlayerData(encodePlayerData(customized))).toEqual(customized)
  })
  it("round-trips one complete canonical player-owned payload", () => {
    const playerData = createInitialPlayerData({
      schedulerSeed: "player-data-codec-seed",
      createdAt: "2026-07-29T00:00:00.000Z",
    })

    expect(decodePlayerData(encodePlayerData(playerData))).toEqual(playerData)
  })

  it("rejects unsupported versions and malformed generation timestamps", () => {
    const encoded = encodePlayerData(
      createInitialPlayerData({
        schedulerSeed: "invalid-player-data-codec-seed",
        createdAt: "2026-07-29T00:00:00.000Z",
      }),
    )

    expect(() => decodePlayerData([3, ...encoded.slice(1)])).toThrow(
      "Unsupported Player Data codec version",
    )
    expect(() =>
      decodePlayerData([...encoded.slice(0, 4), "2026-07-29", ...encoded.slice(5)]),
    ).toThrow("Invalid Progress generation start timestamp")
  })

  it("rejects noncanonical tuple representations", () => {
    const encoded = encodePlayerData(
      createInitialPlayerData({
        schedulerSeed: "noncanonical-player-data-codec-seed",
        createdAt: "2026-07-29T00:00:00.000Z",
      }),
    )

    expect(() => decodePlayerData([...encoded, null])).toThrow(
      "Invalid Player Data",
    )
  })

  it("rejects executable array representations that alter canonical JSON", () => {
    const encoded = [
      ...encodePlayerData(
        createInitialPlayerData({
          schedulerSeed: "executable-player-data-codec-seed",
          createdAt: "2026-07-29T00:00:00.000Z",
        }),
      ),
    ]
    Object.defineProperty(encoded, "toJSON", {
      value: () => ["altered-player-data"],
    })

    expect(() => decodePlayerData(encoded)).toThrow(
      "Player Data encoding is not canonical",
    )
  })
})
