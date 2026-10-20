"use client"

import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import {
  getHeroes99Choices,
  getHeroes99PaletteChoices,
  getHeroes99PaletteId,
  HEROES99_CATEGORIES,
  isHeroes99ChoiceSelected,
  type Heroes99Category,
} from "@game/data/src/Heroes99DressingRoom"
import {
  HEROES99_THUMBNAIL,
  type Heroes99RuntimeAssets,
} from "@game/data/src/Heroes99RuntimeAssets"
import { createLocaleFormatters } from "@game/data/src/LocaleFormatters"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { avatarMachine } from "@game/machines/src/AvatarMachine"
import useRecoverableActorSnapshot from "@game/utils/src/useRecoverableActorSnapshot"
import { cx } from "classix"
import type { StaticImageData } from "next/image"
import { useMemo, useState } from "react"
import type { ActorRefFrom } from "xstate"
import Heroes99Hero from "@/components/Heroes99Hero"
import MapacheScreen from "@/components/MapacheScreen"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { HEROES99_ASSETS } from "@/generated/heroes99/Heroes99Assets"

const assets: Heroes99RuntimeAssets<StaticImageData> = HEROES99_ASSETS

export default function DressingRoom({
  actor,
  shouldReduceMotion,
  onShare,
}: {
  actor: ActorRefFrom<typeof avatarMachine>
  shouldReduceMotion: boolean
  onShare: (appearance: Heroes99Appearance) => void
}) {
  const localizedCopy = useLocaleCatalog()
  const DRESSING_ROOM_COPY = localizedCopy.interfaceCopy.dressingRoom
  const VALUES_CARD_COPY = localizedCopy.card
  const choiceCopy = localizedCopy.interfaceCopy.heroChoices
  const { integer } = useMemo(
    () => createLocaleFormatters(localizedCopy.metadata.languageTag),
    [localizedCopy.metadata.languageTag],
  )
  const choices = useMemo(
    () => getHeroes99Choices(choiceCopy, integer),
    [choiceCopy, integer],
  )

  const state = useRecoverableActorSnapshot(actor)
  const [category, setCategory] = useState<Heroes99Category>("Skin")
  const { draft } = state.context
  const isSaving = state.matches("Saving")
  const paletteChoices = getHeroes99PaletteChoices(
    category,
    draft,
    choiceCopy,
    integer,
  )
  const paletteId = getHeroes99PaletteId(category, draft)
  return (
    <MapacheScreen
      spacing="standard-xl"
      viewport="fixed"
      className="grid grid-rows-[auto_auto_auto_minmax(7.5rem,1fr)] justify-items-center gap-2 overflow-y-auto xl:flex xl:flex-col xl:items-center xl:gap-6"
    >
      <header className="w-full max-w-7xl shrink-0">
        <h1 className="text-mapache-vivid-primary-cyan text-2xl font-black xl:text-4xl">
          {DRESSING_ROOM_COPY.title}
        </h1>
      </header>
      <div className="contents xl:grid xl:w-full xl:max-w-7xl xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:gap-6">
        <section
          aria-label={DRESSING_ROOM_COPY.preview}
          className="flex w-full min-w-0 items-center gap-3 border-4 border-black bg-white p-2 shadow-[6px_6px_0px_0px_#000000] xl:flex-col xl:gap-4 xl:p-4"
        >
          <Heroes99Hero
            appearance={draft}
            shouldReduceMotion={shouldReduceMotion}
            className="h-[clamp(5rem,16dvh,12rem)] min-w-0 flex-1 xl:h-96 xl:w-full xl:flex-none"
          />
          <Button
            variant="secondary"
            typographyClassName="text-base xl:text-lg"
            disabled={isSaving}
            onClick={() => actor.send({ type: "AVATAR.RANDOMIZE" })}
          >
            {DRESSING_ROOM_COPY.randomize}
          </Button>
        </section>
        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-4">
          <div
            role="group"
            aria-label={DRESSING_ROOM_COPY.category}
            className="flex w-full min-w-0 shrink-0 gap-2 overflow-x-auto pb-1 xl:flex-wrap xl:overflow-visible xl:pb-0"
          >
            {HEROES99_CATEGORIES.map((item) => (
              <button
                type="button"
                key={choiceCopy.categories[item]}
                disabled={isSaving}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={cx(
                  "min-h-11 shrink-0 cursor-pointer border-4 border-black px-3 py-2 font-black focus-visible:outline-4 focus-visible:outline-white",
                  category === item
                    ? "bg-mapache-vivid-primary-cyan text-black"
                    : "hover:bg-mapache-vivid-light bg-white text-black",
                )}
              >
                {choiceCopy.categories[item]}
              </button>
            ))}
          </div>
          <div className="min-h-0 w-full min-w-0 overflow-y-auto overscroll-contain p-1 xl:overflow-visible xl:p-0">
            <div
              role="group"
              aria-label={DRESSING_ROOM_COPY.choices(
                choiceCopy.categories[category],
              )}
              className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 xl:max-h-88 xl:grid-cols-[repeat(auto-fill,minmax(80px,1fr))] xl:gap-3 xl:overflow-y-auto xl:p-1"
            >
              {choices[category].map((choice) => {
                const index = assets.thumbnailIndexByChoiceId[choice.id]
                return (
                  <button
                    type="button"
                    key={choice.id}
                    disabled={isSaving}
                    aria-label={choice.label}
                    aria-pressed={isHeroes99ChoiceSelected(draft, choice)}
                    onClick={() =>
                      actor.send({
                        type: "AVATAR.CHANGE",
                        change: choice.change,
                      })
                    }
                    className={cx(
                      "flex min-h-28 cursor-pointer flex-col items-center justify-center border-4 border-black p-1 text-black focus-visible:outline-4 focus-visible:outline-white",
                      isHeroes99ChoiceSelected(draft, choice)
                        ? "bg-mapache-vivid-primary-cyan"
                        : "hover:bg-mapache-vivid-light bg-white",
                    )}
                  >
                    {assets.thumbnailAtlas && index !== undefined && (
                      <span
                        aria-hidden="true"
                        className="block h-20 w-16 shrink-0 [image-rendering:pixelated]"
                        style={{
                          backgroundImage: `url(${assets.thumbnailAtlas.src})`,
                          backgroundPosition: `-${(index % HEROES99_THUMBNAIL.columns) * HEROES99_THUMBNAIL.width}px -${Math.floor(index / HEROES99_THUMBNAIL.columns) * HEROES99_THUMBNAIL.height}px`,
                        }}
                      />
                    )}
                    <span className="text-sm font-bold">{choice.label}</span>
                  </button>
                )
              })}
            </div>
            {paletteChoices.length > 0 && (
              <div
                role="group"
                aria-label={DRESSING_ROOM_COPY.palette(
                  choiceCopy.categories[category],
                )}
                className="mt-3 flex flex-wrap gap-2 xl:mt-4"
              >
                {paletteChoices.map((choice, index) => (
                  <button
                    type="button"
                    key={choice.id}
                    disabled={isSaving}
                    aria-label={choice.label}
                    aria-pressed={isHeroes99ChoiceSelected(draft, choice)}
                    onClick={() =>
                      actor.send({
                        type: "AVATAR.CHANGE",
                        change: choice.change,
                      })
                    }
                    className="grid size-12 cursor-pointer place-items-center border-4 border-black focus-visible:outline-4 focus-visible:outline-white"
                    style={{
                      backgroundColor: assets.palettes[paletteId]?.[index],
                    }}
                  >
                    {isHeroes99ChoiceSelected(draft, choice) && (
                      <span
                        aria-hidden="true"
                        className="grid size-6 place-items-center rounded-full bg-black text-sm font-black text-white"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {state.context.hasEditFailure && (
        <p
          role="alert"
          className="max-h-[30dvh] w-full max-w-7xl shrink-0 overflow-y-auto border-4 border-black bg-white p-4 text-black"
        >
          {DRESSING_ROOM_COPY.editError}
        </p>
      )}
      {state.matches("SaveFailed") && (
        <div
          role="alert"
          className="max-h-[30dvh] w-full max-w-7xl shrink-0 overflow-y-auto border-4 border-black bg-white p-4 text-black"
        >
          <p className="font-black">✕ {DRESSING_ROOM_COPY.error}</p>
          <p>{DRESSING_ROOM_COPY.errorDetail}</p>
          <Button
            className="mt-3"
            onClick={() => actor.send({ type: "AVATAR.SAVE" })}
          >
            {DRESSING_ROOM_COPY.retry}
          </Button>
        </div>
      )}
      <footer className="flex w-full max-w-7xl shrink-0 flex-wrap gap-2 pb-2 [overflow-wrap:anywhere] hyphens-auto xl:grid xl:grid-cols-3 xl:gap-4 xl:pb-0">
        <Button
          size="sm"
          wrap
          className="min-w-0 grow basis-32"
          variant="outline"
          typographyClassName="text-base xl:text-lg"
          disabled={isSaving}
          onClick={() => actor.send({ type: "AVATAR.BACK_REQUESTED" })}
        >
          {DRESSING_ROOM_COPY.back}
        </Button>
        <Button
          size="sm"
          wrap
          className="min-w-0 grow basis-32"
          typographyClassName="text-base xl:text-lg"
          disabled={isSaving}
          aria-busy={isSaving}
          onClick={() => actor.send({ type: "AVATAR.SAVE" })}
        >
          {isSaving ? DRESSING_ROOM_COPY.saving : DRESSING_ROOM_COPY.save}
        </Button>
        <Button
          size="sm"
          id="dressing-room-share-button"
          className="min-w-0 basis-full"
          variant="secondary"
          typographyClassName="text-base xl:text-lg"
          wrap
          disabled={isSaving}
          onClick={() => onShare(draft)}
        >
          {VALUES_CARD_COPY.title}
        </Button>
      </footer>
      <Dialog
        open={state.matches("ConfirmingLeave")}
        onOpenChange={(open) => {
          if (!open) actor.send({ type: "AVATAR.KEEP_EDITING" })
        }}
      >
        <DialogContent aria-describedby={undefined} className="gap-4 p-5">
          <DialogTitle className="text-2xl font-black">
            {DRESSING_ROOM_COPY.keepTitle}
          </DialogTitle>
          <Button onClick={() => actor.send({ type: "AVATAR.SAVE" })}>
            {DRESSING_ROOM_COPY.saveReturn}
          </Button>
          <Button
            variant="outline"
            onClick={() => actor.send({ type: "AVATAR.CANCEL" })}
          >
            {DRESSING_ROOM_COPY.discard}
          </Button>
          <Button
            variant="secondary"
            onClick={() => actor.send({ type: "AVATAR.KEEP_EDITING" })}
          >
            {DRESSING_ROOM_COPY.keepEditing}
          </Button>
        </DialogContent>
      </Dialog>
    </MapacheScreen>
  )
}
