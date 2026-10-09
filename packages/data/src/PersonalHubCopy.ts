const rankedTitleLines = Object.freeze(["My Top Five", "Life Values"])

export const PERSONAL_HUB_COPY = Object.freeze({
  screenTitle: "Home screen",
  rankedTitle: rankedTitleLines.join(" "),
  rankedTitleLines,
  unrankedTitle: "My Values",
  rankedList: "Your values",
  unrankedList: "Included values",
  unrankedNotice: "Not ranked yet",
  remainingValues: "All Other Values",
  battle: "Battle",
  browse: "Browse All Values",
  add: "Add value",
  actions: "Value actions",
  level: (level: number) => `Level ${level}`,
})
