"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { RadnaSnagaGrupa } from "@/lib/types/radna-snaga"
import {
  upsertRadnaSnagaGrupaAction,
  updateOpterecenjePlataAction,
} from "@/app/actions/radna-snaga"

interface Props {
  productId: string
  grupe: RadnaSnagaGrupa[]
  opterecenje: number
  onTotalChange?: (total: number) => void
}

type FieldKey = `${string}__broj` | `${string}__neto`

export function TrosakRadneSnageTab({ productId, grupe, opterecenje, onTotalChange }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [drafts, setDrafts] = useState<Partial<Record<FieldKey, string>>>({})
  const [opDraft, setOpDraft] = useState<string | null>(null)

  const getVal = (g: RadnaSnagaGrupa, field: "broj" | "neto"): string => {
    const key = `${g.grupa_key}__${field}` as FieldKey
    if (drafts[key] !== undefined) return drafts[key]!
    const v = g[field]
    return v > 0 ? String(v) : ""
  }

  const onChange = (gKey: string, field: "broj" | "neto", raw: string) => {
    const key = `${gKey}__${field}` as FieldKey
    setDrafts((d) => ({ ...d, [key]: raw }))
  }

  const commit = (g: RadnaSnagaGrupa, field: "broj" | "neto") => {
    const key = `${g.grupa_key}__${field}` as FieldKey
    const raw = drafts[key]
    if (raw === undefined) return
    const val = parseFloat(raw) || 0
    const clearDraft = () =>
      setDrafts((d) => {
        const next = { ...d }
        delete next[key]
        return next
      })
    if (val === g[field]) { clearDraft(); return }
    startTransition(async () => {
      const res = await upsertRadnaSnagaGrupaAction(productId, g.grupa_key, g.grupa_label, { [field]: val })
      if (res.error) { alert(res.error); return }
      clearDraft()
      router.refresh()
    })
  }

  const commitOp = () => {
    if (opDraft === null) return
    const val = parseFloat(opDraft) || 0
    if (val === opterecenje) { setOpDraft(null); return }
    startTransition(async () => {
      const res = await updateOpterecenjePlataAction(val)
      if (res.error) { alert(res.error); return }
      setOpDraft(null)
      router.refresh()
    })
  }

  const faktor = 1 + opterecenje / 100

  const rows = grupe.map((g) => ({
    ...g,
    bruto: g.neto * faktor,
    ukupno: g.broj * g.neto * faktor,
  }))

  const ukupnoMesecno = rows.reduce((s, g) => s + g.ukupno, 0)

  const ukupnoRef = useRef<number>(0)
  useEffect(() => {
    if (ukupnoMesecno !== ukupnoRef.current) {
      ukupnoRef.current = ukupnoMesecno
      onTotalChange?.(ukupnoMesecno)
    }
  })

  const opVal = opDraft !== null ? opDraft : (opterecenje > 0 ? String(opterecenje) : "")

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <label className="whitespace-nowrap text-sm font-medium text-[#374151]">
          Opterećenje na plate:
        </label>
        <div className="relative w-36">
          <input
            type="number"
            min="0"
            max="500"
            step="0.1"
            value={opVal}
            onChange={(e) => setOpDraft(e.target.value)}
            onBlur={commitOp}
            placeholder="npr. 65"
            disabled={isPending}
            className="w-full rounded-md border border-[#E5E7EB] py-1.5 pl-3 pr-8 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-[#F9FAFB]"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF]">%</span>
        </div>
        {opterecenje > 0 && (
          <span className="text-xs text-[#6B7280]">
            Bruto = Neto × {faktor.toFixed(4)}
          </span>
        )}
        <span className="text-xs text-[#9CA3AF]">(globalno za sve proizvode)</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Grupa</th>
              <th className="w-32 px-4 py-3 text-right font-medium text-[#6B7280]">Broj</th>
              <th className="w-44 px-4 py-3 text-right font-medium text-[#6B7280]">Neto (din)</th>
              <th className="w-44 px-4 py-3 text-right font-medium text-[#6B7280]">Bruto (din)</th>
              <th className="w-48 px-4 py-3 text-right font-medium text-[#6B7280]">Ukupno mesečno (din)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {rows.map((g) => (
              <tr key={g.grupa_key} className="hover:bg-[#F9FAFB]">
                <td className="px-4 py-3 font-medium text-[#111827]">{g.grupa_label}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={getVal(g, "broj")}
                    onChange={(e) => onChange(g.grupa_key, "broj", e.target.value)}
                    onBlur={() => commit(g, "broj")}
                    placeholder="0"
                    disabled={isPending}
                    className="w-full rounded-md border border-[#E5E7EB] px-3 py-1.5 text-right text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-[#F9FAFB]"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={getVal(g, "neto")}
                    onChange={(e) => onChange(g.grupa_key, "neto", e.target.value)}
                    onBlur={() => commit(g, "neto")}
                    placeholder="0"
                    disabled={isPending}
                    className="w-full rounded-md border border-[#E5E7EB] px-3 py-1.5 text-right text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-[#F9FAFB]"
                  />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[#374151]">
                  {g.neto > 0 && opterecenje > 0 ? fmt(g.bruto) : g.neto > 0 ? fmt(g.neto) : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-[#111827]">
                  {g.ukupno > 0 ? fmt(g.ukupno) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#E5E7EB] bg-[#F0F7FF]">
              <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-[#374151]">
                ∑ Ukupni mesečni trošak plata
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-[#2563EB]">
                {ukupnoMesecno > 0 ? `${fmt(ukupnoMesecno)} din` : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {ukupnoMesecno > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {rows.filter((g) => g.ukupno > 0).map((g) => (
            <div key={g.grupa_key} className="rounded-lg border border-[#E5E7EB] bg-white p-3">
              <p className="text-xs text-[#6B7280]">{g.grupa_label}</p>
              <p className="mt-1 text-base font-bold text-[#111827]">{fmt(g.ukupno)} din</p>
              <p className="text-xs text-[#9CA3AF]">
                {((g.ukupno / ukupnoMesecno) * 100).toFixed(1)}% ukupnih troškova
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function fmt(n: number): string {
  return new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 0 }).format(n)
}
