import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValuesCardDeliveryMessage,
  readValuesCardPalette,
  VALUES_CARD_COLOR_VARIABLES,
  type ValuesCardModel,
} from "@game/data/src/ValuesCard"
import { valuesCardShareMachine } from "@game/machines/src/ValuesCardShareMachine"
import { useMachine } from "@xstate/react"
import { Image } from "expo-image"
import { useEffect, useState } from "react"
import { Modal, Pressable, ScrollView, View } from "react-native"
import { useCSSVariable, withUniwind } from "uniwind"
import MapacheScreen from "@/components/MapacheScreen"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { prepareNativeValuesCard } from "@/lib/NativeValuesCardExport"

const CardImage = withUniwind(Image)

export default function NativeValuesCardShare({
  model,
  shouldReduceMotion,
  onClose,
}: {
  readonly model: ValuesCardModel<number>
  readonly shouldReduceMotion: boolean
  readonly onClose: () => void
}) {
  const colors = useCSSVariable([...VALUES_CARD_COLOR_VARIABLES])
  const [showDetails, setShowDetails] = useState(false)
  const localizedCopy = useLocaleCatalog()
  const { copy } = model
  const [state, send, actor] = useMachine(valuesCardShareMachine, {
    input: {
      prepare: (options) =>
        prepareNativeValuesCard(model, readValuesCardPalette(colors), options),
    },
  })
  useEffect(
    () => () => {
      actor.getSnapshot().context.artifact?.dispose()
    },
    [actor],
  )
  const { artifact, format, includeHero, error, outcome } = state.context
  const isDelivering = state.matches("Delivering")
  return (
    <Modal
      visible
      animationType={shouldReduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <MapacheScreen>
        <ScrollView
          contentContainerClassName="min-h-full w-full max-w-[45rem] self-center gap-2 p-3 xl:gap-4 xl:p-6"
          accessibilityViewIsModal
        >
          <View>
            <Text
              accessibilityRole="header"
              className="text-mapache-vivid-primary-cyan text-center text-xl leading-6 font-black xl:text-3xl"
            >
              {copy.title}
            </Text>
          </View>
          <View
            accessibilityLabel={copy.format}
            className="flex-row flex-wrap gap-2 xl:w-80 xl:self-center"
          >
            {(["gif", "png"] as const).map((option) => (
              <Button
                key={option}
                size="compact"
                className="relative min-w-0 grow basis-28"
                accessibilityLabel={`${copy[option].name} · ${copy[option].description}`}
                variant={format === option ? "secondary" : "outline"}
                accessibilityState={{
                  selected: format === option,
                  disabled: isDelivering,
                }}
                disabled={isDelivering}
                onPress={() =>
                  send({ type: "CARD_SHARE.FORMAT", format: option })
                }
              >
                {format === option && (
                  <Text
                    accessible={false}
                    className="absolute left-1 top-1 text-base font-black text-black"
                  >
                    ✓
                  </Text>
                )}
                <View className="items-center px-2">
                  <Text>{copy[option].name}</Text>
                  <Text className="text-center text-sm font-bold text-black">
                    {copy[option].description}
                  </Text>
                </View>
              </Button>
            ))}
          </View>
          <View className="bg-player-card-background aspect-video w-full">
            {artifact ? (
              <CardImage
                source={{
                  uri: shouldReduceMotion
                    ? artifact.stillPreviewUri
                    : artifact.previewUri,
                }}
                contentFit="contain"
                className="h-full w-full"
                accessibilityLabel={localizedCopy.interfaceCopy.screen.cardPreview(
                  model.title,
                  model.values.map((value) => value.name),
                )}
                accessible
              />
            ) : (
              <View className="h-full items-center justify-center p-4">
                <Text
                  accessibilityLiveRegion="polite"
                  className="text-player-card-ink text-center font-bold"
                >
                  {state.matches("Preparing") ? copy.preparing : copy.failure}
                </Text>
              </View>
            )}
          </View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: includeHero,
              disabled: isDelivering,
            }}
            disabled={isDelivering}
            onPress={() =>
              send({ type: "CARD_SHARE.HERO", includeHero: !includeHero })
            }
            className="min-h-12 flex-row items-center gap-2"
          >
            <Text className="text-2xl text-white">
              {includeHero ? "☑" : "☐"}
            </Text>
            <Text className="min-w-0 flex-1 font-bold text-white">{copy.includeHero}</Text>
          </Pressable>
          {error && (
            <View className="gap-2 border-4 border-black bg-white p-3">
              <Text accessibilityRole="alert" className="font-bold text-black">
                {artifact ? copy.deliveryFailure : copy.failure}
              </Text>
              <Button
                variant="outline"
                size="compact"
                onPress={() => setShowDetails((value) => !value)}
              >
                <Text>{copy.details}</Text>
              </Button>
              {showDetails && (
                <Text selectable className="text-black">
                  {error}
                </Text>
              )}
            </View>
          )}
          <View className="mt-auto gap-2 pb-2">
            <View className="flex-row flex-wrap gap-2">
              <Button
                size="compact"
                className="min-w-0 grow basis-28"
                variant="outline"
                onPress={onClose}
              >
                <Text>{copy.back}</Text>
              </Button>
              {state.matches("Failed") ? (
                <Button
                  size="compact"
                  className="min-w-0 grow basis-28"
                  onPress={() => send({ type: "CARD_SHARE.RETRY" })}
                >
                  <Text>{copy.retry}</Text>
                </Button>
              ) : (
                <Button
                  size="compact"
                  className="min-w-0 grow basis-28"
                  disabled={!artifact || isDelivering}
                  onPress={() =>
                    send({ type: "CARD_SHARE.DELIVER", delivery: "save" })
                  }
                >
                  <Text>{copy.save(format)}</Text>
                </Button>
              )}
            </View>
            {!state.matches("Failed") && (
              <Button
                size="compact"
                variant="secondary"
                disabled={!artifact?.canShare || isDelivering}
                onPress={() =>
                  send({ type: "CARD_SHARE.DELIVER", delivery: "share" })
                }
              >
                <Text>{copy.share(format)}</Text>
              </Button>
            )}
          </View>
          {artifact && !artifact.canShare && (
            <Text className="text-sm text-white">{copy.unsupportedShare}</Text>
          )}
          {(isDelivering || outcome) && (
            <Text
              accessibilityLiveRegion="polite"
              className="text-center text-sm font-medium text-white"
            >
              {isDelivering
                ? copy.delivering
                : getValuesCardDeliveryMessage(outcome, copy)}
            </Text>
          )}
        </ScrollView>
      </MapacheScreen>
    </Modal>
  )
}
