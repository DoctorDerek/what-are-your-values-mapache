import type { Heroes99WeaponStyle } from "./Heroes99Appearance"

export type Heroes99ChoiceCopy = Readonly<{
  categories: Readonly<
    Record<"Skin" | "Face" | "Hair" | "Clothing" | "Weapon", string>
  >
  weapons: Readonly<Record<Heroes99WeaponStyle, string>>
  none: string
  skin: (number: string) => string
  face: (number: string) => string
  style: (number: string) => string
  outfit: (number: string) => string
  palette: (number: string) => string
}>

export const HEROES99_CHOICE_COPY: Heroes99ChoiceCopy = Object.freeze({
  categories: {
    Skin: "Skin",
    Face: "Face",
    Hair: "Hair",
    Clothing: "Clothing",
    Weapon: "Weapon",
  },
  weapons: {
    sword: "Sword",
    spear: "Spear",
    wand: "Wand",
    axe: "Axe",
    dagger: "Dagger",
  },
  none: "None",
  skin: (number: string) => `Skin ${number}`,
  face: (number: string) => `Face ${number}`,
  style: (number: string) => `Style ${number}`,
  outfit: (number: string) => `Outfit ${number}`,
  palette: (number: string) => `Palette ${number}`,
})
