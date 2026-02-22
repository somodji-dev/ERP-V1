/**
 * Export podataka u Excel (xlsx). PDF može biti u v2.
 */
import * as XLSX from "xlsx"

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName = "Podaci"
): void {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/** Export mesečnih cash flow podataka. */
export function exportCashFlowToExcel(
  rows: Array<{
    mesec: number
    godina: number
    ukupno_cash: number
    dugovanja_dobavljaci: number
    neto_cash_flow: number
    promena_percent?: number
  }>,
  filename: string
): void {
  const MESECI = ["", "Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Avg", "Sep", "Okt", "Nov", "Dec"]
  const data = rows.map((r) => ({
    Mesec: MESECI[r.mesec] ?? r.mesec,
    Godina: r.godina,
    "Cash (aktiva)": r.ukupno_cash,
    Dugovanja: r.dugovanja_dobavljaci,
    "Neto C/F": r.neto_cash_flow,
    "Promena %": r.promena_percent != null ? `${r.promena_percent}%` : "",
  }))
  exportToExcel(data, filename, "Cash Flow")
}

/** Export dnevne proizvodnje. */
export function exportProizvodnjaToExcel(
  rows: Array<{
    datum: string
    broj_naloga: number
    pikant: number
    bbq: number
    ukupno: number
    smena?: string
  }>,
  filename: string
): void {
  const data = rows.map((r) => ({
    Datum: r.datum,
    "Br. naloga": r.broj_naloga,
    Pikant_kg: r.pikant,
    BBQ_kg: r.bbq,
    Ukupno_kg: r.ukupno,
    Smena: r.smena ?? "",
  }))
  exportToExcel(data, filename, "Proizvodnja")
}

/** Export liste radnih naloga. */
export function exportRadniNaloziToExcel(
  rows: Array<{
    broj_naloga: string
    datum: string
    smena: string
    radnici: string
    proizvodnja_kg: number
    draziranje?: number
  }>,
  filename: string
): void {
  exportToExcel(rows, filename, "Radni nalozi")
}
