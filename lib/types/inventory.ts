/**
 * Tipovi za modul Popis sirovina
 */

export type RawMaterial = {
  id: string
  naziv: string
  jedinica: string
  min_kolicina: number
  redosled: number
  aktivan: boolean
  created_at?: string
}

export type InventoryCount = {
  id: string
  datum: string
  employee_id: string | null
  napomena: string | null
  created_by: string | null
  created_at?: string
}

export type InventoryCountItem = {
  id: string
  inventory_count_id: string
  raw_material_id: string
  kolicina: number
  iznad_minimuma: boolean
}

/** Red za prikaz popisa — sirovina + trenutna količina */
export type InventoryRow = RawMaterial & {
  kolicina: number
  iznad_minimuma: boolean
  ispod_minimuma: boolean
}

/**
 * Sirovine koje se vode u paletama: ako ima minimum ili više, radnik stavlja OK;
 * ako ima manje, broji DŽAKOVE (broj džakova po paleti nije stalan, pa se ne preračunava).
 * Zato je za njih upisana količina u džakovima i uvek znači "ispod minimuma".
 */
export const PALETA = "paleta"
export const DZAK = "džak"

/** Jedinica u kojoj se upisuje količina kad nije OK. */
export function unosJedinica(jedinica: string): string {
  return jedinica === PALETA ? DZAK : jedinica
}

/** Da li je sirovina ispod minimuma prema stavci popisa. */
export function jeIspodMinimuma(
  m: Pick<RawMaterial, "jedinica" | "min_kolicina">,
  kolicina: number,
  iznadMinimuma: boolean
): boolean {
  if (iznadMinimuma) return false
  if (m.jedinica === PALETA) return true
  return kolicina < Number(m.min_kolicina)
}
