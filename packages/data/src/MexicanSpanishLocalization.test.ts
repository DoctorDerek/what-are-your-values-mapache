import { describe, expect, it } from "vitest"
import { CANONICAL_VALUES } from "./CanonicalValues"
import { ENGLISH_LOCALIZATION_CATALOG } from "./EnglishLocalizationCatalog"
import { getLocaleCatalog } from "./LocalizationCatalog"
import { isLocalizationObject } from "./LocalizationRecovery"
import { MEXICAN_SPANISH_LOCALIZATION_CATALOG } from "./MexicanSpanishLocalizationCatalog"
import { resolveLocalizationCatalog } from "./ResolveLocalizationCatalog"
import { createCanonicalValueId } from "./Value"

describe("Mexican Spanish catalog", () => {
  const spanish = getLocaleCatalog("es-MX")

  it("keeps all canonical identities and distinct authored meanings", () => {
    expect([...spanish.values.keys()]).toEqual(
      CANONICAL_VALUES.map(({ id }) => id),
    )
    expect(
      new Set([...spanish.values.values()].map(({ name }) => name)).size,
    ).toBe(103)
    const value = (id: string) => spanish.values.get(createCanonicalValueId(id))
    expect(value("pvcs-2011:acceptance")?.definition).toBe(
      "que me acepten tal como soy",
    )
    expect(value("pvcs-2011:self-acceptance")?.definition).toBe(
      "aceptarme tal como soy",
    )
    expect(value("pvcs-2011:commitment")?.name).not.toBe(
      value("pvcs-2011:compromise")?.name,
    )
    expect(value("pvcs-2011:loved")?.name).toBe("Recibir amor")
    expect(value("pvcs-2011:loving")?.name).toBe("Dar amor")
    expect(value("pvcs-2011:sexuality")?.definition).toBe(
      "tener una vida sexual activa y satisfactoria",
    )
    expect(value("wayvm:ingenuity")?.name).toBe("Ingenio")
  })

  it("uses singular and plural progress without losing interpolated private text", () => {
    const { progression, screen } = spanish.interfaceCopy
    expect(progression.battleTitle("1")).toBe("1 batalla")
    expect(progression.battleTitle("2")).toBe("2 batallas")
    expect(progression.battleReason("1")).toBe("1 par comparado.")
    expect(progression.battleRequirement("1")).toBe("Compara 1 par de valores.")
    expect(progression.topFiveProgress("1")).toBe("Valores con XP: 1 de 5")
    expect(screen.valuesShown(0, "0")).toBe("0 valores mostrados")
    expect(screen.valuesShown(1, "1")).toBe("1 valor mostrado")
    expect(screen.valuesShown(103, "103")).toBe("103 valores mostrados")
    expect(
      progression.selection("Mi valor “私の価値”", "400", "Salud o Ingenio"),
    ).toBe(
      "Elegiste Mi valor “私の価値”. Ganaste 400 XP. Siguiente: Salud o Ingenio.",
    )
  })

  it("keeps the Spanish game usable with damaged copy while exposing quality defects", () => {
    const authored = MEXICAN_SPANISH_LOCALIZATION_CATALOG
    const result = resolveLocalizationCatalog("es-MX", {
      ...authored,
      introduction: { ...authored.introduction, startAction: null },
      values: authored.values.map(([id, copy], index) => [
        id,
        index === 0 ? { ...copy, name: " " } : copy,
      ]),
      interfaceCopy: {
        ...authored.interfaceCopy,
        results: {
          ...authored.interfaceCopy.results,
          keepBattlingAction: undefined,
        },
      },
    })
    expect(result.issues).toHaveLength(3)
    expect(result.catalog.introduction.startAction).toBe("Start")
    expect(result.catalog.interfaceCopy.results.keepBattlingAction).toBe(
      "Keep battling",
    )
    expect(result.catalog.interfaceCopy.results.seeValuesAction).toBe(
      "Ver mis valores",
    )
    expect(result.catalog.values.get(CANONICAL_VALUES[0].id)?.name).toBe(
      "Acceptance",
    )
    expect(result.catalog.values.get(CANONICAL_VALUES[1].id)?.name).toBe(
      "Exactitud",
    )
    expect(result.issues.every(({ fallback }) => fallback === "english")).toBe(
      true,
    )
  })

  it("does not silently carry English copy outside intentional names, formats, and hardware legends", () => {
    const unchanged: string[] = []
    const visit = (source: unknown, selected: unknown, path: string) => {
      if (typeof source === "string" && source && source === selected)
        unchanged.push(path)
      else if (Array.isArray(source) && Array.isArray(selected))
        source.forEach((entry, index) =>
          visit(entry, selected[index], `${path}.${index}`),
        )
      else if (isLocalizationObject(source) && isLocalizationObject(selected)) {
        for (const [key, entry] of Object.entries(source)) {
          if (
            !["id", "kind", "value", "command", "actionId", "url"].includes(key)
          )
            visit(entry, selected[key], `${path}.${key}`)
        }
      }
    }
    visit(
      ENGLISH_LOCALIZATION_CATALOG.interfaceCopy,
      MEXICAN_SPANISH_LOCALIZATION_CATALOG.interfaceCopy,
      "interfaceCopy",
    )
    expect(unchanged).toEqual([
      "interfaceCopy.screen.xp",
      "interfaceCopy.battleSpeed.options.0.label",
      "interfaceCopy.battleSpeed.options.1.label",
      "interfaceCopy.battleSpeed.options.2.label",
      "interfaceCopy.webControls.1.bindings.6.input",
      "interfaceCopy.controllerBindings.5.input",
      "interfaceCopy.controllerBindings.6.input",
      "interfaceCopy.controllerButtonLabels.generic.select-first-value",
      "interfaceCopy.controllerButtonLabels.generic.select-second-value",
      "interfaceCopy.controllerButtonLabels.xbox.confirm",
      "interfaceCopy.controllerButtonLabels.xbox.cancel",
      "interfaceCopy.controllerButtonLabels.xbox.redo",
      "interfaceCopy.controllerButtonLabels.xbox.select-first-value",
      "interfaceCopy.controllerButtonLabels.xbox.select-second-value",
      "interfaceCopy.controllerButtonLabels.xbox.menu",
      "interfaceCopy.controllerButtonLabels.xbox.back",
      "interfaceCopy.controllerButtonLabels.playstation.select-first-value",
      "interfaceCopy.controllerButtonLabels.playstation.select-second-value",
      "interfaceCopy.controllerButtonLabels.playstation.menu",
      "interfaceCopy.controllerButtonLabels.playstation.back",
      "interfaceCopy.controllerButtonLabels.nintendo.confirm",
      "interfaceCopy.controllerButtonLabels.nintendo.cancel",
      "interfaceCopy.controllerButtonLabels.nintendo.redo",
      "interfaceCopy.controllerButtonLabels.nintendo.select-first-value",
      "interfaceCopy.controllerButtonLabels.nintendo.select-second-value",
      "interfaceCopy.controllerButtonLabels.nintendo.menu",
      "interfaceCopy.controllerButtonLabels.nintendo.back",
      "interfaceCopy.controllerButtonLabels.steam-deck.confirm",
      "interfaceCopy.controllerButtonLabels.steam-deck.cancel",
      "interfaceCopy.controllerButtonLabels.steam-deck.redo",
      "interfaceCopy.controllerButtonLabels.steam-deck.select-first-value",
      "interfaceCopy.controllerButtonLabels.steam-deck.select-second-value",
      "interfaceCopy.controllerButtonLabels.steam-deck.menu",
      "interfaceCopy.controllerButtonLabels.steam-deck.back",
      "interfaceCopy.controllerButtonLabels.steam.confirm",
      "interfaceCopy.controllerButtonLabels.steam.cancel",
      "interfaceCopy.controllerButtonLabels.steam.redo",
      "interfaceCopy.controllerButtonLabels.steam.select-first-value",
      "interfaceCopy.controllerButtonLabels.steam.select-second-value",
      "interfaceCopy.controllerButtonLabels.steam.menu",
      "interfaceCopy.controllerButtonLabels.steam.back",
      "interfaceCopy.information.why-i-made-this-game.blocks.7.text",
      "interfaceCopy.information.free-resources.blocks.7.title",
      "interfaceCopy.information.free-resources.blocks.8.title",
      "interfaceCopy.information.credits-privacy.blocks.6.title",
      "interfaceCopy.information.credits-privacy.blocks.8.title",
      "interfaceCopy.information.credits-privacy.blocks.11.title",
    ])
  })
})
