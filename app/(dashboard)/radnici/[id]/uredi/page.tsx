import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { UrediRadnikForm } from "@/components/radnici/UrediRadnikForm"
import type { Employee } from "@/lib/types/radnici"

type Props = { params: Promise<{ id: string }> }

export default async function UrediRadnikPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: employee, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !employee) {
    notFound()
  }

  const initial: Employee = {
    id: employee.id,
    ime: employee.ime,
    prezime: employee.prezime,
    jmbg: employee.jmbg ?? null,
    pozicija: employee.pozicija ?? null,
    datum_zaposlenja: employee.datum_zaposlenja ?? null,
    godisnji_fond: employee.godisnji_fond ?? 20,
    nadoknada_prevoz: employee.nadoknada_prevoz ?? 0,
    aktivan: employee.aktivan ?? true,
    napomena: employee.napomena ?? null,
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href={`/radnici/${id}`} aria-label="Nazad na profil">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-[#111827]">Uredi radnika</h1>
      </div>
      <UrediRadnikForm id={id} initialData={initial} />
    </div>
  )
}
