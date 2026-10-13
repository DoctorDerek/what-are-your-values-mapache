import { FIRST_ARRIVAL_PRESENTATION } from "@game/data/src/FirstArrivalPresentation"
import { introductionCopy } from "@game/data/src/IntroductionCopy"
import type { SupportedLocale } from "@game/machines/src/PlayerSettings"
import RenderRecoveryBoundary from "@game/utils/src/RenderRecoveryBoundary"
import { Fragment, lazy, Suspense, useCallback, useState } from "react"
import { Alert, Image, Linking, Pressable, View } from "react-native"
import NativeFirstArrivalRaccoon from "@/components/NativeFirstArrivalRaccoon"
import NativeInformationPanel from "@/components/NativeInformationPanel"
import NativeLanguageSelector from "@/components/NativeLanguageSelector"
import { Text } from "@/components/ui/text"
import useNativeDeferredFirstArrival from "@/components/useNativeDeferredFirstArrival"

const NativeMapachitoIceCream = lazy(
  () => import("@/components/NativeMapachitoIceCream"),
)

export default function NativeIntroduction({
  notice = null,
  isPending = false,
  locale = "en",
  shouldReduceMotion = false,
  onLocaleChange,
  onComplete,
}: {
  notice?: string | null
  isPending?: boolean
  locale?: SupportedLocale
  shouldReduceMotion?: boolean
  onLocaleChange: (locale: SupportedLocale) => void
  onComplete: () => void
}) {
  const [hasStarted, setHasStarted] = useState(false)
  const [hasFinished, setHasFinished] = useState(false)
  const shouldPlay = useNativeDeferredFirstArrival(
    !shouldReduceMotion && !isPending && !hasFinished,
  )
  const handleStarted = useCallback(() => setHasStarted(true), [])
  const handleFinished = useCallback(() => setHasFinished(true), [])
  return (
    <NativeInformationPanel
      presentation="introduction"
      title={introductionCopy.title}
      titleContent={FIRST_ARRIVAL_PRESENTATION.titleLines.map((line, index) => (
        <Fragment key={line}>
          {index > 0 && <Text className="xl:hidden">{"\n"}</Text>}
          {index > 0 && " "}
          {line}
        </Fragment>
      ))}
      titleDecoration={
        shouldPlay &&
        hasStarted && <NativeFirstArrivalRaccoon onComplete={handleFinished} />
      }
      decoration={
        shouldPlay && (
          <View
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="absolute top-1/2 left-1/2 z-10 h-screen w-screen -translate-x-1/2 -translate-y-1/2"
          >
            <RenderRecoveryBoundary fallback={() => null}>
              <Suspense fallback={null}>
                <NativeMapachitoIceCream
                  onStarted={handleStarted}
                  onUnavailable={handleFinished}
                />
              </Suspense>
            </RenderRecoveryBoundary>
          </View>
        )
      }
      beforePrimaryAction={
        <NativeLanguageSelector
          locale={locale}
          disabled={isPending}
          onLocaleChange={onLocaleChange}
        />
      }
      afterActions={
        <View className="relative h-38 shrink-0 items-center justify-center border-t-4 border-black bg-black">
          <View className="absolute inset-0 mx-auto w-full max-w-100">
            <Image
              source={require("@game/data/assets/mapachito/ice-cream.png")}
              alt=""
              accessible={false}
              resizeMode="cover"
              className="h-full w-full"
            />
          </View>
          <View className="relative z-20 items-center gap-1 py-2">
            <Text className="text-center text-2xl leading-7 font-black text-white xl:text-[26px]">
              {FIRST_ARRIVAL_PRESENTATION.gameCredit}
            </Text>
            <Text className="text-center text-lg leading-7 font-medium text-white">
              {FIRST_ARRIVAL_PRESENTATION.creatorCredit}
            </Text>
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => {
                void Linking.openURL(
                  FIRST_ARRIVAL_PRESENTATION.creatorWebsiteUrl,
                ).catch(() =>
                  Alert.alert(
                    FIRST_ARRIVAL_PRESENTATION.websiteErrorTitle,
                    FIRST_ARRIVAL_PRESENTATION.websiteErrorMessage,
                  ),
                )
              }}
              className="justify-center active:opacity-70"
            >
              <Text className="text-center text-lg leading-7 font-medium text-white">
                {FIRST_ARRIVAL_PRESENTATION.creatorWebsiteLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      }
      primaryActionLabel={introductionCopy.startAction}
      onPrimaryAction={onComplete}
      isPrimaryActionPending={isPending}
    >
      <View className="gap-4">
        {notice ? (
          <Text
            accessibilityLiveRegion="polite"
            className="bg-mapache-vivid-secondary-green border-4 border-black p-4 text-lg font-black text-black"
          >
            {notice}
          </Text>
        ) : null}
        <Text className="text-2xl leading-8 font-black text-black">
          {introductionCopy.tagline}
        </Text>
        {introductionCopy.body.map((paragraph) => (
          <Text
            key={paragraph}
            className="text-lg leading-7 font-medium text-black"
          >
            {paragraph}
          </Text>
        ))}
      </View>
    </NativeInformationPanel>
  )
}
