import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/format"
import { ArrowLeft } from "lucide-react"
import { CashFlowUporediForm } from "@/components/cashflow/CashFlowUporediForm"
import { getTwoSnapshotsForCompare } from "@/app/actions/cashflow"

const MESECI = [
  "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
]

function label(mesec: number, godina: number): string {
  return `${MESECI[mesec]} ${String(godina).slice(-2)}`
}

function formatDiff(val: number): string {
  if (val > 0) return `+${formatCurrency(val)}`
  if (val < 0) return formatCurrency(val)
  return "0"
}

function percentChange(before: number, after: number): number | null {
  if (before === 0) return null
  return ((after - before) / before) * 100
}

export default async function CashFlowUporediPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>
}) {
  const params = await searchParams
  const idA = params.a
  const idB = params.b

  const supabase = await createClient()
  const { data: snapshots } = await supabase
    .from("cash_snapshots")
    .select("id, mesec, godina")
    .order("godina", { ascending: false })
    .order("mesec", { ascending: false })

  const list = (snapshots ?? []).map((s) => ({
    id: String(s.id),
    label: `${MESECI[Number(s.mesec)]} ${s.godina}`,
  }))

  const hasCompare = idA && idB && idA !== idB
  let compare: { a: Record<string, unknown> | null; b: Record<string, unknown> | null; error?: string } = {
    a: null,
    b: null,
  }
  if (hasCompare) {
    compare = await getTwoSnapshotsForCompare(idA, idB)
  }

  const n = (v: unknown) => Number(v ?? 0)
  const a = compare.a
  const b = compare.b

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/cash-flow" aria-label="Nazad">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-[#111827]">Uporedi mesece</h1>
      </div>

      <Card className="border-[#E5E7EB] bg-white shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Izbor snimaka</CardTitle>
        </CardHeader>
        <CardContent>
          <CashFlowUporediForm snapshots={list} />
        </CardContent>
      </Card>

      {compare.error && (
        <Card className="border-[#E5E7EB] bg-white shadow-sm">
          <CardContent className="py-6 text-center text-sm text-[#DC2626]">
            {compare.error}
          </CardContent>
        </Card>
      )}

      {hasCompare && a && b && !compare.error && (
        <Card className="border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              Uporedba: {label(n(a.mesec), n(a.godina))} vs {label(n(b.mesec), n(b.godina))}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                  <th className="text-left py-3 px-4 font-semibold text-[#6B7280]"></th>
                  <th className="text-right py-3 px-4 font-semibold text-[#6B7280]">{label(n(a.mesec), n(a.godina))}</th>
                  <th className="text-right py-3 px-4 font-semibold text-[#6B7280]">{label(n(b.mesec), n(b.godina))}</th>
                  <th className="text-right py-3 px-4 font-semibold text-[#6B7280]">Razlika</th>
                </tr>
              </thead>
              <tbody>
                {(n(a.potrazivanja_kupci) !== 0 || n(b.potrazivanja_kupci) !== 0) && (
                  <tr className="border-b border-[#F3F4F6]">
                    <td className="py-2 px-4 text-[#111827]">Potraživanja</td>
                    <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(a.potrazivanja_kupci))}</td>
                    <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(b.potrazivanja_kupci))}</td>
                    <td className="py-2 px-4 text-right tabular-nums">{formatDiff(n(a.potrazivanja_kupci) - n(b.potrazivanja_kupci))}</td>
                  </tr>
                )}
                <tr className="border-b border-[#F3F4F6]">
                  <td className="py-2 px-4 text-[#111827]">Račun Intesa</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(a.racun_intesa))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(b.racun_intesa))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatDiff(n(a.racun_intesa) - n(b.racun_intesa))}</td>
                </tr>
                <tr className="border-b border-[#F3F4F6]">
                  <td className="py-2 px-4 text-[#111827]">Račun NLB</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(a.racun_nlb))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(b.racun_nlb))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatDiff(n(a.racun_nlb) - n(b.racun_nlb))}</td>
                </tr>
                <tr className="border-b border-[#F3F4F6]">
                  <td className="py-2 px-4 text-[#111827]">Devizni račun</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(a.devizni_racun))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(b.devizni_racun))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatDiff(n(a.devizni_racun) - n(b.devizni_racun))}</td>
                </tr>
                <tr className="border-b border-[#F3F4F6]">
                  <td className="py-2 px-4 text-[#111827]">Gotovi proizvodi</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(a.gotovi_proizvodi))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(b.gotovi_proizvodi))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatDiff(n(a.gotovi_proizvodi) - n(b.gotovi_proizvodi))}</td>
                </tr>
                <tr className="border-b border-[#F3F4F6]">
                  <td className="py-2 px-4 text-[#111827]">Sirovine</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(a.sirovine))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(b.sirovine))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatDiff(n(a.sirovine) - n(b.sirovine))}</td>
                </tr>
                <tr className="border-b border-[#F3F4F6]">
                  <td className="py-2 px-4 text-[#111827]">Ostalo</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(a.ostalo))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(b.ostalo))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatDiff(n(a.ostalo) - n(b.ostalo))}</td>
                </tr>
                <tr className="border-b-2 border-[#E5E7EB] bg-[#F9FAFB] font-medium">
                  <td className="py-2 px-4 text-[#111827]">UKUPNO CASH</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(a.ukupno_cash))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(b.ukupno_cash))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatDiff(n(a.ukupno_cash) - n(b.ukupno_cash))}</td>
                </tr>
                <tr className="border-b border-[#F3F4F6]">
                  <td className="py-2 px-4 text-[#111827]">Dugovanja dobavljači</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(a.dugovanja_dobavljaci))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(n(b.dugovanja_dobavljaci))}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{formatDiff(n(a.dugovanja_dobavljaci) - n(b.dugovanja_dobavljaci))}</td>
                </tr>
                <tr className="bg-[#D1FAE5] font-bold">
                  <td className="py-3 px-4 text-[#111827]">NETO CASH FLOW</td>
                  <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(n(a.neto_cash_flow))}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(n(b.neto_cash_flow))}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{formatDiff(n(a.neto_cash_flow) - n(b.neto_cash_flow))}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-6 text-sm">
              <p className="text-[#6B7280]">
                <span className="font-medium text-[#111827]">Cash: </span>
                {percentChange(n(b.ukupno_cash), n(a.ukupno_cash)) != null
                  ? `${percentChange(n(b.ukupno_cash), n(a.ukupno_cash))! >= 0 ? "+" : ""}${percentChange(n(b.ukupno_cash), n(a.ukupno_cash))!.toFixed(1)}%`
                  : "—"}
              </p>
              <p className="text-[#6B7280]">
                <span className="font-medium text-[#111827]">Dugovanja: </span>
                {percentChange(n(b.dugovanja_dobavljaci), n(a.dugovanja_dobavljaci)) != null
                  ? `${percentChange(n(b.dugovanja_dobavljaci), n(a.dugovanja_dobavljaci))!.toFixed(1)}%`
                  : "—"}
              </p>
              <p className="text-[#6B7280]">
                <span className="font-medium text-[#111827]">Neto C/F: </span>
                {percentChange(n(b.neto_cash_flow), n(a.neto_cash_flow)) != null
                  ? `${percentChange(n(b.neto_cash_flow), n(a.neto_cash_flow))! >= 0 ? "+" : ""}${percentChange(n(b.neto_cash_flow), n(a.neto_cash_flow))!.toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
