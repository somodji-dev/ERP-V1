"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { formatCurrency } from "@/lib/utils/format"
import type { AmbalazaPakovanje } from "@/lib/types/ambalaza"
import type { MpCenaBlock, MpCenaPatch } from "@/lib/types/mp-cena"
import {
  addMpCenaBlockAction,
  updateMpCenaBlockAction,
  deleteMpCenaBlockAction,
} from "@/app/actions/mp-cena"

interface Props {
  productId: string
  pakovanja: AmbalazaPakovanje[]
  blocks: MpCenaBlock[]
}

type NumField =
  | "prodajna_cena"
  | "rabat"
  | "marza_distributera"
  | "marza_maloprodaje"
  | "pdv"

const FIELDS: {
  key: NumField
  label: string
  suffix: "RSD" | "%"
  placeholder: string
}[] = [
  { key: "prodajna_cena", label: "Prodajna cena", suffix: "RSD", placeholder: "npr. 300" },
  { key: "rabat", label: "Rabat", suffix: "%", placeholder: "npr. 5" },
  { key: "marza_distributera", label: "Marža distributera", suffix: "%", placeholder: "npr. 10" },
  { key: "marza_maloprodaje", label: "Marža maloprodaje", suffix: "%", placeholder: "npr. 30" },
  { key: "pdv", label: "PDV", suffix: "%", placeholder: "npr. 20" },
]

function calcKrajnjaCena(b: MpCenaBlock): number {
  const posleRabata = b.prodajna_cena * (1 - b.rabat / 100)
  const posleDist = posleRabata * (1 + b.marza_distributera / 100)
  const posleMp = posleDist * (1 + b.marza_maloprodaje / 100)
  const saPdv = posleMp * (1 + b.pdv / 100)
  return saPdv
}

export function MaloprodajnaCenaTab({ productId, pakovanja, blocks }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Draft po polju: `${blockId}:${field}` → string
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const addBlock = () => {
    const position = blocks.length
    const defaultPak = pakovanja[0]?.id ?? null
    startTransition(async () => {
      const res = await addMpCenaBlockAction(productId, position, defaultPak)
      if (res.error) {
        alert(res.error)
        return
      }
      router.refresh()
    })
  }

  const removeBlock = (id: string) => {
    if (!confirm("Obrisati ovaj blok?")) return
    startTransition(async () => {
      const res = await deleteMpCenaBlockAction(id, productId)
      if (res.error) {
        alert(res.error)
        return
      }
      router.refresh()
    })
  }

  const changePakovanje = (block: MpCenaBlock, pId: string) => {
    startTransition(async () => {
      const res = await updateMpCenaBlockAction(block.id, productId, {
        selected_pakovanje_id: pId || null,
      })
      if (res.error) {
        alert(res.error)
        return
      }
      router.refresh()
    })
  }

  const getFieldVal = (block: MpCenaBlock, field: NumField): string => {
    const key = `${block.id}:${field}`
    if (drafts[key] !== undefined) return drafts[key]
    const v = block[field]
    return v > 0 ? String(v) : ""
  }

  const setDraft = (block: MpCenaBlock, field: NumField, val: string) => {
    const key = `${block.id}:${field}`
    setDrafts((d) => ({ ...d, [key]: val }))
  }

  const commitField = (block: MpCenaBlock, field: NumField) => {
    const key = `${block.id}:${field}`
    const raw = drafts[key]
    if (raw === undefined) return
    const val = parseFloat(raw.replace(",", ".")) || 0
    const current = block[field]
    const clearDraft = () =>
      setDrafts((d) => {
        const next = { ...d }
        delete next[key]
        return next
      })
    if (val === current) {
      clearDraft()
      return
    }
    const patch: MpCenaPatch = { [field]: val }
    startTransition(async () => {
      const res = await updateMpCenaBlockAction(block.id, productId, patch)
      if (res.error) {
        alert(res.error)
        return
      }
      clearDraft()
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {blocks.length === 0 && (
        <div className="rounded-lg border border-dashed border-[#E5E7EB] py-10 text-center">
          <p className="text-sm text-[#6B7280]">
            Nema unesenih kalkulacija. Dodajte prvi blok da proračunate krajnju maloprodajnu cenu.
          </p>
          <button
            type="button"
            onClick={addBlock}
            disabled={isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Dodaj prvi blok
          </button>
        </div>
      )}

      {blocks.map((block, idx) => {
        const krajnja = calcKrajnjaCena(block)
        return (
          <div
            key={block.id}
            className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white"
          >
            {/* Header bloka — pakovanje + obriši */}
            <div className="flex items-center gap-3 border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Blok {idx + 1}
              </span>
              <select
                value={block.selected_pakovanje_id ?? ""}
                onChange={(e) => changePakovanje(block, e.target.value)}
                disabled={isPending}
                className="flex-1 rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="">— Izaberi pakovanje —</option>
                {pakovanja.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.naziv}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                disabled={isPending}
                className="rounded-md p-1.5 text-[#DC2626] hover:bg-[#FEF2F2]"
                title="Obriši blok"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Polja */}
            <div className="grid gap-3 p-4 sm:max-w-md">
              {FIELDS.map((f) => (
                <div key={f.key} className="grid grid-cols-[1fr_120px] items-center gap-3">
                  <label className="text-sm text-[#111827]">{f.label}:</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={getFieldVal(block, f.key)}
                      onChange={(e) => setDraft(block, f.key, e.target.value)}
                      onBlur={() => commitField(block, f.key)}
                      placeholder={f.placeholder}
                      className={cn(
                        "w-full rounded-md border border-[#E5E7EB] px-2.5 py-1.5 pr-12 text-right text-sm tabular-nums outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      )}
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6B7280]">
                      {f.suffix}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Krajnja cena */}
            <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#F0FDF4] px-4 py-3">
              <span className="text-sm font-semibold text-[#111827]">
                KRAJNJA MALOPRODAJNA CENA:
              </span>
              <span className="text-xl font-bold tabular-nums text-[#16A34A]">
                {formatCurrency(krajnja)}
              </span>
            </div>
          </div>
        )
      })}

      {blocks.length > 0 && (
        <button
          type="button"
          onClick={addBlock}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#111827] hover:bg-[#F9FAFB] disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Dodaj blok
        </button>
      )}
    </div>
  )
}
