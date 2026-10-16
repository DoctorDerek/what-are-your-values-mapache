export const PROGRESSION_COPY = Object.freeze({
  firstBattleTitle: "First Battle",
  firstBattleReason: "First pair compared.",
  firstBattleRequirement: "Compare your first pair of values.",
  battleTitle: (count: string) => `${count} Battles`,
  battleReason: (count: string) => `${count} pairs compared.`,
  battleRequirement: (count: string) => `Compare ${count} pairs of values.`,
  topFiveTitle: "Reveal Your Top Five",
  topFiveReason: "Five values earned XP.",
  topFiveRequirement:
    "Earn XP with at least five different values to reveal your Top Five.",
  levelTitle: (level: string) => `Reach Level ${level}`,
  levelReason: (level: string) => `A value reached Level ${level}.`,
  levelRequirement: (level: string) => `Raise any value to Level ${level}.`,
  noEligibleValue: (level: string) =>
    `No active value is currently eligible to cross Level ${level}.`,
  eligibleValue: (level: string, target: string) =>
    `Highest eligible value: Level ${level} of Level ${target}`,
  comparisonProgress: (count: string, target: string) =>
    `${count} of ${target} comparisons`,
  topFiveProgress: (count: string) => `${count} of 5 values have earned XP`,
  resetTopFive:
    "Reset Levels & Experience before revealing your Top Five again.",
  choice: (name: string, level: string, choice: string) =>
    `Choose ${name}. Level ${level}. Choice ${choice}.`,
  nextPair: (first: string, second: string) => `${first} or ${second}`,
  selection: (name: string, xp: string, pair: string) =>
    `${name} chosen. ${xp} XP earned. Next: ${pair}.`,
  undo: (name: string, xp: string, pair: string) =>
    `Undo complete. ${xp} XP removed from ${name}. Restored: ${pair}.`,
  redo: (name: string, xp: string, pair: string) =>
    `Redo complete. ${xp} XP restored to ${name}. Next: ${pair}.`,
  reward: (xp: string, level: string) => `+${xp} XP · Level ${level}`,
  levelProgress: (xp: string, required: string, level: string) =>
    `${xp}/${required} XP toward Level ${level}`,
})
