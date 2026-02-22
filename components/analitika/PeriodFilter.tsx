"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type FilterState = {
  godina?: string
  mesec?: string
  smena?: string
  period?: string
  datumOd?: string
  datumDo?: string
}

type PeriodFilterProps = {
  onFilterChange?: (filters: FilterState) => void
  showYear?: boolean
  showMonth?: boolean
  showSmena?: boolean
  showPeriod?: boolean
  showDateRange?: boolean
}

const MESECI = [
  { value: "all", label: "Svi meseci" },
  { value: "1", label: "Januar" },
  { value: "2", label: "Februar" },
  { value: "3", label: "Mart" },
  { value: "4", label: "April" },
  { value: "5", label: "Maj" },
  { value: "6", label: "Jun" },
  { value: "7", label: "Jul" },
  { value: "8", label: "Avgust" },
  { value: "9", label: "Septembar" },
  { value: "10", label: "Oktobar" },
  { value: "11", label: "Novembar" },
  { value: "12", label: "Decembar" },
]

const PERIOD_OPTIONS = [
  { value: "7", label: "Poslednjih 7 dana" },
  { value: "30", label: "Poslednjih 30 dana" },
  { value: "90", label: "Poslednjih 90 dana" },
  { value: "mesec", label: "Tekući mesec" },
]

export function PeriodFilter({
  onFilterChange,
  showYear = true,
  showMonth = true,
  showSmena = false,
  showPeriod = false,
  showDateRange = false,
}: PeriodFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const godina = searchParams.get("godina") ?? new Date().getFullYear().toString()
  const mesec = searchParams.get("mesec") ?? "all"
  const smena = searchParams.get("smena") ?? "sve"
  const period = searchParams.get("period") ?? "30"
  const datumOd = searchParams.get("datumOd") ?? ""
  const datumDo = searchParams.get("datumDo") ?? ""

  function apply(filters: FilterState) {
    const p = new URLSearchParams(searchParams.toString())
    if (filters.godina != null) p.set("godina", filters.godina)
    if (filters.mesec != null) p.set("mesec", filters.mesec)
    if (filters.smena != null) p.set("smena", filters.smena)
    if (filters.period != null) p.set("period", filters.period)
    if (filters.datumOd != null) p.set("datumOd", filters.datumOd)
    if (filters.datumDo != null) p.set("datumDo", filters.datumDo)
    router.push(`?${p.toString()}`)
    onFilterChange?.(filters)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const mesecVal = fd.get("mesec") as string
    apply({
      godina: (fd.get("godina") as string) || undefined,
      mesec: mesecVal && mesecVal !== "all" ? mesecVal : undefined,
      smena: (fd.get("smena") as string) || undefined,
      period: (fd.get("period") as string) || undefined,
      datumOd: (fd.get("datumOd") as string) || undefined,
      datumDo: (fd.get("datumDo") as string) || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <input type="hidden" name="godina" value={godina} />
      <input type="hidden" name="mesec" value={mesec} />
      <input type="hidden" name="smena" value={smena} />
      <input type="hidden" name="period" value={period} />
      {showYear && (
        <div className="space-y-2">
          <Label htmlFor="godina" className="text-[#6B7280] text-sm">
            Godina
          </Label>
          <Select value={godina} onValueChange={(v) => apply({ godina: v, mesec, smena, period })}>
            <SelectTrigger id="godina" className="w-[100px] border-[#E5E7EB]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {showMonth && (
        <div className="space-y-2">
          <Label htmlFor="mesec" className="text-[#6B7280] text-sm">
            Mesec
          </Label>
          <Select value={mesec} onValueChange={(v) => apply({ godina, mesec: v, smena, period })}>
            <SelectTrigger id="mesec" className="w-[140px] border-[#E5E7EB]">
              <SelectValue placeholder="Svi meseci" />
            </SelectTrigger>
            <SelectContent>
              {MESECI.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {showSmena && (
        <div className="space-y-2">
          <Label htmlFor="smena" className="text-[#6B7280] text-sm">
            Smena
          </Label>
          <select
            id="smena"
            name="smena"
            defaultValue={smena}
            className="flex h-9 w-[120px] rounded-md border border-[#E5E7EB] bg-white px-3 py-1 text-sm"
          >
            <option value="sve">Sve smene</option>
            <option value="I">I</option>
            <option value="II">II</option>
          </select>
        </div>
      )}
      {showPeriod && (
        <div className="space-y-2">
          <Label htmlFor="period" className="text-[#6B7280] text-sm">
            Period
          </Label>
          <Select value={period} onValueChange={(v) => apply({ godina, mesec, smena, period: v })}>
            <SelectTrigger id="period" className="w-[180px] border-[#E5E7EB]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {showDateRange && (
        <>
          <div className="space-y-2">
            <Label htmlFor="datumOd" className="text-[#6B7280] text-sm">
              Od
            </Label>
            <Input id="datumOd" name="datumOd" type="date" defaultValue={datumOd} className="w-[140px] border-[#E5E7EB]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="datumDo" className="text-[#6B7280] text-sm">
              Do
            </Label>
            <Input id="datumDo" name="datumDo" type="date" defaultValue={datumDo} className="w-[140px] border-[#E5E7EB]" />
          </div>
        </>
      )}
      <Button type="submit" variant="outline" size="sm" className="border-[#E5E7EB]">
        Primeni
      </Button>
    </form>
  )
}
