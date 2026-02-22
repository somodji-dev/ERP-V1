"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createBrziSnapshotAction } from "@/app/actions/cashflow"
import { formatCurrency } from "@/lib/utils/format"
import { Loader2 } from "lucide-react"

const MESECI = [
  "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
]

type Props = {
  mesec: number
  godina: number
  onBack: () => void
}

export function CashFlowBrziForm({ mesec, godina, onBack }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [ukupnoCash, setUkupnoCash] = useState<number | null>(null)
  const [dugovanja, setDugovanja] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const neto =
    ukupnoCash != null && dugovanja != null ? ukupnoCash - dugovanja : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (ukupnoCash == null || ukupnoCash < 0 || dugovanja == null || dugovanja < 0) {
      toast({
        title: "Greška",
        description: "Unesite iznose (brojevi >= 0).",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)
    const result = await createBrziSnapshotAction({
      mesec,
      godina,
      ukupno_cash: ukupnoCash,
      dugovanja_dobavljaci: dugovanja,
    })
    setIsLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Snimak sačuvan." })
    router.push("/cash-flow")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-[#6B7280]">
        Novi snimak — {MESECI[mesec]} {godina} (Brzi unos)
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ukupno_cash">Ukupna aktiva (Cash)</Label>
          <Input
            id="ukupno_cash"
            type="number"
            min={0}
            step={1}
            value={ukupnoCash === null || ukupnoCash === 0 ? "" : ukupnoCash}
            onChange={(e) =>
              setUkupnoCash(e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="0"
            className="border-[#E5E7EB]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dugovanja">Ukupna pasiva (Dugovanja)</Label>
          <Input
            id="dugovanja"
            type="number"
            min={0}
            step={1}
            value={dugovanja === null || dugovanja === 0 ? "" : dugovanja}
            onChange={(e) =>
              setDugovanja(e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="0"
            className="border-[#E5E7EB]"
          />
        </div>
      </div>

      <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
        <p className="text-sm font-medium text-[#111827]">
          Neto Cash Flow:{" "}
          {neto != null ? formatCurrency(neto) : "—"}
        </p>
        <p className="text-xs text-[#6B7280] mt-1">
          Koristi za unos istorijskih podataka bez detalja.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="border-[#E5E7EB]">
          Nazad
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
      </div>
    </form>
  )
}
