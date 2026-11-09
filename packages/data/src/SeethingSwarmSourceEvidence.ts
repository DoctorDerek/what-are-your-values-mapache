import type { ZooAnimalId } from "./ZooAnimals"

const SOURCE_SNAPSHOT_ID = "seethingswarm-animals:2026-11-09"

export type SeethingSwarmSourceEvidenceFile = Readonly<{
  relativePath: string
  sha256: string
}>

export type SeethingSwarmSourceSnapshot = Readonly<{
  sourceSnapshotId: string
  storefrontReviewedOn: string
  packCount: number
  stableAnimalCount: number
  characterAnimationStripCount: number
  auxiliaryEffectStripCount: number
  excludedHumanWeaponStripCount: number
  totalPngStripCount: number
  distinctAnimationIdCount: number
  evidenceFiles: readonly SeethingSwarmSourceEvidenceFile[]
}>

export type SeethingSwarmSourcePack = Readonly<{
  packId: string
  storefrontTitle: string
  storefrontUrl: `https://seethingswarm.itch.io/${string}`
  sourceDirectory: string
  animalIds: readonly ZooAnimalId[]
  sourceSnapshotId: string
}>

function defineEvidenceFile(relativePath: string, sha256: string) {
  return Object.freeze({ relativePath, sha256 })
}

function defineSourcePack(
  packId: string,
  storefrontTitle: string,
  sourceDirectory: string,
  animalIds: readonly ZooAnimalId[],
): SeethingSwarmSourcePack {
  return Object.freeze({
    packId,
    storefrontTitle,
    storefrontUrl: `https://seethingswarm.itch.io/${packId}`,
    sourceDirectory,
    animalIds: Object.freeze(animalIds),
    sourceSnapshotId: SOURCE_SNAPSHOT_ID,
  })
}

export const SEETHING_SWARM_SOURCE_SNAPSHOT = Object.freeze({
  sourceSnapshotId: SOURCE_SNAPSHOT_ID,
  storefrontReviewedOn: "2026-11-09",
  packCount: 30,
  stableAnimalCount: 48,
  characterAnimationStripCount: 821,
  auxiliaryEffectStripCount: 1,
  excludedHumanWeaponStripCount: 102,
  totalPngStripCount: 924,
  distinctAnimationIdCount: 95,
  evidenceFiles: Object.freeze([
    defineEvidenceFile(
      "seethingswarm_animals_full_animation_list_with_frame_count.txt",
      "1AA43BAF60269569EEFE5D0ED00B74DEC627A96D9DE91A6E68261BC1ECB049CA",
    ),
    defineEvidenceFile(
      "seethingswarm_animals_colors_list.txt",
      "E670191995A100C891D573D33679CAE4D7AB09F055A0F405A8354B86A8A492E4",
    ),
    defineEvidenceFile(
      "seethingswarm_animals_spritesheet_sizes.txt",
      "912A384B5A61B9F08D392C20DEF1EA6EA08D5808F7C864D810393D3687CC043C",
    ),
    defineEvidenceFile(
      "LICENSE.txt",
      "13F97ABBA7D10CBCFD343EBA184B704C8BA329D5434818BC05A6D1ECF6E38200",
    ),
  ]),
}) satisfies SeethingSwarmSourceSnapshot

