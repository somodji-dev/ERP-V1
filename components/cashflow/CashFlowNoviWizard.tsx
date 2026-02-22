"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CashFlowBrziForm } from "./CashFlowBrziForm"
import { CashFlowDetaljniForm } from "./CashFlowDetaljniForm"
import { BarChart3, Zap } from "lucide-react"

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

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i)

export function CashFlowNoviWizard() {
  const [step, setStep] = useState<1 | 2>(1)
  const [mesec, setMesec] = useState<number | null>(null)
  const [godina, setGodina] = useState<number | null>(null)
  const [tipUnosa, setTipUnosa] = useState<"detaljan" | "brzi" | null>(null)

  const canContinue =
    step === 1 && mesec != null && godina != null && tipUnosa != null

  function handleNastavi() {
    if (!canContinue) return
    setStep(2)
  }

  if (step === 2 && mesec != null && godina != null && tipUnosa != null) {
    return (
      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Novi snimak</CardTitle>
        </CardHeader>
        <CardContent>
          {tipUnosa === "brzi" ? (
            <CashFlowBrziForm
              mesec={mesec}
              godina={godina}
              onBack={() => setStep(1)}
            />
          ) : (
            <CashFlowDetaljniForm
              mesec={mesec}
              godina={godina}
              onBack={() => setStep(1)}
            />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Novi Cash Flow snimak</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Mesec</Label>
            <Select
              value={mesec != null ? String(mesec) : ""}
              onValueChange={(v) => setMesec(v === "" ? null : Number(v))}
            >
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue placeholder="Izaberi mesec..." />
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
              onValueChange={(v) => setGodina(v === "" ? null : Number(v))}
            >
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue placeholder="Izaberi godinu..." />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Tip unosa</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTipUnosa("detaljan")}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                tipUnosa === "detaljan"
                  ? "border-[#2563EB] bg-[#EFF6FF]"
                  : "border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]"
              }`}
            >
              <BarChart3 className="h-5 w-5 shrink-0 text-[#2563EB]" />
              <div>
                <p className="font-medium text-[#111827]">Detaljni unos</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Unesi sve cash komponente: potraživanja, računi, zalihe, dugovanja.
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTipUnosa("brzi")}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                tipUnosa === "brzi"
                  ? "border-[#2563EB] bg-[#EFF6FF]"
                  : "border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]"
              }`}
            >
              <Zap className="h-5 w-5 shrink-0 text-[#6B7280]" />
              <div>
                <p className="font-medium text-[#111827]">Brzi unos (samo totali)</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Unesi ukupnu aktivu i pasivu — za istorijske podatke.
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleNastavi}
            disabled={!canContinue}
            className="bg-[#2563EB] hover:bg-[#1D4ED8]"
          >
            Nastavi
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
