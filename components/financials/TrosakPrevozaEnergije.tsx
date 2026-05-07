"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { PrevozEnergija } from "@/lib/types/prevoz-energija"
import { upsertPrevozEnergijaAction } from "@/app/actions/prevoz-energija"

type FieldKey = "prevoz_cena" | "prevoz_kg" | "struja_racun" | "struja_kg"

interface Props {
  productId: string
  prevozEnergija: PrevozEnergija
}

export function TrosakPrevozaEnergije({ productId, prevozEnergija }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [drafts, setDrafts] = useState<Partial<Record<FieldKey, string>>>({})

  const getVal = (k: FieldKey): string => {
    if (drafts[k] !== undefined) return drafts[k]!
    const v = prevozEnergija[k]
    return v > 0 ? String(v) : ""
  }

  const onChange = (k: FieldKey, raw: string) => {
    setDrafts((d) => ({ ...d, [k]: raw }))
  }

  const commit = (k: FieldKey) => {
    const raw = drafts[k]
    if (raw === undefined) return
    const val = parseFloat(raw) || 0
    if (val === prevozEnergija[k]) {
      setDrafts((d) => {
        const next = { ...d }
        delete next[k]
        return next
      })
      return
    }
    startTransition(async () => {
      const res = await upsertPrevozEnergijaAction(productId, { [k]: val })
      if (res.error) { alert(res.error); return }
      setDrafts((d) => {
        const next = { ...d }
        delete next[k]
        return next
      })
      router.refresh()
    })
  }

  const prevozPoKg = prevozEnergija.prevoz_kg > 0
    ? prevozEnergija.prevoz_cena / prevozEnergija.prevoz_kg
    : null
  const energijaPoKg = prevozEnergija.struja_kg > 0
    ? prevozEnergija.struja_racun / prevozEnergija.struja_kg
    : null
  const ukupnoPoKg = (prevozPoKg ?? 0) + (energijaPoKg ?? 0)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
        <div className="bg-[#F9FAFB] px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#374151]">Prevoz</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <Field
            label="Ukupna cena prevoza (din)"
            value={getVal("prevoz_cena")}
            onChange={(v) => onChange("prevoz_cena", v)}
            onBlur={() => commit("prevoz_cena")}
            placeholder="npr. 50000"
            disabled={isPending}
          />
          <Field
            label="Ukupna količina (kg)"
            value={getVal("prevoz_kg")}
            onChange={(v) => onChange("prevoz_kg", v)}
            onBlur={() => commit("prevoz_kg")}
            placeholder="npr. 5000"
            disabled={isPending}
          />
        </div>
        <ResultRow
          label="Trošak prevoza po kg"
          value={prevozPoKg}
          empty="Unesite cenu i količinu"
        />
      </div>

      <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
        <div className="bg-[#F9FAFB] px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#374151]">Energija (struja)</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <Field
            label="Račun za struju (din)"
            value={getVal("struja_racun")}
            onChange={(v) => onChange("struja_racun", v)}
            onBlur={() => commit("struja_racun")}
            placeholder="npr. 80000"
            disabled={isPending}
          />
          <Field
            label="Proizvedeno u mesecu (kg)"
            value={getVal("struja_kg")}
            onChange={(v) => onChange("struja_kg", v)}
            onBlur={() => commit("struja_kg")}
            placeholder="npr. 10000"
            disabled={isPending}
          />
        </div>
        <ResultRow
          label="Trošak energije po kg"
          value={energijaPoKg}
          empty="Unesite račun i količinu"
        />
      </div>

      {(prevozPoKg !== null || energijaPoKg !== null) && (
        <div className="flex items-center justify-between rounded-lg border-2 border-[#BFDBFE] bg-[#EFF6FF] px-5 py-4">
          <span className="text-sm font-semibold text-[#374151]">
            Ukupan trošak prevoza i energije po kg
          </span>
          <span className="text-lg font-bold text-[#2563EB]">
            {fmt(ukupnoPoKg)} din/kg
          </span>
        </div>
      )}
    </div>
  )
}

function Field({
  label, value, onChange, onBlur, placeholder, disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  placeholder: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#374151]">{label}</label>
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-[#F9FAFB]"
      />
    </div>
  )
}

function ResultRow({ label, value, empty }: { label: string; value: number | null; empty: string }) {
  return (
    <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#F0F7FF] px-4 py-3">
      <span className="text-sm text-[#6B7280]">{label}</span>
      {value !== null ? (
        <span className="text-sm font-bold text-[#2563EB]">{fmt(value)} din/kg</span>
      ) : (
        <span className="text-xs text-[#9CA3AF]">{empty}</span>
      )}
    </div>
  )
}

function fmt(n: number): string {
  return new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 0 }).format(n)
}
