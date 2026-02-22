"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { deleteWorkOrder } from "@/app/actions/work-orders"
import { Trash2, Loader2 } from "lucide-react"

type Props = { nalogId: string; brojNaloga: string }

export function NalogDeleteButton({ nalogId, brojNaloga }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteWorkOrder(nalogId)
    setIsDeleting(false)
    if (result.success) {
      toast({ title: "Nalog obrisan.", description: `Nalog ${brojNaloga} je uklonjen.` })
      setOpen(false)
      router.push("/proizvodnja")
    } else {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-[#DC2626] text-[#DC2626] hover:bg-[#FEF2F2]">
          <Trash2 className="mr-2 h-4 w-4" />
          Obriši
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
          <AlertDialogDescription>
            Nalog &quot;{brojNaloga}&quot; će biti trajno obrisan. Ova akcija se ne može poništiti.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="border-[#E5E7EB]">
            Otkaži
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-[#DC2626] hover:bg-[#B91C1C]"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Obriši"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
