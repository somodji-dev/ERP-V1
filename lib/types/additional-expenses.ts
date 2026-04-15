/**
 * Tipovi za modul Dodatni troškovi (neposlovni + bankomat)
 */

export type AdditionalExpense = {
  id: string
  mesec: number
  godina: number
  neposlovni: number
  bankomat: number
  napomena: string | null
  created_at?: string
}

export type MonthlyChartPoint = {
  mesec: number
  godina: number
  label: string
  neposlovni: number
  bankomat: number
  neto_cash_flow: number | null
}
