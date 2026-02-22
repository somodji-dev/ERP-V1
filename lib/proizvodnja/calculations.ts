/**
 * Kalkulacije za modul Proizvodnja — ukupno kg, komadi po kutijama
 */

export type PakovanjeRow = {
  pikant_15kg?: number | null
  pikant_1kg?: number | null
  pikant_200g?: number | null
  pikant_150g?: number | null
  pikant_80g?: number | null
  bbq_15kg?: number | null
  bbq_1kg?: number | null
  bbq_200g?: number | null
  bbq_150g?: number | null
  bbq_80g?: number | null
}

const KUTIJE = {
  pikant_200g: 16,
  pikant_150g: 15,
  pikant_80g: 36,
  bbq_200g: 16,
  bbq_150g: 15,
  bbq_80g: 36,
} as const

export function calculateTotalKg(pakovanje: PakovanjeRow | null | undefined): {
  pikant: number
  bbq: number
  ukupno: number
} {
  if (!pakovanje) return { pikant: 0, bbq: 0, ukupno: 0 }

  const p15 = Number(pakovanje.pikant_15kg ?? 0)
  const p1 = Number(pakovanje.pikant_1kg ?? 0)
  const p200 = (Number(pakovanje.pikant_200g ?? 0) * KUTIJE.pikant_200g * 0.2)
  const p150 = (Number(pakovanje.pikant_150g ?? 0) * KUTIJE.pikant_150g * 0.15)
  const p80 = (Number(pakovanje.pikant_80g ?? 0) * KUTIJE.pikant_80g * 0.08)
  const pikant = Math.round((p15 + p1 + p200 + p150 + p80) * 10) / 10

  const b15 = Number(pakovanje.bbq_15kg ?? 0)
  const b1 = Number(pakovanje.bbq_1kg ?? 0)
  const b200 = (Number(pakovanje.bbq_200g ?? 0) * KUTIJE.bbq_200g * 0.2)
  const b150 = (Number(pakovanje.bbq_150g ?? 0) * KUTIJE.bbq_150g * 0.15)
  const b80 = (Number(pakovanje.bbq_80g ?? 0) * KUTIJE.bbq_80g * 0.08)
  const bbq = Math.round((b15 + b1 + b200 + b150 + b80) * 10) / 10

  const ukupno = Math.round((pikant + bbq) * 10) / 10
  return {
    pikant,
    bbq,
    ukupno,
  }
}

/** Za prikaz ukupne kg: zaokružuje na 1 decimale, blizu celog broja prikaže ceo (npr. 499.9 → 500) */
export function formatUkupnoKg(kg: number): string {
  const rounded = Math.round(kg * 10) / 10
  const nearInteger = Math.abs(rounded - Math.round(rounded)) < 0.05
  const display = nearInteger ? Math.round(rounded) : rounded
  return String(display)
}

export function calculateKomadi(kutije: number, komPoKutiji: number): number {
  return kutije * komPoKutiji
}
