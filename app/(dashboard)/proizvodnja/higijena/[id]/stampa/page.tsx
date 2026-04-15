import { notFound } from "next/navigation"
import Link from "next/link"
import { getHygieneChecklistDetail } from "@/app/actions/hygiene"
import { PrintView } from "@/components/hygiene/PrintView"
import { PrintButton } from "@/components/hygiene/PrintButton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function HigijenaStampaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const detail = await getHygieneChecklistDetail(id)
  if (!detail) notFound()

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/proizvodnja/higijena/${id}`} aria-label="Nazad">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="flex-1 text-lg font-bold text-[#111827]">Priprema za štampu</h1>
        <PrintButton />
      </div>
      <PrintView detail={detail} />
    </div>
  )
}
