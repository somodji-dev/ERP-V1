"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { updateSnapshotAction } from "@/app/actions/cashflow"
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
] as const

type SnapshotRow = Record<string, unknown>

type Props = {
  snapshot: SnapshotRow
}

const n = (v: unknown) => Number(v ?? 0)

export function CashFlowUrediForm({ snapshot }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const id = String(snapshot.id)
  const tipUnosa = String(snapshot.tip_unosa) as "brzi" | "detaljan"
  const isBrzi = tipUnosa === "brzi"

  const [ukupnoCash, setUkupnoCash] = useState<number | null>(n(snapshot.ukupno_cash) || null)
  const [dugovanja, setDugovanja] = useState<number | null>(n(snapshot.dugovanja_dobavljaci) || null)

  const [potrazivanjaKupci, setPotrazivanjaKupci] = useState(n(snapshot.potrazivanja_kupci))
  const [racunIntesa, setRacunIntesa] = useState(n(snapshot.racun_intesa))
  const [racunNlb, setRacunNlb] = useState(n(snapshot.racun_nlb))
  const [devizniRacun, setDevizniRacun] = useState(n(snapshot.devizni_racun))
  const [gotoviProizvodi, setGotoviProizvodi] = useState(n(snapshot.gotovi_proizvodi))
  const [sirovine, setSirovine] = useState(n(snapshot.sirovine))
  const [ostalo, setOstalo] = useState(n(snapshot.ostalo))

  const [isLoading, setIsLoading] = useState(false)

  const netoBrzi =
    ukupnoCash != null && dugovanja != null ? ukupnoCash - dugovanja : null
  const ukupnoDetaljan =
    potrazivanjaKupci + racunIntesa + racunNlb + devizniRacun + gotoviProizvodi + sirovine + ostalo
  const netoDetaljan = ukupnoDetaljan - dugovanja

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isBrzi) {
      if (ukupnoCash == null || ukupnoCash < 0 || dugovanja == null || dugovanja < 0) {
        toast({ title: "Greška", description: "Unesite iznose (>= 0).", variant: "destructive" })
        return
      }
    }
    setIsLoading(true)
    const result = isBrzi
      ? await updateSnapshotAction(
          id,
          {
            mesec: snapshot.mesec as number,
            godina: snapshot.godina as number,
            ukupno_cash: ukupnoCash ?? 0,
            dugovanja_dobavljaci: dugovanja ?? 0,
          },
          "brzi"
        )
      : await updateSnapshotAction(
          id,
          {
            mesec: snapshot.mesec as number,
            godina: snapshot.godina as number,
            potrazivanja_kupci: potrazivanjaKupci,
            racun_intesa: racunIntesa,
            racun_nlb: racunNlb,
            devizni_racun: devizniRacun,
            gotovi_proizvodi: gotoviProizvodi,
            sirovine: sirovine,
            ostalo: ostalo,
            dugovanja_dobavljaci: dugovanjaVal,
          },
          "detaljan"
        )
    setIsLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Snimak sačuvan." })
    router.push(`/cash-flow/${id}`)
    router.refresh()
  }

  if (isBrzi) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-[#6B7280]">
          Izmena — {MESECI[Number(snapshot.mesec)]} {snapshot.godina} (Brzi unos)
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ukupno_cash">Ukupna aktiva (Cash)</Label>
            <Input
              id="ukupno_cash"
              type="number"
              min={0}
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
            Neto Cash Flow: {netoBrzi != null ? formatCurrency(netoBrzi) : "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Čuvanje...</>
            ) : (
              "Sačuvaj"
            )}
          </Button>
        </div>
      </form>
    )
  }

  const setDugovanjaDetaljan = (v: number | null) => setDugovanja(v)
  const dugovanjaVal = dugovanja ?? n(snapshot.dugovanja_dobavljaci)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-[#6B7280]">
        Izmena — {MESECI[Number(snapshot.mesec)]} {snapshot.godina} (Detaljni unos)
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {CASH_FIELDS.map(({ key, label }) => {
          const val =
            key === "potrazivanja_kupci"
              ? potrazivanjaKupci
              : key === "racun_intesa"
                ? racunIntesa
                : key === "racun_nlb"
                  ? racunNlb
                  : key === "devizni_racun"
                    ? devizniRacun
                    : key === "gotovi_proizvodi"
                      ? gotoviProizvodi
                      : key === "sirovine"
                        ? sirovine
                        : ostalo
          const set =
            key === "potrazivanja_kupci"
              ? setPotrazivanjaKupci
              : key === "racun_intesa"
                ? setRacunIntesa
                : key === "racun_nlb"
                  ? setRacunNlb
                  : key === "devizni_racun"
                    ? setDevizniRacun
                    : key === "gotovi_proizvodi"
                      ? setGotoviProizvodi
                      : key === "sirovine"
                        ? setSirovine
                        : setOstalo
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type="number"
                min={0}
                value={val === 0 ? "" : val}
                onChange={(e) =>
                  set(e.target.value === "" ? 0 : Number(e.target.value))
                }
                placeholder="0"
                className="border-[#E5E7EB]"
              />
            </div>
          )
        })}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="dugovanja_dobavljaci">Dugovanja dobavljači</Label>
          <Input
            id="dugovanja_dobavljaci"
            type="number"
            min={0}
            value={dugovanjaVal === 0 ? "" : dugovanjaVal}
            onChange={(e) =>
              setDugovanjaDetaljan(e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="0"
            className="border-[#E5E7EB]"
          />
        </div>
      </div>
      <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 space-y-1">
        <p className="text-sm font-medium text-[#111827]">
          UKUPNO CASH: {formatCurrency(ukupnoDetaljan)}
        </p>
        <p className="text-sm font-medium text-[#111827]">
          NETO CASH FLOW: {formatCurrency(netoDetaljan)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Čuvanje...</>
          ) : (
            "Sačuvaj"
          )}
        </Button>
      </div>
    </form>
  )
}
