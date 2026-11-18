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
import { PALETA, unosJedinica, type RawMaterial, type InventoryRow } from "@/lib/types/inventory"
import { Plus, Printer, Loader2, Package, AlertTriangle, Pencil, Check } from "lucide-react"
import { cn } from "@/lib/utils/cn"

const JEDINICE = ["kg", "paleta", "kutija", "kom", "paket", "kanta", "pakovanje"]

function fmtKol(kolicina: number, jedinica: string): string {
  const n = kolicina.toLocaleString("sr-RS", { maximumFractionDigits: 2 })
  return `${n} ${jedinica}`
}

/** Današnji datum po lokalnom vremenu (toISOString je UTC — posle ponoći daje juče). */
function localToday(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

/**
 * Parsira unetu količinu. Prazno = 0. Prihvata "12,5", "12.5", "1.250,5", "1 250".
 * Vraća NaN za neispravan unos (ranije se tiho pretvaralo u 0).
 */
function parseKol(raw: string | undefined): number {
  let s = String(raw ?? "").trim().replace(/\s/g, "")
  if (s === "") return 0
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".")
  } else {
    s = s.replace(",", ".")
  }
  if (!/^\d*\.?\d+$|^\d+\.$/.test(s)) return NaN
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? n : NaN
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

  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [datum, setDatum] = useState(localToday)
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [invalid, setInvalid] = useState<Record<string, boolean>>({})

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editMaterial, setEditMaterial] = useState<RawMaterial | null>(null)
  const [editMin, setEditMin] = useState("")
  const [editJedinica, setEditJedinica] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  const ispodMinimuma = rows.filter((r) => r.ispod_minimuma).length

  function openNoviPopis() {
    // Svaki popis kreće prazan: radnik za svaku sirovinu bira OK (iznad minimuma)
    // ili upisuje koliko ima. Prošlo stanje se samo prikazuje kao podsetnik —
    // ranije je bilo unapred upisano, pa su stare vrednosti ostajale nepromenjene.
    setQuantities({})
    setChecks({})
    setInvalid({})
    setDatum(localToday())
    setSelectedEmployee("")
    setDialogOpen(true)
  }

  function setQuantity(id: string, value: string) {
    setQuantities((q) => ({ ...q, [id]: value }))
    // Kucanje količine znači da sirovina nije "OK/iznad minimuma" — skini oznaku,
    // inače bi se uneta vrednost ignorisala i sačuvala kao 0.
    if (value.trim() !== "") setChecks((c) => (c[id] ? { ...c, [id]: false } : c))
    setInvalid((inv) => (inv[id] ? { ...inv, [id]: false } : inv))
  }

  function toggleOk(id: string) {
    setChecks((c) => ({ ...c, [id]: !c[id] }))
    setInvalid((inv) => (inv[id] ? { ...inv, [id]: false } : inv))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isLoading) return

    const bad: Record<string, boolean> = {}
    let missing = false
    const items = materials.map((m) => {
      const ok = checks[m.id] ?? false
      const raw = String(quantities[m.id] ?? "").trim()
      if (!ok && raw === "") {
        bad[m.id] = true
        missing = true
        return { raw_material_id: m.id, kolicina: 0, iznad_minimuma: false }
      }
      const kolicina = ok ? 0 : parseKol(raw)
      if (Number.isNaN(kolicina)) bad[m.id] = true
      return { raw_material_id: m.id, kolicina, iznad_minimuma: ok }
    })

    const badIds = Object.keys(bad)
    if (badIds.length > 0) {
      setInvalid(bad)
      const imena = materials.filter((m) => bad[m.id]).map((m) => m.naziv)
      toast({
        title: missing
          ? `Nije popunjeno: ${badIds.length} sirovina (upišite količinu ili OK)`
          : "Neispravna količina",
        description: `Proverite: ${imena.slice(0, 3).join(", ")}${imena.length > 3 ? "…" : ""}`,
        variant: "destructive",
      })
      document.getElementById(`kol-${badIds[0]}`)?.focus()
      return
    }

    setIsLoading(true)
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
    const minVal = parseKol(editMin)
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

  const popunjeno = materials.filter(
    (m) => checks[m.id] || String(quantities[m.id] ?? "").trim() !== ""
  ).length

  return (
    <div className="space-y-4">
      {/* Akcije */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          {countsCount > 0 && ispodMinimuma > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-1.5 text-sm text-[#DC2626]">
              <AlertTriangle className="h-4 w-4" />
              {ispodMinimuma} ispod min.
            </div>
          )}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="outline"
            className="hidden border-[#E5E7EB] sm:inline-flex"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Štampaj
          </Button>
          <Button
            onClick={openNoviPopis}
            className="h-11 flex-1 bg-[#2563EB] text-base hover:bg-[#1D4ED8] sm:h-10 sm:flex-none sm:text-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novi popis
          </Button>
        </div>
      </div>

      {/* Mobilni prikaz stanja — kartice umesto tabele */}
      {rows.length > 0 && (
        <ul className="divide-y divide-[#E5E7EB] rounded-xl border border-[#E5E7EB] bg-white shadow-sm sm:hidden print:hidden">
          {rows.map((row) => {
            const razlika = row.kolicina - Number(row.min_kolicina)
            return (
              <li
                key={row.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5",
                  row.ispod_minimuma && "bg-[#FEF2F2]"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm leading-tight",
                      row.ispod_minimuma ? "font-medium text-[#DC2626]" : "text-[#111827]"
                    )}
                  >
                    {row.naziv}
                  </p>
                  <p className="mt-0.5 text-xs text-[#6B7280]">
                    min. {fmtKol(Number(row.min_kolicina), row.jedinica)}
                    {countsCount > 0 && !row.iznad_minimuma && row.jedinica !== PALETA && (
                      <span
                        className={cn(
                          "ml-2",
                          razlika >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"
                        )}
                      >
                        ({razlika >= 0 ? "+" : ""}
                        {fmtKol(razlika, row.jedinica)})
                      </span>
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right text-sm tabular-nums">
                  {countsCount === 0 ? (
                    "—"
                  ) : row.iznad_minimuma ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[#D1FAE5] px-2 py-0.5 text-xs font-medium text-[#16A34A]">
                      <Check className="h-3 w-3" />
                      OK
                    </span>
                  ) : (
                    <span className={row.ispod_minimuma ? "font-semibold text-[#DC2626]" : "text-[#111827]"}>
                      {fmtKol(row.kolicina, unosJedinica(row.jedinica))}
                    </span>
                  )}
                </div>
                {canEditMaterials && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditMaterial(row)}
                    className="h-9 w-9 shrink-0 p-0"
                    aria-label={`Izmeni ${row.naziv}`}
                  >
                    <Pencil className="h-4 w-4 text-[#6B7280]" />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Tabela popisa (desktop + štampa) — redosled: Sirovina | Razlika | Stanje | Min. */}
      <div
        id="popis-sirovine-print"
        className="hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm sm:block print:block print:rounded-none print:border-0 print:shadow-none"
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
              <th className="px-3 py-2.5 font-medium print:px-2 print:py-1">Sirovina</th>
              <th className="px-2 py-2.5 font-medium text-right print:px-1 print:py-1 w-20">Razlika</th>
              <th className="px-2 py-2.5 font-medium text-right print:px-1 print:py-1 w-24">Stanje</th>
              <th className="px-2 py-2.5 font-medium text-right print:px-1 print:py-1 w-20">Min.</th>
              {canEditMaterials && (
                <th className="px-1 py-2.5 print:hidden w-10"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
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
                  <td className={cn("px-3 py-2 print:px-2 print:py-0.5", row.ispod_minimuma ? "text-[#DC2626]" : "text-[#111827]")}>
                    {row.naziv}
                  </td>
                  <td className={cn("px-2 py-2 print:px-1 print:py-0.5 text-right tabular-nums text-xs", row.ispod_minimuma ? "text-[#DC2626] font-medium" : razlika >= 0 || row.iznad_minimuma ? "text-[#16A34A]" : "")}>
                    {countsCount === 0 ? "—" : row.iznad_minimuma || row.jedinica === PALETA ? "—" : (razlika >= 0 ? "+" : "") + fmtKol(razlika, row.jedinica)}
                  </td>
                  <td className={cn("px-2 py-2 print:px-1 print:py-0.5 text-right tabular-nums text-xs", row.ispod_minimuma ? "text-[#DC2626] font-medium" : "text-[#111827]")}>
                    {countsCount === 0 ? "—" : row.iznad_minimuma ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#D1FAE5] px-1.5 py-0.5 text-[10px] font-medium text-[#16A34A]">
                        <Check className="h-2.5 w-2.5" />
                        OK
                      </span>
                    ) : fmtKol(row.kolicina, unosJedinica(row.jedinica))}
                  </td>
                  <td className="px-2 py-2 print:px-1 print:py-0.5 text-right tabular-nums text-xs text-[#6B7280]">
                    {fmtKol(Number(row.min_kolicina), row.jedinica)}
                  </td>
                  {canEditMaterials && (
                    <td className="px-1 py-2 text-right print:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditMaterial(row)}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-3 w-3 text-[#6B7280]" />
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

      {/* Dialog za novi popis — na telefonu preko celog ekrana */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !isLoading && setDialogOpen(o)}>
        <DialogContent
          // Slučajan dodir pored prozora ne sme da obriše uneti popis.
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            "flex flex-col gap-0 overflow-hidden border-[#E5E7EB] bg-white p-0",
            // telefon: ceo ekran
            "inset-0 left-0 top-0 h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 rounded-none",
            // tablet/desktop: centriran prozor
            "sm:inset-auto sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-xl"
          )}
        >
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-[#E5E7EB] px-4 pb-3 pt-4 sm:px-6">
              <DialogHeader className="mb-3 text-left">
                <DialogTitle>Novi popis</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="popis-datum" className="text-xs">Datum</Label>
                  <Input
                    id="popis-datum"
                    type="date"
                    value={datum}
                    onChange={(e) => setDatum(e.target.value)}
                    className="h-11 border-[#E5E7EB] text-base sm:h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="popis-radnik" className="text-xs">Popisivač</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger id="popis-radnik" className="h-11 border-[#E5E7EB] text-base sm:h-9 sm:text-sm">
                      <SelectValue placeholder="Radnik" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="mt-2 text-xs text-[#6B7280]">
                Ima više od minimuma → <b>OK</b>. Ima manje → upišite koliko ima.
                Popunjeno {popunjeno}/{materials.length}.
              </p>
            </div>

            {/* Lista sirovina — skroluje se, zaglavlje i dugmad ostaju na mestu */}
            <ul className="min-h-0 flex-1 divide-y divide-[#E5E7EB] overflow-y-auto overscroll-contain">
              {materials.map((m, idx) => {
                const isChecked = checks[m.id] ?? false
                const isBad = invalid[m.id] ?? false
                const imaUnos = !isChecked && String(quantities[m.id] ?? "") !== ""
                return (
                  <li
                    key={m.id}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 sm:px-6",
                      isChecked && "bg-[#F0FDF4]",
                      isBad && "bg-[#FEF2F2]"
                    )}
                  >
                    <label htmlFor={`kol-${m.id}`} className="min-w-0 flex-1">
                      <span className="block text-sm leading-tight text-[#111827]">{m.naziv}</span>
                      <span className="mt-0.5 block text-sm font-semibold text-[#2563EB]">
                        Min: {Number(m.min_kolicina).toLocaleString("sr-RS")} {m.jedinica}
                      </span>
                    </label>
                    <div className="relative w-28 shrink-0 sm:w-32">
                      <Input
                        id={`kol-${m.id}`}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        enterKeyHint={idx === materials.length - 1 ? "done" : "next"}
                        placeholder={isChecked ? "OK" : unosJedinica(m.jedinica)}
                        value={isChecked ? "" : (quantities[m.id] ?? "")}
                        onChange={(e) => setQuantity(m.id, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            const next = materials[idx + 1]
                            if (next) document.getElementById(`kol-${next.id}`)?.focus()
                            else (e.target as HTMLInputElement).blur()
                          }
                        }}
                        aria-invalid={isBad}
                        // text-base (16px) sprečava automatski zoom na iPhone-u
                        className={cn(
                          "h-11 border-[#E5E7EB] text-right text-base tabular-nums",
                          imaUnos && "pr-14",
                          isChecked && "bg-[#F0FDF4] placeholder:text-[#16A34A]",
                          isBad && "border-[#DC2626] ring-1 ring-[#DC2626]"
                        )}
                      />
                      {/* Prazno polje pokazuje jedinicu kao placeholder; posle upisa ostaje desno. */}
                      {imaUnos && (
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">
                          {unosJedinica(m.jedinica)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleOk(m.id)}
                      aria-pressed={isChecked}
                      title="Iznad minimuma"
                      className={cn(
                        "flex h-11 w-12 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors",
                        isChecked
                          ? "border-[#16A34A] bg-[#16A34A] text-white"
                          : "border-[#D1D5DB] bg-white text-[#6B7280]"
                      )}
                    >
                      {isChecked ? <Check className="h-5 w-5" /> : "OK"}
                    </button>
                  </li>
                )
              })}
            </ul>

            <DialogFooter className="flex-row gap-2 sm:space-x-0 border-t border-[#E5E7EB] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isLoading}
                className="h-11 flex-1 text-base sm:h-10 sm:flex-none sm:text-sm"
              >
                Otkaži
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 flex-[2] bg-[#2563EB] text-base hover:bg-[#1D4ED8] sm:h-10 sm:flex-none sm:text-sm"
              >
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

      {/* Admin edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="border-[#E5E7EB] bg-white shadow-md rounded-xl max-w-sm w-[calc(100vw-2rem)]">
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
                className="h-11 border-[#E5E7EB] text-base sm:h-10 sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-jedinica">Jedinica mere</Label>
              <Select value={editJedinica} onValueChange={setEditJedinica}>
                <SelectTrigger id="edit-jedinica" className="h-11 border-[#E5E7EB] text-base sm:h-10 sm:text-sm">
                  <SelectValue placeholder="Jedinica" />
                </SelectTrigger>
                <SelectContent>
                  {JEDINICE.map((j) => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="flex-row gap-2 sm:space-x-0">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1 sm:flex-none">
                Otkaži
              </Button>
              <Button type="submit" disabled={editLoading} className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] sm:flex-none">
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
