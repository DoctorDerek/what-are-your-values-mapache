import {
  getValuesCardDeliveryMessage,
  readValuesCardPalette,
  VALUES_CARD_COLOR_VARIABLES,
  VALUES_CARD_COPY as copy,
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

export default function NativeValuesCardShare({ model, shouldReduceMotion, onClose }: {
  readonly model: ValuesCardModel<number>
  readonly shouldReduceMotion: boolean
  readonly onClose: () => void
}) {
  const colors = useCSSVariable([...VALUES_CARD_COLOR_VARIABLES])
  const [showDetails, setShowDetails] = useState(false)
  const [state, send, actor] = useMachine(valuesCardShareMachine, {
    input: { prepare: (options) => prepareNativeValuesCard(model, readValuesCardPalette(colors), options) },
  })
  useEffect(() => () => { actor.getSnapshot().context.artifact?.dispose() }, [actor])
  const { artifact, format, includeHero, error, outcome } = state.context
  const isDelivering = state.matches("Delivering")
  return (
    <Modal visible animationType={shouldReduceMotion ? "none" : "fade"} onRequestClose={onClose}>
      <MapacheScreen>
        <ScrollView contentContainerClassName="gap-4 p-3 xl:p-6" accessibilityViewIsModal>
          <View className="flex-row items-center gap-3">
            <Button onPress={onClose} variant="secondary" size="compact"><Text>{copy.back}</Text></Button>
            <Text accessibilityRole="header" className="text-mapache-vivid-primary-cyan min-w-0 flex-1 text-xl font-black xl:text-3xl">{copy.title}</Text>
          </View>
          <View accessibilityLabel={copy.format} className="flex-row flex-wrap gap-3">
            {(["gif", "png"] as const).map((option) => (
              <Button key={option} size="compact" variant={format === option ? "secondary" : "outline"}
                accessibilityState={{ selected: format === option, disabled: isDelivering }} disabled={isDelivering}
                onPress={() => send({ type: "CARD_SHARE.FORMAT", format: option })}>
                <Text>{format === option ? "✓ " : ""}{copy[option]}</Text>
              </Button>
            ))}
          </View>
          <View className="bg-player-card-background aspect-video w-full">
            {artifact ? <CardImage source={{ uri: shouldReduceMotion ? artifact.stillPreviewUri : artifact.previewUri }}
              contentFit="contain" className="h-full w-full" accessibilityLabel={`${model.title}: ${model.values.map((value) => value.name).join(", ")}`} accessible />
              : <View className="h-full items-center justify-center p-4"><Text accessibilityLiveRegion="polite" className="text-player-card-ink text-center font-bold">{state.matches("Preparing") ? copy.preparing : copy.failure}</Text></View>}
          </View>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: includeHero, disabled: isDelivering }} disabled={isDelivering}
            onPress={() => send({ type: "CARD_SHARE.HERO", includeHero: !includeHero })} className="min-h-12 flex-row items-center gap-3">
            <Text className="text-2xl text-white">{includeHero ? "☑" : "☐"}</Text><Text className="font-bold text-white">{copy.includeHero}</Text>
          </Pressable>
          {error && <View className="gap-2 border-4 border-black bg-white p-3">
            <Text accessibilityRole="alert" className="font-bold text-black">{artifact ? copy.deliveryFailure : copy.failure}</Text>
            <Button variant="outline" size="compact" onPress={() => setShowDetails((value) => !value)}><Text>{copy.details}</Text></Button>
            {showDetails && <Text selectable className="text-black">{error}</Text>}
          </View>}
          {state.matches("Failed") ? <Button onPress={() => send({ type: "CARD_SHARE.RETRY" })}><Text>{copy.retry}</Text></Button> : <View className="flex-row gap-4">
            <Button className="min-w-0 flex-1" disabled={!artifact || isDelivering} onPress={() => send({ type: "CARD_SHARE.DELIVER", delivery: "save" })}><Text>{copy.save(format)}</Text></Button>
            <Button className="min-w-0 flex-1" variant="secondary" disabled={!artifact?.canShare || isDelivering} onPress={() => send({ type: "CARD_SHARE.DELIVER", delivery: "share" })}><Text>{copy.share(format)}</Text></Button>
          </View>}
          {artifact && !artifact.canShare && <Text className="text-sm text-white">{copy.unsupportedShare}</Text>}
          <Text accessibilityLiveRegion="polite" className="min-h-7 font-medium text-white">{isDelivering ? copy.delivering : getValuesCardDeliveryMessage(outcome)}</Text>
        </ScrollView>
      </MapacheScreen>
    </Modal>
  )
}
