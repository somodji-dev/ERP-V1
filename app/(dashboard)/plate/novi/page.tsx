import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { PlateNoviForm } from "@/components/plate/PlateNoviForm"

export default async function PlateNoviPage() {
  const supabase = await createClient()
  const { data: employees } = await supabase
    .from("employees")
    .select("id, ime, prezime")
    .eq("aktivan", true)
    .order("ime", { ascending: true })

  const list = employees ?? []

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/plate" aria-label="Nazad">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-[#111827]">Generisanje platnog izveštaja</h1>
      </div>

      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Izbor radnika i perioda</CardTitle>
        </CardHeader>
        <CardContent>
          <PlateNoviForm employees={list} />
        </CardContent>
      </Card>
    </div>
  )
}
