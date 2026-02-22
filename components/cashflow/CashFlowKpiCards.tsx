import { Card, CardContent } from "@/components/ui/card"
import { Wallet, TrendingDown, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import { getLastSnapshotForKpi } from "@/app/actions/cashflow"

const MESECI = [
  "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
]

export async function CashFlowKpiCards() {
  const last = await getLastSnapshotForKpi()

  const cards = [
    {
      title: "CASH",
      value: last ? formatCurrency(last.ukupno_cash) : "—",
      icon: Wallet,
      trend: null as string | null,
    },
    {
      title: "DUGOVANJA",
      value: last ? formatCurrency(last.dugovanja_dobavljaci) : "—",
      icon: TrendingDown,
      trend: null,
    },
    {
      title: "NETO C/F",
      value: last ? formatCurrency(last.neto_cash_flow) : "—",
      icon: TrendingUp,
      trend: null,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(({ title, value, icon: Icon }) => (
        <Card
          key={title}
          className="border-[#E5E7EB] bg-white shadow-sm"
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-[#6B7280]">{title}</span>
              <Icon className="h-5 w-5 text-[#9CA3AF]" aria-hidden />
            </div>
            <p className="text-3xl font-bold text-[#111827]">{value}</p>
            {last && (
              <p className="text-xs text-[#6B7280] mt-1">
                Poslednji snimak: {MESECI[last.mesec]} {last.godina}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
