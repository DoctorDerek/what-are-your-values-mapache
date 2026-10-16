import { CANONICAL_VALUES } from "@game/data/src/CanonicalValues"
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@game/data/src/LocaleRegistry"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
} from "@game/data/src/Value"

export default function WebEditorialCanonicalValues({
  locale = DEFAULT_LOCALE,
}: {
  readonly locale?: SupportedLocale
}) {
  const localization = getLocaleCatalog(locale)
  return (
    <section
      id="included-values"
      aria-labelledby="included-values-title"
      className="scroll-mt-4 border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000000] xl:p-8"
    >
      <h2
        id="included-values-title"
        className="border-b-4 border-black pb-4 text-3xl leading-tight font-black uppercase xl:text-5xl"
      >
        {localization.interfaceCopy.screen.includedValueCount(
          String(CANONICAL_VALUES.length),
        )}
      </h2>
      <dl className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {CANONICAL_VALUES.map((canonicalValue) => (
          <div
            key={canonicalValue.id}
            className="bg-mapache-vivid-light border-4 border-black p-4 shadow-[5px_5px_0px_0px_#000000]"
          >
            <dt className="text-xl leading-tight font-black">
              {getValueDisplayName(canonicalValue, localization.values)}
            </dt>
            <dd className="mt-2 text-lg leading-relaxed font-medium">
              {getValueDisplayDefinition(canonicalValue, localization.values)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
