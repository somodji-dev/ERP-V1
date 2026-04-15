import { notFound } from "next/navigation"
import Link from "next/link"
import { getHygieneChecklistDetail } from "@/app/actions/hygiene"
import { getActiveEmployees } from "@/app/actions/inventory"
import { ChecklistEditor } from "@/components/hygiene/ChecklistEditor"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

const MESECI = [
  "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
]

export default async function HigijenaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [detail, employees] = await Promise.all([
    getHygieneChecklistDetail(id),
    getActiveEmployees(),
  ])
  if (!detail) notFound()

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
        <Button asChild variant="ghost" size="icon">
          <Link href="/proizvodnja/higijena" aria-label="Nazad">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-[#111827]">
            Higijena — {MESECI[detail.mesec]} {detail.godina}
          </h1>
          <p className="text-sm text-[#6B7280]">{detail.completions.length} unosa</p>
        </div>
      </div>
      <ChecklistEditor detail={detail} employees={employees} />
    </div>
  )
}
