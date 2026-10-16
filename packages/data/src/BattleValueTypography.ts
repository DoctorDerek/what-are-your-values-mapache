import {
  getValueDisplayName,
  type ActiveValueDefinition,
  type CanonicalValueId,
  type LocalizedValueCopy,
} from "./Value"

const BATTLE_VALUE_WORD_BREAKS: ReadonlyMap<string, string> = new Map([
  ["Acceptance", "Accep\u00adtance"],
  ["Achievement", "Achieve\u00adment"],
  ["Adventure", "Adven\u00adture"],
  ["Attractiveness", "Attrac\u00adtive\u00adness"],
  ["Autonomy", "Auton\u00adomy"],
  ["Commitment", "Com\u00admit\u00adment"],
  ["Compassion", "Com\u00adpas\u00adsion"],
  ["Complexity", "Com\u00adplex\u00adity"],
  ["Compromise", "Com\u00adpro\u00admise"],
  ["Contribution", "Con\u00adtri\u00adbu\u00adtion"],
  ["Cooperation", "Co\u00adoper\u00adation"],
  ["Dependability", "Depend\u00adability"],
  ["Excitement", "Excite\u00adment"],
  ["Faithfulness", "Faith\u00adful\u00adness"],
  ["Forgiveness", "For\u00adgive\u00adness"],
  ["Generosity", "Gen\u00ader\u00ados\u00adity"],
  ["Genuineness", "Gen\u00aduine\u00adness"],
  ["Imagination", "Imag\u00adina\u00adtion"],
  ["Independence", "Inde\u00adpend\u00adence"],
  ["Intelligence", "Intel\u00adli\u00adgence"],
  ["Knowledge", "Knowl\u00adedge"],
  ["Leadership", "Lead\u00ader\u00adship"],
  ["Mindfulness", "Mind\u00adful\u00adness"],
  ["Moderation", "Mod\u00ader\u00adation"],
  ["Monogamy", "Monog\u00adamy"],
  ["Conformity", "Con\u00adform\u00adity"],
  ["Nurturance", "Nur\u00adtur\u00adance"],
  ["Practicality", "Prac\u00adti\u00adcal\u00adity"],
  ["Rationality", "Ration\u00adal\u00adity"],
  ["Responsibility", "Re\u00adspon\u00adsi\u00adbil\u00adity"],
  ["Spirituality", "Spir\u00aditual\u00adity"],
])

export function getBattleValueDisplayName(
  value: ActiveValueDefinition,
  translations?: ReadonlyMap<CanonicalValueId, LocalizedValueCopy>,
  languageTag = "en-US",
): string {
  const name = getValueDisplayName(value, translations)
  return value.kind === "canonical" && languageTag.split("-")[0] === "en"
    ? name.replace(
        /[A-Za-z]+/g,
        (word) => BATTLE_VALUE_WORD_BREAKS.get(word) ?? word,
      )
    : name
}
