"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import * as Dialog from "@radix-ui/react-dialog"
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, X } from "lucide-react"
import type { AmbalazaPakovanje, AmbalazaStavka } from "@/lib/types/ambalaza"
import {
  addPakovanjeAction,
  updatePakovanjeAction,
  deletePakovanjeAction,
  addStavkaAction,
  updateStavkaAction,
  deleteStavkaAction,
} from "@/app/actions/ambalaza"

type StavkaModal =
  | { type: "closed" }
  | { type: "add"; pId: string }
  | { type: "edit"; pId: string; stavka: AmbalazaStavka }

type DeleteModal =
  | { type: "closed" }
  | { type: "stavka"; pId: string; stavka: AmbalazaStavka }
  | { type: "pakovanje"; pakovanje: AmbalazaPakovanje }

const JEDINICE = ["kom", "kg", "l", "m", "m²", "par"]
const EMPTY_STAVKA = { naziv: "", kolicina: "", jedinica: "kom", cena: "" }

interface Props {
  productId: string
  pakovanja: AmbalazaPakovanje[]
}

export function TrosakAmbalaze({ productId, pakovanja }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(pakovanja.map((p) => p.id))
  )

  const [addPakovanjeOpen, setAddPakovanjeOpen] = useState(false)
  const [novoPakovanjeNaziv, setNovoPakovanjeNaziv] = useState("")
  const [novoPakovanjeNasa, setNovoPakovanjeNasa] = useState("")

  const [stavkaModal, setStavkaModal] = useState<StavkaModal>({ type: "closed" })
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({ type: "closed" })
  const [stavkaForm, setStavkaForm] = useState(EMPTY_STAVKA)
  const [formError, setFormError] = useState<string | null>(null)

  const [masaDraft, setMasaDraft] = useState<Record<string, string>>({})

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getMasaVal = (pak: AmbalazaPakovanje) =>
    masaDraft[pak.id] !== undefined
      ? masaDraft[pak.id]
      : pak.masa > 0 ? String(pak.masa) : ""

  const commitMasa = (pak: AmbalazaPakovanje) => {
    const draft = masaDraft[pak.id]
    if (draft === undefined) return
    const val = parseFloat(draft) || 0
    const clearDraft = () => setMasaDraft((prev) => {
      const next = { ...prev }
      delete next[pak.id]
      return next
    })
    if (val === pak.masa) { clearDraft(); return }
    startTransition(async () => {
      const res = await updatePakovanjeAction(pak.id, pak.naziv, val, productId)
      if (res.error) alert(res.error)
      clearDraft()
      router.refresh()
    })
  }

  const addPakovanje = () => {
    if (!novoPakovanjeNaziv.trim()) return
    startTransition(async () => {
      const res = await addPakovanjeAction(
        productId,
        novoPakovanjeNaziv.trim(),
        parseFloat(novoPakovanjeNasa) || 0
      )
      if (res.error) { alert(res.error); return }
      if (res.id) setExpanded((prev) => new Set(prev).add(res.id!))
      setNovoPakovanjeNaziv("")
      setNovoPakovanjeNasa("")
      setAddPakovanjeOpen(false)
      router.refresh()
    })
  }

  const deletePakovanje = (id: string) => {
    startTransition(async () => {
      const res = await deletePakovanjeAction(id, productId)
      if (res.error) { alert(res.error); return }
      setDeleteModal({ type: "closed" })
      router.refresh()
    })
  }

  const openAddStavka = (pId: string) => {
    setStavkaForm(EMPTY_STAVKA)
    setFormError(null)
    setStavkaModal({ type: "add", pId })
  }

  const openEditStavka = (pId: string, stavka: AmbalazaStavka) => {
    setStavkaForm({
      naziv: stavka.naziv,
      kolicina: String(stavka.kolicina),
      jedinica: stavka.jedinica,
      cena: String(stavka.cena),
    })
    setFormError(null)
    setStavkaModal({ type: "edit", pId, stavka })
  }

  const saveStavka = () => {
    const naziv = stavkaForm.naziv.trim()
    const kolicina = parseFloat(stavkaForm.kolicina)
    const cena = parseFloat(stavkaForm.cena)

    if (!naziv) { setFormError("Naziv je obavezan."); return }
    if (isNaN(kolicina) || kolicina <= 0) { setFormError("Unesite ispravnu količinu."); return }
    if (isNaN(cena) || cena < 0) { setFormError("Unesite ispravnu cenu."); return }

    const modal = stavkaModal
    if (modal.type === "closed") return

    startTransition(async () => {
      if (modal.type === "add") {
        const res = await addStavkaAction(modal.pId, productId, naziv, kolicina, stavkaForm.jedinica, cena)
        if (res.error) { setFormError(res.error); return }
      } else if (modal.type === "edit") {
        const res = await updateStavkaAction(modal.stavka.id, productId, naziv, kolicina, stavkaForm.jedinica, cena)
        if (res.error) { setFormError(res.error); return }
      }
      setStavkaModal({ type: "closed" })
      router.refresh()
    })
  }

  const deleteStavka = (sId: string) => {
    startTransition(async () => {
      const res = await deleteStavkaAction(sId, productId)
      if (res.error) { alert(res.error); return }
      setDeleteModal({ type: "closed" })
      router.refresh()
    })
  }

  const ukupnoSva = pakovanja.reduce(
    (s, p) => s + p.stavke.reduce((ps, st) => ps + st.kolicina * st.cena, 0),
    0
  )

  return (
    <>
      <div className="space-y-3">
        {pakovanja.length === 0 && (
          <div className="rounded-lg border border-dashed border-[#E5E7EB] py-10 text-center">
            <p className="text-sm text-[#6B7280]">Nema pakovanja. Dodajte prvo.</p>
          </div>
        )}

        {pakovanja.map((pak) => {
          const isExp = expanded.has(pak.id)
          const masa = pak.masa ?? 0
          const ukupno = pak.stavke.reduce((s, st) => s + st.kolicina * st.cena, 0)
          const dinPoKg = masa > 0 && ukupno > 0 ? ukupno / masa : null
          return (
            <div key={pak.id} className="overflow-hidden rounded-lg border border-[#E5E7EB]">
              <div
                className="flex cursor-pointer items-center gap-2 bg-[#F9FAFB] px-4 py-3 select-none"
                onClick={() => toggleExpand(pak.id)}
              >
                {isExp
                  ? <ChevronDown className="h-4 w-4 shrink-0 text-[#6B7280]" />
                  : <ChevronRight className="h-4 w-4 shrink-0 text-[#6B7280]" />
                }
                <span className="flex-1 text-sm font-semibold text-[#111827]">{pak.naziv}</span>

                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs text-[#9CA3AF]">masa:</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={getMasaVal(pak)}
                    onChange={(e) => setMasaDraft((prev) => ({ ...prev, [pak.id]: e.target.value }))}
                    onBlur={() => commitMasa(pak)}
                    placeholder="0"
                    title="Masa po pakovanju u kg (npr. 0.5 za 500g)"
                    className="w-16 rounded border border-[#E5E7EB] bg-white px-1.5 py-0.5 text-xs text-right tabular-nums outline-none focus:border-[#2563EB]"
                  />
                  <span className="text-xs text-[#9CA3AF]">kg</span>
                </div>

                <span className="text-sm font-bold text-[#2563EB]">
                  {ukupno > 0 ? `${fmt(ukupno)} din/kom` : "—"}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDeleteModal({ type: "pakovanje", pakovanje: pak }) }}
                  className="ml-2 rounded p-1 text-[#9CA3AF] hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="Obriši pakovanje"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {isExp && (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-[#E5E7EB] bg-white">
                        <th className="px-4 py-2 text-left font-medium text-[#6B7280]">Naziv</th>
                        <th className="w-28 px-4 py-2 text-right font-medium text-[#6B7280]">Količina</th>
                        <th className="w-20 px-4 py-2 text-center font-medium text-[#6B7280]">J.m.</th>
                        <th className="w-32 px-4 py-2 text-right font-medium text-[#6B7280]">Cena (din)</th>
                        <th className="w-32 px-4 py-2 text-right font-medium text-[#6B7280]">Trošak (din)</th>
                        <th className="w-16 px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {pak.stavke.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-center text-xs text-[#9CA3AF]">
                            Nema stavki — dodajte prvu
                          </td>
                        </tr>
                      )}
                      {pak.stavke.map((st) => (
                        <tr key={st.id} className="group hover:bg-[#F9FAFB]">
                          <td className="px-4 py-2 text-[#111827]">{st.naziv}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-[#374151]">{fmt4(st.kolicina)}</td>
                          <td className="px-4 py-2 text-center text-[#6B7280]">{st.jedinica}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-[#374151]">{fmt(st.cena)}</td>
                          <td className="px-4 py-2 text-right tabular-nums font-medium text-[#111827]">
                            {fmt(st.kolicina * st.cena)}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => openEditStavka(pak.id, st)}
                                className="rounded p-1 text-[#9CA3AF] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteModal({ type: "stavka", pId: pak.id, stavka: st })}
                                className="rounded p-1 text-[#9CA3AF] hover:bg-red-50 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#E5E7EB] bg-[#F0F7FF]">
                        <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-[#374151]">
                          Ukupno — {pak.naziv}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-[#6B7280]">
                          {dinPoKg !== null ? `${fmt(dinPoKg)} din/kg` : masa === 0 ? "unesite masu →" : ""}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-sm font-bold text-[#2563EB]">
                          {ukupno > 0 ? `${fmt(ukupno)} din/kom` : "—"}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>

                  <div className="border-t border-[#E5E7EB] px-4 py-2">
                    <button
                      type="button"
                      onClick={() => openAddStavka(pak.id)}
                      className="flex items-center gap-1.5 text-sm text-[#2563EB] hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Dodaj stavku
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}

        {pakovanja.length > 1 && ukupnoSva > 0 && (
          <div className="flex items-center justify-between rounded-lg border-2 border-[#BFDBFE] bg-[#EFF6FF] px-5 py-3">
            <span className="text-sm font-semibold text-[#374151]">Ukupno — sva pakovanja</span>
            <span className="text-base font-bold text-[#2563EB]">{fmt(ukupnoSva)} din</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => { setNovoPakovanjeNaziv(""); setNovoPakovanjeNasa(""); setAddPakovanjeOpen(true) }}
          className="flex items-center gap-2 rounded-md border border-dashed border-[#2563EB] px-4 py-2 text-sm font-medium text-[#2563EB] hover:bg-[#EFF6FF] transition-colors w-full justify-center"
        >
          <Plus className="h-4 w-4" />
          Dodaj pakovanje
        </button>
      </div>

      {/* Dialog — novo pakovanje */}
      <Dialog.Root open={addPakovanjeOpen} onOpenChange={setAddPakovanjeOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-base font-semibold text-[#111827]">Novo pakovanje</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded p-1 text-[#9CA3AF] hover:text-[#111827]">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Dodavanje novog pakovanja</Dialog.Description>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151]">
                  Naziv pakovanja <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={novoPakovanjeNaziv}
                  onChange={(e) => setNovoPakovanjeNaziv(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPakovanje()}
                  placeholder="npr. Kesa 500g"
                  autoFocus
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151]">Masa po pakovanju (kg)</label>
                <p className="text-xs text-[#9CA3AF]">Koristi se za preračun din/kom ↔ din/kg u PTR-u</p>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={novoPakovanjeNasa}
                  onChange={(e) => setNovoPakovanjeNasa(e.target.value)}
                  placeholder="npr. 0.5 za 500g, 1 za 1kg"
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button type="button" className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                  Otkaži
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={addPakovanje}
                disabled={!novoPakovanjeNaziv.trim() || isPending}
                className="rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors disabled:opacity-50"
              >
                {isPending ? "Dodajem..." : "Dodaj"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog — stavka (add/edit) */}
      <Dialog.Root
        open={stavkaModal.type !== "closed"}
        onOpenChange={(o) => !o && setStavkaModal({ type: "closed" })}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-base font-semibold text-[#111827]">
                {stavkaModal.type === "edit" ? "Izmeni stavku" : "Dodaj stavku"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded p-1 text-[#9CA3AF] hover:text-[#111827]">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Unos stavke ambalaže</Dialog.Description>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151]">
                  Naziv <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={stavkaForm.naziv}
                  onChange={(e) => { setStavkaForm((f) => ({ ...f, naziv: e.target.value })); setFormError(null) }}
                  placeholder="npr. Posuda"
                  autoFocus
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#374151]">
                    Količina <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={stavkaForm.kolicina}
                    onChange={(e) => { setStavkaForm((f) => ({ ...f, kolicina: e.target.value })); setFormError(null) }}
                    placeholder="npr. 1"
                    className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151]">Jedinica mere</label>
                  <select
                    value={stavkaForm.jedinica}
                    onChange={(e) => setStavkaForm((f) => ({ ...f, jedinica: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white"
                  >
                    {JEDINICE.map((j) => <option key={j}>{j}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151]">
                  Cena po jedinici (din) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={stavkaForm.cena}
                  onChange={(e) => { setStavkaForm((f) => ({ ...f, cena: e.target.value })); setFormError(null) }}
                  placeholder="npr. 3.8"
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button type="button" className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                  Otkaži
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={saveStavka}
                disabled={isPending}
                className="rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors disabled:opacity-50"
              >
                {isPending ? "Čuvam..." : "Sačuvaj"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* AlertDialog — brisanje */}
      <AlertDialog.Root
        open={deleteModal.type !== "closed"}
        onOpenChange={(o) => !o && setDeleteModal({ type: "closed" })}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <AlertDialog.Title className="text-base font-semibold text-[#111827]">
              {deleteModal.type === "pakovanje" ? "Obriši pakovanje" : "Ukloni stavku"}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-[#6B7280]">
              {deleteModal.type === "pakovanje" && (
                <>Obrisati pakovanje <span className="font-semibold text-[#111827]">{deleteModal.pakovanje.naziv}</span> i sve stavke unutar njega?</>
              )}
              {deleteModal.type === "stavka" && (
                <>Ukloniti stavku <span className="font-semibold text-[#111827]">{deleteModal.stavka.naziv}</span>?</>
              )}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button type="button" className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                  Otkaži
                </button>
              </AlertDialog.Cancel>
              <button
                type="button"
                onClick={() => {
                  if (deleteModal.type === "pakovanje") deletePakovanje(deleteModal.pakovanje.id)
                  if (deleteModal.type === "stavka") deleteStavka(deleteModal.stavka.id)
                }}
                disabled={isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteModal.type === "pakovanje" ? "Obriši" : "Ukloni"}
              </button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}

function fmt(n: number): string {
  return new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 0 }).format(n)
}

function fmt4(n: number): string {
  return new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 4 }).format(n)
}
