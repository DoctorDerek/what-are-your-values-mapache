"use client"

import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import { VALUES_CARD_COPY } from "@game/data/src/ValuesCard"
import {
  DRESSING_ROOM_COPY,
  getHeroes99PaletteChoices,
  getHeroes99PaletteId,
  HEROES99_CATEGORIES,
  HEROES99_CHOICES,
  isHeroes99ChoiceSelected,
  type Heroes99Category,
} from "@game/data/src/Heroes99DressingRoom"
import {
  HEROES99_THUMBNAIL,
  type Heroes99RuntimeAssets,
} from "@game/data/src/Heroes99RuntimeAssets"
import type { avatarMachine } from "@game/machines/src/AvatarMachine"
import useRecoverableActorSnapshot from "@game/utils/src/useRecoverableActorSnapshot"
import { cx } from "classix"
import type { StaticImageData } from "next/image"
import { useState } from "react"
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
  const state = useRecoverableActorSnapshot(actor)
  const [category, setCategory] = useState<Heroes99Category>("Skin")
  const { draft } = state.context
  const isSaving = state.matches("Saving")
  const paletteChoices = getHeroes99PaletteChoices(category, draft)
  const paletteId = getHeroes99PaletteId(category, draft)
  return (
    <MapacheScreen
      spacing="standard-xl"
      className="flex flex-col items-center gap-6"
    >
      <header className="flex w-full max-w-7xl items-center gap-4">
        <Button
          variant="secondary"
          disabled={isSaving}
          onClick={() => actor.send({ type: "AVATAR.BACK_REQUESTED" })}
        >
          {DRESSING_ROOM_COPY.back}
        </Button>
        <h1 className="text-mapache-vivid-primary-cyan text-2xl font-black xl:text-4xl">
          {DRESSING_ROOM_COPY.title}
        </h1>
      </header>
      <div className="grid w-full max-w-7xl min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section
          aria-label={DRESSING_ROOM_COPY.preview}
          className="flex flex-col items-center gap-4 border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_#000000]"
        >
          <Heroes99Hero
            appearance={draft}
            shouldReduceMotion={shouldReduceMotion}
            className="h-48 w-full xl:h-96"
          />
          <Button
            variant="secondary"
            disabled={isSaving}
            onClick={() => actor.send({ type: "AVATAR.RANDOMIZE" })}
          >
            {DRESSING_ROOM_COPY.randomize}
          </Button>
        </section>
        <div className="flex min-w-0 flex-col gap-4">
          <div
            role="group"
            aria-label={DRESSING_ROOM_COPY.category}
            className="flex flex-wrap gap-2"
          >
            {HEROES99_CATEGORIES.map((item) => (
              <button
                type="button"
                key={item}
                disabled={isSaving}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={cx(
                  "min-h-11 cursor-pointer border-4 border-black px-3 py-2 font-black focus-visible:outline-4 focus-visible:outline-white",
                  category === item
                    ? "bg-mapache-vivid-primary-cyan text-black"
                    : "hover:bg-mapache-vivid-light bg-white text-black",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <div
            role="group"
            aria-label={DRESSING_ROOM_COPY.choices(category)}
            className="grid max-h-88 grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3 overflow-y-auto p-1"
          >
            {HEROES99_CHOICES[category].map((choice) => {
              const index = assets.thumbnailIndexByChoiceId[choice.id]
              return (
                <button
                  type="button"
                  key={choice.id}
                  disabled={isSaving}
                  aria-label={choice.label}
                  aria-pressed={isHeroes99ChoiceSelected(draft, choice)}
                  onClick={() =>
                    actor.send({ type: "AVATAR.CHANGE", change: choice.change })
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
              aria-label={DRESSING_ROOM_COPY.palette(category)}
              className="flex flex-wrap gap-2"
            >
              {paletteChoices.map((choice, index) => (
                <button
                  type="button"
                  key={choice.id}
                  disabled={isSaving}
                  aria-label={choice.label}
                  aria-pressed={isHeroes99ChoiceSelected(draft, choice)}
                  onClick={() =>
                    actor.send({ type: "AVATAR.CHANGE", change: choice.change })
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
      {state.context.hasEditFailure && (
        <p
          role="alert"
          className="w-full max-w-7xl border-4 border-black bg-white p-4 text-black"
        >
          {DRESSING_ROOM_COPY.editError}
        </p>
      )}
      {state.matches("SaveFailed") && (
        <div
          role="alert"
          className="w-full max-w-7xl border-4 border-black bg-white p-4 text-black"
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
      <footer className="grid w-full max-w-7xl grid-cols-2 gap-4 xl:grid-cols-3">
        <Button
          variant="outline"
          disabled={isSaving}
          onClick={() => actor.send({ type: "AVATAR.CANCEL" })}
        >
          {DRESSING_ROOM_COPY.cancel}
        </Button>
        <Button
          wrap
          disabled={isSaving}
          aria-busy={isSaving}
          onClick={() => actor.send({ type: "AVATAR.SAVE" })}
        >
          {isSaving ? DRESSING_ROOM_COPY.saving : DRESSING_ROOM_COPY.save}
        </Button>
        <Button id="dressing-room-share-button" className="col-span-2 xl:col-span-1" variant="secondary" wrap
          disabled={isSaving} onClick={() => onShare(draft)}>{VALUES_CARD_COPY.title}</Button>
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
