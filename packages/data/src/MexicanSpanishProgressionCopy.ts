import type { InterfaceCopy } from "./EnglishInterfaceCopy"

export const MEXICAN_SPANISH_PROGRESSION_COPY: InterfaceCopy["progression"] = {
  firstBattleTitle: "Primera batalla",
  firstBattleReason: "Comparaste tu primer par de valores.",
  firstBattleRequirement: "Compara tu primer par de valores.",
  battleTitle: (count) => `${count} ${count === "1" ? "batalla" : "batallas"}`,
  battleReason: (count) =>
    `${count} ${count === "1" ? "par comparado" : "pares comparados"}.`,
  battleRequirement: (count) =>
    `Compara ${count} ${count === "1" ? "par" : "pares"} de valores.`,
  topFiveTitle: "Descubre tus cinco principales",
  topFiveReason: "Cinco valores ganaron XP.",
  topFiveRequirement:
    "Gana XP con al menos cinco valores distintos para descubrir tus cinco principales.",
  levelTitle: (level) => `Alcanza el nivel ${level}`,
  levelReason: (level) => `Un valor alcanzó el nivel ${level}.`,
  levelRequirement: (level) => `Sube cualquier valor al nivel ${level}.`,
  noEligibleValue: (level) =>
    `Por ahora, ningún valor activo puede alcanzar el nivel ${level} para obtener este logro.`,
  eligibleValue: (level, target) =>
    `Valor más avanzado que cumple los requisitos: nivel ${level} de ${target}`,
  comparisonProgress: (count, target) => `${count} de ${target} comparaciones`,
  topFiveProgress: (count) => `Valores con XP: ${count} de 5`,
  resetTopFive:
    "Reinicia los niveles y la experiencia antes de descubrir tus cinco principales otra vez.",
  choice: (name, level, choice) =>
    `Elegir ${name}. Nivel ${level}. Opción ${choice}.`,
  nextPair: (first, second) => `${first} o ${second}`,
  selection: (name, xp, pair) =>
    `Elegiste ${name}. Ganaste ${xp} XP. Siguiente: ${pair}.`,
  undo: (name, xp, pair) =>
    `Se deshizo tu elección. Se quitaron ${xp} XP de ${name}. Par restaurado: ${pair}.`,
  redo: (name, xp, pair) =>
    `Se rehízo tu elección. Se restauraron ${xp} XP a ${name}. Siguiente: ${pair}.`,
  reward: (xp, level) => `+${xp} XP · Nivel ${level}`,
  levelProgress: (xp, required, level) =>
    `${xp}/${required} XP para alcanzar el nivel ${level}`,
}

export const MEXICAN_SPANISH_RESULTS_COPY: InterfaceCopy["results"] = {
  heading: "Resultados",
  seeValuesAction: "Ver mis valores",
  keepBattlingAction: "Seguir combatiendo",
  rosterLabel: "Resultados de tus valores",
  profileLevel: (level) => `Nivel del perfil: ${level}`,
  profileXp: (xp) => `XP del perfil: ${xp}`,
  rankingChangedSummary: "Cambió el orden de tus valores",
  progressChangedSummary: "Cambió el progreso de tus valores",
}

export const MEXICAN_SPANISH_RANK_COPY: InterfaceCopy["rank"] = {
  gold: "oro",
  silver: "plata",
  bronze: "bronce",
  rank: (rank) => `Puesto ${rank}`,
  medal: (rank, color) => `Puesto ${rank}, medalla de ${color}`,
}
