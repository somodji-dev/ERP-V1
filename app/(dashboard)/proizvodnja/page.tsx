import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { calculateTotalKg } from "@/lib/proizvodnja/calculations"
import { format } from "date-fns"
import { srLatn } from "date-fns/locale"
import { FileText, Plus } from "lucide-react"

type SearchParams = Promise<{ datumOd?: string; datumDo?: string; smena?: string; search?: string }>

type Props = { searchParams: SearchParams }

async function getNalozi(searchParams: SearchParams) {
  const params = await searchParams
  const supabase = await createClient()
  let query = supabase
    .from("work_orders")
    .select(
      `
      id,
      broj_naloga,
      datum,
      smena,
      work_order_employees (
        employee:employees (id, ime, prezime)
      ),
      pakovanje (
        pikant_15kg, pikant_1kg, pikant_200g, pikant_150g, pikant_80g,
        bbq_15kg, bbq_1kg, bbq_200g, bbq_150g, bbq_80g
      )
    `
    )
    .order("datum", { ascending: false })
    .order("broj_naloga", { ascending: false })

  if (params.datumOd) {
    query = query.gte("datum", params.datumOd)
  }
  if (params.datumDo) {
    query = query.lte("datum", params.datumDo)
  }
  if (params.smena && params.smena !== "sve") {
    query = query.eq("smena", params.smena)
  }
  if (params.search?.trim()) {
    query = query.ilike("broj_naloga", `%${params.search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as NalogRow[]
}

type NalogRow = {
  id: string
  broj_naloga: string
  datum: string
  smena: string
  work_order_employees: Array<{ employee: { id: string; ime: string; prezime: string } | null }>
  pakovanje: Array<{
    pikant_15kg?: number | null
    pikant_1kg?: number | null
    pikant_200g?: number | null
    pikant_150g?: number | null
    pikant_80g?: number | null
    bbq_15kg?: number | null
    bbq_1kg?: number | null
    bbq_200g?: number | null
    bbq_150g?: number | null
    bbq_80g?: number | null
  }> | null
}

function radniciDisplay(rows: NalogRow["work_order_employees"]): string {
  const names = rows
    ?.map((r) => {
      const emp = Array.isArray(r.employee) ? r.employee[0] : r.employee
      return emp ? `${emp.ime} ${emp.prezime}` : null
    })
    .filter(Boolean) as string[]
  if (!names?.length) return "—"
  if (names.length <= 2) return names.join(", ")
  return `${names[0]}, ${names[1]} +${names.length - 2}`
}

export default async function ProizvodnjaPage({ searchParams }: Props) {
  const nalozi = await getNalozi(searchParams)
  const params = await searchParams

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-[#111827]">Radni nalozi</h1>
        <Button asChild className="bg-[#2563EB] hover:bg-[#1D4ED8] shrink-0">
          <Link href="/proizvodnja/novi">
            <Plus className="mr-2 h-4 w-4" />
            Novi nalog
          </Link>
        </Button>
      </div>

      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="pt-6">
          <form method="get" action="/proizvodnja" className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="datumOd" className="text-[#6B7280] text-sm">
                Datum od
              </Label>
              <Input
                id="datumOd"
                name="datumOd"
                type="date"
                defaultValue={params.datumOd ?? ""}
                className="w-[160px] border-[#E5E7EB]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="datumDo" className="text-[#6B7280] text-sm">
                Datum do
              </Label>
              <Input
                id="datumDo"
                name="datumDo"
                type="date"
                defaultValue={params.datumDo ?? ""}
                className="w-[160px] border-[#E5E7EB]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smena" className="text-[#6B7280] text-sm">
                Smena
              </Label>
              <select
                id="smena"
                name="smena"
                defaultValue={params.smena ?? "sve"}
                className="flex h-9 w-[100px] rounded-md border border-[#E5E7EB] bg-white px-3 py-1 text-sm"
              >
                <option value="sve">Sve</option>
                <option value="I">I</option>
                <option value="II">II</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search" className="text-[#6B7280] text-sm">
                Broj naloga
              </Label>
              <Input
                id="search"
                name="search"
                type="search"
                placeholder="Pretraga..."
                defaultValue={params.search ?? ""}
                className="w-[180px] border-[#E5E7EB]"
              />
            </div>
            <Button type="submit" variant="outline" className="border-[#E5E7EB]">
              Filtriraj
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-5 border-[#E5E7EB] bg-white shadow-sm">
        {nalozi.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-[#9CA3AF]" />
            <p className="mt-4 text-[#6B7280]">Nema naloga za prikaz</p>
            <Button asChild variant="outline" className="mt-4 border-[#E5E7EB]">
              <Link href="/proizvodnja/novi">Kreiraj prvi nalog</Link>
            </Button>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7EB] hover:bg-transparent">
                <TableHead className="text-[#6B7280]">Broj naloga</TableHead>
                <TableHead className="text-[#6B7280]">Datum</TableHead>
                <TableHead className="text-[#6B7280]">Smena</TableHead>
                <TableHead className="text-[#6B7280]">Radnici</TableHead>
                <TableHead className="text-[#6B7280]">Proizvodnja</TableHead>
                <TableHead className="text-[#6B7280] w-[80px]">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nalozi.map((n) => {
                const pak = Array.isArray(n.pakovanje) ? n.pakovanje[0] : n.pakovanje
                const total = calculateTotalKg(pak ?? null)
                return (
                  <TableRow key={n.id} className="border-[#E5E7EB] hover:bg-[#F9FAFB]">
                    <TableCell className="font-medium text-[#111827]">{n.broj_naloga}</TableCell>
                    <TableCell className="text-[#111827]">
                      {format(new Date(n.datum), "dd.MM.yyyy", { locale: srLatn })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          n.smena === "II" ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                      >
                        {n.smena}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#111827]">{radniciDisplay(n.work_order_employees)}</TableCell>
                    <TableCell className="text-[#111827]">{total.ukupno} kg</TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm" className="text-[#2563EB]">
                        <Link href={`/proizvodnja/${n.id}`}>Detalj</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
