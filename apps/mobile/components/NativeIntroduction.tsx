import { FIRST_ARRIVAL_PRESENTATION } from "@game/data/src/FirstArrivalPresentation"
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@game/data/src/LocaleRegistry"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
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
  locale = DEFAULT_LOCALE,
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
  const { introduction: introductionCopy, firstArrival } =
    getLocaleCatalog(locale)
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
      titleContent={firstArrival.titleLines.map((line, index) => (
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
        <View className="relative min-h-[min(148px,max(104px,calc(100vh-440px)))] shrink-0 items-center justify-center border-t-6 border-black bg-black px-4 py-[min(16px,max(8px,calc(100vh-430px)))]">
          <View className="absolute inset-0 mx-auto w-full max-w-80">
            <Image
              source={require("@game/data/assets/mapachito/ice-cream.png")}
              alt=""
              accessible={false}
              resizeMode="cover"
              className="h-full w-full"
            />
          </View>
          <View className="relative z-20 items-center">
            <Text className="text-center text-xl leading-7 font-black text-white">
              {firstArrival.gameCredit}
            </Text>
            <Text className="text-center text-xl leading-7 font-black text-white">
              {firstArrival.creatorCredit}
            </Text>
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => {
                void Linking.openURL(
                  FIRST_ARRIVAL_PRESENTATION.creatorWebsiteUrl,
                ).catch(() =>
                  Alert.alert(
                    firstArrival.websiteErrorTitle,
                    firstArrival.websiteErrorMessage,
                  ),
                )
              }}
              className="group/creator justify-center active:opacity-70"
            >
              <Text className="group-hover/creator:text-mapache-vivid-primary-orange text-center text-xl leading-7 font-black text-white">
                {firstArrival.creatorWebsiteLabel}
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
