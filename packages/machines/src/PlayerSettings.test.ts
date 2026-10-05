import { describe, expect, it } from "vitest"
import {
  createInitialPlayerSettings,
  createPlayerSettings,
  decodePlayerSettings,
  encodePlayerSettings,
} from "./PlayerSettings"

describe("Player Settings", () => {
  it("creates the truthful launch defaults", () => {
    expect(createInitialPlayerSettings()).toEqual({
      locale: "en",
      reducedMotion: "system",
      controlHints: "auto",
      battleAnimationSpeed: "1x",
    })
  })

  it("round-trips every supported setting choice", () => {
    const settings = createPlayerSettings({
      locale: "en",
      reducedMotion: "off",
      controlHints: "always",
    })

    expect(decodePlayerSettings(encodePlayerSettings(settings))).toEqual(
      settings,
    )
  })

  it.each([
    {
      index: 0,
      value: 99,
      issue: "Unsupported Player Settings codec version",
    },
    { index: 1, value: "es", issue: "Unsupported locale" },
    {
      index: 2,
      value: "sometimes",
      issue: "Unsupported reduced-motion preference",
    },
    {
      index: 3,
      value: "keyboard",
      issue: "Unsupported control-hint preference",
    },
  ])(
    "rejects unsupported persisted settings at tuple index $index",
    ({ index, value, issue }) => {
      const encoded = [...encodePlayerSettings(createInitialPlayerSettings())]
      encoded[index] = value

      expect(() => decodePlayerSettings(encoded)).toThrow(issue)
    },
  )

  it("rejects noncanonical tuple representations", () => {
    expect(() =>
      decodePlayerSettings([1, "en", "system", "auto", null]),
    ).toThrow("Invalid Player Settings")
  })
  it("preserves legacy encodings and round-trips every Battle mode", () => {
    expect(encodePlayerSettings(createInitialPlayerSettings())).toEqual([
      1,
      "en",
      "system",
      "auto",
    ])
    expect(
      decodePlayerSettings([1, "en", "system", "auto"]).battleAnimationSpeed,
    ).toBe("1x")
    for (const battleAnimationSpeed of ["1x", "2x", "3x", "skip"] as const) {
      const settings = createPlayerSettings({
        ...createInitialPlayerSettings(),
        battleAnimationSpeed,
      })
      expect(decodePlayerSettings(encodePlayerSettings(settings))).toEqual(
        settings,
      )
    }
    expect(() =>
      decodePlayerSettings([2, "en", "system", "auto", "4x"]),
    ).toThrow("Unsupported Battle animation speed")
    expect(() =>
      decodePlayerSettings([2, "en", "system", "auto", "1x"]),
    ).toThrow("not canonical")
  })
})
