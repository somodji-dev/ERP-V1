"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createHygieneChecklistAction } from "@/app/actions/hygiene"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const MESECI = [
  "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
]

export default function NovaHigijenaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const now = new Date()
  const [mesec, setMesec] = useState(String(now.getMonth() + 1))
  const [godina, setGodina] = useState(String(now.getFullYear()))
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await createHygieneChecklistAction(Number(mesec), Number(godina))
    setLoading(false)
    if (result.error || !result.id) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    router.push(`/proizvodnja/higijena/${result.id}`)
  }

  const years: number[] = []
  for (let y = now.getFullYear() + 1; y >= 2018; y--) years.push(y)

  return (
    <div className="max-w-md">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/proizvodnja/higijena"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-xl font-bold text-[#111827]">Nova mesečna ček lista</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <Label>Mesec</Label>
          <Select value={mesec} onValueChange={setMesec}>
            <SelectTrigger className="border-[#E5E7EB]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESECI.map((label, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Godina</Label>
          <Select value={godina} onValueChange={setGodina}>
            <SelectTrigger className="border-[#E5E7EB]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-[#6B7280]">
          Ako ček lista za izabrani mesec već postoji, bićete preusmereni na postojeću.
        </p>
        <Button type="submit" disabled={loading} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kreiranje...</> : "Kreiraj / Otvori"}
        </Button>
      </form>
    </div>
  )
}
