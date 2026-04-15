"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
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
import {
  upsertAdditionalExpenseAction,
  deleteAdditionalExpenseAction,
  getChartData,
} from "@/app/actions/additional-expenses"
import type { AdditionalExpense, MonthlyChartPoint } from "@/lib/types/additional-expenses"
import { Plus, Pencil, Trash2, Loader2, TrendingDown, Banknote, Activity } from "lucide-react"

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
  neposlovni: string
  bankomat: string
  napomena: string
  editId?: string
}

type RangeType = "12" | "year" | "range"

export function DodatniTroskoviClient({
  tableData,
  initialChartData,
  godina,
  availableYears,
}: {
  tableData: AdditionalExpense[]
  initialChartData: MonthlyChartPoint[]
  godina: number
  availableYears: number[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [, startTransition] = useTransition()

  // Form state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdditionalExpense | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    mesec: 1,
    godina,
    neposlovni: "",
    bankomat: "",
    napomena: "",
  })

  // Chart state
  const [rangeType, setRangeType] = useState<RangeType>("12")
  const [chartYear, setChartYear] = useState<number>(godina)
  const defaultFrom = (() => {
    const d = new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })()
  const defaultTo = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })()
  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo, setDateTo] = useState(defaultTo)
  const [chartData, setChartData] = useState<MonthlyChartPoint[]>(initialChartData)
  const [chartLoading, setChartLoading] = useState(false)

  // Toggle koje linije su vidljive
  const [showNeposlovni, setShowNeposlovni] = useState(true)
  const [showBankomat, setShowBankomat] = useState(true)
  const [showNeto, setShowNeto] = useState(true)

  async function loadChart() {
    setChartLoading(true)
    try {
      if (rangeType === "12") {
        const data = await getChartData("12", {})
        setChartData(data)
      } else if (rangeType === "year") {
        const data = await getChartData("year", { godina: chartYear })
        setChartData(data)
      } else {
        const [yFrom, mFrom] = dateFrom.split("-").map(Number)
        const [yTo, mTo] = dateTo.split("-").map(Number)
        const data = await getChartData("range", { fromY: yFrom, fromM: mFrom, toY: yTo, toM: mTo })
        setChartData(data)
      }
    } finally {
      setChartLoading(false)
    }
  }

  // Izvedene vrednosti za tabelu
  const dataByMesec = new Map(tableData.map((d) => [d.mesec, d]))
  const ukupnoNeposlovni = tableData.reduce((s, d) => s + Number(d.neposlovni), 0)
  const ukupnoBankomat = tableData.reduce((s, d) => s + Number(d.bankomat), 0)

  function openNew() {
    let firstEmpty = 1
    for (let m = 1; m <= 12; m++) {
      if (!dataByMesec.has(m)) { firstEmpty = m; break }
    }
    setForm({ mesec: firstEmpty, godina, neposlovni: "", bankomat: "", napomena: "" })
    setDialogOpen(true)
  }

  function openEdit(d: AdditionalExpense) {
    setForm({
      mesec: d.mesec,
      godina: d.godina,
      neposlovni: String(d.neposlovni),
      bankomat: String(d.bankomat),
      napomena: d.napomena ?? "",
      editId: d.id,
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const neposlovni = Number(String(form.neposlovni).replace(",", ".")) || 0
    const bankomat = Number(String(form.bankomat).replace(",", ".")) || 0
    setIsLoading(true)
    const result = await upsertAdditionalExpenseAction(form.mesec, form.godina, neposlovni, bankomat, form.napomena || null)
    setIsLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: form.editId ? "Unos ažuriran." : "Unos sačuvan." })
    setDialogOpen(false)
    startTransition(() => {
      router.refresh()
      loadChart()
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsLoading(true)
    const result = await deleteAdditionalExpenseAction(deleteTarget.id)
    setIsLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
    } else {
      toast({ title: "Unos obrisan." })
    }
    setDeleteTarget(null)
    startTransition(() => {
      router.refresh()
      loadChart()
    })
  }

  return (
    <div className="space-y-6">
      {/* Filter po godini za tabelu + dugme */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6B7280]">Tabela za godinu:</span>
          <Select
            value={String(godina)}
            onValueChange={(v) => router.push(`/dodatni-troskovi?godina=${v}`)}
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
        </div>

        <Button onClick={openNew} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
          <Plus className="mr-2 h-4 w-4" />
          Novi unos
        </Button>
      </div>

      {/* KPI kartice */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <TrendingDown className="h-4 w-4 text-[#DC2626]" />
            Neposlovni troškovi — {godina}
          </div>
          <p className="mt-1 text-2xl font-bold text-[#DC2626]">{formatCurrency(ukupnoNeposlovni)}</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Banknote className="h-4 w-4 text-[#F59E0B]" />
            Bankomat — {godina}
          </div>
          <p className="mt-1 text-2xl font-bold text-[#F59E0B]">{formatCurrency(ukupnoBankomat)}</p>
        </div>
      </div>

      {/* Grafikon — uporedno sva 3 */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#111827]">Uporedni grafikon</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={rangeType === "12" ? "default" : "outline"}
              size="sm"
              className={rangeType === "12" ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : "border-[#E5E7EB]"}
              onClick={() => { setRangeType("12"); }}
            >
              Zadnjih 12 meseci
            </Button>
            <Button
              type="button"
              variant={rangeType === "year" ? "default" : "outline"}
              size="sm"
              className={rangeType === "year" ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : "border-[#E5E7EB]"}
              onClick={() => { setRangeType("year"); }}
            >
              Po godini
            </Button>
            <Button
              type="button"
              variant={rangeType === "range" ? "default" : "outline"}
              size="sm"
              className={rangeType === "range" ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : "border-[#E5E7EB]"}
              onClick={() => { setRangeType("range"); }}
            >
              Od – Do
            </Button>
          </div>
        </div>

        {/* Dodatni kontroli za year/range */}
        {rangeType === "year" && (
          <div className="mb-3 flex items-center gap-2">
            <Label className="text-sm text-[#6B7280]">Godina:</Label>
            <Select value={String(chartYear)} onValueChange={(v) => setChartYear(Number(v))}>
              <SelectTrigger className="w-[140px] border-[#E5E7EB] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={loadChart} disabled={chartLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
              {chartLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Primeni"}
            </Button>
          </div>
        )}
        {rangeType === "range" && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Label className="text-sm text-[#6B7280]">Od:</Label>
            <Input type="month" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[140px] border-[#E5E7EB] h-9" />
            <Label className="text-sm text-[#6B7280]">Do:</Label>
            <Input type="month" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[140px] border-[#E5E7EB] h-9" />
            <Button size="sm" onClick={loadChart} disabled={chartLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
              {chartLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Primeni"}
            </Button>
          </div>
        )}
        {rangeType === "12" && (
          <div className="mb-3">
            <Button size="sm" onClick={loadChart} disabled={chartLoading} variant="outline" className="border-[#E5E7EB]">
              {chartLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Osveži"}
            </Button>
          </div>
        )}

        {/* Toggle kategorija */}
        <div className="mb-3 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showNeposlovni}
              onChange={(e) => setShowNeposlovni(e.target.checked)}
              className="h-4 w-4 rounded border-[#D1D5DB]"
              style={{ accentColor: "#DC2626" }}
            />
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: "#DC2626" }} /> Neposlovni</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showBankomat}
              onChange={(e) => setShowBankomat(e.target.checked)}
              className="h-4 w-4 rounded border-[#D1D5DB]"
              style={{ accentColor: "#F59E0B" }}
            />
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: "#F59E0B" }} /> Bankomat</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showNeto}
              onChange={(e) => setShowNeto(e.target.checked)}
              className="h-4 w-4 rounded border-[#D1D5DB]"
              style={{ accentColor: "#2563EB" }}
            />
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: "#2563EB" }} /> Neto Cash Flow</span>
          </label>
        </div>

        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }}
            />
            <Legend />
            {showNeposlovni && (
              <Line type="monotone" dataKey="neposlovni" name="Neposlovni" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            )}
            {showBankomat && (
              <Line type="monotone" dataKey="bankomat" name="Bankomat" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            )}
            {showNeto && (
              <Line type="monotone" dataKey="neto_cash_flow" name="Neto Cash Flow" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Godišnja tabela */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-gray-50 text-left text-[#6B7280]">
              <th className="px-4 py-3 font-medium">Mesec</th>
              <th className="px-4 py-3 text-right font-medium">Neposlovni</th>
              <th className="px-4 py-3 text-right font-medium">Bankomat</th>
              <th className="px-4 py-3 text-right font-medium">Ukupno</th>
              <th className="px-4 py-3 text-right font-medium">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {MESECI.map((label, i) => {
              const m = i + 1
              const row = dataByMesec.get(m)
              const neposlovni = row ? Number(row.neposlovni) : 0
              const bankomat = row ? Number(row.bankomat) : 0
              const ukupno = neposlovni + bankomat
              return (
                <tr key={m} className="border-b border-[#E5E7EB]/70 hover:bg-[#F9FAFB]">
                  <td className="px-4 py-2.5 font-medium text-[#111827]">{label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row ? formatCurrency(neposlovni) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row ? formatCurrency(bankomat) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                    {row ? formatCurrency(ukupno) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {row ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(row)} className="h-8 w-8 p-0">
                          <Pencil className="h-3.5 w-3.5 text-[#6B7280]" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)} className="h-8 w-8 p-0 text-[#DC2626] hover:text-[#DC2626]">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              )
            })}
            <tr className="border-t-2 border-[#E5E7EB] bg-gray-50 font-bold">
              <td className="px-4 py-3 text-[#111827]">UKUPNO</td>
              <td className="px-4 py-3 text-right tabular-nums text-[#DC2626]">{formatCurrency(ukupnoNeposlovni)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-[#F59E0B]">{formatCurrency(ukupnoBankomat)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-[#111827]">{formatCurrency(ukupnoNeposlovni + ukupnoBankomat)}</td>
              <td className="px-4 py-3" />
            </tr>
          </tbody>
        </table>
      </div>

      {tableData.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-white py-10 text-center shadow-sm">
          <Activity className="mx-auto mb-3 h-8 w-8 text-[#9CA3AF]" />
          <p className="text-sm text-[#6B7280]">Nema unetih podataka za {godina}. godinu.</p>
        </div>
      )}

      {/* Dialog za unos/izmenu */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-[#E5E7EB] bg-white shadow-md rounded-xl max-w-md w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>{form.editId ? "Izmena unosa" : "Novi unos"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dt-mesec">Mesec</Label>
                <Select value={String(form.mesec)} onValueChange={(v) => setForm((f) => ({ ...f, mesec: Number(v) }))}>
                  <SelectTrigger id="dt-mesec" className="border-[#E5E7EB]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESECI.map((label, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dt-godina">Godina</Label>
                <Input
                  id="dt-godina"
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
              <Label htmlFor="dt-neposlovni">Neposlovni troškovi (RSD)</Label>
              <Input
                id="dt-neposlovni"
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={form.neposlovni}
                onChange={(e) => setForm((f) => ({ ...f, neposlovni: e.target.value }))}
                className="border-[#E5E7EB]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dt-bankomat">Bankomat (RSD)</Label>
              <Input
                id="dt-bankomat"
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={form.bankomat}
                onChange={(e) => setForm((f) => ({ ...f, bankomat: e.target.value }))}
                className="border-[#E5E7EB]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dt-napomena">Napomena</Label>
              <Input
                id="dt-napomena"
                value={form.napomena}
                onChange={(e) => setForm((f) => ({ ...f, napomena: e.target.value }))}
                className="border-[#E5E7EB]"
                placeholder="Opciono"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Otkaži</Button>
              <Button type="submit" disabled={isLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Čuvanje...</> : "Sačuvaj"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
            <AlertDialogAction onClick={handleDelete} className="bg-[#DC2626] hover:bg-[#B91C1C]">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
