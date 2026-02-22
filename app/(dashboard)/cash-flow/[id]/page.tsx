import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ArrowLeft, Pencil, BarChart3, Zap } from "lucide-react"

const MESECI = [
  "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
]

function formatDatum(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}.${month}.${year}.`
}

export default async function CashFlowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: snapshot, error } = await supabase
    .from("cash_snapshots")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !snapshot) notFound()

  const tipUnosa = String(snapshot.tip_unosa) as "detaljan" | "brzi"
  const isDetaljan = tipUnosa === "detaljan"

  let partners: Array<{ partner_naziv: string; kupci_iznos: number; dobavljaci_iznos: number }> = []
  if (isDetaljan) {
    const { data: rows } = await supabase
      .from("excel_partners")
      .select("partner_naziv, kupci_iznos, dobavljaci_iznos")
      .eq("snapshot_id", id)
      .order("partner_naziv", { ascending: true })
    partners = (rows ?? []).map((r) => ({
      partner_naziv: String(r.partner_naziv ?? ""),
      kupci_iznos: Number(r.kupci_iznos ?? 0),
      dobavljaci_iznos: Number(r.dobavljaci_iznos ?? 0),
    }))
  }

  const n = (v: unknown) => Number(v ?? 0)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/cash-flow" aria-label="Nazad">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#111827]">
            Cash Flow — {MESECI[snapshot.mesec]} {snapshot.godina}
          </h1>
          <p className="text-sm text-[#6B7280]">
            {isDetaljan ? (
              <span className="inline-flex items-center gap-1">
                <BarChart3 className="h-4 w-4" /> Detaljni snimak
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Zap className="h-4 w-4" /> Brzi unos (istorija)
              </span>
            )}
            {" · "}
            Datum unosa: {formatDatum(snapshot.datum_unosa)}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="border-[#E5E7EB]">
          <Link href={`/cash-flow/${id}/uredi`}>
            <Pencil className="mr-2 h-4 w-4" />
            Izmeni
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <Card className="border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {isDetaljan ? "CASH (Aktiva)" : "Pregled"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDetaljan ? (
              <>
                <div className="grid gap-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-[#6B7280]">Potraživanja od kupaca:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(n(snapshot.potrazivanja_kupci))}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#6B7280]">Račun Intesa:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(n(snapshot.racun_intesa))}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#6B7280]">Račun NLB:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(n(snapshot.racun_nlb))}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#6B7280]">Devizni račun:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(n(snapshot.devizni_racun))}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#6B7280]">Gotovi proizvodi:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(n(snapshot.gotovi_proizvodi))}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#6B7280]">Sirovine:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(n(snapshot.sirovine))}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#6B7280]">Ostalo:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(n(snapshot.ostalo))}</span>
                  </p>
                  <p className="flex justify-between border-t border-[#E5E7EB] pt-2 font-semibold text-[#111827]">
                    <span>UKUPNO CASH:</span>
                    <span className="tabular-nums">{formatCurrency(n(snapshot.ukupno_cash))}</span>
                  </p>
                </div>
                <div className="border-t border-[#E5E7EB] pt-4">
                  <p className="text-sm font-semibold text-[#111827]">DUGOVANJA (Pasiva)</p>
                  <p className="flex justify-between text-sm mt-1">
                    <span className="text-[#6B7280]">Dobavljači:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(n(snapshot.dugovanja_dobavljaci))}</span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Ukupna aktiva (Cash):</span>
                  <span className="font-medium tabular-nums">{formatCurrency(n(snapshot.ukupno_cash))}</span>
                </p>
                <p className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Ukupna pasiva (Dugovanja):</span>
                  <span className="font-medium tabular-nums">{formatCurrency(n(snapshot.dugovanja_dobavljaci))}</span>
                </p>
              </>
            )}

            <div className="rounded-lg bg-[#D1FAE5] px-4 py-3">
              <p className="text-lg font-bold text-[#111827]">
                NETO CASH FLOW: {formatCurrency(n(snapshot.neto_cash_flow))}
              </p>
            </div>
          </CardContent>
        </Card>

        {isDetaljan && partners.length > 0 && (
          <Card className="border-[#E5E7EB] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Partneri iz Excel-a</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E5E7EB] hover:bg-transparent">
                    <TableHead className="bg-[#F9FAFB] text-xs font-semibold text-[#6B7280]">Partner</TableHead>
                    <TableHead className="bg-[#F9FAFB] text-xs font-semibold text-[#6B7280] text-right">Kupci</TableHead>
                    <TableHead className="bg-[#F9FAFB] text-xs font-semibold text-[#6B7280] text-right">Dobavljači</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((p, i) => (
                    <TableRow key={i} className="border-[#F3F4F6]">
                      <TableCell className="text-sm text-[#111827]">{p.partner_naziv}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{p.kupci_iznos > 0 ? formatCurrency(p.kupci_iznos) : "—"}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{p.dobavljaci_iznos > 0 ? formatCurrency(p.dobavljaci_iznos) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
