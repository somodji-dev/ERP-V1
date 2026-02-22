"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createPayrollNacrtAction } from "@/app/actions/payroll"
import { Loader2 } from "lucide-react"

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

export function PlateNoviForm({ employees }: { employees: Employee[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [employeeId, setEmployeeId] = useState<string>("")
  const [mesec, setMesec] = useState<number | null>(null)
  const [godina, setGodina] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear - 1, currentYear - 2]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId || mesec == null || godina == null) {
      toast({ title: "Greška", description: "Izaberite radnika, mesec i godinu.", variant: "destructive" })
      return
    }
    setIsLoading(true)
    const result = await createPayrollNacrtAction(employeeId, mesec, godina)
    setIsLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Nacrt izveštaja kreiran." })
    if (result.id) router.push(`/plate/${result.id}`)
    else router.push("/plate")
  }

  if (employees.length === 0) {
    return (
      <p className="text-sm text-[#6B7280] py-4">
        Nema aktivnih radnika. Dodajte radnika u modulu Radnici.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Radnik</Label>
          <Select value={employeeId} onValueChange={setEmployeeId} required>
            <SelectTrigger className="border-[#E5E7EB]">
              <SelectValue placeholder="Izaberi radnika..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.ime} {e.prezime}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Mesec</Label>
          <Select
            value={mesec == null ? "" : String(mesec)}
            onValueChange={(v) => setMesec(v === "" ? null : Number(v))}
            required
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
            value={godina == null ? "" : String(godina)}
            onValueChange={(v) => setGodina(v === "" ? null : Number(v))}
            required
          >
            <SelectTrigger className="border-[#E5E7EB]">
              <SelectValue placeholder="Izaberi godinu..." />
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
      </div>
      <Button type="submit" disabled={isLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Kreiranje...
          </>
        ) : (
          "Sačuvaj kao nacrt"
        )}
      </Button>
    </form>
  )
}
