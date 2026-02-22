import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Eye } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"

const MESECI = [
  "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
]

export default async function PlateListPage() {
  const supabase = await createClient()
  const { data: reports, error } = await supabase
    .from("payroll_reports")
    .select("id, employee_id, mesec, godina, neto_za_isplatu, status, employees(ime, prezime)")
    .order("godina", { ascending: false })
    .order("mesec", { ascending: false })

  if (error) {
    return (
      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">Greška pri učitavanju: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  const list = reports ?? []
  type Row = Record<string, unknown> & { employees?: { ime?: string; prezime?: string } | { ime?: string; prezime?: string }[] | null }
  type PlateRow = { id: unknown; mesec: unknown; godina: unknown; neto_za_isplatu: unknown; status: unknown; employeeName: string }
  const rows: PlateRow[] = list.map((r: Row) => {
    const emp = Array.isArray(r.employees) ? r.employees[0] : r.employees
    const employeeName = emp
      ? `${String(emp.ime ?? "")} ${String(emp.prezime ?? "")}`.trim()
      : "—"
    return { id: r.id, mesec: r.mesec, godina: r.godina, neto_za_isplatu: r.neto_za_isplatu, status: r.status, employeeName }
  })

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-[#111827]">Platni izveštaji</h1>
        <Button asChild className="bg-[#2563EB] hover:bg-[#1D4ED8] shrink-0">
          <Link href="/plate/novi">
            <Plus className="mr-2 h-4 w-4" />
            Novi izveštaj
          </Link>
        </Button>
      </div>

      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-[#6B7280]">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm font-medium">Nema platnih izveštaja.</p>
              <p className="text-xs mt-1">Kliknite Novi izveštaj da generišete prvi.</p>
              <Button asChild className="mt-4 bg-[#2563EB] hover:bg-[#1D4ED8]">
                <Link href="/plate/novi">
                  <Plus className="mr-2 h-4 w-4" />
                  Novi izveštaj
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#E5E7EB] hover:bg-transparent">
                  <TableHead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280]">
                    Radnik
                  </TableHead>
                  <TableHead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280]">
                    Period
                  </TableHead>
                  <TableHead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280]">
                    Neto za isplatu
                  </TableHead>
                  <TableHead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280]">
                    Status
                  </TableHead>
                  <TableHead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280] text-right">
                    Akcije
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const status = String(row.status ?? "")
                  return (
                  <TableRow key={String(row.id)} className="border-[#F3F4F6] hover:bg-[#F4F5F7]">
                    <TableCell className="text-sm font-medium text-[#111827]">
                      {row.employeeName}
                    </TableCell>
                    <TableCell className="text-sm text-[#6B7280]">
                      {MESECI[Number(row.mesec)]} {String(row.godina ?? "")}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-[#111827]">
                      {formatCurrency(Number(row.neto_za_isplatu ?? 0))}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          status === "isplacen"
                            ? "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#D1FAE5] text-[#16A34A]"
                            : status === "finalizovan"
                              ? "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#DBEAFE] text-[#2563EB]"
                              : "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#F3F4F6] text-[#6B7280]"
                        }
                      >
                        {status === "nacrt" ? "Nacrt" : status === "finalizovan" ? "Finalizovan" : "Isplaćen"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                        <Link href={`/plate/${String(row.id)}`}>
                          <Eye className="mr-1.5 h-4 w-4" />
                          Pogledaj
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
