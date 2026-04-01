"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { formatCurrency } from "@/lib/utils/format"
import { upsertFinancialAction, deleteFinancialAction } from "@/app/actions/financials"
import type { MonthlyFinancial } from "@/lib/types/financials"
import { Plus, Pencil, Trash2, Loader2, TrendingUp, TrendingDown, DollarSign } from "lucide-react"

const MESECI = [
  "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
]

function fmtShort(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + "K"
  return String(n)
}

type FormState = {
  mesec: number
  godina: number
  prihod: string
  rashod: string
  napomena: string
  editId?: string
}

export function PrihodiRashodiClient({
  initialData,
  godina,
  availableYears,
}: {
  initialData: MonthlyFinancial[]
  godina: number
  availableYears: number[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MonthlyFinancial | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    mesec: 1,
    godina,
    prihod: "",
    rashod: "",
    napomena: "",
  })

  // Izvedene vrednosti
  const dataByMesec = new Map(initialData.map((d) => [d.mesec, d]))
  const ukupanPrihod = initialData.reduce((s, d) => s + Number(d.prihod), 0)
  const ukupanRashod = initialData.reduce((s, d) => s + Number(d.rashod), 0)
  const brutoProfit = ukupanPrihod - ukupanRashod

  // Podaci za grafikon (svih 12 meseci)
  const chartData = MESECI.map((label, i) => {
    const m = i + 1
    const row = dataByMesec.get(m)
    const prihod = row ? Number(row.prihod) : 0
    const rashod = row ? Number(row.rashod) : 0
    return { mesec: label.substring(0, 3), prihod, rashod, profit: prihod - rashod }
  })

  function openNew() {
    // Pronađi prvi mesec bez unosa
    let firstEmpty = 1
    for (let m = 1; m <= 12; m++) {
      if (!dataByMesec.has(m)) { firstEmpty = m; break }
    }
    setForm({ mesec: firstEmpty, godina, prihod: "", rashod: "", napomena: "" })
    setDialogOpen(true)
  }

  function openEdit(d: MonthlyFinancial) {
    setForm({
      mesec: d.mesec,
      godina: d.godina,
      prihod: String(d.prihod),
      rashod: String(d.rashod),
      napomena: d.napomena ?? "",
      editId: d.id,
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const prihod = Number(String(form.prihod).replace(",", "."))
    const rashod = Number(String(form.rashod).replace(",", "."))
    if (Number.isNaN(prihod) || Number.isNaN(rashod)) {
      toast({ title: "Greška", description: "Unesite validne brojeve.", variant: "destructive" })
      return
    }
    setIsLoading(true)
    const result = await upsertFinancialAction(form.mesec, form.godina, prihod, rashod, form.napomena || null)
    setIsLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: form.editId ? "Unos ažuriran." : "Unos sačuvan." })
    setDialogOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsLoading(true)
    const result = await deleteFinancialAction(deleteTarget.id)
    setIsLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
    } else {
      toast({ title: "Unos obrisan." })
    }
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Filter po godini + dugme za novi unos */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          value={String(godina)}
          onValueChange={(v) => router.push(`/prihodi-rashodi?godina=${v}`)}
        >
          <SelectTrigger className="w-[140px] border-[#E5E7EB]">
            <SelectValue placeholder="Godina" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={openNew} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
          <Plus className="mr-2 h-4 w-4" />
          Novi unos
        </Button>
      </div>

      {/* KPI kartice */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <TrendingUp className="h-4 w-4 text-[#16A34A]" />
            Ukupan prihod
          </div>
          <p className="mt-1 text-2xl font-bold text-[#16A34A]">{formatCurrency(ukupanPrihod)}</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <TrendingDown className="h-4 w-4 text-[#DC2626]" />
            Ukupan rashod
          </div>
          <p className="mt-1 text-2xl font-bold text-[#DC2626]">{formatCurrency(ukupanRashod)}</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <DollarSign className="h-4 w-4 text-[#2563EB]" />
            Bruto profit
          </div>
          <p className={`mt-1 text-2xl font-bold ${brutoProfit >= 0 ? "text-[#2563EB]" : "text-[#DC2626]"}`}>
            {formatCurrency(brutoProfit)}
          </p>
        </div>
      </div>

      {/* Grafikon */}
      {initialData.length > 0 && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[#111827]">Pregled po mesecima — {godina}</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="mesec" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }}
              />
              <Legend />
              <Bar dataKey="prihod" name="Prihod" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rashod" name="Rashod" fill="#DC2626" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Bruto profit" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Godišnja sumarna tabela */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-gray-50 text-left text-[#6B7280]">
              <th className="px-4 py-3 font-medium">Mesec</th>
              <th className="px-4 py-3 text-right font-medium">Prihod</th>
              <th className="px-4 py-3 text-right font-medium">Rashod</th>
              <th className="px-4 py-3 text-right font-medium">Bruto profit</th>
              <th className="px-4 py-3 text-right font-medium">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {MESECI.map((label, i) => {
              const m = i + 1
              const row = dataByMesec.get(m)
              const prihod = row ? Number(row.prihod) : 0
              const rashod = row ? Number(row.rashod) : 0
              const profit = prihod - rashod
              return (
                <tr key={m} className="border-b border-[#E5E7EB]/70 hover:bg-[#F9FAFB]">
                  <td className="px-4 py-2.5 font-medium text-[#111827]">{label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row ? formatCurrency(prihod) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row ? formatCurrency(rashod) : "—"}
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular-nums ${row ? (profit >= 0 ? "text-[#16A34A]" : "text-[#DC2626]") : ""}`}>
                    {row ? formatCurrency(profit) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {row ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(row)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#6B7280]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(row)}
                          className="h-8 w-8 p-0 text-[#DC2626] hover:text-[#DC2626]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              )
            })}
            {/* UKUPNO red */}
            <tr className="border-t-2 border-[#E5E7EB] bg-gray-50 font-bold">
              <td className="px-4 py-3 text-[#111827]">UKUPNO</td>
              <td className="px-4 py-3 text-right tabular-nums text-[#111827]">{formatCurrency(ukupanPrihod)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-[#111827]">{formatCurrency(ukupanRashod)}</td>
              <td className={`px-4 py-3 text-right tabular-nums ${brutoProfit >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                {formatCurrency(brutoProfit)}
              </td>
              <td className="px-4 py-3" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {initialData.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-white py-12 text-center shadow-sm">
          <DollarSign className="mx-auto mb-3 h-10 w-10 text-[#9CA3AF]" />
          <p className="text-sm text-[#6B7280]">Nema unetih podataka za {godina}. godinu.</p>
          <Button onClick={openNew} variant="outline" className="mt-4 border-[#E5E7EB]">
            <Plus className="mr-2 h-4 w-4" />
            Dodaj prvi unos
          </Button>
        </div>
      )}

      {/* Dialog za unos/izmenu */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-[#E5E7EB] bg-white shadow-md rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form.editId ? "Izmena unosa" : "Novi unos prihoda i rashoda"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fin-mesec">Mesec</Label>
                <Select
                  value={String(form.mesec)}
                  onValueChange={(v) => setForm((f) => ({ ...f, mesec: Number(v) }))}
                >
                  <SelectTrigger id="fin-mesec" className="border-[#E5E7EB]">
                    <SelectValue placeholder="Mesec" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESECI.map((label, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fin-godina">Godina</Label>
                <Input
                  id="fin-godina"
                  type="number"
                  min={2000}
                  max={2100}
                  value={form.godina}
                  onChange={(e) => setForm((f) => ({ ...f, godina: Number(e.target.value) }))}
                  className="border-[#E5E7EB]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fin-prihod">Prihod (RSD)</Label>
              <Input
                id="fin-prihod"
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={form.prihod}
                onChange={(e) => setForm((f) => ({ ...f, prihod: e.target.value }))}
                className="border-[#E5E7EB]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fin-rashod">Rashod (RSD)</Label>
              <Input
                id="fin-rashod"
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={form.rashod}
                onChange={(e) => setForm((f) => ({ ...f, rashod: e.target.value }))}
                className="border-[#E5E7EB]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fin-napomena">Napomena</Label>
              <Input
                id="fin-napomena"
                value={form.napomena}
                onChange={(e) => setForm((f) => ({ ...f, napomena: e.target.value }))}
                className="border-[#E5E7EB]"
                placeholder="Opciono"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Čuvanje...</>
                ) : (
                  "Sačuvaj"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Potvrda brisanja */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent className="border-[#E5E7EB] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Obrisati unos?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `Da li ste sigurni da želite da obrišete unos za ${MESECI[deleteTarget.mesec - 1]} ${deleteTarget.godina}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-[#DC2626] hover:bg-[#B91C1C]"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
