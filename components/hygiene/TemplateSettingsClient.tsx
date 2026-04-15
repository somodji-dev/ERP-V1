"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  upsertHygieneTemplateAction,
  deactivateHygieneTemplateAction,
} from "@/app/actions/hygiene"
import type { HygieneTemplate, HygieneGrupa, HygienePeriod } from "@/lib/types/hygiene"
import { Plus, Pencil, Loader2, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils/cn"

const GRUPE: { value: HygieneGrupa; label: string }[] = [
  { value: "radni_prostor", label: "Radni prostor" },
  { value: "krug", label: "Krug" },
]

const PERIODI: { value: HygienePeriod; label: string }[] = [
  { value: "SP", label: "Svakodnevni (SP)" },
  { value: "NP", label: "Nedeljni (NP)" },
  { value: "MP", label: "Mesečni (MP)" },
]

export function TemplateSettingsClient({ templates }: { templates: HygieneTemplate[] }) {
  const router = useRouter()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<HygieneTemplate | null>(null)
  const [naziv, setNaziv] = useState("")
  const [grupa, setGrupa] = useState<HygieneGrupa>("radni_prostor")
  const [period, setPeriod] = useState<HygienePeriod>("SP")
  const [redosled, setRedosled] = useState("0")
  const [aktivan, setAktivan] = useState(true)
  const [loading, setLoading] = useState(false)

  function openNew() {
    setEditing(null)
    setNaziv("")
    setGrupa("radni_prostor")
    setPeriod("SP")
    const maxRedosled = templates.reduce((max, t) => Math.max(max, t.redosled), 0)
    setRedosled(String(maxRedosled + 1))
    setAktivan(true)
    setDialogOpen(true)
  }

  function openEdit(t: HygieneTemplate) {
    setEditing(t)
    setNaziv(t.naziv)
    setGrupa(t.grupa)
    setPeriod(t.period)
    setRedosled(String(t.redosled))
    setAktivan(t.aktivan)
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const red = Number(redosled)
    if (Number.isNaN(red)) {
      toast({ title: "Greška", description: "Redosled mora biti broj.", variant: "destructive" })
      return
    }
    setLoading(true)
    const result = await upsertHygieneTemplateAction({
      id: editing?.id,
      naziv,
      grupa,
      period,
      redosled: red,
      aktivan,
    })
    setLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: editing ? "Stavka ažurirana." : "Stavka dodata." })
    setDialogOpen(false)
    router.refresh()
  }

  async function handleDeactivate(t: HygieneTemplate) {
    const result = await deactivateHygieneTemplateAction(t.id)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Stavka deaktivirana." })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
          <Plus className="mr-2 h-4 w-4" />
          Nova stavka
        </Button>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-gray-50 text-left text-[#6B7280]">
              <th className="px-3 py-2.5 font-medium w-12">#</th>
              <th className="px-3 py-2.5 font-medium">Naziv</th>
              <th className="px-3 py-2.5 font-medium">Grupa</th>
              <th className="px-3 py-2.5 font-medium text-center w-16">Period</th>
              <th className="px-3 py-2.5 font-medium text-center w-20">Aktivan</th>
              <th className="px-3 py-2.5 font-medium text-right w-24">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr
                key={t.id}
                className={cn(
                  "border-b border-[#E5E7EB]/70 hover:bg-[#F9FAFB]",
                  !t.aktivan && "opacity-50"
                )}
              >
                <td className="px-3 py-2 text-[#6B7280] tabular-nums">{t.redosled}</td>
                <td className="px-3 py-2 text-[#111827]">{t.naziv}</td>
                <td className="px-3 py-2 text-[#6B7280]">
                  {t.grupa === "radni_prostor" ? "Radni prostor" : "Krug"}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="inline-block rounded bg-[#F3F4F6] px-1.5 py-0.5 text-xs font-medium">
                    {t.period}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  {t.aktivan ? (
                    <span className="text-xs text-[#16A34A]">Da</span>
                  ) : (
                    <span className="text-xs text-[#6B7280]">Ne</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)} className="h-8 w-8 p-0">
                      <Pencil className="h-3.5 w-3.5 text-[#6B7280]" />
                    </Button>
                    {t.aktivan && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivate(t)}
                        className="h-8 w-8 p-0 text-[#6B7280]"
                        title="Deaktiviraj"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-[#E5E7EB] bg-white rounded-xl max-w-md w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>{editing ? "Izmena stavke" : "Nova stavka"}</DialogTitle>
            <DialogDescription className="sr-only">
              Definiši naziv, grupu, period i redosled stavke ček liste.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-naziv">Naziv</Label>
              <Input id="t-naziv" value={naziv} onChange={(e) => setNaziv(e.target.value)} className="border-[#E5E7EB]" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Grupa</Label>
                <Select value={grupa} onValueChange={(v) => setGrupa(v as HygieneGrupa)}>
                  <SelectTrigger className="border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRUPE.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={period} onValueChange={(v) => setPeriod(v as HygienePeriod)}>
                  <SelectTrigger className="border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIODI.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-redosled">Redosled</Label>
              <Input
                id="t-redosled"
                type="number"
                value={redosled}
                onChange={(e) => setRedosled(e.target.value)}
                className="border-[#E5E7EB]"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={aktivan}
                onChange={(e) => setAktivan(e.target.checked)}
                className="h-4 w-4 rounded border-[#D1D5DB]"
              />
              Aktivna stavka
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Otkaži</Button>
              <Button type="submit" disabled={loading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Čuvanje...</> : "Sačuvaj"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
