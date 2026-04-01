"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createInventoryCountAction } from "@/app/actions/inventory"
import type { RawMaterial, InventoryRow } from "@/lib/types/inventory"
import { Plus, Printer, Loader2, Package, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils/cn"

function fmtKol(kolicina: number, jedinica: string): string {
  const n = kolicina.toLocaleString("sr-RS", { maximumFractionDigits: 2 })
  return `${n} ${jedinica}`
}

export function PopisSirovinaClient({
  rows,
  materials,
  latestCountDate,
  countsCount,
}: {
  rows: InventoryRow[]
  materials: RawMaterial[]
  latestCountDate: string | null
  countsCount: number
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [datum, setDatum] = useState(() => new Date().toISOString().slice(0, 10))
  const [napomena, setNapomena] = useState("")
  const [quantities, setQuantities] = useState<Record<string, string>>({})

  const ispodMinimuma = rows.filter((r) => r.ispod_minimuma).length

  function openNoviPopis() {
    // Prefill sa poslednjim količinama
    const q: Record<string, string> = {}
    for (const r of rows) {
      q[r.id] = r.kolicina > 0 ? String(r.kolicina) : ""
    }
    setQuantities(q)
    setDatum(new Date().toISOString().slice(0, 10))
    setNapomena("")
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const items = materials.map((m) => ({
      raw_material_id: m.id,
      kolicina: Number(String(quantities[m.id] ?? "0").replace(",", ".")) || 0,
    }))

    const result = await createInventoryCountAction(datum, napomena || null, items)
    setIsLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Popis sačuvan." })
    setDialogOpen(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Akcije */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          {ispodMinimuma > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-1.5 text-sm text-[#DC2626]">
              <AlertTriangle className="h-4 w-4" />
              {ispodMinimuma} {ispodMinimuma === 1 ? "sirovina" : "sirovina"} ispod minimuma
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#E5E7EB]" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Štampaj
          </Button>
          <Button onClick={openNoviPopis} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
            <Plus className="mr-2 h-4 w-4" />
            Novi popis
          </Button>
        </div>
      </div>

      {/* Tabela popisa — štamparska verzija */}
      <div
        id="popis-sirovine-print"
        className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-x-auto print:rounded-none print:border-0 print:shadow-none"
      >
        {/* Print header */}
        <div className="hidden print:block print:mb-4 print:text-center">
          <h1 className="text-lg font-bold">POPIS SIROVINA</h1>
          {latestCountDate && (
            <p className="text-xs text-gray-500">
              Datum popisa: {new Date(latestCountDate).toLocaleDateString("sr-RS")}
            </p>
          )}
        </div>

        <table className="w-full text-sm print:text-[9pt]">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-gray-50 text-left text-[#6B7280] print:bg-transparent">
              <th className="px-4 py-2.5 font-medium print:px-2 print:py-1 w-8 print:w-6">#</th>
              <th className="px-4 py-2.5 font-medium print:px-2 print:py-1">Sirovina</th>
              <th className="px-4 py-2.5 font-medium text-right print:px-2 print:py-1">Min. količina</th>
              <th className="px-4 py-2.5 font-medium text-right print:px-2 print:py-1">Stanje</th>
              <th className="px-4 py-2.5 font-medium text-right print:px-2 print:py-1">Razlika</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const razlika = row.kolicina - Number(row.min_kolicina)
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-[#E5E7EB]/70",
                    row.ispod_minimuma
                      ? "bg-[#F3F4F6] text-[#DC2626] font-medium print:bg-gray-100"
                      : "hover:bg-[#F9FAFB]"
                  )}
                >
                  <td className="px-4 py-2 print:px-2 print:py-0.5 text-[#6B7280] tabular-nums">
                    {idx + 1}
                  </td>
                  <td className={cn("px-4 py-2 print:px-2 print:py-0.5", row.ispod_minimuma ? "text-[#DC2626]" : "text-[#111827]")}>
                    {row.naziv}
                  </td>
                  <td className="px-4 py-2 print:px-2 print:py-0.5 text-right tabular-nums">
                    {fmtKol(Number(row.min_kolicina), row.jedinica)}
                  </td>
                  <td className={cn("px-4 py-2 print:px-2 print:py-0.5 text-right tabular-nums font-medium", row.ispod_minimuma ? "text-[#DC2626]" : "text-[#111827]")}>
                    {countsCount > 0 ? fmtKol(row.kolicina, row.jedinica) : "—"}
                  </td>
                  <td className={cn("px-4 py-2 print:px-2 print:py-0.5 text-right tabular-nums", razlika < 0 ? "text-[#DC2626] font-medium" : "text-[#16A34A]")}>
                    {countsCount > 0 ? (razlika >= 0 ? "+" : "") + fmtKol(razlika, row.jedinica) : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Print footer */}
        <div className="hidden print:block print:mt-4 print:text-xs print:text-gray-400 print:text-center">
          Štampano: {new Date().toLocaleDateString("sr-RS")}
        </div>
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-white py-12 text-center shadow-sm print:hidden">
          <Package className="mx-auto mb-3 h-10 w-10 text-[#9CA3AF]" />
          <p className="text-sm text-[#6B7280]">Nema sirovina u sistemu.</p>
        </div>
      )}

      {/* Dialog za novi popis */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-[#E5E7EB] bg-white shadow-md rounded-xl max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novi popis sirovina</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="popis-datum">Datum popisa</Label>
                <Input
                  id="popis-datum"
                  type="date"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                  className="border-[#E5E7EB]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="popis-napomena">Napomena</Label>
                <Input
                  id="popis-napomena"
                  value={napomena}
                  onChange={(e) => setNapomena(e.target.value)}
                  className="border-[#E5E7EB]"
                  placeholder="Opciono"
                />
              </div>
            </div>

            <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-gray-50 text-left text-[#6B7280]">
                    <th className="px-3 py-2 font-medium">Sirovina</th>
                    <th className="px-3 py-2 font-medium text-right w-24">Min.</th>
                    <th className="px-3 py-2 font-medium w-32">Količina</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id} className="border-b border-[#E5E7EB]/70">
                      <td className="px-3 py-1.5 text-[#111827]">{m.naziv}</td>
                      <td className="px-3 py-1.5 text-right text-[#6B7280] tabular-nums">
                        {Number(m.min_kolicina).toLocaleString("sr-RS")} {m.jedinica}
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={quantities[m.id] ?? ""}
                          onChange={(e) =>
                            setQuantities((q) => ({ ...q, [m.id]: e.target.value }))
                          }
                          className="h-8 border-[#E5E7EB] text-right tabular-nums"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Čuvanje...</>
                ) : (
                  "Sačuvaj popis"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
