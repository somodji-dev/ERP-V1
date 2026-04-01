import { getFinancials, getFinancialsMultiYear } from "@/app/actions/financials"
import { PrihodiRashodiClient } from "@/components/financials/PrihodiRashodiClient"

export default async function PrihodiRashodiPage({
  searchParams,
}: {
  searchParams: Promise<{ godina?: string; uporedi?: string }>
}) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const godina = params.godina ? Number(params.godina) : currentYear

  // Default uporedne godine: odabrana + 2 prethodne
  const compareYears = params.uporedi
    ? params.uporedi.split(",").map(Number).filter((n) => !Number.isNaN(n))
    : [godina, godina - 1, godina - 2]

  const [data, compareData] = await Promise.all([
    getFinancials(godina),
    getFinancialsMultiYear(compareYears),
  ])

  // Sve godine od 2018 do tekuće
  const START_YEAR = 2018
  const finalYears: number[] = []
  for (let y = currentYear; y >= START_YEAR; y--) finalYears.push(y)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Prihodi i Rashodi</h1>
        <p className="text-sm text-[#6B7280]">Mesečni pregled prihoda, rashoda i bruto profita</p>
      </div>
      <PrihodiRashodiClient
        initialData={data}
        godina={godina}
        availableYears={finalYears}
        compareData={compareData}
        compareYears={compareYears}
      />
    </div>
  )
}
