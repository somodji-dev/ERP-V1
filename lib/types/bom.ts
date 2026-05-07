export interface BomStavka {
  id: string
  proizvod_id: string
  materijal_id: string | null
  naziv: string
  udeo: number
  cena_po_kg: number
}