export const SEETHING_SWARM_SOURCE_PACKS = Object.freeze([
  defineSourcePack("batpack", "Batpack", "bat_spritesheets", ["bat"]),
  defineSourcePack("bearpack", "Bearpack", "bearpack_spritesheets", [
    "bearpack",
  ]),
  defineSourcePack("bunnypack", "Bunnypack", "bunnypack_spritesheets", [
    "bunnypack",
  ]),
  defineSourcePack("catset", "Catset", "catset_spritesheets", [
    "catset/cat01_brown",
    "catset/cat02_dark_gray",
    "catset/cat03_orange",
    "catset/cat04_light_gray",
    "catset/cat05_black",
  ]),
  defineSourcePack("catset-kittens", "Catset Kittens", "kittens_spritesheets", [
    "kittens/kitten01_brown",
    "kittens/kitten02_dark_gray",
    "kittens/kitten03_orange",
    "kittens/kitten04_light_gray",
    "kittens/kitten05_black",
  ]),
  defineSourcePack("chickenpack", "Chickenpack", "chickenpack_spritesheets", [
    "chickenpack",
  ]),
  defineSourcePack("cranepack", "Cranepack", "cranepack_spritesheets", [
    "cranepack",
  ]),
  defineSourcePack("crowpack", "Crowpack", "crowpack_spritesheets", [
    "crowpack",
  ]),
  defineSourcePack("deerpack", "Deerpack", "deer_female_spritesheets", [
    "deer_female",
  ]),
  defineSourcePack("dogpack", "Dogpack", "dogpack_spritesheets", ["dogpack"]),
  defineSourcePack("dragonflypack", "Dragonflypack", "dragonfly_spritesheets", [
    "dragonfly/dragonfly01_blue",
    "dragonfly/dragonfly02_yellow",
    "dragonfly/dragonfly03_pink",
    "dragonfly/dragonfly04_green",
  ]),
  defineSourcePack("falconpack", "Falconpack", "falconpack_spritesheets", [
    "falconpack",
  ]),
  defineSourcePack("foxpack", "Foxpack", "foxpack_spritesheets", ["foxpack"]),
  defineSourcePack("frogpack", "Frogpack", "frogpack_spritesheets", [
    "frogpack",
  ]),
  defineSourcePack("lil-axolotl", "Lil Axolotl", "lilaxolotl_spritesheets", [
    "lilaxolotl",
  ]),
  defineSourcePack("lil-doggies", "Lil Doggies", "lildoggies_spritesheets", [
    "lildoggies/lildoggie01_brown",
    "lildoggies/lildoggie02_dark_gray",
    "lildoggies/lildoggie03_orange",
    "lildoggies/lildoggie04_light_gray",
    "lildoggies/lildoggie05_black",
  ]),
  defineSourcePack("lil-fox", "Lil Fox", "lilfox_spritesheets", [
    "lilfox/lilfox_red",
    "lilfox/lilfox_white",
  ]),
  defineSourcePack("lil-hedgehog", "Lil Hedgehog", "lilhedgehog_spritesheets", [
    "lilhedgehog",
  ]),
  defineSourcePack("lil-otter", "Lil Otter", "lilotter_spritesheets", [
    "lilotter",
  ]),
  defineSourcePack("lil-pig", "Lil Pig", "lilpig_spritesheets", ["lilpig"]),
  defineSourcePack("mousepack", "Mousepack", "mousepack_spritesheets", [
    "mousepack/mouse01_dark_gray",
    "mousepack/mouse02_brown",
    "mousepack/mouse03_light_gray",
  ]),
  defineSourcePack("owlpack", "Owlpack", "owlpack_spritesheets", ["owlpack"]),
  defineSourcePack("pandapack", "Pandapack", "pandapack_spritesheets", [
    "pandapack",
  ]),
  defineSourcePack("parrotpack", "Parrotpack", "parrotpack_spritesheets", [
    "parrotpack",
  ]),
  defineSourcePack("pigpack", "Pigpack", "pigpack_spritesheets", ["pigpack"]),
  defineSourcePack("raccoonpack", "Raccoonpack", "raccoonpack_spritesheets", [
    "raccoonpack",
  ]),
  defineSourcePack(
    "squirrelpack",
    "Squirrelpack",
    "squirrelpack_spritesheets",
    ["squirrelpack"],
  ),
  defineSourcePack("tigerpack", "Tigerpack", "tigerpack_spritesheets", [
    "tigerpack",
  ]),
  defineSourcePack("turtlepack", "Turtlepack", "turtle_spritesheets", [
    "turtle",
  ]),
  defineSourcePack("wolfpack", "Wolfpack", "wolfpack_spritesheets", [
    "wolfpack",
  ]),
]) satisfies readonly SeethingSwarmSourcePack[]
