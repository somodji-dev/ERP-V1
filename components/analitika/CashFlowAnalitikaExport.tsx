"use client"

import { ExportButton } from "@/components/analitika/ExportButton"
import { exportCashFlowToExcel } from "@/lib/dashboard/export"
import type { AnalitikaCashFlowRow } from "@/lib/dashboard/data"

type Props = { tableRows: AnalitikaCashFlowRow[] }

export function CashFlowAnalitikaExport({ tableRows }: Props) {
  function handleExport() {
    exportCashFlowToExcel(tableRows, `cash-flow-analitika-${new Date().toISOString().slice(0, 10)}`)
  }
  return <ExportButton onExportExcel={handleExport} label="Export Excel" disabled={tableRows.length === 0} />
}
