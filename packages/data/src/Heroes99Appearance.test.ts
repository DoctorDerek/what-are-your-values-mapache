import { describe, expect, it } from "vitest"
import { DEFAULT_HEROES99_APPEARANCE, getHeroes99LayerPaths, randomizeHeroes99Appearance, readHeroes99Appearance } from "./Heroes99Appearance"
import { applyHeroes99Choice, getHeroes99PaletteChoices, HEROES99_CHOICES } from "./Heroes99DressingRoom"
import { unionHeroes99Bounds } from "./Heroes99RuntimeAssets"

describe("Heroes99 appearance contract", () => {
  it("maps the approved default and optional layers in source z-order", () => {
    expect(getHeroes99LayerPaths(DEFAULT_HEROES99_APPEARANCE)).toEqual([
      "weapon/weapon1/weapon1_bot/weapon1_bot.png", "skin/skin_c1.png", "hair/m4/m4_bot/m4_c4_bot.png", "face/face_c2.png", "cloth/cloth14/cloth14_bot/cloth14_c4_bot.png", "cloth/cloth14/cloth14_top/cloth14_c4_top.png", "hair/m4/m4_top/m4_c4_top.png", "weapon/weapon1/weapon1_top/weapon1_top.png",
    ])
    expect(getHeroes99LayerPaths(applyHeroes99Choice(DEFAULT_HEROES99_APPEARANCE, { hairStyle: null, weaponStyle: null }))).toHaveLength(4)
    expect(getHeroes99LayerPaths(applyHeroes99Choice(DEFAULT_HEROES99_APPEARANCE, { weaponStyle: "dagger", weaponPalette: 4 }))[0]).toBe("weapon/weapon5/weapon5_bot/weapon5_c4_bot.png")
  })

  it("accepts every catalog choice and its applicable source palettes", () => {
    for (const category of ["Skin", "Face", "Hair", "Clothing", "Weapon"] as const) for (const choice of HEROES99_CHOICES[category]) {
      const appearance = applyHeroes99Choice(DEFAULT_HEROES99_APPEARANCE, choice.change)
      expect(readHeroes99Appearance(appearance)).toEqual(appearance)
      for (const palette of getHeroes99PaletteChoices(category, appearance)) expect(() => applyHeroes99Choice(appearance, palette.change)).not.toThrow()
    }
  })

  it.each([null, [], { ...DEFAULT_HEROES99_APPEARANCE, packVersion: "unknown" }, { ...DEFAULT_HEROES99_APPEARANCE, skinPalette: 7 }, { ...DEFAULT_HEROES99_APPEARANCE, hairStyle: "m15" }, { ...DEFAULT_HEROES99_APPEARANCE, weaponStyle: "gun" }, { ...DEFAULT_HEROES99_APPEARANCE, weaponPalette: 2 }, { ...DEFAULT_HEROES99_APPEARANCE, facePalette: 0.5 }])("rejects unsupported or malformed external appearances %#", value => {
    expect(() => readHeroes99Appearance(value)).toThrow()
  })

  it("randomizes within verified source limits and includes None", () => {
    expect(randomizeHeroes99Appearance(() => 0)).toMatchObject({ skinPalette: 1, hairStyle: "m1", clothingStyle: 1, weaponStyle: "sword" })
    expect(randomizeHeroes99Appearance(() => 0.999)).toMatchObject({ skinPalette: 6, hairStyle: null, hairPalette: 10, clothingStyle: 17, clothingPalette: 8, weaponStyle: null })
  })

  it("contains every authored layer in one stable animation crop", () => {
    expect(unionHeroes99Bounds([{ left: 15, top: 7, width: 14, height: 31 }, { left: 10, top: 12, width: 23, height: 35 }])).toEqual({ left: 10, top: 7, width: 23, height: 40 })
  })
})
