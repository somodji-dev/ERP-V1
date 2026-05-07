"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { Plus, Trash2, Pencil, X } from "lucide-react"
import type { BomStavka } from "@/lib/types/bom"
import type { MaterijaliCena } from "@/lib/types/materijali-cene"
import {
  addBomStavkaAction,
  updateBomStavkaAction,
  deleteBomStavkaAction,
  updateUkupnaKolicinaAction,
} from "@/app/actions/bom"

interface Props {
  productId: string
  materijali: MaterijaliCena[]
  bomStavke: BomStavka[]
  ukupnaKolicina: number
}

type ModalState =
  | { type: "closed" }
  | { type: "add" }
  | { type: "edit"; item: BomStavka }
  | { type: "delete"; item: BomStavka }

const EMPTY_FORM = { naziv: "", materijal_id: "", udeo: "", cena_po_kg: "" }

export function TrosakSirovinaTab({ productId, materijali, bomStavke, ukupnaKolicina }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [modal, setModal] = useState<ModalState>({ type: "closed" })
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  const [kolicinaDraft, setKolicinaDraft] = useState<string | null>(null)

  const rows = bomStavke.map((item) => {
    const kolicina = ukupnaKolicina * item.udeo
    const trosak = kolicina * item.cena_po_kg
    return { ...item, kolicina, trosak }
  })

  const sumaUdeo = bomStavke.reduce((s, i) => s + i.udeo, 0)
  const sumaKolicina = rows.reduce((s, r) => s + r.kolicina, 0)
  const sumaTrosak = rows.reduce((s, r) => s + r.trosak, 0)
  const cenaPo1kg = ukupnaKolicina > 0 ? sumaTrosak / ukupnaKolicina : 0

  const kolicinaVal = kolicinaDraft !== null ? kolicinaDraft : String(ukupnaKolicina)

  const commitKolicina = () => {
    if (kolicinaDraft === null) return
    const val = parseFloat(kolicinaDraft)
    if (isNaN(val) || val <= 0) { setKolicinaDraft(null); return }
    if (val === ukupnaKolicina) { setKolicinaDraft(null); return }
    startTransition(async () => {
      await updateUkupnaKolicinaAction(productId, val)
      setKolicinaDraft(null)
      router.refresh()
    })
  }

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setModal({ type: "add" })
  }

  const openEdit = (item: BomStavka) => {
    setForm({
      naziv: item.naziv,
      materijal_id: item.materijal_id ?? "",
      udeo: String(+(item.udeo * 100).toFixed(4)),
      cena_po_kg: String(item.cena_po_kg),
    })
    setFormError(null)
    setModal({ type: "edit", item })
  }

  const closeModal = () => setModal({ type: "closed" })

  const onMaterijalSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    const mat = materijali.find((m) => m.id === id)
    setForm((f) => ({
      ...f,
      materijal_id: id,
      naziv: mat ? mat.naziv : f.naziv,
      cena_po_kg: mat ? String(mat.cena) : f.cena_po_kg,
    }))
  }

  const handleSave = () => {
    const naziv = form.naziv.trim()
    const udeoNum = parseFloat(form.udeo)
    const cenaNum = parseFloat(form.cena_po_kg)

    if (!naziv) { setFormError("Naziv je obavezan."); return }
    if (isNaN(udeoNum) || udeoNum <= 0 || udeoNum > 100) {
      setFormError("Udeo mora biti između 0 i 100%.")
      return
    }
    if (isNaN(cenaNum) || cenaNum < 0) { setFormError("Unesite ispravnu cenu."); return }

    const udeoDec = udeoNum / 100
    const materijalId = form.materijal_id || null

    startTransition(async () => {
      if (modal.type === "edit") {
        const res = await updateBomStavkaAction(modal.item.id, productId, naziv, udeoDec, cenaNum, materijalId)
        if (res.error) { setFormError(res.error); return }
      } else {
        const res = await addBomStavkaAction(productId, naziv, udeoDec, cenaNum, materijalId)
        if (res.error) { setFormError(res.error); return }
      }
      closeModal()
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (modal.type !== "delete") return
    const id = modal.item.id
    startTransition(async () => {
      const res = await deleteBomStavkaAction(id, productId)
      if (res.error) { alert(res.error); return }
      closeModal()
      router.refresh()
    })
  }

  const isFormOpen = modal.type === "add" || modal.type === "edit"

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <label className="text-sm font-medium text-[#374151] whitespace-nowrap">
          Ukupna količina (kg):
        </label>
        <input
          type="number"
          min="0.001"
          step="any"
          value={kolicinaVal}
          onChange={(e) => setKolicinaDraft(e.target.value)}
          onBlur={commitKolicina}
          className="w-36 rounded-md border border-[#E5E7EB] px-3 py-1.5 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
        />
        <span className="text-sm text-[#9CA3AF]">
          {ukupnaKolicina === 1 ? "Proračun za 1 kg proizvoda" : `Proračun za ${fmt2(ukupnaKolicina)} kg proizvoda`}
        </span>
      </div>

      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-md bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Dodaj sirovinu
        </button>
      </div>

      {bomStavke.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E5E7EB] py-10 text-center">
          <p className="text-sm text-[#6B7280]">Nema sirovina. Dodajte prvu.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Naziv</th>
                <th className="px-4 py-3 text-right font-medium text-[#6B7280]">Udeo (%)</th>
                <th className="px-4 py-3 text-right font-medium text-[#6B7280]">Količina (kg)</th>
                <th className="px-4 py-3 text-right font-medium text-[#6B7280]">Cena (din/kg)</th>
                <th className="px-4 py-3 text-right font-medium text-[#6B7280]">Trošak (din)</th>
                <th className="w-16 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {rows.map((row) => (
                <tr key={row.id} className="group hover:bg-[#F9FAFB]">
                  <td className="px-4 py-2.5 font-medium text-[#111827]">{row.naziv}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#374151]">
                    {fmt2(row.udeo * 100)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#374151]">
                    {fmt4(row.kolicina)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#374151]">
                    {fmt(row.cena_po_kg)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-[#111827]">
                    {fmt(row.trosak)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="rounded p-1 text-[#9CA3AF] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setModal({ type: "delete", item: row })}
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
                <td className="px-4 py-2.5 text-sm font-semibold text-[#374151]">∑ Ukupno</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-sm font-semibold text-[#374151]">
                  {fmt2(sumaUdeo * 100)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-sm font-semibold text-[#374151]">
                  {fmt4(sumaKolicina)}
                </td>
                <td className="px-4 py-2.5" />
                <td className="px-4 py-2.5 text-right tabular-nums text-sm font-bold text-[#2563EB]">
                  {fmt(sumaTrosak)} din
                </td>
                <td />
              </tr>
              {ukupnaKolicina !== 1 && (
                <tr className="border-t border-[#BFDBFE] bg-[#EFF6FF]">
                  <td colSpan={4} className="px-4 py-2 text-sm text-[#374151]">
                    Cena sirovina za 1 kg proizvoda
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-sm font-bold text-[#2563EB]">
                    {fmt(cenaPo1kg)} din
                  </td>
                  <td />
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      )}

      {/* Dialog — dodaj / izmeni */}
      <Dialog.Root open={isFormOpen} onOpenChange={(o) => !o && closeModal()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-base font-semibold text-[#111827]">
                {modal.type === "edit" ? "Izmeni sirovinu" : "Dodaj sirovinu"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded p-1 text-[#9CA3AF] hover:text-[#111827]">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Unos sirovine u proračun</Dialog.Description>

            <div className="mt-4 space-y-4">
              {materijali.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#374151]">
                    Iz baze sirovina
                  </label>
                  <select
                    value={form.materijal_id}
                    onChange={onMaterijalSelect}
                    className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white"
                  >
                    <option value="">— odaberi ili upiši ručno —</option>
                    {materijali.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.naziv} ({fmt(m.cena)} din/kg)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#374151]">
                  Naziv <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.naziv}
                  onChange={(e) => { setForm((f) => ({ ...f, naziv: e.target.value })); setFormError(null) }}
                  placeholder="npr. Kikiriki"
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  autoFocus={materijali.length === 0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151]">
                  Udeo u proizvodu (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={form.udeo}
                  onChange={(e) => { setForm((f) => ({ ...f, udeo: e.target.value })); setFormError(null) }}
                  placeholder="npr. 40"
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151]">
                  Cena (din/kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.cena_po_kg}
                  onChange={(e) => { setForm((f) => ({ ...f, cena_po_kg: e.target.value })); setFormError(null) }}
                  placeholder="npr. 160"
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                >
                  Otkaži
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={handleSave}
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
      <AlertDialog.Root open={modal.type === "delete"} onOpenChange={(o) => !o && closeModal()}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <AlertDialog.Title className="text-base font-semibold text-[#111827]">
              Ukloni sirovinu
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-[#6B7280]">
              Ukloniti{" "}
              <span className="font-semibold text-[#111827]">
                {modal.type === "delete" ? modal.item.naziv : ""}
              </span>{" "}
              iz proračuna?
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                >
                  Otkaži
                </button>
              </AlertDialog.Cancel>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Ukloni
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

function fmt2(n: number): string {
  return new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 2 }).format(n)
}

function fmt4(n: number): string {
  return new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 4 }).format(n)
}
