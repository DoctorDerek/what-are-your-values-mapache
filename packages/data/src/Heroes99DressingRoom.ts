import {
  HEROES99_CLOTHING_STYLE_COUNT,
  HEROES99_HAIR_STYLES,
  HEROES99_PALETTE_COUNTS,
  HEROES99_WEAPON_STYLES,
  readHeroes99Appearance,
  type Heroes99Appearance,
} from "./Heroes99Appearance"

export const HEROES99_CATEGORIES = [
  "Skin",
  "Face",
  "Hair",
  "Clothing",
  "Weapon",
] as const
export type Heroes99Category = (typeof HEROES99_CATEGORIES)[number]
export type Heroes99Choice = Readonly<{
  id: string
  label: string
  change: Partial<Heroes99Appearance>
}>
const numbered = (count: number) =>
  Array.from({ length: count }, (_, index) => index + 1)

export const HEROES99_CHOICES: Readonly<
  Record<Heroes99Category, readonly Heroes99Choice[]>
> = Object.freeze({
  Skin: numbered(HEROES99_PALETTE_COUNTS.skin).map((skinPalette) => ({
    id: `skin-${skinPalette}`,
    label: `Skin ${skinPalette}`,
    change: { skinPalette },
  })),
  Face: numbered(HEROES99_PALETTE_COUNTS.face).map((facePalette) => ({
    id: `face-${facePalette}`,
    label: `Face ${facePalette}`,
    change: { facePalette },
  })),
  Hair: [
    { id: "hair-none", label: "None", change: { hairStyle: null } },
    ...HEROES99_HAIR_STYLES.map((hairStyle, index) => ({
      id: `hair-${hairStyle}`,
      label: `Style ${index + 1}`,
      change: { hairStyle },
    })),
  ],
  Clothing: numbered(HEROES99_CLOTHING_STYLE_COUNT).map((clothingStyle) => ({
    id: `clothing-${clothingStyle}`,
    label: `Outfit ${clothingStyle}`,
    change: { clothingStyle },
  })),
  Weapon: [
    {
      id: "weapon-none",
      label: "None",
      change: { weaponStyle: null, weaponPalette: 1 },
    },
    ...HEROES99_WEAPON_STYLES.map((weaponStyle) => ({
      id: `weapon-${weaponStyle}`,
      label: weaponStyle.charAt(0).toUpperCase() + weaponStyle.slice(1),
      change: { weaponStyle, weaponPalette: 1 },
    })),
  ],
})

export function applyHeroes99Choice(
  appearance: Heroes99Appearance,
  change: Partial<Heroes99Appearance>,
) {
  return readHeroes99Appearance({ ...appearance, ...change })
}

export function isHeroes99ChoiceSelected(
  appearance: Heroes99Appearance,
  choice: Heroes99Choice,
) {
  return Object.entries(choice.change).every(
    ([key, value]) =>
      (key === "weaponPalette" && "weaponStyle" in choice.change) ||
      Reflect.get(appearance, key) === value,
  )
}

export function getHeroes99PaletteChoices(
  category: Heroes99Category,
  appearance: Heroes99Appearance,
): readonly Heroes99Choice[] {
  const field =
    category === "Hair" && appearance.hairStyle
      ? "hairPalette"
      : category === "Clothing"
        ? "clothingPalette"
        : category === "Weapon" && appearance.weaponStyle === "dagger"
          ? "weaponPalette"
          : null
  if (!field) return []
  const count =
    field === "hairPalette"
      ? HEROES99_PALETTE_COUNTS.hair
      : field === "clothingPalette"
        ? HEROES99_PALETTE_COUNTS.clothing
        : HEROES99_PALETTE_COUNTS.dagger
  return numbered(count).map((palette) => ({
    id: `${field}-${palette}`,
    label: `Palette ${palette}`,
    change: { [field]: palette },
  }))
}

export function getHeroes99PaletteId(
  category: Heroes99Category,
  appearance: Heroes99Appearance,
) {
  return category === "Hair"
    ? `Hair-${appearance.hairStyle}`
    : category === "Clothing"
      ? `Clothing-${appearance.clothingStyle}`
      : "Weapon-dagger"
}

export const DRESSING_ROOM_COPY = Object.freeze({
  preview: "Appearance preview",
  category: "Appearance category",
  character: "Your Heroes99 character",
  choices: (category: Heroes99Category) => `${category} choices`,
  palette: (category: Heroes99Category) => `${category} palette`,
  title: "Dressing Room",
  customize: "Customize my card",
  randomize: "Randomize",
  save: "Save appearance",
  cancel: "Cancel",
  back: "Back",
  saving: "Saving appearance…",
  error: "Local save error",
  errorDetail:
    "Your appearance changes are still here, but have not been saved.",
  retry: "Retry save",
  editError:
    "That appearance change could not be applied. Your previous selection is still here. Try another option.",
  keepTitle: "Keep your changes?",
  saveReturn: "Save and return",
  discard: "Discard changes",
  keepEditing: "Keep editing",
  placeholder: "Hero preview unavailable",
  loading: "Loading your hero…",
})
