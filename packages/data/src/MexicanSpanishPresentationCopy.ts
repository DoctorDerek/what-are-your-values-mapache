import type { AuthoredLocalizationCatalog } from "./LocalizationCatalog"

const rankedTitleLines = Object.freeze([
  "Mis cinco principales",
  "valores de vida",
])

export const MEXICAN_SPANISH_PRESENTATION_COPY: Pick<
  AuthoredLocalizationCatalog,
  | "metadata"
  | "introduction"
  | "firstArrival"
  | "language"
  | "hub"
  | "card"
  | "seo"
> = {
  metadata: {
    languageTag: "es-MX",
    languageName: "Español (México)",
    webPath: "/que-valoras-en-la-vida",
    openGraphLocale: "es_MX",
  },
  introduction: {
    title: "¿Cuáles son tus valores, Mapache?",
    tagline:
      "Un juego rápido de batallas automáticas que te ayuda a descubrir tus valores de vida.",
    body: [
      "Conocer tus valores puede ayudarte a encontrar sentido a tu vida, tomar decisiones difíciles y conocerte mejor.",
      "Compara 103 valores incluidos en batallas rápidas de uno contra uno. Si falta algo importante, agrega valores personalizados privados con los nombres y las definiciones que tú elijas.",
      "Cada elección da forma a tus cinco valores principales y a una clasificación completa que evoluciona y que puedes consultar cuando quieras.",
      "Juega unos minutos o sigue jugando. No hay una clasificación correcta. Puedes volver a empezar cuando quieras reiniciando tu progreso en el juego.",
      "Privado. Sin conexión. Sin cuenta. Tus elecciones y tus valores personalizados se quedan en este dispositivo, a menos que decidas exportarlos.",
      "¡Y además es divertido!",
    ],
    startAction: "Empezar",
    closeAction: "Cerrar",
    accessibleCloseLabel: "Cerrar introducción",
  },
  firstArrival: {
    titleLines: ["¿Cuáles son tus valores,", "Mapache?"],
    gameCredit: "Un juego de Mapachito",
    creatorCredit: "por el Dr. Derek Austin",
    creatorWebsiteLabel: "DoctorDerek.com",
    websiteErrorTitle: "No se pudo abrir el sitio web",
    websiteErrorMessage: "Inténtalo de nuevo.",
  },
  language: { heading: "Idioma", closeAction: "Volver" },
  hub: {
    rankedTitle: rankedTitleLines.join(" "),
    rankedTitleLines,
    unrankedTitle: "Mis valores",
    rankedList: "Tus valores",
    unrankedList: "Valores incluidos",
    unrankedNotice: "Aún sin clasificar",
    remainingValues: "Los demás valores",
    battle: "Combatir",
    browse: "Ver todos los valores",
    add: "Agregar valor",
    actions: "Acciones de valores",
    level: (level) => `Nivel ${level}`,
  },
  card: {
    title: "Compartir mi tarjeta de valores",
    gif: { name: "GIF", description: "Animado" },
    png: { name: "PNG", description: "Estático" },
    format: "Formato de imagen",
    includeHero: "Incluir a mi héroe",
    back: "Volver",
    preparing: "Preparando tu tarjeta…",
    delivering: "Abriendo tu archivo…",
    retry: "Reintentar",
    failure:
      "No se pudo preparar tu tarjeta. Tus valores y tu apariencia siguen intactos.",
    deliveryFailure: "Tu archivo sigue listo. Inténtalo de nuevo o guárdalo.",
    unsupportedShare:
      "Guarda tu tarjeta y luego adjúntala donde quieras compartirla.",
    downloadStarted:
      "Tu archivo está listo en las opciones de guardado o descarga de tu dispositivo.",
    handoff:
      "Tu tarjeta se envió a las opciones para compartir de tu dispositivo.",
    saved: "Tarjeta guardada.",
    cancelled: "Se canceló. Tu tarjeta sigue lista.",
    details: "Detalles técnicos",
    invitation: "Juega gratis en WhatAreYourValuesMapache.com",
    preview: "Vista previa de la tarjeta de valores",
    rank: (rank) => `#${rank}`,
    save: (format) => `Guardar ${format.toUpperCase()}`,
    share: (format) => `Compartir ${format.toUpperCase()}`,
  },
  seo: {
    title:
      "¿Cuáles son tus valores, Mapache? Un juego gratis para descubrir qué valoras en la vida",
    description:
      "¿Cuáles son tus valores, Mapache? es un juego rápido de batallas automáticas para ordenar tus valores y descubrir qué valoras en la vida.",
  },
}
