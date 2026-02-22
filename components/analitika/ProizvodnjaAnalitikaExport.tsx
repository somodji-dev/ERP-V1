"use client"

import { ExportButton } from "@/components/analitika/ExportButton"
import { exportProizvodnjaToExcel } from "@/lib/dashboard/export"
import type { DailyProdRow } from "@/lib/dashboard/data"

type Props = { dailyData: DailyProdRow[] }

export function ProizvodnjaAnalitikaExport({ dailyData }: Props) {
  function handleExport() {
    const rows = dailyData.map((d) => ({
      datum: d.datum,
      broj_naloga: d.broj_naloga,
      pikant: d.pikant,
      bbq: d.bbq,
      ukupno: d.ukupno,
      smena: d.smena,
    }))
    exportProizvodnjaToExcel(rows, `proizvodnja-analitika-${new Date().toISOString().slice(0, 10)}`)
  }
  return <ExportButton onExportExcel={handleExport} label="Export Excel" disabled={dailyData.length === 0} />
}
