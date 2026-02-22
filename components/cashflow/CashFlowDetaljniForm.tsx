"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createDetaljanSnapshotAction } from "@/app/actions/cashflow"
import { formatCurrency } from "@/lib/utils/format"
import { Loader2 } from "lucide-react"

const MESECI = [
  "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
]

const CASH_FIELDS = [
  { key: "potrazivanja_kupci", label: "Potraživanja od kupaca" },
  { key: "racun_intesa", label: "Račun Intesa" },
  { key: "racun_nlb", label: "Račun NLB" },
  { key: "devizni_racun", label: "Devizni račun" },
  { key: "gotovi_proizvodi", label: "Gotovi proizvodi" },
  { key: "sirovine", label: "Sirovine" },
  { key: "ostalo", label: "Ostalo" },
  { key: "dugovanja_dobavljaci", label: "Dugovanja dobavljači" },
] as const

type Props = {
  mesec: number
  godina: number
  onBack: () => void
}

type CashValues = {
  potrazivanja_kupci: number
  racun_intesa: number
  racun_nlb: number
  devizni_racun: number
  gotovi_proizvodi: number
  sirovine: number
  ostalo: number
  dugovanja_dobavljaci: number
}

const emptyCash: CashValues = {
  potrazivanja_kupci: 0,
  racun_intesa: 0,
  racun_nlb: 0,
  devizni_racun: 0,
  gotovi_proizvodi: 0,
  sirovine: 0,
  ostalo: 0,
  dugovanja_dobavljaci: 0,
}

export function CashFlowDetaljniForm({ mesec, godina, onBack }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [cash, setCash] = useState<CashValues>(emptyCash)
  const [isLoading, setIsLoading] = useState(false)

  const ukupnoCash =
    cash.potrazivanja_kupci +
    cash.racun_intesa +
    cash.racun_nlb +
    cash.devizni_racun +
    cash.gotovi_proizvodi +
    cash.sirovine +
    cash.ostalo
  const neto = ukupnoCash - cash.dugovanja_dobavljaci

  function setCashField(key: keyof CashValues, value: number | null) {
    setCash((prev) => ({ ...prev, [key]: value ?? 0 }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    const result = await createDetaljanSnapshotAction({
      mesec,
      godina,
      potrazivanja_kupci: cash.potrazivanja_kupci,
      racun_intesa: cash.racun_intesa,
      racun_nlb: cash.racun_nlb,
      devizni_racun: cash.devizni_racun,
      gotovi_proizvodi: cash.gotovi_proizvodi,
      sirovine: cash.sirovine,
      ostalo: cash.ostalo,
      dugovanja_dobavljaci: cash.dugovanja_dobavljaci,
      excel_partners: [],
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
        Novi snimak — {MESECI[mesec]} {godina} (Detaljni unos)
      </p>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#111827]">Cash komponente</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {CASH_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type="number"
                min={0}
                step={1}
                value={cash[key as keyof CashValues] === 0 ? "" : cash[key as keyof CashValues]}
                onChange={(e) =>
                  setCashField(key as keyof CashValues, e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder="0"
                className="border-[#E5E7EB]"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 space-y-1">
        <p className="text-sm font-medium text-[#111827]">
          UKUPNO CASH: {formatCurrency(ukupnoCash)}
        </p>
        <p className="text-sm font-medium text-[#111827]">
          NETO CASH FLOW: {formatCurrency(neto)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="border-[#E5E7EB]">
          Nazad
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#2563EB] hover:bg-[#1D4ED8]"
        >
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
