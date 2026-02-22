import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { CashFlowUrediForm } from "@/components/cashflow/CashFlowUrediForm"

export default async function CashFlowUrediPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: snapshot, error } = await supabase
    .from("cash_snapshots")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !snapshot) notFound()

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href={`/cash-flow/${id}`} aria-label="Nazad">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-[#111827]">Izmena Cash Flow snimka</h1>
      </div>

      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Podaci snimka</CardTitle>
        </CardHeader>
        <CardContent>
          <CashFlowUrediForm snapshot={snapshot} />
        </CardContent>
      </Card>
    </div>
  )
}
