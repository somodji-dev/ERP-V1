"use client"

import { useState, useTransition } from "react"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import * as Dialog from "@radix-ui/react-dialog"
import { Pencil, Trash2, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import {
  addMaterijaliCenaAction,
  updateMaterijaliCenaAction,
  deleteMaterijaliCenaAction,
} from "@/app/actions/materijali-cene"
import type { MaterijaliCena } from "@/lib/types/materijali-cene"

interface Props {
  initialData: MaterijaliCena[]
}

type ModalState =
  | { type: "closed" }
  | { type: "add" }
  | { type: "edit"; item: MaterijaliCena }
  | { type: "delete"; item: MaterijaliCena }

export function CeneSirovinaClient({ initialData }: Props) {
  const [modal, setModal] = useState<ModalState>({ type: "closed" })
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const [naziv, setNaziv] = useState("")
  const [cena, setCena] = useState("")

  const openAdd = () => {
    setNaziv("")
    setCena("")
    setFormError(null)
    setModal({ type: "add" })
  }

  const openEdit = (item: MaterijaliCena) => {
    setNaziv(item.naziv)
    setCena(String(item.cena))
    setFormError(null)
    setModal({ type: "edit", item })
  }

  const closeModal = () => setModal({ type: "closed" })

  const handleSave = () => {
    const cenaNum = parseFloat(cena)
    if (!naziv.trim()) { setFormError("Naziv je obavezan."); return }
    if (isNaN(cenaNum) || cenaNum < 0) { setFormError("Unesite ispravnu cenu."); return }

    startTransition(async () => {
      const result =
        modal.type === "edit"
          ? await updateMaterijaliCenaAction(modal.item.id, naziv, cenaNum)
          : await addMaterijaliCenaAction(naziv, cenaNum)

      if (result.error) { setFormError(result.error); return }
      closeModal()
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteMaterijaliCenaAction(id)
      closeModal()
    })
  }

  const isFormOpen = modal.type === "add" || modal.type === "edit"

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          {initialData.length} {initialData.length === 1 ? "materijal" : "materijala"}
        </p>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Dodaj materijal
        </button>
      </div>

      {initialData.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-white p-8 text-center">
          <p className="text-sm text-[#6B7280]">Još nema materijala. Dodajte prvi.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Naziv</th>
                <th className="px-4 py-3 text-right font-medium text-[#6B7280]">Cena (din/kg)</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {initialData.map((item) => (
                <tr key={item.id} className="group hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3 font-medium text-[#111827]">{item.naziv}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#374151]">
                    {fmt(item.cena)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded p-1 text-[#9CA3AF] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
                        title="Izmeni"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setModal({ type: "delete", item })}
                        className="rounded p-1 text-[#9CA3AF] hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Obriši"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
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
                {modal.type === "edit" ? "Izmeni materijal" : "Novi materijal"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded p-1 text-[#9CA3AF] hover:text-[#111827]">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              {modal.type === "edit" ? "Izmena postojećeg materijala" : "Dodavanje novog materijala u bazu cena"}
            </Dialog.Description>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151]">
                  Naziv <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={naziv}
                  onChange={(e) => { setNaziv(e.target.value); setFormError(null) }}
                  placeholder="npr. Kikiriki"
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151]">
                  Cena (din/kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cena}
                  onChange={(e) => { setCena(e.target.value); setFormError(null) }}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="npr. 160"
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
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
                {isPending ? "Čuvanje..." : "Sačuvaj"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* AlertDialog — brisanje */}
      <AlertDialog.Root
        open={modal.type === "delete"}
        onOpenChange={(o) => !o && closeModal()}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <AlertDialog.Title className="text-base font-semibold text-[#111827]">
              Obriši materijal
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-[#6B7280]">
              Da li ste sigurni da želite da obrišete{" "}
              <span className="font-semibold text-[#111827]">
                {modal.type === "delete" ? modal.item.naziv : ""}
              </span>
              ? Ova akcija se ne može poništiti.
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
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => modal.type === "delete" && handleDelete(modal.item.id)}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Brisanje..." : "Obriši"}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}

function fmt(n: number): string {
  return new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 2 }).format(n)
}
