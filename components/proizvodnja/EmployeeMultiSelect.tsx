"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Users, X } from "lucide-react"
import { cn } from "@/lib/utils/cn"

type Employee = { id: string; ime: string; prezime: string }

type Props = {
  employees: Employee[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  error?: string
  disabled?: boolean
}

export function EmployeeMultiSelect({ employees, selectedIds, onChange, error, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const selected = employees.filter((e) => selectedIds.includes(e.id))
  const available = employees.filter((e) => !selectedIds.includes(e.id))

  function add(id: string) {
    onChange([...selectedIds, id])
  }

  function remove(id: string) {
    onChange(selectedIds.filter((x) => x !== id))
  }

  return (
    <div className="space-y-2">
      <Label className="text-[#6B7280]">Radnici</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start border-[#E5E7EB] text-left font-normal",
              selectedIds.length === 0 && "text-[#9CA3AF]"
            )}
            disabled={disabled}
          >
            <Users className="mr-2 h-4 w-4 text-[#6B7280]" />
            {selectedIds.length === 0 ? "Izaberi radnike..." : `Izabrano: ${selectedIds.length}`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-2" align="start">
          {available.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-2">Svi radnici su izabrani.</p>
          ) : (
            <ul className="max-h-[240px] overflow-y-auto space-y-0.5">
              {available.map((emp) => (
                <li key={emp.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-[#F4F5F7] text-[#111827]"
                    onClick={() => {
                      add(emp.id)
                    }}
                  >
                    {emp.ime} {emp.prezime}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map((emp) => (
            <span
              key={emp.id}
              className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2.5 py-0.5 text-sm text-[#2563EB]"
            >
              {emp.ime} {emp.prezime}
              <button
                type="button"
                onClick={() => remove(emp.id)}
                className="rounded-full hover:bg-[#2563EB] hover:text-white p-0.5"
                aria-label="Ukloni"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
    </div>
  )
}
