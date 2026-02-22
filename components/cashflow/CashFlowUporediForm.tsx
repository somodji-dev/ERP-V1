"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SnapshotOption = { id: string; label: string }

type Props = {
  snapshots: SnapshotOption[]
}

export function CashFlowUporediForm({ snapshots }: Props) {
  const router = useRouter()
  const [idA, setIdA] = useState<string>("")
  const [idB, setIdB] = useState<string>("")

  function handleUporedi() {
    if (!idA || !idB || idA === idB) return
    router.push(`/cash-flow/uporedi?a=${encodeURIComponent(idA)}&b=${encodeURIComponent(idB)}`)
  }

  const canCompare = idA && idB && idA !== idB

  if (snapshots.length < 2) {
    return (
      <p className="text-sm text-[#6B7280]">
        Potrebna su najmanje dva snimka za upoređivanje.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="space-y-2 flex-1">
        <Label>Mesec 1</Label>
        <Select value={idA} onValueChange={setIdA}>
          <SelectTrigger className="border-[#E5E7EB]">
            <SelectValue placeholder="Izaberi snimak..." />
          </SelectTrigger>
          <SelectContent>
            {snapshots.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 flex-1">
        <Label>Mesec 2</Label>
        <Select value={idB} onValueChange={setIdB}>
          <SelectTrigger className="border-[#E5E7EB]">
            <SelectValue placeholder="Izaberi snimak..." />
          </SelectTrigger>
          <SelectContent>
            {snapshots.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        onClick={handleUporedi}
        disabled={!canCompare}
        className="bg-[#2563EB] hover:bg-[#1D4ED8] shrink-0"
      >
        Uporedi
      </Button>
    </div>
  )
}
