/**
 * Helper funkcije za Dashboard i Analitiku — agregacije, grupisanje, trendi.
 */
import type { PakovanjeRow } from "@/lib/proizvodnja/calculations"
import { calculateTotalKg } from "@/lib/proizvodnja/calculations"

export { calculateTotalKg }
export type { PakovanjeRow }

/** Prosečna dnevna proizvodnja (kg) za dati niz dnevnih ukupnih vrednosti. */
export function calculateDailyAverage(dailyTotals: number[], daysCount: number): number {
  if (daysCount <= 0 || dailyTotals.length === 0) return 0
  const sum = dailyTotals.reduce((a, b) => a + b, 0)
  return Math.round((sum / daysCount) * 10) / 10
}

/** Grupisanje po datumu (key: YYYY-MM-DD). */
export function groupByDate<T extends { datum: string; pakovanje?: unknown }>(
  items: T[],
  getPakovanje: (item: T) => PakovanjeRow | null
): Map<string, { pikant: number; bbq: number; ukupno: number; count: number }> {
  const map = new Map<string, { pikant: number; bbq: number; ukupno: number; count: number }>()
  for (const item of items) {
    const key = item.datum
    const pak = getPakovanje(item)
    const t = calculateTotalKg(pak)
    const existing = map.get(key)
    if (existing) {
      existing.pikant += t.pikant
      existing.bbq += t.bbq
      existing.ukupno += t.ukupno
      existing.count += 1
    } else {
      map.set(key, { pikant: t.pikant, bbq: t.bbq, ukupno: t.ukupno, count: 1 })
    }
  }
  return map
}

/** Grupisanje po radniku (ime prezime) — suma kg po radniku. */
export function groupByWorker(
  items: Array<{
    pakovanje?: Array<{ radnik?: { ime?: string; prezime?: string } | null } & PakovanjeRow> | null
  }>,
  getPakovanje: (item: { pakovanje?: Array<unknown> | null }) => PakovanjeRow | null
): Map<string, number> {
  const map = new Map<string, number>()
  for (const item of items) {
    const pakArr = item.pakovanje
    const pak = Array.isArray(pakArr) ? pakArr[0] : null
    if (!pak) continue
    const name = pak.radnik
      ? `${String(pak.radnik.ime ?? "").trim()} ${String(pak.radnik.prezime ?? "").trim()}`.trim()
      : "Nepoznat"
    const t = calculateTotalKg(pak as PakovanjeRow)
    map.set(name, (map.get(name) ?? 0) + t.ukupno)
  }
  return map
}

/** Grupisanje po smeni (I / II). */
export function groupByShift<T extends { smena: string }>(
  items: T[]
): { I: number; II: number } {
  let I = 0
  let II = 0
  for (const item of items) {
    if (item.smena === "I") I += 1
    else if (item.smena === "II") II += 1
  }
  return { I, II }
}

/** Grupisanje po dobavljaču (draziranje). */
export function groupBySupplier(
  items: Array<{ draziranje?: Array<{ dobavljac?: string }> | null }>
): Map<string, number> {
  const map = new Map<string, number>()
  for (const item of items) {
    const dr = Array.isArray(item.draziranje) ? item.draziranje[0] : null
    const name = dr?.dobavljac ?? "Nepoznat"
    map.set(name, (map.get(name) ?? 0) + 1)
  }
  return map
}

/** Izračunavanje procenta promene (vs prethodni period). */
export function percentChange(current: number, previous: number): { value: number; percentage: number; isPositive: boolean } {
  if (previous === 0) {
    return { value: current, percentage: current > 0 ? 100 : 0, isPositive: current >= 0 }
  }
  const value = current - previous
  const percentage = Math.round((value / previous) * 100)
  return { value, percentage, isPositive: value >= 0 }
}
