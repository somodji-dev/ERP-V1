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
import { getAnalitikaRadniNalozi } from "@/lib/dashboard/data"
import { MetricCard } from "@/components/analitika/MetricCard"
import { PeriodFilter } from "@/components/analitika/PeriodFilter"
import { RadniNaloziAnalitikaExport } from "@/components/analitika/RadniNaloziAnalitikaExport"
import { RadniNaloziPieCharts } from "@/components/analitika/RadniNaloziPieCharts"
import { format } from "date-fns"
import { srLatn } from "date-fns/locale"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"

type Props = { searchParams: Promise<{ godina?: string; mesec?: string; smena?: string }> }

export default async function AnalitikaRadniNaloziPage({ searchParams }: Props) {
  const params = await searchParams
  const { metrics, tableRows, bySupplier, byWorkerDraziranje } = await getAnalitikaRadniNalozi({
    godina: params.godina,
    mesec: params.mesec,
    smena: params.smena,
  })

  const pieSupplier = Array.from(bySupplier.entries()).map(([name, value], i) => ({
    name,
    value,
    color: ["#2563EB", "#16A34A", "#F59E0B"][i] ?? "#6B7280",
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
            <h1 className="text-xl font-bold text-[#111827]">Radni nalozi analitika</h1>
            <p className="text-sm text-[#6B7280]">Nalozi, dražiranje po radniku i dobavljaču</p>
          </div>
        </div>
        <Suspense fallback={null}>
          <RadniNaloziAnalitikaExport tableRows={tableRows} />
        </Suspense>
      </div>

      <Card className="mb-6 border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-medium text-[#6B7280]">Period</p>
          <Suspense fallback={<div className="h-10 w-64 animate-pulse rounded bg-[#F3F4F6]" />}>
            <PeriodFilter showYear showMonth showSmena />
          </Suspense>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard title="Ukupno naloga" value={metrics.ukupnoNaloga} />
        <MetricCard title="Prosek naloga po smeni" value={metrics.prosekDnevno} subtitle="Naloga po smeni u periodu" />
      </div>

      {byWorkerDraziranje.length > 0 && (
        <Card className="mb-6 border-[#E5E7EB] bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-[#E5E7EB] px-6 py-4">
              <h2 className="text-lg font-semibold text-[#111827]">Prosek dražiranja po radniku (po smeni)</h2>
              <p className="mt-1 text-xs text-[#6B7280]">
                Prosek = ukupno dražiranja u periodu / broj smena u periodu (fiksno za sve radnike).
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-[#E5E7EB] hover:bg-transparent">
                  <TableHead className="text-[#6B7280]">Radnik</TableHead>
                  <TableHead className="text-[#6B7280]">Ukupno dražiranja</TableHead>
                  <TableHead className="text-[#6B7280]">Prosek po smeni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byWorkerDraziranje.map((r) => (
                  <TableRow key={r.name} className="border-[#E5E7EB] hover:bg-[#F9FAFB]">
                    <TableCell className="font-medium text-[#111827]">{r.name}</TableCell>
                    <TableCell className="text-[#111827]">{r.ukupnoDraziranja}</TableCell>
                    <TableCell className="text-[#111827]">{r.prosekDnevno}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {pieSupplier.length > 0 && (
        <div className="mb-6">
          <RadniNaloziPieCharts pieShift={[]} pieSupplier={pieSupplier} />
        </div>
      )}

      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-[#E5E7EB] px-6 py-4">
            <h2 className="text-lg font-semibold text-[#111827]">Lista naloga</h2>
          </div>
          {tableRows.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#6B7280]">Nema naloga za izabrani period.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#E5E7EB] hover:bg-transparent">
                  <TableHead className="text-[#6B7280]">Broj</TableHead>
                  <TableHead className="text-[#6B7280]">Datum</TableHead>
                  <TableHead className="text-[#6B7280]">Smena</TableHead>
                  <TableHead className="text-[#6B7280]">Radnici</TableHead>
                  <TableHead className="text-[#6B7280]">Proizvodnja (kg)</TableHead>
                  <TableHead className="text-[#6B7280]">Dražiranje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((r) => (
                  <TableRow key={r.id} className="border-[#E5E7EB] hover:bg-[#F9FAFB]">
                    <TableCell className="font-medium text-[#111827]">
                      <Link href={`/proizvodnja/${r.id}`} className="text-[#2563EB] hover:underline">
                        {r.broj_naloga}
                      </Link>
                    </TableCell>
                    <TableCell className="text-[#111827]">
                      {format(new Date(r.datum), "dd.MM.yyyy", { locale: srLatn })}
                    </TableCell>
                    <TableCell className="text-[#111827]">{r.smena}</TableCell>
                    <TableCell className="text-[#111827]">{r.radnici}</TableCell>
                    <TableCell className="text-[#111827]">{r.proizvodnja_kg}</TableCell>
                    <TableCell className="text-[#111827]">{r.draziranje ?? "—"}</TableCell>
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
