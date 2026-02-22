"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { deleteCashSnapshotAction } from "@/app/actions/cashflow"

type Props = {
  snapshotId: string
  label: string
}

export function CashFlowDeleteButton({ snapshotId, label }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteCashSnapshotAction(snapshotId)
    setIsDeleting(false)
    setOpen(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Snimak obrisan." })
    router.refresh()
    window.location.href = "/cash-flow"
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-[#DC2626] text-[#DC2626] hover:bg-[#FEF2F2]"
      >
        <Trash2 className="mr-1.5 h-4 w-4" />
        Obriši
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši snimak?</AlertDialogTitle>
            <AlertDialogDescription>
              Snimak za <strong>{label}</strong> će biti trajno obrisan. Redovi partnera iz Excel-a
              takođe će biti obrisani. Ovu radnju nije moguće poništiti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-[#DC2626] hover:bg-[#B91C1C]"
              disabled={isDeleting}
            >
              {isDeleting ? "Brisanje..." : "Obriši"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
