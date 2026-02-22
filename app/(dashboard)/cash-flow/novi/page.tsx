import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { CashFlowNoviWizard } from "@/components/cashflow/CashFlowNoviWizard"

export default function CashFlowNoviPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/cash-flow" aria-label="Nazad">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-[#111827]">Novi Cash Flow snimak</h1>
      </div>

      <CashFlowNoviWizard />
    </div>
  )
}
