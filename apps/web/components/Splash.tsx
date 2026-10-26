"use client"

import { FIRST_ARRIVAL_PRESENTATION } from "@game/data/src/FirstArrivalPresentation"
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@game/data/src/LocaleRegistry"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import RenderRecoveryBoundary from "@game/utils/src/RenderRecoveryBoundary"
import Image from "next/image"
import { lazy, Suspense, useCallback, useState } from "react"
import FirstArrivalRaccoon from "@/components/FirstArrivalRaccoon"
import InformationPanel from "@/components/InformationPanel"
import LanguageSelector from "@/components/LanguageSelector"
import useDeferredFirstArrival from "@/components/useDeferredFirstArrival"

const MapachitoIceCream = lazy(() => import("@/components/MapachitoIceCream"))

export default function Splash({
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
  const [hasIceCreamFinished, setHasIceCreamFinished] = useState(false)
  const shouldPlay = useDeferredFirstArrival(
    !shouldReduceMotion && !isPending && !hasFinished,
  )
  const handleStarted = useCallback(() => setHasStarted(true), [])
  const handleFinished = useCallback(() => setHasFinished(true), [])
  const handleIceCreamFinished = useCallback(
    () => setHasIceCreamFinished(true),
    [],
  )
  return (
    <InformationPanel
      presentation="introduction"
      title={introductionCopy.title}
      titleContent={firstArrival.titleLines.map((line, index) => (
        <span className="block xl:inline" key={line}>
          {index > 0 && " "}
          {line}
        </span>
      ))}
      titleDecoration={
        shouldPlay &&
        hasStarted && <FirstArrivalRaccoon onComplete={handleFinished} />
      }
      decoration={
        shouldPlay &&
        !hasIceCreamFinished && (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-10"
            data-testid="arrival-ice-cream"
          >
            <RenderRecoveryBoundary fallback={() => null}>
              <Suspense fallback={null}>
                <MapachitoIceCream
                  onStarted={handleStarted}
                  onFinished={handleIceCreamFinished}
                />
              </Suspense>
            </RenderRecoveryBoundary>
          </div>
        )
      }
      beforePrimaryAction={
        <LanguageSelector
          locale={locale}
          disabled={isPending}
          onLocaleChange={onLocaleChange}
        />
      }
      afterActions={
        <div className="relative grid min-h-37 shrink-0 place-items-center border-t-6 border-black bg-black px-4 py-4">
          <div className="absolute inset-0 mx-auto max-w-80">
            <Image
              src={FIRST_ARRIVAL_PRESENTATION.posterUrl}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="relative z-20 grid min-w-0 w-full justify-items-center text-xl leading-7 font-black text-white [overflow-wrap:anywhere]">
            <p>{firstArrival.gameCredit}</p>
            <p>{firstArrival.creatorCredit}</p>
            <a
              href={FIRST_ARRIVAL_PRESENTATION.creatorWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-mapache-vivid-primary-orange active:text-mapache-vivid-primary-orange relative no-underline transition-colors after:absolute after:-inset-x-2 after:-inset-y-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
            >
              {firstArrival.creatorWebsiteLabel}
            </a>
          </div>
        </div>
      }
      primaryActionLabel={introductionCopy.startAction}
      onPrimaryAction={onComplete}
      isPrimaryActionPending={isPending}
    >
      <div className="flex flex-col gap-4 text-black">
        {notice ? (
          <p
            role="status"
            className="bg-mapache-vivid-secondary-green text-mapache-vivid-dark border-4 border-black p-4 text-xl font-black shadow-[6px_6px_0px_0px_#000000]"
          >
            {notice}
          </p>
        ) : null}
        <p className="text-[22px] leading-snug font-bold xl:text-2xl">
          {introductionCopy.tagline}
        </p>
        {introductionCopy.body.map((paragraph) => (
          <p
            key={paragraph}
            className="text-lg leading-relaxed font-medium text-gray-800"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </InformationPanel>
  )
}
