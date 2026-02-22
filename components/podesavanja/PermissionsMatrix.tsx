"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { saveUserPermissionsAction } from "@/app/actions/users"
import type { ModulName } from "@/lib/types/auth"
import { Loader2 } from "lucide-react"
import type { PermissionRow } from "@/app/actions/users"

const MODULI: { key: ModulName; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "radnici", label: "Radnici & Plate" },
  { key: "cashflow", label: "Cash Flow" },
  { key: "proizvodnja", label: "Proizvodnja" },
  { key: "podesavanja", label: "Podešavanja" },
]

type Props = {
  userId: string
  initialPermissions: { modul: ModulName; view: boolean; create: boolean; edit: boolean; delete: boolean }[]
}

export function PermissionsMatrix({ userId, initialPermissions }: Props) {
  const { toast } = useToast()
  const [perms, setPerms] = useState<PermissionRow[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const byModul = new Map(initialPermissions.map((p) => [p.modul, p]))
    setPerms(
      MODULI.map((m) => ({
        modul: m.key,
        view: byModul.get(m.key)?.view ?? false,
        create: byModul.get(m.key)?.create ?? false,
        edit: byModul.get(m.key)?.edit ?? false,
        delete: byModul.get(m.key)?.delete ?? false,
      }))
    )
  }, [initialPermissions])

  function setModul(modul: ModulName, field: keyof Omit<PermissionRow, "modul">, value: boolean) {
    setPerms((prev) =>
      prev.map((p) => (p.modul === modul ? { ...p, [field]: value } : p))
    )
  }

  async function handleSave() {
    setIsLoading(true)
    try {
      await saveUserPermissionsAction(userId, perms)
      toast({ title: "Prava sačuvana" })
    } catch (e) {
      toast({
        title: "Greška",
        description: e instanceof Error ? e.message : "Neuspelo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (perms.length === 0) return null

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
      <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
        <h2 className="text-sm font-semibold text-[#111827]">Prava po modulima</h2>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Označite šta korisnik sme da radi u svakom modulu.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <th className="text-left px-4 py-3 font-semibold text-[#6B7280]">Modul</th>
              <th className="px-4 py-3 font-semibold text-[#6B7280] text-center">Pregled</th>
              <th className="px-4 py-3 font-semibold text-[#6B7280] text-center">Dodavanje</th>
              <th className="px-4 py-3 font-semibold text-[#6B7280] text-center">Izmena</th>
              <th className="px-4 py-3 font-semibold text-[#6B7280] text-center">Brisanje</th>
            </tr>
          </thead>
          <tbody>
            {MODULI.map((m) => {
              const p = perms.find((x) => x.modul === m.key)
              if (!p) return null
              return (
                <tr key={m.key} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3 font-medium text-[#111827]">{m.label}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={p.view}
                      onChange={(e) => setModul(m.key, "view", e.target.checked)}
                      className="h-4 w-4 rounded border-[#E5E7EB]"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={p.create}
                      onChange={(e) => setModul(m.key, "create", e.target.checked)}
                      className="h-4 w-4 rounded border-[#E5E7EB]"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={p.edit}
                      onChange={(e) => setModul(m.key, "edit", e.target.checked)}
                      className="h-4 w-4 rounded border-[#E5E7EB]"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={p.delete}
                      onChange={(e) => setModul(m.key, "delete", e.target.checked)}
                      className="h-4 w-4 rounded border-[#E5E7EB]"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#E5E7EB] px-4 py-3 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-[#2563EB] hover:bg-[#1D4ED8]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Čuvanje...
            </>
          ) : (
            "Sačuvaj prava"
          )}
        </Button>
      </div>
    </div>
  )
}
