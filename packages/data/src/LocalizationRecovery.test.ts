import { describe, expect, it } from "vitest"
import { CANONICAL_VALUES } from "./CanonicalValues"
import { ENGLISH_LOCALIZATION_CATALOG as english } from "./EnglishLocalizationCatalog"
import {
  isLocalizationObject,
  readLocalizationField,
  resolveLocalizedFormatter,
  resolveLocalizedText,
  resolveLocalizedTextList,
} from "./LocalizationRecovery"
import { resolveLocalizationCatalog } from "./ResolveLocalizationCatalog"

describe("shared localization recovery", () => {
  it("keeps valid selected copy and repairs only damaged fields", () => {
    const selected = {
      ...english,
      metadata: { ...english.metadata, languageTag: "es-MX" },
      introduction: {
        ...english.introduction,
        startAction: " ",
        tagline: "⟦Selected tagline⟧",
      },
      values: english.values.map(([id, copy], index) => [
        id,
        index === 0
          ? { name: null, definition: "⟦Selected definition⟧" }
          : copy,
      ]),
    }
    const { catalog, issues } = resolveLocalizationCatalog("es-MX", selected)
    expect(catalog.metadata.languageTag).toBe("es-MX")
    expect(catalog.introduction.startAction).toBe(
      english.introduction.startAction,
    )
    expect(catalog.introduction.tagline).toBe("⟦Selected tagline⟧")
    expect(catalog.values.get(CANONICAL_VALUES[0].id)).toEqual({
      name: CANONICAL_VALUES[0].englishName,
      definition: "⟦Selected definition⟧",
    })
    expect(issues).toEqual([
      {
        locale: "es-MX",
        key: `values.${CANONICAL_VALUES[0].id}.name`,
        reason: "missing",
        fallback: "english",
      },
      {
        locale: "es-MX",
        key: "introduction.startAction",
        reason: "blank",
        fallback: "english",
      },
    ])
    expect(selected.introduction.startAction).toBe(" ")
    expect(resolveLocalizationCatalog("es-MX", english).issues).toEqual([])
  })

  it("detects missing fields independently of both damaged input and English", () => {
    const expected = resolveLocalizationCatalog("en", english).catalog
    for (const [section, copy] of Object.entries(expected)) {
      if (section === "values" || !isLocalizationObject(copy)) continue
      for (const key of Object.keys(copy)) {
        const raw = readLocalizationField(english, section)
        if (!isLocalizationObject(raw))
          throw new Error("Expected authored copy section")
        const damaged = { ...english, [section]: { ...raw, [key]: undefined } }
        const result = resolveLocalizationCatalog("en", damaged, damaged)
        expect(result.issues, `${section}.${key}`).toContainEqual({
          locale: "en",
          key: `${section}.${key}`,
          reason: "missing",
          fallback: "emergency",
        })
        expect(result.catalog.introduction.startAction).not.toBe("")
        expect(result.catalog.hub.battle).not.toBe("")
      }
    }
  })

  it.each([
    null,
    undefined,
    "corrupt",
    7,
    [],
    { introduction: false, values: {} },
  ])("survives a malformed catalog and malformed English: %j", (damaged) => {
    const { catalog, issues } = resolveLocalizationCatalog(
      "es-MX",
      damaged,
      damaged ?? null,
    )
    expect(issues.length).toBeGreaterThan(100)
    expect(catalog.introduction.startAction).toBe("Start")
    expect(catalog.language.heading).toBe("Language")
    expect(catalog.language.closeAction).toBe("Back")
    expect(catalog.firstArrival.titleLines).toEqual([
      "What Are Your Values, Mapache?",
    ])
    expect(catalog.introduction.body).toEqual([])
    expect(catalog.card.retry).toBe("Retry")
    expect(catalog.card.failure).not.toMatch(/saved|success/i)
    expect(catalog.card.save("gif")).toBe("Save GIF")
    expect(catalog.card.share("png")).toBe("Share PNG")
    expect(catalog.hub.level(7)).toBe("Level 7")
    expect(catalog.card.rank("12")).toBe("#12")
    expect([...catalog.values.keys()]).toEqual(
      CANONICAL_VALUES.map(({ id }) => id),
    )
    for (const value of CANONICAL_VALUES)
      expect(catalog.values.get(value.id)).toEqual({
        name: value.englishName,
        definition: value.sourceDefinition,
      })
    expect(issues).toContainEqual({
      locale: "en",
      key: "language.heading",
      reason: "missing",
      fallback: "emergency",
    })
  })

  it("detects duplicate IDs before map construction and restores missing values", () => {
    const [first, second] = english.values
    const { catalog, issues } = resolveLocalizationCatalog("es-MX", {
      ...english,
      values: [
        first,
        [first[0], { name: "Duplicate", definition: "Wrong" }],
        ...english.values.slice(2),
      ],
    })
    expect(catalog.values.size).toBe(103)
    expect(catalog.values.get(first[0])).toEqual(first[1])
    expect(catalog.values.get(second[0])).toEqual(second[1])
    expect(issues).toContainEqual({
      locale: "es-MX",
      key: `values.${first[0]}`,
      reason: "duplicate",
      fallback: null,
    })
    expect(issues).toContainEqual({
      locale: "es-MX",
      key: `values.${second[0]}.name`,
      reason: "missing",
      fallback: "english",
    })
  })

  it("records malformed entries and extra keys without retaining their contents", () => {
    const privateText = "Private custom value or formatter error"
    const { issues } = resolveLocalizationCatalog("es-MX", {
      ...english,
      [privateText]: true,
      language: { ...english.language, [privateText]: true },
      values: [
        ...english.values.map(([id, copy], index) => [
          id,
          index === 0 ? { ...copy, [privateText]: true } : copy,
        ]),
        null,
        [42],
        [privateText, privateText],
      ],
    })
    expect(issues.map(({ reason }) => reason)).toContain("invalid-type")
    expect(
      issues.filter(({ reason }) => reason === "unexpected-key"),
    ).toHaveLength(4)
    expect(JSON.stringify(issues)).not.toContain(privateText)
  })

  it("repairs broken language tags, lists, and throwing or invalid formatter results", () => {
    const selected = {
      ...english,
      metadata: { ...english.metadata, languageTag: "broken_locale" },
      introduction: { ...english.introduction, body: ["Valid", " "] },
      firstArrival: { ...english.firstArrival, titleLines: [] },
      hub: {
        ...english.hub,
        level: () => {
          throw new Error("private error")
        },
      },
      card: {
        ...english.card,
        rank: () => false,
        save: "not callable",
        share: () => " ",
      },
    }
    const { catalog, issues } = resolveLocalizationCatalog("es-MX", selected)
    expect(catalog.metadata.languageTag).toBe("en-US")
    expect(catalog.introduction.body).toEqual(english.introduction.body)
    expect(catalog.firstArrival.titleLines).toEqual(
      english.firstArrival.titleLines,
    )
    expect(catalog.hub.level(19)).toBe(english.hub.level(19))
    expect(catalog.card.rank("12")).toBe(english.card.rank("12"))
    expect(catalog.card.save("png")).toBe(english.card.save("png"))
    expect(catalog.card.share("gif")).toBe(english.card.share("gif"))
    expect(issues).toHaveLength(7)
    expect(issues).toContainEqual({
      locale: "es-MX",
      key: "metadata.languageTag",
      reason: "invalid-value",
      fallback: "english",
    })
    expect(issues).toContainEqual({
      locale: "es-MX",
      key: "hub.level",
      reason: "formatter-failed",
      fallback: "english",
    })
    expect(JSON.stringify(issues)).not.toContain("private error")
  })

  it("contains a parameter-specific formatter failure at the actual call", () => {
    const selected = (level: number) => {
      if (level === 37) throw new Error("Bad branch")
      return `⟦Level ${level}⟧`
    }
    const { catalog } = resolveLocalizationCatalog("es-MX", {
      ...english,
      hub: { ...english.hub, level: selected },
    })
    expect(catalog.hub.level(36)).toBe("⟦Level 36⟧")
    expect(catalog.hub.level(37)).toBe(english.hub.level(37))
    const result = resolveLocalizedFormatter(
      "es-MX",
      "hub.level",
      selected,
      english.hub.level,
      () => "Level",
      [37],
    )
    expect(result.issues).toEqual([
      {
        locale: "es-MX",
        key: "hub.level",
        reason: "formatter-failed",
        fallback: "english",
      },
    ])
    expect(
      resolveLocalizedFormatter(
        "es-MX",
        "hub.level",
        false,
        () => null,
        () => "Level",
        [37],
      ).source,
    ).toBe("emergency")
  })

  it("does not confuse falsy, blank, and wrong-typed text with valid copy", () => {
    expect(
      resolveLocalizedText("es-MX", "heading", "0", "English", "Emergency")
        .source,
    ).toBe("selected")
    for (const value of ["", " ", false, 0, {}, []]) {
      const result = resolveLocalizedText(
        "es-MX",
        "heading",
        value,
        "English",
        "Emergency",
      )
      expect(result.value).toBe("English")
      expect(result.issues).toHaveLength(1)
    }
    expect(
      resolveLocalizedText("es-MX", "optional", undefined, null, "").value,
    ).toBe("")
    expect(
      resolveLocalizedTextList(
        "en",
        "titleLines",
        Array(2),
        ["Title"],
        ["Fallback"],
      ).source,
    ).toBe("english")
  })
})
