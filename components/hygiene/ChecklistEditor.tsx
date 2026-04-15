"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import {
  addCompletionAction,
  deleteCompletionAction,
  updateCompletionAction,
  setVerifikacijaAction,
  deleteHygieneChecklistAction,
} from "@/app/actions/hygiene"
import type { HygieneChecklistDetail, HygieneTemplate, HygieneCompletionWithRelations } from "@/lib/types/hygiene"
import { Plus, Check, Trash2, Printer, ShieldCheck, Loader2, CircleDot } from "lucide-react"
import { cn } from "@/lib/utils/cn"

const PERIOD_LABELS: Record<string, string> = {
  SP: "Svakodnevni poslovi",
  NP: "Nedeljni poslovi",
  MP: "Mesečni poslovi",
}

const GRUPA_LABELS: Record<string, string> = {
  radni_prostor: "Radni prostor",
  krug: "Krug",
}

function formatDatumShort(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}.${m}.`
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function ChecklistEditor({
  detail,
  employees,
}: {
  detail: HygieneChecklistDetail
  employees: { id: string; label: string }[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [, startTransition] = useTransition()

  // Add completion dialog
  const [addOpen, setAddOpen] = useState(false)
  const [addTemplateId, setAddTemplateId] = useState<string | null>(null)
  const [addDatum, setAddDatum] = useState(todayIso())
  const [addEmployee, setAddEmployee] = useState("")
  const [addNapomena, setAddNapomena] = useState("")
  const [addLoading, setAddLoading] = useState(false)

  // Edit completion dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<HygieneCompletionWithRelations | null>(null)
  const [editDatum, setEditDatum] = useState("")
  const [editEmployee, setEditEmployee] = useState("")
  const [editNapomena, setEditNapomena] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  // Verifikacija dialog
  const [verOpen, setVerOpen] = useState(false)
  const [verId, setVerId] = useState(detail.verifikator_id ?? "")
  const [verFunkcija, setVerFunkcija] = useState(detail.verifikator_funkcija ?? "")
  const [verDatum, setVerDatum] = useState(detail.verifikator_datum ?? todayIso())
  const [verNapomena, setVerNapomena] = useState(detail.napomena ?? "")
  const [verLoading, setVerLoading] = useState(false)

  // Delete checklist
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Grupiši completions po template_id
  const completionsByTemplate = new Map<string, HygieneCompletionWithRelations[]>()
  for (const c of detail.completions) {
    const arr = completionsByTemplate.get(c.template_id) ?? []
    arr.push(c)
    completionsByTemplate.set(c.template_id, arr)
  }

  // Grupiši templates po period
  const groups: Record<string, HygieneTemplate[]> = { SP: [], NP: [], MP: [] }
  for (const t of detail.templates) {
    groups[t.period].push(t)
  }

  function openAdd(templateId: string) {
    setAddTemplateId(templateId)
    setAddDatum(todayIso())
    setAddEmployee("")
    setAddNapomena("")
    setAddOpen(true)
  }

  async function handleQuickAdd(templateId: string) {
    // Quick add: today, no employee, no napomena
    const result = await addCompletionAction(detail.id, templateId, todayIso(), null, null)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Dodato ✓" })
    startTransition(() => router.refresh())
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!addTemplateId) return
    setAddLoading(true)
    const result = await addCompletionAction(
      detail.id,
      addTemplateId,
      addDatum,
      addEmployee || null,
      addNapomena || null
    )
    setAddLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Unos sačuvan." })
    setAddOpen(false)
    startTransition(() => router.refresh())
  }

  function openEdit(c: HygieneCompletionWithRelations) {
    setEditTarget(c)
    setEditDatum(c.datum_uradjeno)
    setEditEmployee(c.employee_id ?? "")
    setEditNapomena(c.napomena ?? "")
    setEditOpen(true)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setEditLoading(true)
    const result = await updateCompletionAction(editTarget.id, {
      datum_uradjeno: editDatum,
      employee_id: editEmployee || null,
      napomena: editNapomena || null,
    })
    setEditLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Ažurirano." })
    setEditOpen(false)
    startTransition(() => router.refresh())
  }

  async function handleDeleteCompletion() {
    if (!editTarget) return
    setEditLoading(true)
    const result = await deleteCompletionAction(editTarget.id)
    setEditLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Unos obrisan." })
    setEditOpen(false)
    startTransition(() => router.refresh())
  }

  async function handleVerifikacija(e: React.FormEvent) {
    e.preventDefault()
    setVerLoading(true)
    const result = await setVerifikacijaAction(
      detail.id,
      verId || null,
      verFunkcija || null,
      verDatum || null,
      verNapomena || null
    )
    setVerLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Verifikacija sačuvana." })
    setVerOpen(false)
    startTransition(() => router.refresh())
  }

  async function handleDeleteChecklist() {
    setDeleteLoading(true)
    const result = await deleteHygieneChecklistAction(detail.id)
    setDeleteLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Ček lista obrisana." })
    router.push("/proizvodnja/higijena")
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Akcije */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button asChild variant="outline" className="border-[#E5E7EB]">
          <Link href={`/proizvodnja/higijena/${detail.id}/stampa`}>
            <Printer className="mr-2 h-4 w-4" />
            Štampaj
          </Link>
        </Button>
        <Button
          variant="outline"
          className="border-[#E5E7EB]"
          onClick={() => setVerOpen(true)}
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          {detail.verifikator_id ? "Izmeni verifikaciju" : "Verifikacija"}
        </Button>
        <Button
          variant="outline"
          className="border-[#E5E7EB] text-[#DC2626] hover:text-[#DC2626]"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Obriši
        </Button>
      </div>

      {/* Sekcije po period-u */}
      {(["SP", "NP", "MP"] as const).map((period) => (
        <section key={period} className="space-y-2">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide px-1">
            {PERIOD_LABELS[period]}
          </h2>
          <div className="space-y-2">
            {groups[period].map((t) => {
              const comps = completionsByTemplate.get(t.id) ?? []
              const hasAny = comps.length > 0
              return (
                <div
                  key={t.id}
                  className={cn(
                    "rounded-xl border bg-white p-4 shadow-sm transition-colors",
                    hasAny
                      ? "border-l-4 border-[#E5E7EB] border-l-[#16A34A]"
                      : "border-[#E5E7EB]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(t.id)}
                      className="flex-1 text-left active:bg-[#F0FDF4] -m-2 p-2 rounded-lg"
                    >
                      <p className="text-base font-medium text-[#111827] leading-tight">{t.naziv}</p>
                      <p className="mt-0.5 text-xs text-[#9CA3AF]">
                        {GRUPA_LABELS[t.grupa]} · {t.period}
                      </p>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAdd(t.id)}
                      className="shrink-0 h-10 w-10 p-0 text-[#2563EB]"
                      aria-label="Dodaj datum"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Chip-ovi datuma */}
                  {comps.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {comps.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => openEdit(c)}
                          className="inline-flex items-center gap-1 rounded-full bg-[#D1FAE5] px-2.5 py-1 text-xs font-medium text-[#16A34A] hover:bg-[#A7F3D0]"
                        >
                          <Check className="h-3 w-3" />
                          {formatDatumShort(c.datum_uradjeno)}
                        </button>
                      ))}
                    </div>
                  )}
                  {!hasAny && (
                    <p className="mt-2 text-xs text-[#9CA3AF] italic flex items-center gap-1">
                      <CircleDot className="h-3 w-3" />
                      Tap na naziv = danas; plus za drugi datum
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {/* Verifikacija prikaz */}
      {detail.verifikator_id && (
        <section className="rounded-xl border border-[#E5E7EB] bg-[#F0FDF4] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#16A34A]">
            <ShieldCheck className="h-4 w-4" />
            Verifikovano
          </div>
          {detail.verifikator && (
            <p className="mt-1 text-sm text-[#111827]">
              {detail.verifikator.ime} {detail.verifikator.prezime}
              {detail.verifikator_funkcija && ` — ${detail.verifikator_funkcija}`}
              {detail.verifikator_datum && ` · ${formatDatumShort(detail.verifikator_datum)}`}
            </p>
          )}
        </section>
      )}

      {/* Sticky bottom progress */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E7EB] bg-white px-4 py-3 shadow-lg sm:left-[220px] print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="text-sm text-[#6B7280]">
            <span className="font-bold text-[#111827]">{detail.completions.length}</span> unosa
          </p>
          <Button
            size="sm"
            onClick={() => setVerOpen(true)}
            className="bg-[#2563EB] hover:bg-[#1D4ED8]"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            {detail.verifikator_id ? "Verifikovano" : "Verifikacija"}
          </Button>
        </div>
      </div>

      {/* Dialog: dodaj novi datum */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border-[#E5E7EB] bg-white rounded-xl max-w-md w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Dodaj datum</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-datum">Datum</Label>
              <Input id="add-datum" type="date" value={addDatum} onChange={(e) => setAddDatum(e.target.value)} className="border-[#E5E7EB]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-emp">Radnik (opciono)</Label>
              <Select value={addEmployee || "none"} onValueChange={(v) => setAddEmployee(v === "none" ? "" : v)}>
                <SelectTrigger id="add-emp" className="border-[#E5E7EB]">
                  <SelectValue placeholder="Izaberi..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nijedan —</SelectItem>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-nap">Napomena (opciono)</Label>
              <Input id="add-nap" value={addNapomena} onChange={(e) => setAddNapomena(e.target.value)} className="border-[#E5E7EB]" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Otkaži</Button>
              <Button type="submit" disabled={addLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                {addLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Čuvanje...</> : "Sačuvaj"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: edit completion */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-[#E5E7EB] bg-white rounded-xl max-w-md w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Izmena unosa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Datum</Label>
              <Input type="date" value={editDatum} onChange={(e) => setEditDatum(e.target.value)} className="border-[#E5E7EB]" />
            </div>
            <div className="space-y-2">
              <Label>Radnik</Label>
              <Select value={editEmployee || "none"} onValueChange={(v) => setEditEmployee(v === "none" ? "" : v)}>
                <SelectTrigger className="border-[#E5E7EB]">
                  <SelectValue placeholder="Izaberi..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nijedan —</SelectItem>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Napomena</Label>
              <Input value={editNapomena} onChange={(e) => setEditNapomena(e.target.value)} className="border-[#E5E7EB]" />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" className="text-[#DC2626]" onClick={handleDeleteCompletion} disabled={editLoading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Obriši
              </Button>
              <Button type="submit" disabled={editLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                {editLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sačuvaj
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: verifikacija */}
      <Dialog open={verOpen} onOpenChange={setVerOpen}>
        <DialogContent className="border-[#E5E7EB] bg-white rounded-xl max-w-md w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Verifikacija aktivnosti</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVerifikacija} className="space-y-4">
            <div className="space-y-2">
              <Label>Verifikator</Label>
              <Select value={verId || "none"} onValueChange={(v) => setVerId(v === "none" ? "" : v)}>
                <SelectTrigger className="border-[#E5E7EB]">
                  <SelectValue placeholder="Izaberi..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Niko —</SelectItem>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Funkcija</Label>
              <Input value={verFunkcija} onChange={(e) => setVerFunkcija(e.target.value)} placeholder="npr. Šef proizvodnje" className="border-[#E5E7EB]" />
            </div>
            <div className="space-y-2">
              <Label>Datum verifikacije</Label>
              <Input type="date" value={verDatum} onChange={(e) => setVerDatum(e.target.value)} className="border-[#E5E7EB]" />
            </div>
            <div className="space-y-2">
              <Label>Napomena (opciono)</Label>
              <Input value={verNapomena} onChange={(e) => setVerNapomena(e.target.value)} className="border-[#E5E7EB]" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVerOpen(false)}>Otkaži</Button>
              <Button type="submit" disabled={verLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                {verLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sačuvaj
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-[#E5E7EB] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Obrisati celu ček listu?</AlertDialogTitle>
            <AlertDialogDescription>
              Svi unosi za ovaj mesec biće obrisani. Ova akcija se ne može poništiti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChecklist} className="bg-[#DC2626] hover:bg-[#B91C1C]">
              {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
