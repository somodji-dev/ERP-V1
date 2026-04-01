/**
 * Tipovi za modul Finansije — Prihodi i Rashodi
 */

export type MonthlyFinancial = {
  id: string
  mesec: number
  godina: number
  prihod: number
  rashod: number
  napomena: string | null
  created_at?: string
}
