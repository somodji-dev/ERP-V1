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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  createInventoryCountAction,
  updateRawMaterialAction,
} from "@/app/actions/inventory"
import type { RawMaterial, InventoryRow } from "@/lib/types/inventory"
import { Plus, Printer, Loader2, Package, AlertTriangle, Pencil, Check } from "lucide-react"
import { cn } from "@/lib/utils/cn"

const JEDINICE = ["kg", "paleta", "kutija", "kom", "paket", "kanta", "pakovanje"]

function fmtKol(kolicina: number, jedinica: string): string {
  const n = kolicina.toLocaleString("sr-RS", { maximumFractionDigits: 2 })
  return `${n} ${jedinica}`
}

export function PopisSirovinaClient({
  rows,
  materials,
  latestCountDate,
  countsCount,
  canEditMaterials,
  employees,
}: {
  rows: InventoryRow[]
  materials: RawMaterial[]
  latestCountDate: string | null
  countsCount: number
  canEditMaterials: boolean
  employees: { id: string; label: string }[]
}) {
  const router = useRouter()
  const { toast } = useToast()

  // Popis dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [datum, setDatum] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [checks, setChecks] = useState<Record<string, boolean>>({})

  // Admin edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editMaterial, setEditMaterial] = useState<RawMaterial | null>(null)
  const [editMin, setEditMin] = useState("")
  const [editJedinica, setEditJedinica] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  const ispodMinimuma = rows.filter((r) => r.ispod_minimuma).length

  function openNoviPopis() {
    const q: Record<string, string> = {}
    const c: Record<string, boolean> = {}
    for (const r of rows) {
      q[r.id] = r.kolicina > 0 ? String(r.kolicina) : ""
      c[r.id] = r.iznad_minimuma
    }
    setQuantities(q)
    setChecks(c)
    setDatum(new Date().toISOString().slice(0, 10))
    setSelectedEmployee("")
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const items = materials.map((m) => ({
      raw_material_id: m.id,
      kolicina: checks[m.id]
        ? 0
        : Number(String(quantities[m.id] ?? "0").replace(",", ".")) || 0,
      iznad_minimuma: checks[m.id] ?? false,
    }))

    const result = await createInventoryCountAction(datum, selectedEmployee || null, items)
    setIsLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Popis sačuvan." })
    setDialogOpen(false)
    router.refresh()
  }

  function openEditMaterial(m: RawMaterial) {
    setEditMaterial(m)
    setEditMin(String(m.min_kolicina))
    setEditJedinica(m.jedinica)
    setEditDialogOpen(true)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editMaterial) return
    setEditLoading(true)
    const minVal = Number(String(editMin).replace(",", "."))
    if (Number.isNaN(minVal) || minVal < 0) {
      toast({ title: "Greška", description: "Unesite validnu količinu.", variant: "destructive" })
      setEditLoading(false)
      return
    }
    const result = await updateRawMaterialAction(editMaterial.id, minVal, editJedinica)
    setEditLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Sirovina ažurirana." })
    setEditDialogOpen(false)
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
              {ispodMinimuma} sirovina ispod minimuma
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

      {/* Tabela popisa */}
      <div
        id="popis-sirovine-print"
        className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-x-auto print:rounded-none print:border-0 print:shadow-none"
      >
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
              {canEditMaterials && (
                <th className="px-4 py-2.5 font-medium text-right print:hidden w-16"></th>
              )}
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
                  <td className={cn("px-4 py-2 print:px-2 print:py-0.5 text-right tabular-nums", row.ispod_minimuma ? "text-[#DC2626] font-medium" : "text-[#111827]")}>
                    {countsCount === 0 ? "—" : row.iznad_minimuma ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#D1FAE5] px-2 py-0.5 text-xs font-medium text-[#16A34A]">
                        <Check className="h-3 w-3" />
                        Dovoljno
                      </span>
                    ) : fmtKol(row.kolicina, row.jedinica)}
                  </td>
                  <td className={cn("px-4 py-2 print:px-2 print:py-0.5 text-right tabular-nums", row.ispod_minimuma ? "text-[#DC2626] font-medium" : razlika >= 0 || row.iznad_minimuma ? "text-[#16A34A]" : "")}>
                    {countsCount === 0 ? "—" : row.iznad_minimuma ? "—" : (razlika >= 0 ? "+" : "") + fmtKol(razlika, row.jedinica)}
                  </td>
                  {canEditMaterials && (
                    <td className="px-4 py-2 text-right print:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditMaterial(row)}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5 text-[#6B7280]" />
                      </Button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>

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
                <Label htmlFor="popis-radnik">Popisivač</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger id="popis-radnik" className="border-[#E5E7EB]">
                    <SelectValue placeholder="Izaberi radnika" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-gray-50 text-left text-[#6B7280]">
                    <th className="px-3 py-2 font-medium">Sirovina</th>
                    <th className="px-3 py-2 font-medium text-right w-24">Min.</th>
                    <th className="px-3 py-2 font-medium text-center w-20">Dovoljno</th>
                    <th className="px-3 py-2 font-medium w-32">Količina</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => {
                    const isChecked = checks[m.id] ?? false
                    return (
                      <tr key={m.id} className="border-b border-[#E5E7EB]/70">
                        <td className="px-3 py-1.5 text-[#111827]">{m.naziv}</td>
                        <td className="px-3 py-1.5 text-right text-[#6B7280] tabular-nums">
                          {Number(m.min_kolicina).toLocaleString("sr-RS")} {m.jedinica}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setChecks((c) => ({ ...c, [m.id]: e.target.checked }))
                            }
                            className="h-4 w-4 rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB]"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            disabled={isChecked}
                            value={isChecked ? "" : (quantities[m.id] ?? "")}
                            onChange={(e) =>
                              setQuantities((q) => ({ ...q, [m.id]: e.target.value }))
                            }
                            className={cn(
                              "h-8 border-[#E5E7EB] text-right tabular-nums",
                              isChecked && "bg-[#F3F4F6] opacity-50"
                            )}
                          />
                        </td>
                      </tr>
                    )
                  })}
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

      {/* Admin edit dialog za min. količinu */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="border-[#E5E7EB] bg-white shadow-md rounded-xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Izmena: {editMaterial?.naziv}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-min">Minimalna količina</Label>
              <Input
                id="edit-min"
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={editMin}
                onChange={(e) => setEditMin(e.target.value)}
                className="border-[#E5E7EB]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-jedinica">Jedinica mere</Label>
              <Select value={editJedinica} onValueChange={setEditJedinica}>
                <SelectTrigger id="edit-jedinica" className="border-[#E5E7EB]">
                  <SelectValue placeholder="Jedinica" />
                </SelectTrigger>
                <SelectContent>
                  {JEDINICE.map((j) => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={editLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                {editLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Čuvanje...</>
                ) : (
                  "Sačuvaj"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
