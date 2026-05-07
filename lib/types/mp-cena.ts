/**
 * Tipovi za "Krajnja maloprodajna cena" tab — proračun krajnje cene
 * proizvoda na osnovu prodajne cene + lanca marži (rabat → distributer →
 * maloprodaja → PDV).
 */

export type MpCenaBlock = {
  id: string
  proizvod_id: string
  selected_pakovanje_id: string | null
  position: number
  prodajna_cena: number
  rabat: number
  marza_distributera: number
  marza_maloprodaje: number
  pdv: number
  updated_at?: string
}

export type MpCenaPatch = Partial<
  Pick<
    MpCenaBlock,
    | "selected_pakovanje_id"
    | "prodajna_cena"
    | "rabat"
    | "marza_distributera"
    | "marza_maloprodaje"
    | "pdv"
  >
>
