/**
 * Pomocne konstante i funkcije za satnice (rate_settings)
 */

const TIP_LABELS: Record<string, string> = {
  redovni: "Redovni sat",
  prekovremeno: "Prekovremeno",
  subota: "Subota",
  nedelja: "Nedelja",
  praznik: "Praznik",
  topli_obrok: "Topli obrok",
}

export const RATE_TIPS = [
  "redovni",
  "prekovremeno",
  "subota",
  "nedelja",
  "praznik",
  "topli_obrok",
] as const

export function getRateTipLabel(tip: string): string {
  return TIP_LABELS[tip] ?? tip
}
