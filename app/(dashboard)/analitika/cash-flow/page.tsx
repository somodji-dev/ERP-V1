import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAnalitikaCashFlow } from "@/lib/dashboard/data"
import { CashFlowChartWithRange } from "@/components/cashflow/CashFlowChartWithRange"
import { MetricCard } from "@/components/analitika/MetricCard"
import { PeriodFilter } from "@/components/analitika/PeriodFilter"
import { ExportButton } from "@/components/analitika/ExportButton"
import { CashFlowAnalitikaExport } from "@/components/analitika/CashFlowAnalitikaExport"
import { formatCurrency } from "@/lib/utils/format"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"

const MESECI = ["", "Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Avg", "Sep", "Okt", "Nov", "Dec"]

type Props = { searchParams: Promise<{ godina?: string; mesec?: string }> }

export default async function AnalitikaCashFlowPage({ searchParams }: Props) {
  const params = await searchParams
  const { metrics, chartData, tableRows } = await getAnalitikaCashFlow({
    godina: params.godina,
    mesec: params.mesec,
  })

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/dashboard" aria-label="Nazad na Dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#111827]">Cash Flow analitika</h1>
            <p className="text-sm text-[#6B7280]">Detaljni KPI i trendovi</p>
          </div>
        </div>
        <Suspense fallback={null}>
          <CashFlowAnalitikaExport tableRows={tableRows} />
        </Suspense>
      </div>

      <Card className="mb-6 border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-medium text-[#6B7280]">Period</p>
          <Suspense fallback={<div className="h-10 w-64 animate-pulse rounded bg-[#F3F4F6]" />}>
            <PeriodFilter showYear showMonth showDateRange={false} />
          </Suspense>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <MetricCard title="Cash (aktiva)" value={metrics.cashAktiva} formatAsCurrency />
        <MetricCard title="Dugovanja (pasiva)" value={metrics.dugovanja} formatAsCurrency />
        <MetricCard title="Neto C/F" value={metrics.neto} formatAsCurrency />
        <MetricCard
          title="Prosek mesečno"
          value={Math.round(metrics.prosekMesečno)}
          valueSuffix=" RSD"
        />
        <MetricCard title="YTD Neto" value={metrics.ytdNeto} formatAsCurrency />
      </div>

      <Card className="mb-6 border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#111827]">Cash Flow kretanje</h2>
          <p className="mb-4 text-sm text-[#6B7280]">Izaberite period ispod grafikona (12 meseci, 5 godina ili Od–Do).</p>
          <CashFlowChartWithRange initialData={chartData} />
        </CardContent>
      </Card>

      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-[#E5E7EB] px-6 py-4">
            <h2 className="text-lg font-semibold text-[#111827]">Mesečni podaci</h2>
          </div>
          {tableRows.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#6B7280]">Nema podataka za izabrani period.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#E5E7EB] hover:bg-transparent">
                  <TableHead className="text-[#6B7280]">Mesec</TableHead>
                  <TableHead className="text-[#6B7280]">Cash</TableHead>
                  <TableHead className="text-[#6B7280]">Dugovanja</TableHead>
                  <TableHead className="text-[#6B7280]">Neto</TableHead>
                  <TableHead className="text-[#6B7280]">Promena %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((r) => (
                  <TableRow key={`${r.godina}-${r.mesec}`} className="border-[#E5E7EB] hover:bg-[#F9FAFB]">
                    <TableCell className="font-medium text-[#111827]">
                      {MESECI[r.mesec]} {r.godina}
                    </TableCell>
                    <TableCell className="text-[#111827]">{formatCurrency(r.ukupno_cash)}</TableCell>
                    <TableCell className="text-[#111827]">{formatCurrency(r.dugovanja_dobavljaci)}</TableCell>
                    <TableCell className="text-[#111827]">{formatCurrency(r.neto_cash_flow)}</TableCell>
                    <TableCell className="text-[#111827]">
                      {r.promena_percent != null ? `${r.promena_percent > 0 ? "+" : ""}${r.promena_percent}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
