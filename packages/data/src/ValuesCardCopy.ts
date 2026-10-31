import type { ValuesCardFormat } from "./ValuesCard"

export const VALUES_CARD_COPY = Object.freeze({
  title: "Share my values card",
  gif: { name: "GIF", description: "Animated" },
  png: { name: "PNG", description: "Still" },
  format: "Image format",
  includeHero: "Include my hero",
  includeLevels: "Include levels",
  back: "Back",
  preparing: "Preparing your card…",
  delivering: "Opening your file…",
  retry: "Retry",
  failure:
    "Your card could not be prepared. Your values and appearance are unchanged.",
  deliveryFailure: "Your file is still ready. Try again or save it instead.",
  unsupportedShare:
    "Save your card, then attach it wherever you want to share it.",
  downloadStarted: "Your file is ready in your device’s save or download flow.",
  handoff: "Your card was handed to your device’s sharing options.",
  saved: "Card saved.",
  cancelled: "Canceled. Your card is still ready.",
  details: "Technical details",
  invitation: "Play free at WhatAreYourValuesMapache.com",
  preview: "Values card preview",
  rank: (rank: string) => `#${rank}`,
  save: (format: ValuesCardFormat) => `Save ${format.toUpperCase()}`,
  share: (format: ValuesCardFormat) => `Share ${format.toUpperCase()}`,
})
