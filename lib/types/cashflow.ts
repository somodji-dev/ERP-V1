/**
 * Tipovi za Cash Flow modul (DOCS/module-cashflow.md)
 */

export type TipUnosa = "detaljan" | "brzi"

export interface CashSnapshot {
  id: string
  mesec: number
  godina: number
  datum_unosa: string
  tip_unosa: TipUnosa
  potrazivanja_kupci: number | null
  racun_intesa: number | null
  racun_nlb: number | null
  devizni_racun: number | null
  gotovi_proizvodi: number | null
  sirovine: number | null
  ostalo: number | null
  ukupno_cash: number
  dugovanja_dobavljaci: number
  neto_cash_flow: number
  excel_file_url: string | null
  created_by: string | null
  created_at: string
}

export interface ExcelPartner {
  id: string
  snapshot_id: string
  partner_naziv: string
  kupci_iznos: number
  dobavljaci_iznos: number
  created_at: string
}

/** Za kreiranje brzog unosa */
export interface CreateBrziPayload {
  mesec: number
  godina: number
  ukupno_cash: number
  dugovanja_dobavljaci: number
}

/** Za kreiranje detaljnog unosa (bez Excel URL-a u prvoj iteraciji) */
export interface CreateDetaljanPayload {
  mesec: number
  godina: number
  potrazivanja_kupci: number
  racun_intesa: number
  racun_nlb: number
  devizni_racun: number
  gotovi_proizvodi: number
  sirovine: number
  ostalo: number
  dugovanja_dobavljaci: number
  excel_partners: { partner_naziv: string; kupci_iznos: number; dobavljaci_iznos: number }[]
}
