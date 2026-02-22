import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { WorkOrderForm } from "@/components/proizvodnja/WorkOrderForm"
import { getNextBrojNaloga } from "@/app/actions/work-orders"

export default async function ProizvodnjaNoviPage() {
  const supabase = await createClient()
  const { data: employees } = await supabase
    .from("employees")
    .select("id, ime, prezime")
    .eq("aktivan", true)
    .order("ime", { ascending: true })

  const nextBroj = await getNextBrojNaloga()
  const list = (employees ?? []) as { id: string; ime: string; prezime: string }[]

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/proizvodnja" aria-label="Nazad na listu">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-[#111827]">Novi radni nalog</h1>
      </div>

      <WorkOrderForm
        mode="create"
        employees={list}
        initialBrojNaloga={nextBroj}
      />
    </div>
  )
}
