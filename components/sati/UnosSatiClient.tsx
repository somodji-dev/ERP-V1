"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils/format"
import { getDaniUMesecu } from "@/lib/radnici/sati"
import {
  getWorkLogsForMonth,
  saveSatiAction,
  deleteSatiZaMesecAction,
  getAdvancesForMonth,
  getBonusesForMonth,
  addAdvanceAction,
  addBonusAction,
  deleteAdvanceAction,
  deleteBonusAction,
} from "@/app/actions/sati"
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
import { Trash2 } from "lucide-react"

const MESECI = [
  { value: 1, label: "Januar" },
  { value: 2, label: "Februar" },
  { value: 3, label: "Mart" },
  { value: 4, label: "April" },
  { value: 5, label: "Maj" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Avgust" },
  { value: 9, label: "Septembar" },
  { value: 10, label: "Oktobar" },
  { value: 11, label: "Novembar" },
  { value: 12, label: "Decembar" },
]

type Employee = { id: string; ime: string; prezime: string }
type DanUnos = { datum: string; redovni: number; prekovremeni: number }

function formatDatum(d: string): string {
  const [y, m, day] = d.split("-").map(Number)
  return new Date(y, m - 1, day).toLocaleDateString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    weekday: "short",
  })
}

export function UnosSatiClient({ employees }: { employees: Employee[] }) {
  const { toast } = useToast()
  const [employeeId, setEmployeeId] = useState<string>("")
  const [mesec, setMesec] = useState<number | null>(null)
  const currentYear = new Date().getFullYear()
  const [godina, setGodina] = useState<number | null>(currentYear)
  const [dani, setDani] = useState<DanUnos[]>([])
  const [advances, setAdvances] = useState<{ id: string; datum: string; iznos: number; napomena: string | null }[]>([])
  const [bonuses, setBonuses] = useState<{ id: string; iznos: number; opis: string | null }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const years = [currentYear, currentYear - 1]

  const loadData = useCallback(async () => {
    if (!employeeId || mesec == null || godina == null) {
      toast({ title: "Greška", description: "Izaberite radnika, mesec i godinu.", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const [logs, adv, bon] = await Promise.all([
        getWorkLogsForMonth(employeeId, mesec, godina),
        getAdvancesForMonth(employeeId, mesec, godina),
        getBonusesForMonth(employeeId, mesec, godina),
      ])
      const byDate: Record<string, { redovni: number; prekovremeni: number }> = {}
      for (const r of logs) {
        if (!byDate[r.datum]) byDate[r.datum] = { redovni: 0, prekovremeni: 0 }
        if (r.tip_sata === "prekovremeno") byDate[r.datum].prekovremeni += Number(r.sati)
        else byDate[r.datum].redovni += Number(r.sati)
      }
      const daniList = getDaniUMesecu(mesec, godina).map((key) => {
        const v = byDate[key] ?? { redovni: 0, prekovremeni: 0 }
        return { datum: key, redovni: v.redovni, prekovremeni: v.prekovremeni }
      })
      setDani(daniList)
      setAdvances(adv)
      setBonuses(bon)
    } finally {
      setLoading(false)
    }
  }, [employeeId, mesec, godina, toast])

  async function handleSaveSati() {
    if (!employeeId || mesec == null || godina == null) {
      toast({ title: "Greška", description: "Izaberite radnika, mesec i godinu.", variant: "destructive" })
      return
    }
    setSaving(true)
    const result = await saveSatiAction(employeeId, mesec, godina, dani)
    setSaving(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Sati sačuvani." })
  }

  function setDan(index: number, field: "redovni" | "prekovremeni", value: number) {
    setDani((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  async function handleObrisiSatiZaMesec() {
    if (!employeeId || mesec == null || godina == null) return
    setDeleting(true)
    const result = await deleteSatiZaMesecAction(employeeId, mesec, godina)
    setDeleting(false)
    setDeleteDialogOpen(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Obrisano: platni izveštaj, sati, akontacije i bonusi za ovaj mesec." })
    setDani([])
    setAdvances([])
    setBonuses([])
  }

  function automatskiUnosSati() {
    setDani((prev) =>
      prev.map((dan) => {
        const [y, m, day] = dan.datum.split("-").map(Number)
        const dayOfWeek = new Date(y, m - 1, day).getDay()
        const radniDan = dayOfWeek >= 1 && dayOfWeek <= 5
        return {
          ...dan,
          redovni: radniDan ? 8 : 0,
          prekovremeni: dan.prekovremeni,
        }
      })
    )
    toast({ title: "Uneto 8 h za sve radne dane u mesecu." })
  }

  const canLoad = !!employeeId && mesec != null && godina != null
  const hasDani = dani.length > 0

  if (employees.length === 0) {
    return (
      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="py-8 text-center text-[#6B7280] text-sm">
          Nema aktivnih radnika. Dodajte radnika u modulu Radnici.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#111827]">Izbor perioda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Radnik</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className="border-[#E5E7EB]">
                  <SelectValue placeholder="Izaberi radnika..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.prezime} {e.ime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mesec</Label>
              <Select
                value={mesec != null ? String(mesec) : ""}
                onValueChange={(v) => setMesec(v ? Number(v) : null)}
              >
                <SelectTrigger className="border-[#E5E7EB]">
                  <SelectValue placeholder="Mesec..." />
                </SelectTrigger>
                <SelectContent>
                  {MESECI.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Godina</Label>
              <Select
                value={godina != null ? String(godina) : ""}
                onValueChange={(v) => setGodina(v ? Number(v) : null)}
              >
                <SelectTrigger className="border-[#E5E7EB]">
                  <SelectValue placeholder="Godina..." />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={loadData}
                disabled={!canLoad || loading}
                className="bg-[#2563EB] hover:bg-[#1D4ED8]"
              >
                {loading ? "Učitavanje..." : "Učitaj"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasDani && (
        <Card className="border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-lg text-[#111827]">Radni sati po danima</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={automatskiUnosSati}
                className="border-[#E5E7EB]"
              >
                Automatski unos sati
              </Button>
              <Button
                type="button"
                onClick={handleSaveSati}
                disabled={saving}
                className="bg-[#2563EB] hover:bg-[#1D4ED8]"
              >
                {saving ? "Čuvanje..." : "Sačuvaj sati"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleting}
                className="border-[#DC2626] text-[#DC2626] hover:bg-[#FEF2F2]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Obriši sve za ovaj mesec
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E5E7EB]">
                    <TableHead className="text-[#6B7280]">Datum</TableHead>
                    <TableHead className="text-[#6B7280] w-32">Redovni (h)</TableHead>
                    <TableHead className="text-[#6B7280] w-32">Prekovremeni (h)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dani.map((dan, i) => (
                    <TableRow key={dan.datum} className="border-[#E5E7EB]">
                      <TableCell className="text-sm text-[#111827]">{formatDatum(dan.datum)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          className="w-24 border-[#E5E7EB] h-9"
                          value={dan.redovni || ""}
                          onChange={(e) => setDan(i, "redovni", parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          className="w-24 border-[#E5E7EB] h-9"
                          value={dan.prekovremeni || ""}
                          onChange={(e) => setDan(i, "prekovremeni", parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši sve za ovaj mesec?</AlertDialogTitle>
            <AlertDialogDescription>
              Biće obrisani: platni izveštaj (ako postoji), svi unosi sati, sve akontacije i svi bonusi za ovog radnika i izabrani mesec. Ovu radnju nije moguće poništiti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleObrisiSatiZaMesec()
              }}
              className="bg-[#DC2626] hover:bg-[#B91C1C]"
              disabled={deleting}
            >
              {deleting ? "Brisanje..." : "Obriši"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {hasDani && employeeId && mesec != null && godina != null && (
        <>
          <AkontacijeSection
            employeeId={employeeId}
            mesec={mesec}
            godina={godina}
            advances={advances}
            onRefresh={loadData}
          />
          <BonusiSection
            employeeId={employeeId}
            mesec={mesec}
            godina={godina}
            bonuses={bonuses}
            onRefresh={loadData}
          />
        </>
      )}
    </div>
  )
}

function AkontacijeSection({
  employeeId,
  mesec,
  godina,
  advances,
  onRefresh,
}: {
  employeeId: string
  mesec: number
  godina: number
  advances: { id: string; datum: string; iznos: number; napomena: string | null }[]
  onRefresh: () => void
}) {
  const { toast } = useToast()
  const [datum, setDatum] = useState("")
  const [iznos, setIznos] = useState("")
  const [napomena, setNapomena] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteAdvanceAction(id)
    setDeletingId(null)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Akontacija obrisana." })
    onRefresh()
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const iznosNum = parseFloat(iznos)
    if (!datum || !iznosNum || iznosNum <= 0) {
      toast({ title: "Greška", description: "Unesite datum i iznos.", variant: "destructive" })
      return
    }
    setSubmitting(true)
    const result = await addAdvanceAction(employeeId, datum, iznosNum, mesec, godina, napomena || undefined)
    setSubmitting(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Akontacija dodata." })
    setDatum("")
    setIznos("")
    setNapomena("")
    onRefresh()
  }

  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-[#111827]">Akontacije za mesec</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Datum</Label>
            <Input
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className="w-40 border-[#E5E7EB] h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Iznos (RSD)</Label>
            <Input
              type="number"
              min={0.01}
              step={0.01}
              value={iznos}
              onChange={(e) => setIznos(e.target.value)}
              placeholder="0"
              className="w-32 border-[#E5E7EB] h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Napomena</Label>
            <Input
              value={napomena}
              onChange={(e) => setNapomena(e.target.value)}
              placeholder="Opciono"
              className="w-48 border-[#E5E7EB] h-9"
            />
          </div>
          <Button type="submit" disabled={submitting} className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9">
            {submitting ? "..." : "Dodaj"}
          </Button>
        </form>
        {advances.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7EB]">
                <TableHead className="text-[#6B7280]">Datum</TableHead>
                <TableHead className="text-[#6B7280]">Iznos</TableHead>
                <TableHead className="text-[#6B7280]">Napomena</TableHead>
                <TableHead className="text-[#6B7280] w-24 text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advances.map((a) => (
                <TableRow key={a.id} className="border-[#E5E7EB]">
                  <TableCell className="text-sm">
                    {(() => {
                      const [y, m, d] = a.datum.split("-").map(Number)
                      return new Date(y, m - 1, d).toLocaleDateString("sr-RS")
                    })()}
                  </TableCell>
                  <TableCell className="text-sm">{formatCurrency(a.iznos)}</TableCell>
                  <TableCell className="text-sm text-[#6B7280]">{a.napomena ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[#DC2626] hover:bg-[#FEF2F2]"
                      disabled={deletingId === a.id}
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

function BonusiSection({
  employeeId,
  mesec,
  godina,
  bonuses,
  onRefresh,
}: {
  employeeId: string
  mesec: number
  godina: number
  bonuses: { id: string; iznos: number; opis: string | null }[]
  onRefresh: () => void
}) {
  const { toast } = useToast()
  const [iznos, setIznos] = useState("")
  const [opis, setOpis] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteBonusAction(id)
    setDeletingId(null)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Bonus obrisan." })
    onRefresh()
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const iznosNum = parseFloat(iznos)
    if (!iznosNum || iznosNum < 0) {
      toast({ title: "Greška", description: "Unesite iznos.", variant: "destructive" })
      return
    }
    setSubmitting(true)
    const result = await addBonusAction(employeeId, mesec, godina, iznosNum, opis || undefined)
    setSubmitting(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Bonus dodat." })
    setIznos("")
    setOpis("")
    onRefresh()
  }

  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-[#111827]">Bonusi za mesec</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Iznos (RSD)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={iznos}
              onChange={(e) => setIznos(e.target.value)}
              placeholder="0"
              className="w-32 border-[#E5E7EB] h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Opis</Label>
            <Input
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              placeholder="Opciono"
              className="w-48 border-[#E5E7EB] h-9"
            />
          </div>
          <Button type="submit" disabled={submitting} className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9">
            {submitting ? "..." : "Dodaj"}
          </Button>
        </form>
        {bonuses.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7EB]">
                <TableHead className="text-[#6B7280]">Iznos</TableHead>
                <TableHead className="text-[#6B7280]">Opis</TableHead>
                <TableHead className="text-[#6B7280] w-24 text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonuses.map((b) => (
                <TableRow key={b.id} className="border-[#E5E7EB]">
                  <TableCell className="text-sm">{formatCurrency(b.iznos)}</TableCell>
                  <TableCell className="text-sm text-[#6B7280]">{b.opis ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[#DC2626] hover:bg-[#FEF2F2]"
                      disabled={deletingId === b.id}
                      onClick={() => handleDelete(b.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
