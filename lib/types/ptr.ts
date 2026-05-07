export interface PtrFiksniStavka {
  id: string
  proizvod_id: string
  naziv: string
  iznos: number
}

export interface PtrParams {
  proizvod_id: string
  prodajna_kg: number
  kapacitet: number
  kurs: number
  selected_pakovanje_id: string | null
}

export interface PtrMiksRow {
  id: string
  proizvod_id: string
  pakovanje_id: string
  kolicina_kg: number
  prodajna_kg: number
}

export const EMPTY_PTR_PARAMS = (proizvodId: string): PtrParams => ({
  proizvod_id: proizvodId,
  prodajna_kg: 0,
  kapacitet: 0,
  kurs: 0,
  selected_pakovanje_id: null,
})
