import Link from "next/link"
import { listSnapshots, getSnapshotsForChart } from "@/app/actions/cashflow"
import { CashFlowKpiCards } from "@/components/cashflow/CashFlowKpiCards"
import { CashFlowChartWithRange } from "@/components/cashflow/CashFlowChartWithRange"
import { prepareChartData } from "@/lib/cashflow/chartData"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils/format"
import { Plus, GitCompare, Eye, Pencil, BarChart3, Zap } from "lucide-react"
import { CashFlowDeleteButton } from "@/components/cashflow/CashFlowDeleteButton"

const MESECI = [
  "", "Jan", "Feb", "Mar", "Apr", "Maj", "Jun",
  "Jul", "Avg", "Sep", "Okt", "Nov", "Dec",
]

export default async function CashFlowPage() {
  const [{ data: snapshots, error }, chartRaw] = await Promise.all([
    listSnapshots(),
    getSnapshotsForChart(12),
  ])

  const chartData = prepareChartData(chartRaw)
  const list = snapshots ?? []

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-[#111827]">Cash Flow analiza</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-[#2563EB] hover:bg-[#1D4ED8] shrink-0">
            <Link href="/cash-flow/novi">
              <Plus className="mr-2 h-4 w-4" />
              Novi snimak
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-[#E5E7EB]">
            <Link href="/cash-flow/uporedi">
              <GitCompare className="mr-2 h-4 w-4" />
              Uporedi mesece
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <CashFlowKpiCards />

        <Card className="border-[#E5E7EB] bg-white shadow-sm">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#111827]">
              Kretanje kroz vreme
            </h2>
            <p className="mb-4 text-sm text-[#6B7280]">
              Kretanje kroz vreme — izaberite period ispod grafikona (12 meseci, 5 godina ili Od–Do).
            </p>
            <CashFlowChartWithRange initialData={chartData} />
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB] bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-[#E5E7EB] px-6 py-4">
              <h2 className="text-lg font-semibold text-[#111827]">Lista snimaka</h2>
            </div>
            {error ? (
              <div className="px-6 py-8 text-center text-sm text-[#DC2626]">
                Greška pri učitavanju: {error}
              </div>
            ) : list.length === 0 ? (
              <div className="py-12 text-center text-[#6B7280]">
                <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm font-medium">Nema snimaka.</p>
                <p className="text-xs mt-1">Kliknite Novi snimak da unesete prvi.</p>
                <Button asChild className="mt-4 bg-[#2563EB] hover:bg-[#1D4ED8]">
                  <Link href="/cash-flow/novi">
                    <Plus className="mr-2 h-4 w-4" />
                    Novi snimak
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E5E7EB] hover:bg-transparent">
                    <TableHead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280]">
                      Mesec
                    </TableHead>
                    <TableHead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280]">
                      Neto C/F
                    </TableHead>
                    <TableHead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280]">
                      Tip
                    </TableHead>
                    <TableHead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280] text-right">
                      Akcije
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((row: Record<string, unknown>) => (
                    <TableRow
                      key={String(row.id)}
                      className="border-[#F3F4F6] hover:bg-[#F4F5F7]"
                    >
                      <TableCell className="text-sm font-medium text-[#111827]">
                        {MESECI[Number(row.mesec)]} {String(row.godina ?? "")}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-[#111827]">
                        {formatCurrency(Number(row.neto_cash_flow ?? 0))}
                      </TableCell>
                      <TableCell>
                        {row.tip_unosa === "detaljan" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2.5 py-0.5 text-xs font-medium text-[#2563EB]">
                            <BarChart3 className="h-3.5 w-3.5" />
                            Detaljan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#6B7280]">
                            <Zap className="h-3.5 w-3.5" />
                            Brzi
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end flex-wrap gap-1">
                          <Button asChild size="sm" variant="outline" className="border-[#E5E7EB]">
                            <Link href={`/cash-flow/${row.id}`}>
                              <Eye className="mr-1.5 h-4 w-4" />
                              Detalji
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/cash-flow/${row.id}/uredi`}>
                              <Pencil className="mr-1.5 h-4 w-4" />
                              Izmeni
                            </Link>
                          </Button>
                          <CashFlowDeleteButton
                            snapshotId={String(row.id)}
                            label={`${MESECI[Number(row.mesec)]} ${String(row.godina ?? "")}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
