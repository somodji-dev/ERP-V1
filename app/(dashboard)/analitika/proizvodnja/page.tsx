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
import { getAnalitikaProizvodnja } from "@/lib/dashboard/data"
import { ProductionChart } from "@/components/dashboard/ProductionChart"
import { MetricCard } from "@/components/analitika/MetricCard"
import { PeriodFilter } from "@/components/analitika/PeriodFilter"
import { ProizvodnjaAnalitikaExport } from "@/components/analitika/ProizvodnjaAnalitikaExport"
import { ProizvodnjaPieCharts } from "@/components/analitika/ProizvodnjaPieCharts"
import { format } from "date-fns"
import { srLatn } from "date-fns/locale"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"

type Props = { searchParams: Promise<{ period?: string; smena?: string }> }

export default async function AnalitikaProizvodnjaPage({ searchParams }: Props) {
  const params = await searchParams
  const { metrics, dailyData, byShift, byWorker } = await getAnalitikaProizvodnja({
    period: params.period,
    smena: params.smena,
  })

  const chartData = dailyData.slice(0, 30).reverse().map((d) => ({
    label: format(new Date(d.datum), "dd.MM", { locale: srLatn }),
    datum: d.datum,
    pikant: d.pikant,
    bbq: d.bbq,
    ukupno: d.ukupno,
    count: d.broj_naloga,
  }))
  const avgLine = chartData.length > 0 ? chartData.reduce((s, d) => s + d.ukupno, 0) / chartData.length : undefined

  const pieShift = [
    { name: "I smena", value: byShift.I, color: "#2563EB" },
    { name: "II smena", value: byShift.II, color: "#F59E0B" },
  ].filter((d) => d.value > 0)

  const pieWorker = byWorker.slice(0, 5).map((w, i) => ({
    name: w.name,
    value: w.kg,
    color: ["#2563EB", "#16A34A", "#F59E0B", "#6B7280", "#9CA3AF"][i] ?? "#6B7280",
  }))

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
            <h1 className="text-xl font-bold text-[#111827]">Proizvodnja analitika</h1>
            <p className="text-sm text-[#6B7280]">Dnevna proizvodnja i raspored</p>
          </div>
        </div>
        <Suspense fallback={null}>
          <ProizvodnjaAnalitikaExport dailyData={dailyData} />
        </Suspense>
      </div>

      <Card className="mb-6 border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-medium text-[#6B7280]">Period</p>
          <Suspense fallback={<div className="h-10 w-64 animate-pulse rounded bg-[#F3F4F6]" />}>
            <PeriodFilter showYear={false} showMonth={false} showPeriod showSmena />
          </Suspense>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <MetricCard title="Ukupno proizvodnja" value={metrics.ukupnoKg} valueSuffix=" kg" />
        <MetricCard title="Prosek dnevno" value={metrics.prosekDnevno} valueSuffix=" kg" />
        <MetricCard title="Pikant ukupno" value={metrics.pikantTotal} valueSuffix=" kg" />
        <MetricCard title="BBQ ukupno" value={metrics.bbqTotal} valueSuffix=" kg" />
        <MetricCard title="Broj naloga" value={metrics.brojNaloga} />
      </div>

      <Card className="mb-6 border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#111827]">Dnevna proizvodnja</h2>
          <ProductionChart data={chartData} averageLine={avgLine} />
        </CardContent>
      </Card>

      <ProizvodnjaPieCharts pieShift={pieShift} pieWorker={pieWorker} />

      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-[#E5E7EB] px-6 py-4">
            <h2 className="text-lg font-semibold text-[#111827]">Dnevni podaci</h2>
          </div>
          {dailyData.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#6B7280]">Nema podataka za izabrani period.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#E5E7EB] hover:bg-transparent">
                  <TableHead className="text-[#6B7280]">Datum</TableHead>
                  <TableHead className="text-[#6B7280]">Naloga</TableHead>
                  <TableHead className="text-[#6B7280]">Pikant (kg)</TableHead>
                  <TableHead className="text-[#6B7280]">BBQ (kg)</TableHead>
                  <TableHead className="text-[#6B7280]">Ukupno (kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyData.slice(0, 30).map((r) => (
                  <TableRow key={r.datum} className="border-[#E5E7EB] hover:bg-[#F9FAFB]">
                    <TableCell className="font-medium text-[#111827]">
                      {format(new Date(r.datum), "dd.MM.yyyy", { locale: srLatn })}
                    </TableCell>
                    <TableCell className="text-[#111827]">{r.broj_naloga}</TableCell>
                    <TableCell className="text-[#111827]">{r.pikant}</TableCell>
                    <TableCell className="text-[#111827]">{r.bbq}</TableCell>
                    <TableCell className="text-[#111827]">{r.ukupno}</TableCell>
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
