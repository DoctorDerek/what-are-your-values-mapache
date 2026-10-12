"use client"

import { FIRST_ARRIVAL_PRESENTATION } from "@game/data/src/FirstArrivalPresentation"
import { introductionCopy } from "@game/data/src/IntroductionCopy"
import type { SupportedLocale } from "@game/machines/src/PlayerSettings"
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
      titleContent={FIRST_ARRIVAL_PRESENTATION.titleLines.map((line) => (
        <span className="block" key={line}>
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
        <div className="relative grid h-38 shrink-0 place-items-center border-t-4 border-black bg-black">
          <Image
            src={FIRST_ARRIVAL_PRESENTATION.posterUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="(min-width: 1280px) 896px, 100vw"
          />
          <div className="relative z-20 text-lg font-medium text-white">
            <p className="text-2xl font-black xl:text-[26px]">
              {FIRST_ARRIVAL_PRESENTATION.gameCredit}
            </p>
            <p>{FIRST_ARRIVAL_PRESENTATION.creatorCredit}</p>
            <a
              href={FIRST_ARRIVAL_PRESENTATION.creatorWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center hover:opacity-80 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white active:opacity-70"
            >
              {FIRST_ARRIVAL_PRESENTATION.creatorWebsiteLabel}
            </a>
          </div>
        </div>
      }
      primaryActionLabel={introductionCopy.startAction}
      onPrimaryAction={onComplete}
      isPrimaryActionPending={isPending}
    >
      <div className="flex flex-col gap-6 text-black">
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
            className="text-lg leading-relaxed font-medium text-gray-800 xl:text-xl"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </InformationPanel>
  )
}
