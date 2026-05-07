"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import * as Dialog from "@radix-ui/react-dialog"
import { Trash2, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { Proizvod } from "@/lib/types/proizvodi"
import { addProizvodAction, deleteProizvodAction } from "@/app/actions/proizvodi"

interface Props {
  initialProizvodi: Proizvod[]
}

export function CeneProizvodaListClient({ initialProizvodi }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<Proizvod | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [naziv, setNaziv] = useState("")
  const [opis, setOpis] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const handleAdd = () => {
    if (!naziv.trim()) return
    setFormError(null)
    startTransition(async () => {
      const res = await addProizvodAction(naziv.trim(), opis.trim() || null)
      if (res.error) {
        setFormError(res.error)
        return
      }
      setNaziv("")
      setOpis("")
      setAddOpen(false)
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const target = deleteTarget
    startTransition(async () => {
      const res = await deleteProizvodAction(target.id)
      if (res.error) {
        alert(res.error)
        return
      }
      setDeleteTarget(null)
      router.refresh()
    })
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => { setNaziv(""); setOpis(""); setFormError(null); setAddOpen(true) }}
          className="flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Dodaj proizvod
        </button>
      </div>

      {initialProizvodi.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-white p-8 text-center">
          <p className="text-sm text-[#6B7280]">Još nema proizvoda.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {initialProizvodi.map((p) => (
            <li key={p.id} className="group relative">
              <Link
                href={`/cene-proizvoda/${p.id}`}
                className="block rounded-lg border border-[#E5E7EB] bg-white p-4 transition-colors hover:border-[#2563EB] hover:bg-[#F8FAFC]"
              >
                <div className="pr-8 font-semibold text-[#111827]">{p.naziv}</div>
                {p.opis && <div className="mt-1 text-xs text-[#6B7280]">{p.opis}</div>}
              </Link>
              <button
                type="button"
                onClick={() => setDeleteTarget(p)}
                className={cn(
                  "absolute right-3 top-3 rounded p-1 text-[#9CA3AF] transition-colors",
                  "opacity-0 group-hover:opacity-100",
                  "hover:bg-red-50 hover:text-red-500"
                )}
                title="Obriši proizvod"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* AlertDialog — brisanje */}
      <AlertDialog.Root open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40 animate-in fade-in" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <AlertDialog.Title className="text-base font-semibold text-[#111827]">
              Obriši proizvod
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-[#6B7280]">
              Da li ste sigurni da želite da obrišete{" "}
              <span className="font-semibold text-[#111827]">{deleteTarget?.naziv}</span>?
              Ova akcija se ne može poništiti.
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
                Obriši
              </button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {/* Dialog — novi proizvod */}
      <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-base font-semibold text-[#111827]">
                Novi proizvod
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded p-1 text-[#9CA3AF] hover:text-[#111827]">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-1 text-sm text-[#6B7280]">
              Unesite naziv novog proizvoda za koji računate cenu.
            </Dialog.Description>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151]">
                  Naziv <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={naziv}
                  onChange={(e) => setNaziv(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="npr. Pikant OZZY"
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151]">Opis (opciono)</label>
                <input
                  type="text"
                  value={opis}
                  onChange={(e) => setOpis(e.target.value)}
                  placeholder="npr. Pikant kikiriki 40g"
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
                onClick={handleAdd}
                disabled={!naziv.trim() || isPending}
                className="rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Dodajem..." : "Dodaj"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
