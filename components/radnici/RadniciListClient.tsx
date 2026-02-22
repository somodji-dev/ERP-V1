"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
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
import { UserPlus, Eye, Pencil, Users, Check } from "lucide-react"
import type { Employee } from "@/lib/types/radnici"

type Filter = "svi" | "aktivni" | "neaktivni"

export function RadniciListClient({
  initialEmployees,
}: {
  initialEmployees: Employee[]
}) {
  const [filter, setFilter] = useState<Filter>("aktivni")

  const filtered = useMemo(() => {
    if (filter === "aktivni") return initialEmployees.filter((e) => e.aktivan)
    if (filter === "neaktivni") return initialEmployees.filter((e) => !e.aktivan)
    return initialEmployees
  }, [initialEmployees, filter])

  const hasPrevoz = (e: Employee) =>
    e.nadoknada_prevoz != null && Number(e.nadoknada_prevoz) > 0

  if (initialEmployees.length === 0) {
    return (
      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center text-[#6B7280]">
            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm font-medium">Nema radnika. Kliknite + Novi radnik.</p>
            <Button asChild className="mt-4 bg-[#2563EB] hover:bg-[#1D4ED8]">
              <Link href="/radnici/novi">
                <UserPlus className="mr-2 h-4 w-4" />
                Novi radnik
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm">
      <CardContent className="p-0">
        <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] px-4 py-3">
          <span className="text-sm font-medium text-[#6B7280] mr-1">Filter:</span>
          {(["svi", "aktivni", "neaktivni"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? "rounded-md px-3 py-1.5 text-sm font-medium bg-[#2563EB] text-white"
                  : "rounded-md px-3 py-1.5 text-sm font-medium text-[#6B7280] hover:bg-[#F4F5F7]"
              }
            >
              {f === "svi" ? "Svi" : f === "aktivni" ? "Aktivni" : "Neaktivni"}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#6B7280]">
            Nema radnika za izabrani filter.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7EB] hover:bg-transparent">
                <TableHead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280]">
                  Ime i prezime
                </TableHead>
                <TableHead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280]">
                  Pozicija
                </TableHead>
                <TableHead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280]">
                  Prevoz
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
              {filtered.map((employee) => (
                <TableRow
                  key={employee.id}
                  className="border-[#F3F4F6] hover:bg-[#F4F5F7]"
                >
                  <TableCell className="text-sm font-medium text-[#111827]">
                    {employee.ime} {employee.prezime}
                  </TableCell>
                  <TableCell className="text-sm text-[#6B7280]">
                    {employee.pozicija ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-[#6B7280]">
                    {hasPrevoz(employee) ? (
                      <Check className="h-4 w-4 text-[#10B981]" aria-label="Ima prevoz" />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        employee.aktivan
                          ? "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#D1FAE5] text-[#10B981]"
                          : "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#F3F4F6] text-[#6B7280]"
                      }
                    >
                      {employee.aktivan ? "Aktivan" : "Neaktivan"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild size="sm" className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                        <Link href={`/radnici/${employee.id}`}>
                          <Eye className="mr-1.5 h-4 w-4" />
                          Otvori profil
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/radnici/${employee.id}/uredi`}>
                          <Pencil className="mr-1.5 h-4 w-4" />
                          Uredi
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
