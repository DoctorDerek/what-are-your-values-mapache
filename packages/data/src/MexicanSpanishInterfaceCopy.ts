import type { InterfaceCopy } from "./EnglishInterfaceCopy"
import { INFORMATION_PANEL_IDS } from "./InformationPanels"
import { MEXICAN_SPANISH_CONTROLS_COPY } from "./MexicanSpanishControlsCopy"
import { MEXICAN_SPANISH_CUSTOMIZATION_COPY } from "./MexicanSpanishCustomizationCopy"
import { MEXICAN_SPANISH_INFORMATION_COPY } from "./MexicanSpanishInformationCopy"
import {
  MEXICAN_SPANISH_PROGRESSION_COPY,
  MEXICAN_SPANISH_RANK_COPY,
  MEXICAN_SPANISH_RESULTS_COPY,
} from "./MexicanSpanishProgressionCopy"
import { MEXICAN_SPANISH_RECOVERY_COPY } from "./MexicanSpanishRecoveryCopy"
import { MEXICAN_SPANISH_SCREEN_COPY } from "./MexicanSpanishScreenCopy"

export const MEXICAN_SPANISH_INTERFACE_COPY: InterfaceCopy = {
  screen: MEXICAN_SPANISH_SCREEN_COPY,
  progression: MEXICAN_SPANISH_PROGRESSION_COPY,
  ...MEXICAN_SPANISH_CONTROLS_COPY,
  rank: MEXICAN_SPANISH_RANK_COPY,
  ...MEXICAN_SPANISH_CUSTOMIZATION_COPY,
  information: MEXICAN_SPANISH_INFORMATION_COPY,
  ...MEXICAN_SPANISH_RECOVERY_COPY,
  settings: {
    title: "Configuración",
    closeAction: "Volver",
    languageHeading: "Idioma",
    reducedMotionHeading: "Reducir movimiento",
    controlHintsHeading: "Indicaciones de controles",
    resetHeading: "Reiniciar o eliminar",
    savingStatus: "Guardando configuración…",
  },
  reducedMotionOptions: [
    {
      value: "system",
      label: "Seguir al sistema",
      description:
        "Usa la configuración de movimiento de tu dispositivo o navegador.",
    },
    { value: "on", label: "Activado", description: "Minimiza el movimiento." },
    {
      value: "off",
      label: "Desactivado",
      description: "Usa todo el movimiento.",
    },
  ],
  controlHintOptions: [
    {
      value: "auto",
      label: "Automáticas",
      description:
        "Muestra indicaciones para el método de entrada que estás usando.",
    },
    {
      value: "always",
      label: "Siempre",
      description:
        "Muestra siempre la indicación del método de entrada actual.",
    },
    {
      value: "off",
      label: "Desactivadas",
      description: "Oculta las indicaciones de controles.",
    },
  ],
  loading: {
    preparing: "Preparando…",
    cancelBattlePreparation: "Preparando batalla. Presiona para cancelar.",
  },
  menu: {
    title: "Menú",
    openAction: "Menú",
    closeAction: "Cerrar menú",
    resumeBattleAction: "Reanudar batalla",
  },
  menuDestinations: [
    { kind: "route", id: "browse-all-values", label: "Ver todos los valores" },
    { kind: "route", id: "custom-values", label: "Valores personalizados" },
    { kind: "route", id: "achievements", label: "Logros" },
    { kind: "route", id: "settings", label: "Configuración" },
    { kind: "route", id: "controls", label: "Controles" },
    { kind: "route", id: "import-export", label: "Importar y exportar" },
    ...INFORMATION_PANEL_IDS.map((id) => ({
      kind: "information-panel" as const,
      id,
      label:
        id === "introduction"
          ? "Introducción"
          : MEXICAN_SPANISH_INFORMATION_COPY[id].title,
    })),
  ],
  results: MEXICAN_SPANISH_RESULTS_COPY,
}
