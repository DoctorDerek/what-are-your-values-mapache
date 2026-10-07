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
import { useSelector } from "@xstate/react"
import { cx } from "classix"
import { useState } from "react"
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
}: {
  actor: ActorRefFrom<typeof avatarMachine>
  shouldReduceMotion: boolean
}) {
  const state = useSelector(actor, (snapshot) => snapshot)
  const [category, setCategory] = useState<Heroes99Category>("Skin")
  const { draft } = state.context
  const isSaving = state.matches("Saving")
  const palettes = getHeroes99PaletteChoices(category, draft)
  const paletteId = getHeroes99PaletteId(category, draft)
  return (
    <MapacheScreen>
      <View className="flex-row items-center gap-3 p-3">
        <Button
          size="compact"
          variant="secondary"
          disabled={isSaving}
          onPress={() => actor.send({ type: "AVATAR.BACK_REQUESTED" })}
        >
          <Text>{DRESSING_ROOM_COPY.back}</Text>
        </Button>
        <Text
          accessibilityRole="header"
          className="text-mapache-vivid-primary-cyan min-w-0 flex-1 text-2xl font-black"
        >
          {DRESSING_ROOM_COPY.title}
        </Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 p-3 xl:flex-row xl:justify-center"
      >
        <View className="items-center gap-4 border-4 border-black bg-white p-4 xl:flex-1">
          <NativeHeroes99Hero
            appearance={draft}
            shouldReduceMotion={shouldReduceMotion}
            sizeClassName="h-48 xl:h-96"
          />
          <Button
            variant="secondary"
            disabled={isSaving}
            onPress={() => actor.send({ type: "AVATAR.RANDOMIZE" })}
          >
            <Text>{DRESSING_ROOM_COPY.randomize}</Text>
          </Button>
        </View>
        <View className="gap-4 xl:flex-1">
          <View
            accessibilityLabel={DRESSING_ROOM_COPY.category}
            className="flex-row flex-wrap gap-2"
          >
            {HEROES99_CATEGORIES.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{
                  selected: category === item,
                  disabled: isSaving,
                }}
                disabled={isSaving}
                onPress={() => setCategory(item)}
                className={cx(
                  "min-h-11 items-center justify-center border-4 border-black px-3 py-2",
                  category === item
                    ? "bg-mapache-vivid-primary-cyan"
                    : "bg-white",
                )}
              >
                <Text className="font-black text-black">{item}</Text>
              </Pressable>
            ))}
          </View>
          <View
            accessibilityLabel={DRESSING_ROOM_COPY.choices(category)}
            className="flex-row flex-wrap gap-3"
          >
            {HEROES99_CHOICES[category].map((choice) => {
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
                    actor.send({ type: "AVATAR.CHANGE", change: choice.change })
                  }
                  className={cx(
                    "min-h-28 w-20 items-center justify-center border-4 border-black p-1",
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
              accessibilityLabel={DRESSING_ROOM_COPY.palette(category)}
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
                    actor.send({ type: "AVATAR.CHANGE", change: choice.change })
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
        </View>
      </ScrollView>
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
      <View className="flex-row gap-4 px-3 pt-4 pb-6">
        <Button
          className="min-w-0 flex-1"
          variant="outline"
          disabled={isSaving}
          onPress={() => actor.send({ type: "AVATAR.CANCEL" })}
        >
          <Text>{DRESSING_ROOM_COPY.cancel}</Text>
        </Button>
        <Button
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
