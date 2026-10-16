export const RESULTS_COPY = Object.freeze({
  heading: "Results",
  seeValuesAction: "See my values",
  keepBattlingAction: "Keep battling",
  rosterLabel: "Your value results",
  profileLevel: (level: string) => `Profile Level ${level}`,
  profileXp: (xp: string) => `Profile XP ${xp}`,
  rankingChangedSummary: "Your values were re-ranked",
  progressChangedSummary: "Your value progress changed",
} as const)
