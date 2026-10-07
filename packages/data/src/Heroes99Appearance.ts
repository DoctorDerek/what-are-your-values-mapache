export const HEROES99_PACK_VERSION = "1.2" as const

export const HEROES99_HAIR_STYLES = [
  "m1",
  "m2",
  "m3",
  "m4",
  "m5",
  "m6",
  "m7",
  "m8",
  "m9",
  "m10",
  "m11",
  "m12",
  "m13",
  "m14",
  "f1",
  "f2",
  "f3",
  "f4",
  "f5",
  "f6",
  "f7",
  "f8",
  "f9",
] as const

export const HEROES99_WEAPON_STYLES = [
  "sword",
  "spear",
  "wand",
  "axe",
  "dagger",
] as const

export type Heroes99HairStyle = (typeof HEROES99_HAIR_STYLES)[number]
export type Heroes99WeaponStyle = (typeof HEROES99_WEAPON_STYLES)[number]

export const HEROES99_PALETTE_COUNTS = Object.freeze({
  skin: 6,
  face: 7,
  hair: 10,
  clothing: 8,
  dagger: 4,
})
export const HEROES99_CLOTHING_STYLE_COUNT = 17
export const HEROES99_IDLE_FRAME_DURATION_MS = 160

export type Heroes99Appearance = Readonly<{
  packVersion: typeof HEROES99_PACK_VERSION
  skinPalette: number
  facePalette: number
  hairStyle: Heroes99HairStyle | null
  hairPalette: number
  clothingStyle: number
  clothingPalette: number
  weaponStyle: Heroes99WeaponStyle | null
  weaponPalette: number
}>

export const DEFAULT_HEROES99_APPEARANCE: Heroes99Appearance = Object.freeze({
  packVersion: HEROES99_PACK_VERSION,
  skinPalette: 1,
  facePalette: 2,
  hairStyle: "m4",
  hairPalette: 4,
  clothingStyle: 14,
  clothingPalette: 4,
  weaponStyle: "sword",
  weaponPalette: 1,
})

export function readHeroes99Appearance(value: unknown): Heroes99Appearance {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("Invalid Heroes99 appearance")
  const source = value as { [key: string]: unknown }
  if (source.packVersion !== HEROES99_PACK_VERSION)
    throw new Error("Unsupported Heroes99 pack version")
  const readPalette = (name: string, maximum: number) => {
    const selected = source[name]
    if (
      typeof selected !== "number" ||
      !Number.isInteger(selected) ||
      selected < 1 ||
      selected > maximum
    )
      throw new Error(`Invalid Heroes99 ${name}`)
    return selected
  }
  const hairStyle = HEROES99_HAIR_STYLES.find(
    (style) => style === source.hairStyle,
  )
  const weaponStyle = HEROES99_WEAPON_STYLES.find(
    (style) => style === source.weaponStyle,
  )
  if (source.hairStyle !== null && !hairStyle)
    throw new Error("Invalid Heroes99 hair style")
  if (source.weaponStyle !== null && !weaponStyle)
    throw new Error("Invalid Heroes99 weapon style")
  return Object.freeze({
    packVersion: HEROES99_PACK_VERSION,
    skinPalette: readPalette("skinPalette", HEROES99_PALETTE_COUNTS.skin),
    facePalette: readPalette("facePalette", HEROES99_PALETTE_COUNTS.face),
    hairStyle: hairStyle ?? null,
    hairPalette: readPalette("hairPalette", HEROES99_PALETTE_COUNTS.hair),
    clothingStyle: readPalette("clothingStyle", HEROES99_CLOTHING_STYLE_COUNT),
    clothingPalette: readPalette(
      "clothingPalette",
      HEROES99_PALETTE_COUNTS.clothing,
    ),
    weaponStyle: weaponStyle ?? null,
    weaponPalette: readPalette(
      "weaponPalette",
      weaponStyle === "dagger" ? HEROES99_PALETTE_COUNTS.dagger : 1,
    ),
  })
}

export function getHeroes99LayerPaths(
  appearance: Heroes99Appearance,
): readonly string[] {
  const {
    skinPalette,
    facePalette,
    hairStyle,
    hairPalette,
    clothingStyle,
    clothingPalette,
    weaponStyle,
    weaponPalette,
  } = appearance
  const weaponNumber =
    weaponStyle === null ? 0 : HEROES99_WEAPON_STYLES.indexOf(weaponStyle) + 1
  const weaponPath = (part: "top" | "bot") =>
    `weapon/weapon${weaponNumber}/weapon${weaponNumber}_${part}/weapon${weaponNumber}${weaponStyle === "dagger" ? `_c${weaponPalette}` : ""}_${part}.png`
  const hairPath = (part: "top" | "bot") =>
    `hair/${hairStyle}/${hairStyle}_${part}/${hairStyle}_c${hairPalette}_${part}.png`
  const clothingPath = (part: "top" | "bot") =>
    `cloth/cloth${clothingStyle}/cloth${clothingStyle}_${part}/cloth${clothingStyle}_c${clothingPalette}_${part}.png`
  return [
    ...(weaponStyle ? [weaponPath("bot")] : []),
    `skin/skin_c${skinPalette}.png`,
    ...(hairStyle ? [hairPath("bot")] : []),
    `face/face_c${facePalette}.png`,
    clothingPath("bot"),
    clothingPath("top"),
    ...(hairStyle ? [hairPath("top")] : []),
    ...(weaponStyle ? [weaponPath("top")] : []),
  ]
}

export function randomizeHeroes99Appearance(
  random: () => number,
): Heroes99Appearance {
  const pickNumber = (maximum: number) => Math.floor(random() * maximum) + 1
  const hairStyle =
    HEROES99_HAIR_STYLES[pickNumber(HEROES99_HAIR_STYLES.length + 1) - 1] ??
    null
  const weaponStyle =
    HEROES99_WEAPON_STYLES[pickNumber(HEROES99_WEAPON_STYLES.length + 1) - 1] ??
    null
  return readHeroes99Appearance({
    packVersion: HEROES99_PACK_VERSION,
    skinPalette: pickNumber(HEROES99_PALETTE_COUNTS.skin),
    facePalette: pickNumber(HEROES99_PALETTE_COUNTS.face),
    hairStyle,
    hairPalette: pickNumber(HEROES99_PALETTE_COUNTS.hair),
    clothingStyle: pickNumber(HEROES99_CLOTHING_STYLE_COUNT),
    clothingPalette: pickNumber(HEROES99_PALETTE_COUNTS.clothing),
    weaponStyle,
    weaponPalette: pickNumber(
      weaponStyle === "dagger" ? HEROES99_PALETTE_COUNTS.dagger : 1,
    ),
  })
}
