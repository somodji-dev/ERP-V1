"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { AmbalazaPakovanje } from "@/lib/types/ambalaza"
import type { BomStavka } from "@/lib/types/bom"
import type { PrevozEnergija } from "@/lib/types/prevoz-energija"
import type { PtrFiksniStavka, PtrParams } from "@/lib/types/ptr"
import type { RabatniBlock, RabatnaScenario } from "@/lib/types/rabatne-skale"
import {
  addRabatniBlockAction,
  updateRabatniBlockAction,
  deleteRabatniBlockAction,
} from "@/app/actions/rabatne-skale"

interface Props {
  productId: string
  pakovanja: AmbalazaPakovanje[]
  bomStavke: BomStavka[]
  prevozEnergija: PrevozEnergija
  ukupnoPlate: number
  fiksniStavke: PtrFiksniStavka[]
  ptrParams: PtrParams
  blocks: RabatniBlock[]
}

type ScField = keyof RabatnaScenario

export function TrosakRabatneSkale({
  productId,
  pakovanja,
  bomStavke,
  prevozEnergija,
  ukupnoPlate,
  fiksniStavke,
  ptrParams,
  blocks,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Draft po polju: `${blockId}:${scenarioIdx}:${field}` → string
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  // --- Zajednički troškovi bez ambalaže (isti za sve) ---
  const sirovinePoKg = bomStavke.reduce((s, i) => s + i.udeo * i.cena_po_kg, 0)
  const kapacitetNum = ptrParams.kapacitet
  const radnaSnagaPoKg = kapacitetNum > 0 ? ukupnoPlate / kapacitetNum : 0
  const prevozPoKg = prevozEnergija.prevoz_kg > 0 ? prevozEnergija.prevoz_cena / prevozEnergija.prevoz_kg : 0
  const energijaPoKg = prevozEnergija.struja_kg > 0 ? prevozEnergija.struja_racun / prevozEnergija.struja_kg : 0
  const fiksniUkupno = fiksniStavke.reduce((s, f) => s + f.iznos, 0)
  const fiksniPoKg = kapacitetNum > 0 ? fiksniUkupno / kapacitetNum : 0
  const baseKostanjaKg = sirovinePoKg + radnaSnagaPoKg + prevozPoKg + energijaPoKg + fiksniPoKg

  const addBlock = () => {
    const position = blocks.length
    const defaultPak = blocks.length === 0 ? ptrParams.selected_pakovanje_id : null
    startTransition(async () => {
      const res = await addRabatniBlockAction(productId, position, defaultPak)
      if (res.error) { alert(res.error); return }
      router.refresh()
    })
  }

  const removeBlock = (id: string) => {
    startTransition(async () => {
      const res = await deleteRabatniBlockAction(id, productId)
      if (res.error) { alert(res.error); return }
      router.refresh()
    })
  }

  const changeSelectedPakovanje = (block: RabatniBlock, pId: string) => {
    startTransition(async () => {
      const res = await updateRabatniBlockAction(block.id, productId, {
        selected_pakovanje_id: pId || null,
      })
      if (res.error) { alert(res.error); return }
      router.refresh()
    })
  }

  const commitField = (block: RabatniBlock, scenarioIdx: number, field: ScField) => {
    const key = `${block.id}:${scenarioIdx}:${field}`
    const raw = drafts[key]
    if (raw === undefined) return
    const val = parseFloat(raw) || 0
    const current = block.scenarios[scenarioIdx][field]
    const clearDraft = () => setDrafts((d) => {
      const next = { ...d }
      delete next[key]
      return next
    })
    if (val === current) { clearDraft(); return }
    const newScenarios = block.scenarios.map((s, i) =>
      i === scenarioIdx ? { ...s, [field]: val } : s
    ) as RabatniBlock["scenarios"]
    startTransition(async () => {
      const res = await updateRabatniBlockAction(block.id, productId, { scenarios: newScenarios })
      if (res.error) { alert(res.error); return }
      clearDraft()
      router.refresh()
    })
  }

  const getFieldVal = (block: RabatniBlock, scenarioIdx: number, field: ScField): string => {
    const key = `${block.id}:${scenarioIdx}:${field}`
    if (drafts[key] !== undefined) return drafts[key]
    const v = block.scenarios[scenarioIdx][field]
    return v > 0 ? String(v) : ""
  }

  const setFieldDraft = (block: RabatniBlock, scenarioIdx: number, field: ScField, val: string) => {
    const key = `${block.id}:${scenarioIdx}:${field}`
    setDrafts((d) => ({ ...d, [key]: val }))
  }

  return (
    <div className="space-y-8">
      {blocks.length === 0 && (
        <div className="rounded-lg border border-dashed border-[#E5E7EB] py-10 text-center">
          <p className="text-sm text-[#6B7280]">Nema pakovanja. Kliknite &quot;Dodaj pakovanje&quot; ispod.</p>
        </div>
      )}

      {blocks.map((block, blockIdx) => (
        <PakovanjeBlockView
          key={block.id}
          index={blockIdx}
          block={block}
          pakovanja={pakovanja}
          baseKostanjaKg={baseKostanjaKg}
          canDelete={true}
          isPending={isPending}
          getFieldVal={getFieldVal}
          setFieldDraft={setFieldDraft}
          commitField={commitField}
          onSelectedPakovanjeChange={(pId) => changeSelectedPakovanje(block, pId)}
          onDelete={() => removeBlock(block.id)}
        />
      ))}

      <button
        type="button"
        onClick={addBlock}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#2563EB] px-4 py-3 text-sm font-medium text-[#2563EB] hover:bg-[#EFF6FF] transition-colors disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Dodaj pakovanje
      </button>
    </div>
  )
}

function PakovanjeBlockView({
  index,
  block,
  pakovanja,
  baseKostanjaKg,
  canDelete,
  isPending,
  getFieldVal,
  setFieldDraft,
  commitField,
  onSelectedPakovanjeChange,
  onDelete,
}: {
  index: number
  block: RabatniBlock
  pakovanja: AmbalazaPakovanje[]
  baseKostanjaKg: number
  canDelete: boolean
  isPending: boolean
  getFieldVal: (block: RabatniBlock, scenarioIdx: number, field: ScField) => string
  setFieldDraft: (block: RabatniBlock, scenarioIdx: number, field: ScField, val: string) => void
  commitField: (block: RabatniBlock, scenarioIdx: number, field: ScField) => void
  onSelectedPakovanjeChange: (pId: string) => void
  onDelete: () => void
}) {
  const selectedPak = pakovanja.find((p) => p.id === block.selected_pakovanje_id) ?? null
  const masaKg = selectedPak?.masa ?? 0

  const ambalazaUkupnoKom = selectedPak
    ? selectedPak.stavke.reduce((s, st) => s + st.kolicina * st.cena, 0)
    : 0
  const ambalazaPoKg = masaKg > 0 ? ambalazaUkupnoKom / masaKg : 0
  const cenaKostanjaKg = baseKostanjaKg + ambalazaPoKg

  const updateKolicinaKom = (idx: number, komVal: string) => {
    if (masaKg === 0) return
    const n = parseFloat(komVal)
    const kg = !isNaN(n) && n > 0 ? String(parseFloat((n * masaKg).toFixed(4))) : ""
    setFieldDraft(block, idx, "kolicina_kg", kg)
  }

  const computeResult = (idx: number) => {
    const osnovnaKg = parseFloat(getFieldVal(block, idx, "osnovna_kg")) || 0
    const kolicinaKg = parseFloat(getFieldVal(block, idx, "kolicina_kg")) || 0
    const rabat = parseFloat(getFieldVal(block, idx, "rabat")) || 0

    const netoKg = osnovnaKg > 0 ? osnovnaKg * (1 - rabat / 100) : 0
    const netoKom = masaKg > 0 ? netoKg * masaKg : 0
    const zaradaKg = netoKg > 0 ? netoKg - cenaKostanjaKg : 0
    const zaradaUkupno = kolicinaKg > 0 ? zaradaKg * kolicinaKg : 0
    const marzaProcenat = netoKg > 0 ? (zaradaKg / netoKg) * 100 : 0
    const prihodUkupno = kolicinaKg * netoKg
    const komBroj = masaKg > 0 && kolicinaKg > 0 ? Math.round(kolicinaKg / masaKg) : 0

    return { osnovnaKg, kolicinaKg, rabat, netoKg, netoKom, zaradaKg, zaradaUkupno, marzaProcenat, prihodUkupno, komBroj }
  }

  const results = [0, 1, 2, 3].map((i) => computeResult(i))
  const nonZero = results.map((r, i) => ({ r, i })).filter(({ r }) => r.zaradaUkupno !== 0)
  const bestIdx = nonZero.length > 0
    ? nonZero.reduce((a, b) => (b.r.zaradaUkupno > a.r.zaradaUkupno ? b : a)).i
    : -1

  return (
    <section className="space-y-4 rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-[#374151]">
            Pakovanje {index + 1}
          </label>
          {pakovanja.length === 0 ? (
            <p className="mt-1 text-xs text-amber-600">Nema pakovanja. Dodajte ih u tab Trošak ambalaže.</p>
          ) : (
            <select
              value={block.selected_pakovanje_id ?? ""}
              onChange={(e) => onSelectedPakovanjeChange(e.target.value)}
              disabled={isPending}
              className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-[#F9FAFB]"
            >
              <option value="">— Izaberite pakovanje —</option>
              {pakovanja.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.naziv}{(p.masa ?? 0) > 0 ? ` (${p.masa} kg)` : " — bez mase"}
                </option>
              ))}
            </select>
          )}
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="mt-6 rounded p-2 text-[#9CA3AF] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Ukloni ovo pakovanje"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between rounded-md border border-[#E5E7EB] bg-white px-3 py-2">
        <span className="text-xs text-[#6B7280]">Cena koštanja (sa fiksnim)</span>
        <div className="flex gap-4 text-right">
          <div>
            <div className="text-[10px] text-[#9CA3AF]">din/kg</div>
            <div className="text-sm font-bold text-[#111827] tabular-nums">
              {cenaKostanjaKg > 0 ? fmt(cenaKostanjaKg) : "—"}
            </div>
          </div>
          {masaKg > 0 && cenaKostanjaKg > 0 && (
            <div>
              <div className="text-[10px] text-[#9CA3AF]">din/kom</div>
              <div className="text-sm font-bold text-[#374151] tabular-nums">
                {fmt(cenaKostanjaKg * masaKg)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((idx) => {
          const r = results[idx]
          const isBest = idx === bestIdx
          return (
            <div
              key={idx}
              className={cn(
                "rounded-lg border bg-white p-3 space-y-3 transition-colors",
                isBest ? "border-[#16A34A] shadow-md" : "border-[#E5E7EB]"
              )}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#374151]">Scenario {idx + 1}</h4>
                {isBest && (
                  <span className="rounded bg-[#16A34A]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#16A34A]">
                    Najveća zarada
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280]">Osnovna cena (din/kg)</label>
                  <input
                    type="number" min="0" step="any"
                    value={getFieldVal(block, idx, "osnovna_kg")}
                    onChange={(e) => setFieldDraft(block, idx, "osnovna_kg", e.target.value)}
                    onBlur={() => commitField(block, idx, "osnovna_kg")}
                    placeholder="npr. 300"
                    className="mt-1 w-full rounded-md border border-[#E5E7EB] px-2 py-1.5 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280]">Količina (kg)</label>
                    <input
                      type="number" min="0" step="any"
                      value={getFieldVal(block, idx, "kolicina_kg")}
                      onChange={(e) => setFieldDraft(block, idx, "kolicina_kg", e.target.value)}
                      onBlur={() => commitField(block, idx, "kolicina_kg")}
                      placeholder="0"
                      className="mt-1 w-full rounded-md border border-[#E5E7EB] px-2 py-1.5 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280]">Količina (kom)</label>
                    <input
                      type="number" min="0" step="1"
                      value={masaKg > 0 && r.kolicinaKg > 0 ? String(r.komBroj) : ""}
                      onChange={(e) => updateKolicinaKom(idx, e.target.value)}
                      onBlur={() => commitField(block, idx, "kolicina_kg")}
                      placeholder="0"
                      disabled={masaKg === 0}
                      className={cn(
                        "mt-1 w-full rounded-md border border-[#E5E7EB] px-2 py-1.5 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]",
                        masaKg === 0 && "bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed"
                      )}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280]">Rabat (%)</label>
                  <div className="relative mt-1">
                    <input
                      type="number" min="0" max="100" step="any"
                      value={getFieldVal(block, idx, "rabat")}
                      onChange={(e) => setFieldDraft(block, idx, "rabat", e.target.value)}
                      onBlur={() => commitField(block, idx, "rabat")}
                      placeholder="npr. 10"
                      className="w-full rounded-md border border-[#E5E7EB] py-1.5 pl-2 pr-7 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">%</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] pt-2 space-y-1">
                <ResultRow label="Neto cena/kg"
                  value={r.netoKg > 0 ? `${fmt(r.netoKg)} din` : "—"} />
                {masaKg > 0 && r.netoKg > 0 && (
                  <ResultRow label="Neto cena/kom" value={`${fmt(r.netoKom)} din`} muted />
                )}
                <ResultRow label="Zarada/kg"
                  value={r.zaradaKg !== 0 ? `${fmt(r.zaradaKg)} din` : "—"}
                  positive={r.zaradaKg > 0}
                  negative={r.zaradaKg < 0} />
                <ResultRow label="Marža"
                  value={r.netoKg > 0 ? `${r.marzaProcenat.toFixed(0)} %` : "—"}
                  positive={r.marzaProcenat > 0}
                  negative={r.marzaProcenat < 0} />
                <div className="mt-1.5 border-t border-[#E5E7EB] pt-1.5">
                  <ResultRow label="Prihod ukupno"
                    value={r.prihodUkupno > 0 ? `${fmt(r.prihodUkupno)} din` : "—"}
                    muted />
                  <ResultRow label="Zarada ukupno"
                    value={r.zaradaUkupno !== 0 ? `${fmt(r.zaradaUkupno)} din` : "—"}
                    large
                    positive={r.zaradaUkupno > 0}
                    negative={r.zaradaUkupno < 0} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ResultRow({
  label, value, large, muted, positive, negative,
}: {
  label: string
  value: string
  large?: boolean
  muted?: boolean
  positive?: boolean
  negative?: boolean
}) {
  const cls = cn(
    "tabular-nums font-semibold",
    large ? "text-base" : "text-sm",
    positive ? "text-[#16A34A]" :
    negative ? "text-red-600" :
    muted ? "text-[#6B7280]" :
    "text-[#111827]"
  )
  return (
    <div className="flex items-baseline justify-between">
      <span className={cn("text-xs", muted ? "text-[#9CA3AF]" : "text-[#6B7280]")}>{label}</span>
      <span className={cls}>{value}</span>
    </div>
  )
}

function fmt(n: number): string {
  return new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 0 }).format(n)
}
