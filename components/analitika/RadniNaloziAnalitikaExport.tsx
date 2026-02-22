"use client"

import { ExportButton } from "@/components/analitika/ExportButton"
import { exportRadniNaloziToExcel } from "@/lib/dashboard/export"
import type { NalogTableRow } from "@/lib/dashboard/data"

type Props = { tableRows: NalogTableRow[] }

export function RadniNaloziAnalitikaExport({ tableRows }: Props) {
  function handleExport() {
    const rows = tableRows.map((r) => ({
      broj_naloga: r.broj_naloga,
      datum: r.datum,
      smena: r.smena,
      radnici: r.radnici,
      proizvodnja_kg: r.proizvodnja_kg,
      draziranje: r.draziranje,
    }))
    exportRadniNaloziToExcel(rows, `radni-nalozi-analitika-${new Date().toISOString().slice(0, 10)}`)
  }
  return <ExportButton onExportExcel={handleExport} label="Export Excel" disabled={tableRows.length === 0} />
}
