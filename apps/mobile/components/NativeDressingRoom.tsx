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
import { useMemo, useState } from "react"
import { Image, Modal, Pressable, ScrollView, View } from "react-native"
import type { ActorRefFrom } from "xstate"
import MapacheScreen from "@/components/MapacheScreen"
import NativeHeroes99Hero from "@/components/NativeHeroes99Hero"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { HEROES99_ASSETS } from "@/generated/heroes99/Heroes99Assets"

const assets: Heroes99RuntimeAssets<number> = HEROES99_ASSETS

export default function NativeDressingRoom({
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
  const palettes = getHeroes99PaletteChoices(
    category,
    draft,
    choiceCopy,
    integer,
  )
  const paletteId = getHeroes99PaletteId(category, draft)
  return (
    <MapacheScreen>
      <View className="shrink-0 px-3 pt-3">
        <Text
          accessibilityRole="header"
          className="text-mapache-vivid-primary-cyan text-2xl font-black"
        >
          {DRESSING_ROOM_COPY.title}
        </Text>
      </View>
      <View className="min-h-0 flex-1 gap-2 p-3 xl:flex-row xl:justify-center xl:gap-5">
        <View className="shrink-0 flex-row items-center justify-around gap-3 border-4 border-black bg-white p-2 xl:flex-1 xl:flex-col xl:justify-center xl:gap-4 xl:p-4">
          <NativeHeroes99Hero
            appearance={draft}
            shouldReduceMotion={shouldReduceMotion}
            sizeClassName="h-24 xl:h-96"
          />
          <Button
            size="compact"
            variant="secondary"
            disabled={isSaving}
            onPress={() => actor.send({ type: "AVATAR.RANDOMIZE" })}
          >
            <Text>{DRESSING_ROOM_COPY.randomize}</Text>
          </Button>
        </View>
        <View className="min-h-0 flex-1 gap-2 xl:gap-4">
          <ScrollView
            horizontal
            accessibilityLabel={DRESSING_ROOM_COPY.category}
            className="shrink-0 grow-0"
            contentContainerClassName="gap-2 pb-1"
          >
            {HEROES99_CATEGORIES.map((item) => (
              <Pressable
                key={choiceCopy.categories[item]}
                accessibilityRole="button"
                accessibilityState={{
                  selected: category === item,
                  disabled: isSaving,
                }}
                disabled={isSaving}
                onPress={() => setCategory(item)}
                className={cx(
                  "min-h-11 shrink-0 items-center justify-center border-4 border-black px-3 py-2",
                  category === item
                    ? "bg-mapache-vivid-primary-cyan"
                    : "bg-white",
                )}
              >
                <Text className="font-black text-black">
                  {choiceCopy.categories[item]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView
            className="min-h-0 flex-1"
            contentContainerClassName="gap-3 pb-2 xl:gap-4"
          >
            <View
              accessibilityLabel={DRESSING_ROOM_COPY.choices(
                choiceCopy.categories[category],
              )}
              className="flex-row flex-wrap gap-3"
            >
              {choices[category].map((choice) => {
                const index = assets.thumbnailIndexByChoiceId[choice.id]
                return (
                  <Pressable
                    key={choice.id}
                    accessibilityRole="button"
                    accessibilityLabel={choice.label}
                    accessibilityState={{
                      selected: isHeroes99ChoiceSelected(draft, choice),
                      disabled: isSaving,
                    }}
                    disabled={isSaving}
                    onPress={() =>
                      actor.send({
                        type: "AVATAR.CHANGE",
                        change: choice.change,
                      })
                    }
                    className={cx(
                      "min-h-28 w-24 items-center justify-center border-4 border-black p-1",
                      isHeroes99ChoiceSelected(draft, choice)
                        ? "bg-mapache-vivid-primary-cyan"
                        : "bg-white",
                    )}
                  >
                    {assets.thumbnailAtlas && index !== undefined && (
                      <View
                        pointerEvents="none"
                        className="relative h-20 w-16 overflow-hidden"
                      >
                        <Image
                          alt=""
                          aria-hidden
                          source={assets.thumbnailAtlas}
                          className="absolute"
                          resizeMode="stretch"
                          style={{
                            width:
                              HEROES99_THUMBNAIL.width *
                              HEROES99_THUMBNAIL.columns,
                            height:
                              Math.ceil(
                                Object.keys(assets.thumbnailIndexByChoiceId)
                                  .length / HEROES99_THUMBNAIL.columns,
                              ) * HEROES99_THUMBNAIL.height,
                            left:
                              -(index % HEROES99_THUMBNAIL.columns) *
                              HEROES99_THUMBNAIL.width,
                            top:
                              -Math.floor(index / HEROES99_THUMBNAIL.columns) *
                              HEROES99_THUMBNAIL.height,
                          }}
                        />
                      </View>
                    )}
                    <Text className="text-sm font-bold text-black">
                      {choice.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            {palettes.length > 0 && (
              <View
                accessibilityLabel={DRESSING_ROOM_COPY.palette(
                  choiceCopy.categories[category],
                )}
                className="flex-row flex-wrap gap-2"
              >
                {palettes.map((choice, index) => (
                  <Pressable
                    key={choice.id}
                    accessibilityRole="button"
                    accessibilityLabel={choice.label}
                    accessibilityState={{
                      selected: isHeroes99ChoiceSelected(draft, choice),
                      disabled: isSaving,
                    }}
                    disabled={isSaving}
                    onPress={() =>
                      actor.send({
                        type: "AVATAR.CHANGE",
                        change: choice.change,
                      })
                    }
                    className="size-12 items-center justify-center border-4 border-black"
                    style={{
                      backgroundColor: assets.palettes[paletteId]?.[index],
                    }}
                  >
                    {isHeroes99ChoiceSelected(draft, choice) && (
                      <Text className="rounded-full bg-black px-1.5 font-black text-white">
                        ✓
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
      {state.context.hasEditFailure && (
        <Text
          accessibilityRole="alert"
          className="mx-3 border-4 border-black bg-white p-3 text-black"
        >
          {DRESSING_ROOM_COPY.editError}
        </Text>
      )}
      {state.matches("SaveFailed") && (
        <View
          accessibilityRole="alert"
          className="mx-3 gap-2 border-4 border-black bg-white p-3"
        >
          <Text className="font-black text-black">
            ✕ {DRESSING_ROOM_COPY.error}
          </Text>
          <Text className="text-black">{DRESSING_ROOM_COPY.errorDetail}</Text>
          <Button onPress={() => actor.send({ type: "AVATAR.SAVE" })}>
            <Text>{DRESSING_ROOM_COPY.retry}</Text>
          </Button>
        </View>
      )}
      <View className="shrink-0 gap-2 px-3 pt-1 pb-4">
        <View className="flex-row gap-2">
          <Button
            size="compact"
            className="min-w-0 flex-1"
            variant="outline"
            disabled={isSaving}
            onPress={() => actor.send({ type: "AVATAR.BACK_REQUESTED" })}
          >
            <Text>{DRESSING_ROOM_COPY.back}</Text>
          </Button>
          <Button
            size="compact"
            className="min-w-0 flex-1"
            disabled={isSaving}
            accessibilityState={{ busy: isSaving }}
            onPress={() => actor.send({ type: "AVATAR.SAVE" })}
          >
            <Text>
              {isSaving ? DRESSING_ROOM_COPY.saving : DRESSING_ROOM_COPY.save}
            </Text>
          </Button>
        </View>
        <Button
          size="compact"
          variant="secondary"
          disabled={isSaving}
          onPress={() => onShare(draft)}
        >
          <Text>{VALUES_CARD_COPY.title}</Text>
        </Button>
      </View>
      <Modal
        transparent
        visible={state.matches("ConfirmingLeave")}
        animationType={shouldReduceMotion ? "none" : "fade"}
        onRequestClose={() => actor.send({ type: "AVATAR.KEEP_EDITING" })}
      >
        <View className="flex-1 items-center justify-center bg-black/70 p-5">
          <View
            accessibilityViewIsModal
            role="dialog"
            accessibilityLabel={DRESSING_ROOM_COPY.keepTitle}
            className="w-full max-w-lg gap-4 border-4 border-black bg-white p-5"
          >
            <Text
              accessibilityRole="header"
              className="text-2xl font-black text-black"
            >
              {DRESSING_ROOM_COPY.keepTitle}
            </Text>
            <Button onPress={() => actor.send({ type: "AVATAR.SAVE" })}>
              <Text>{DRESSING_ROOM_COPY.saveReturn}</Text>
            </Button>
            <Button
              variant="outline"
              onPress={() => actor.send({ type: "AVATAR.CANCEL" })}
            >
              <Text>{DRESSING_ROOM_COPY.discard}</Text>
            </Button>
            <Button
              variant="secondary"
              onPress={() => actor.send({ type: "AVATAR.KEEP_EDITING" })}
            >
              <Text>{DRESSING_ROOM_COPY.keepEditing}</Text>
            </Button>
          </View>
        </View>
      </Modal>
    </MapacheScreen>
  )
}
