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
import { formatCurrency } from "@/lib/utils/format"
import { getRateTipLabel } from "@/lib/radnici/rate-settings"
import { insertRateAction, type RateRow } from "@/app/actions/rate-settings"
import { Pencil, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { srLatn } from "date-fns/locale"

export function PodesavanjaSatniceClient({ rates }: { rates: RateRow[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editingTip, setEditingTip] = useState<RateRow | null>(null)
  const [iznos, setIznos] = useState<string>("")
  const [vaziOd, setVaziOd] = useState<string>("")
  const [napomena, setNapomena] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  function firstDayOfCurrentMonth(): string {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  }

  function openEdit(rate: RateRow) {
    setEditingTip(rate)
    setIznos(rate.iznos === 0 || rate.iznos == null ? "" : String(rate.iznos))
    setVaziOd(rate.vazi_od ?? firstDayOfCurrentMonth())
    setNapomena(rate.napomena ?? "")
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingTip) return
    setIsLoading(true)
    const formData = new FormData()
    formData.set("tip", editingTip.tip)
    formData.set("iznos", iznos === "" ? "0" : iznos)
    formData.set("vazi_od", vaziOd)
    formData.set("napomena", napomena)
    const result = await insertRateAction(formData)
    setIsLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Satnica sačuvana." })
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <div className="space-y-4">
        {rates.map((rate) => (
            <div
              key={rate.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-medium text-[#111827]">{getRateTipLabel(rate.tip)}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Poslednja izmena: {rate.vazi_od ? format(new Date(rate.vazi_od), "dd.MM.yyyy", { locale: srLatn }) : "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-[#111827]">
                  {formatCurrency(Number(rate.iznos))}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(rate)}
                  className="border-[#E5E7EB]"
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Izmeni
                </Button>
              </div>
            </div>
          ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-[#E5E7EB] bg-white shadow-md rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle>
              Izmena satnice: {editingTip ? getRateTipLabel(editingTip.tip) : ""}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="iznos">Nova cena (RSD)</Label>
              <Input
                id="iznos"
                type="number"
                min={0}
                placeholder="0"
                value={iznos}
                onChange={(e) => setIznos(e.target.value === "" ? "" : e.target.value)}
                className="border-[#E5E7EB]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vazi_od">Važi od (poželjno 1. u mesecu)</Label>
              <Input
                id="vazi_od"
                type="date"
                value={vaziOd}
                onChange={(e) => setVaziOd(e.target.value)}
                className="border-[#E5E7EB]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="napomena">Napomena</Label>
              <Input
                id="napomena"
                value={napomena}
                onChange={(e) => setNapomena(e.target.value)}
                className="border-[#E5E7EB]"
                placeholder="Opciono"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Čuvanje...
                  </>
                ) : (
                  "Sačuvaj"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
