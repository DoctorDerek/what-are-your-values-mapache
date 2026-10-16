import { createLocaleFormatters } from "@game/data/src/LocaleFormatters"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { AchievementPresentation } from "@game/machines/src/AchievementPresentation"
import { useMemo } from "react"
import { FlatList, View } from "react-native"
import MapacheScreen from "@/components/MapacheScreen"
import NativeAchievementCard from "@/components/NativeAchievementCard"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeAchievements({
  achievements,
  canOpenMenu,
  onClose,
  onOpenMenu,
}: {
  readonly achievements: readonly AchievementPresentation[]
  readonly canOpenMenu: boolean
  readonly onClose: () => void
  readonly onOpenMenu: () => void
}) {
  const localizedCopy = useLocaleCatalog()
  const PRODUCT_MENU_COPY = localizedCopy.interfaceCopy.menu

  const { integer } = useMemo(
    () => createLocaleFormatters(localizedCopy.metadata.languageTag),
    [localizedCopy.metadata.languageTag],
  )
  const unlockedCount = achievements.filter(
    ({ status }) => status === "unlocked",
  ).length

  return (
    <MapacheScreen>
      <View className="gap-4 border-b-4 border-black p-4">
        <Text
          variant="h1"
          className="text-mapache-vivid-primary-cyan text-left text-4xl font-black tracking-tight uppercase"
        >
          {localizedCopy.interfaceCopy.screen.achievements}
        </Text>
        <View className="flex-row gap-3">
          <Button
            className="flex-1"
            disabled={!canOpenMenu}
            variant="outline"
            onPress={onOpenMenu}
          >
            <Text>{PRODUCT_MENU_COPY.openAction}</Text>
          </Button>
          <Button
            className="flex-1"
            disabled={!canOpenMenu}
            variant="secondary"
            onPress={onClose}
          >
            <Text>{localizedCopy.interfaceCopy.screen.backToValues}</Text>
          </Button>
        </View>
      </View>
      <FlatList
        className="flex-1 px-4"
        contentContainerClassName="gap-4 py-5 pb-10"
        data={achievements}
        keyExtractor={({ id }) => id}
        ListHeaderComponent={
          <View className="gap-4">
            <View className="border-4 border-black bg-white p-4 shadow-[5px_5px_0px_0px_#000000]">
              <Text
                accessibilityRole="header"
                className="text-3xl font-black text-black uppercase"
              >
                {localizedCopy.interfaceCopy.screen.localMilestones}
              </Text>
              <Text className="mt-3 text-lg leading-7 font-bold text-black">
                {localizedCopy.interfaceCopy.screen.achievementPrivacy}
              </Text>
            </View>
            <Text
              accessibilityLiveRegion="polite"
              className="bg-mapache-vivid-secondary-green border-4 border-black p-4 text-xl font-black text-black uppercase"
            >
              {localizedCopy.interfaceCopy.screen.achievementsUnlocked(
                integer(unlockedCount),
                integer(achievements.length),
              )}
            </Text>
          </View>
        }
        renderItem={({ item }) => <NativeAchievementCard achievement={item} />}
      />
    </MapacheScreen>
  )
}
