/**
 * Tipovi za modul Popis sirovina
 */

export type RawMaterial = {
  id: string
  naziv: string
  jedinica: string
  min_kolicina: number
  aktivan: boolean
  created_at?: string
}

export type InventoryCount = {
  id: string
  datum: string
  napomena: string | null
  created_by: string | null
  created_at?: string
}

export type InventoryCountItem = {
  id: string
  inventory_count_id: string
  raw_material_id: string
  kolicina: number
}

/** Red za prikaz popisa — sirovina + trenutna količina */
export type InventoryRow = RawMaterial & {
  kolicina: number
  ispod_minimuma: boolean
}
