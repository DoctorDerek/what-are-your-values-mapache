import {
  DEFAULT_LOCALE,
  SHIPPED_LOCALES,
  type SupportedLocale,
} from "@game/data/src/LocaleRegistry"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import GameIsland from "@/components/GameIsland"
import WebEditorialCanonicalValues from "@/components/WebEditorialCanonicalValues"
import WebEditorialInformation from "@/components/WebEditorialInformation"

export default function WebPublicPage({
  locale = DEFAULT_LOCALE,
}: {
  readonly locale?: SupportedLocale
}) {
  const localization = getLocaleCatalog(locale)
  const copy = localization.interfaceCopy.screen
  return (
    <>
      <GameIsland
        routeLocale={locale === DEFAULT_LOCALE ? undefined : locale}
      />
      <article
        aria-label={copy.publicInformation(localization.introduction.title)}
        className="noise-bg bg-mapache-vivid-dark text-mapache-vivid-dark px-[max(1rem,env(safe-area-inset-left,0px))] pt-[max(2.5rem,env(safe-area-inset-top,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] peer-has-[[data-game-surface=active]]:hidden xl:px-[max(2rem,env(safe-area-inset-left,0px))] xl:pr-[max(2rem,env(safe-area-inset-right,0px))] xl:pb-[max(4rem,env(safe-area-inset-bottom,0px))]"
      >
        <div className="mx-auto grid max-w-7xl min-w-0 grid-cols-1 gap-10">
          <a
            href="#game"
            className="bg-mapache-vivid-secondary-green text-mapache-vivid-dark w-fit max-w-full border-4 border-black px-5 py-4 text-xl font-black uppercase shadow-[6px_6px_0px_0px_#000000] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {copy.startOrContinueGame}
          </a>
          <nav
            aria-label={localization.language.heading}
            className="flex flex-wrap gap-4"
          >
            {SHIPPED_LOCALES.map((language) => {
              const catalog = getLocaleCatalog(language)
              return (
                <a
                  key={language}
                  href={catalog.metadata.webPath}
                  lang={catalog.metadata.languageTag}
                  hrefLang={catalog.metadata.languageTag}
                  aria-current={language === locale ? "page" : undefined}
                  className="border-4 border-black bg-white px-4 py-3 font-bold focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {catalog.metadata.languageName}
                </a>
              )
            })}
          </nav>
          <WebEditorialInformation locale={locale} />
          <WebEditorialCanonicalValues locale={locale} />
          <section
            id="support"
            aria-labelledby="support-title"
            className="min-w-0 scroll-mt-4 border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000000] xl:p-8"
          >
            <h2
              id="support-title"
              className="border-b-4 border-black pb-4 text-3xl leading-tight font-black uppercase xl:text-5xl"
            >
              {copy.support}
            </h2>
            <a
              href="mailto:derekraustin+wayvm@gmail.com"
              className="bg-mapache-vivid-primary-cyan text-mapache-vivid-black! mt-6 inline-block max-w-full border-4 border-black px-4 py-3 text-lg font-black [overflow-wrap:anywhere] uppercase shadow-[5px_5px_0px_0px_#000000] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-black"
            >
              {copy.reportProblem}
            </a>
          </section>
        </div>
      </article>
    </>
  )
}
