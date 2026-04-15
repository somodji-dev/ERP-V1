import { getAdditionalExpenses, getChartData } from "@/app/actions/additional-expenses"
import { DodatniTroskoviClient } from "@/components/additional-expenses/DodatniTroskoviClient"

export default async function DodatniTroskoviPage({
  searchParams,
}: {
  searchParams: Promise<{ godina?: string }>
}) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const godina = params.godina ? Number(params.godina) : currentYear

  const [tableData, chartData] = await Promise.all([
    getAdditionalExpenses(godina),
    getChartData("12", {}),
  ])

  // Sve godine od 2018 do tekuće
  const START_YEAR = 2018
  const availableYears: number[] = []
  for (let y = currentYear; y >= START_YEAR; y--) availableYears.push(y)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Dodatni troškovi</h1>
        <p className="text-sm text-[#6B7280]">Neposlovni troškovi i podizanje gotovine sa bankomata</p>
      </div>
      <DodatniTroskoviClient
        tableData={tableData}
        initialChartData={chartData}
        godina={godina}
        availableYears={availableYears}
      />
    </div>
  )
}
