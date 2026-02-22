"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { oznaciIsplacenAction, generisiObračunAction, deletePayrollReportAction } from "@/app/actions/payroll"
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
import { Printer, CheckCircle, RefreshCw, Trash2 } from "lucide-react"
import { useState } from "react"

export function OznaciIsplacenButton({ reportId }: { reportId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    setIsLoading(true)
    const result = await oznaciIsplacenAction(reportId)
    setIsLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Označeno kao isplaćen." })
    router.refresh()
  }

  return (
    <Button
      variant="default"
      size="sm"
      className="bg-[#16A34A] hover:bg-[#15803D]"
      onClick={handleClick}
      disabled={isLoading}
    >
      <CheckCircle className="mr-2 h-4 w-4" />
      {isLoading ? "Čuvanje..." : "Označi kao isplaćen"}
    </Button>
  )
}

export function GenerisiObračunButton({ reportId }: { reportId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    setIsLoading(true)
    const result = await generisiObračunAction(reportId)
    setIsLoading(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Obračun generisan iz unosa sati i satnica." })
    router.refresh()
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className="border-[#E5E7EB]"
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Generisanje..." : "Generiši obračun"}
    </Button>
  )
}

export function PlateDetailActions({
  reportId,
  status,
}: {
  reportId: string
  status: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleObrisiIzvestaj() {
    setDeleting(true)
    const result = await deletePayrollReportAction(reportId)
    setDeleting(false)
    setDeleteDialogOpen(false)
    if (result.error) {
      toast({ title: "Greška", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "Platni izveštaj obrisan." })
    window.location.href = "/plate"
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 pt-4 print:hidden">
        <GenerisiObračunButton reportId={reportId} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => typeof window !== "undefined" && window.print()}
        >
          <Printer className="mr-2 h-4 w-4" />
          Štampaj
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="#">Export PDF (uskoro)</Link>
        </Button>
        {status !== "isplacen" && <OznaciIsplacenButton reportId={reportId} />}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={deleting}
          className="border-[#DC2626] text-[#DC2626] hover:bg-[#FEF2F2]"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Obriši izveštaj
        </Button>
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši platni izveštaj?</AlertDialogTitle>
            <AlertDialogDescription>
              Ovaj platni izveštaj će biti trajno obrisan. Unosi sati za radnika i mesec ostaju u bazi. Ovu radnju nije moguće poništiti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleObrisiIzvestaj()
              }}
              className="bg-[#DC2626] hover:bg-[#B91C1C]"
              disabled={deleting}
            >
              {deleting ? "Brisanje..." : "Obriši"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
