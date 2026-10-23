import { createLocaleFormatters } from "@game/data/src/LocaleFormatters"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { AchievementPresentation } from "@game/machines/src/AchievementPresentation"
import { useMemo } from "react"
import { FlatList, ScrollView, View } from "react-native"
import MapacheScreen from "@/components/MapacheScreen"
import NativeAchievementCard from "@/components/NativeAchievementCard"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeAchievements({
  achievements,
  canClose,
  onClose,
}: {
  readonly achievements: readonly AchievementPresentation[]
  readonly canClose: boolean
  readonly onClose: () => void
}) {
  const localizedCopy = useLocaleCatalog()

  const { integer } = useMemo(
    () => createLocaleFormatters(localizedCopy.metadata.languageTag),
    [localizedCopy.metadata.languageTag],
  )
  const unlockedCount = achievements.filter(
    ({ status }) => status === "unlocked",
  ).length

  return (
    <MapacheScreen>
      <View className="mx-auto w-full max-w-5xl min-h-0 flex-1 p-4 xl:p-8">
      <FlatList
        className="min-h-0 flex-1"
        contentContainerClassName="pr-2 pb-2"
        data={achievements}
        keyExtractor={({ id }) => id}
        ListHeaderComponent={
          <View>
            <View className="flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <Text
                variant="h1"
                className="text-mapache-vivid-primary-cyan text-left text-xl font-black"
              >
                {localizedCopy.interfaceCopy.screen.achievements}
              </Text>
              <Text
                accessibilityLiveRegion="polite"
                className="bg-mapache-vivid-secondary-green max-w-full border-4 border-black px-2.5 py-1.5 text-base font-black text-black"
              >
                {localizedCopy.interfaceCopy.screen.achievementsUnlocked(
                  integer(unlockedCount),
                  integer(achievements.length),
                )}
              </Text>
            </View>
            <View className="border-x-4 border-t-4 border-black bg-white p-3 xl:p-5">
              <Text className="text-base leading-6 font-bold text-black">
                {localizedCopy.interfaceCopy.screen.achievementPrivacy}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View className="border-x-4 border-black bg-white px-3 pb-4 xl:px-5">
            <View className="pr-1">
              <NativeAchievementCard achievement={item} />
            </View>
          </View>
        )}
        ListFooterComponent={<View className="border-x-4 border-b-4 border-black bg-white pb-2" />}
      />
      <ScrollView className="max-h-[35%] shrink-0 grow-0" contentContainerClassName="items-end pt-3 pr-2 pb-2">
        <Button
          className="w-full xl:w-50"
          disabled={!canClose}
          variant="secondary"
          size="compact"
          onPress={onClose}
        >
          <Text className="text-center text-lg font-black text-black uppercase">{localizedCopy.interfaceCopy.controlActions.back}</Text>
        </Button>
      </ScrollView>
      </View>
    </MapacheScreen>
  )
}
